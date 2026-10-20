import { BufferAttribute, BufferGeometry, Color, Float32BufferAttribute } from "three";
import { mulberry32, range } from "@/lib/random";
import { createTop, type WaterSpec } from "./islandTops";
import { clamp01, fbm, smoothstep } from "./noise";
import { vertexNormals } from "./normals";
import type { ScenePalette } from "./palette";
import type { PropKind } from "./propGeometry";
import { createRootGeometry, type RootAnchor } from "./rootGeometry";
import type { IslandTop, Vec3 } from "./world";

export interface IslandShape {
  radius: number;
  depth: number;
  seed: number;
  /** 0 = platô plano, 1 = colinas suaves. */
  relief: number;
  top: IslandTop;
  /** Câmera da parada, relativa ao centro: orienta lago, sulcos, estrada e tocos para quem olha. */
  camera: Vec3;
}

/** Objeto sobre o topo, em coordenadas locais da ilha. Rotação em ordem YXZ. */
export interface IslandProp {
  kind: PropKind;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface IslandParts {
  body: BufferGeometry;
  roots: BufferGeometry;
  props: IslandProp[];
  water: BufferGeometry | null;
}

// Resolução pensada para os sulcos da aração (ver FURROW em islandTops.ts).
const SEGMENTS = 160;
const TOP_RINGS = 40;
const UNDER_RINGS = 48;

interface ProfileRing {
  /** Raio normalizado (1 = borda). */
  r: number;
  /** Altura normalizada pelo raio (0 = topo). */
  y: number;
  /** 0 no topo e na borda, 1 na ponta de baixo. */
  under: number;
  top: boolean;
}

/** Perfil de revolução: do centro do topo, passando pela borda, até a ponta pendurada. */
function buildProfile(depthRatio: number): ProfileRing[] {
  const rings: ProfileRing[] = [];
  for (let i = 1; i <= TOP_RINGS; i++) {
    rings.push({ r: (i / TOP_RINGS) * 0.97, y: 0, under: 0, top: true });
  }
  rings.push({ r: 1, y: -0.035, under: 0, top: false });
  for (let k = 1; k < UNDER_RINGS; k++) {
    // Mais anéis perto da borda, onde ficam as camadas de solo.
    const t = Math.pow(k / UNDER_RINGS, 1.35);
    rings.push({
      r: (1 - Math.pow(t, 1.7)) * (1 - 0.2 * t),
      y: -0.06 - t * depthRatio,
      under: t,
      top: false,
    });
  }
  return rings;
}

/**
 * Ilha flutuante procedural: o topo conta o serviço (islandTops.ts), o paredão tem camadas
 * de terra roxa e a base rochosa afina até uma ponta torta, com raízes penduradas.
 */
export function createIsland(shape: IslandShape, palette: ScenePalette): IslandParts {
  const { radius: R, depth, seed, relief } = shape;
  const rand = mulberry32(seed);
  const ox = range(rand, 0, 100);
  const oy = range(rand, 0, 100);
  const oz = range(rand, 0, 100);
  const bendAngle = range(rand, 0, Math.PI * 2);
  const bend = range(rand, 0.12, 0.35);
  const bendX = Math.cos(bendAngle) * bend;
  const bendZ = Math.sin(bendAngle) * bend;
  const depthRatio = depth / R;
  const profile = buildProfile(depthRatio);

  const strata = [palette.soil, palette.soilDark, palette.soil, palette.soilOchre, palette.soilDark];

  // Contorno irregular visto de cima: depende só do ângulo.
  const outlineAt = (c: number, s: number) => 1 + 0.18 * fbm(c * 1.1 + ox, oy, s * 1.1 + oz, 3);
  const outlineToward = (x: number, z: number) => {
    const r = Math.hypot(x, z);
    return r > 1e-6 ? outlineAt(x / r, z / r) : outlineAt(1, 0);
  };
  const view = Math.hypot(shape.camera[0], shape.camera[2]) || 1;
  const top = createTop(shape.top, {
    palette,
    radius: R,
    relief,
    ox,
    oy,
    oz,
    view: [shape.camera[0] / view, shape.camera[2] / view],
    outline: outlineToward,
    rand,
  });

  const color = new Color();

  // Por ângulo: contorno, "lóbulos" que pendem mais fundo e a borda do topo (altura, cor
  // e quanto ela desce pela encosta), que o paredão acompanha logo abaixo.
  const cosA: number[] = [];
  const sinA: number[] = [];
  const outline: number[] = [];
  const lobes: number[] = [];
  const lip: number[] = [];
  const edgeHeight: number[] = [];
  const edgeColor: Color[] = [];
  for (let j = 0; j < SEGMENTS; j++) {
    const a = (j / SEGMENTS) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    cosA.push(c);
    sinA.push(s);
    outline.push(outlineAt(c, s));
    lobes.push(fbm(c * 1.7 + ox + 40, oy + 40, s * 1.7 + oz + 40, 3));
    lip.push(0.03 + 0.05 * clamp01(0.5 + fbm(c * 4 + ox, 2, s * 4 + oz, 2)));
    edgeHeight.push(top.sample(outline[j] * c, outline[j] * s, 1, color));
    edgeColor.push(color.clone().multiplyScalar(0.78));
  }

  const paintSide = (yN: number, under: number, j: number) => {
    if (under < lip[j]) {
      color.copy(edgeColor[j]);
      return;
    }
    const c = cosA[j];
    const s = sinA[j];
    // Camadas de solo no paredão; mais abaixo, rocha escura.
    const band = -yN * 9 + fbm(c * 1.3 + ox, yN * 2, s * 1.3 + oz, 2) * 0.9;
    color.copy(strata[((Math.floor(band) % strata.length) + strata.length) % strata.length]);
    color.lerp(palette.rock, smoothstep(0.2, 0.55, under));
    color.multiplyScalar(1 - 0.45 * Math.pow(under, 1.4));
  };

  const vertexCount = 2 + profile.length * SEGMENTS;
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  let cursor = 0;
  const pushVertex = (x: number, y: number, z: number) => {
    positions[cursor] = x * R;
    positions[cursor + 1] = y * R;
    positions[cursor + 2] = z * R;
    colors[cursor] = color.r;
    colors[cursor + 1] = color.g;
    colors[cursor + 2] = color.b;
    cursor += 3;
  };

  // Centro do topo
  pushVertex(0, top.sample(0, 0, 0, color), 0);

  for (const ring of profile) {
    for (let j = 0; j < SEGMENTS; j++) {
      const c = cosA[j];
      const s = sinA[j];
      let rn = ring.r * outline[j];

      if (ring.top) {
        const x = rn * c;
        const z = rn * s;
        pushVertex(x, top.sample(x, z, ring.r, color), z);
        continue;
      }

      const u = ring.under;
      const lumps = fbm(c * 2.4 + ox, ring.y * 4 + oy, s * 2.4 + oz, 3);
      const grit = fbm(c * 8 + ox, ring.y * 10 + oy, s * 8 + oz, 2);
      rn *= 1 + u * 0.5 * lumps + 0.06 * grit;
      const x = rn * c + bendX * u * u;
      const z = rn * s + bendZ * u * u;
      // Lóbulos: alguns lados pendem mais fundo, então a base não vira um cone.
      // (Some antes da ponta para a malha não dobrar.)
      const hang = 1 + 0.6 * lobes[j] * smoothstep(0.1, 0.5, u) * (1 - smoothstep(0.7, 0.98, u));
      // Perto da borda o paredão acompanha o relevo do topo, para não dobrar a malha.
      const y =
        -0.06 +
        (ring.y + 0.06) * hang +
        edgeHeight[j] * (1 - smoothstep(0, 0.15, u)) +
        u * 0.16 * fbm(c * 3 + oz, u * 3 + ox, s * 3 + oy, 2);

      paintSide(y, u, j);
      pushVertex(x, y, z);
    }
  }

  // Ponta de baixo
  color.copy(palette.rock).multiplyScalar(0.5);
  pushVertex(bendX, -0.06 - depthRatio, bendZ);

  const ringStart = (k: number) => 1 + k * SEGMENTS;
  const lastRing = profile.length - 1;
  const tip = 1 + profile.length * SEGMENTS;
  const indices = new Uint32Array(SEGMENTS * 6 * (lastRing + 1));
  let n = 0;
  const pushTriangle = (a: number, b: number, c: number) => {
    indices[n++] = a;
    indices[n++] = b;
    indices[n++] = c;
  };

  for (let j = 0; j < SEGMENTS; j++) {
    const j1 = (j + 1) % SEGMENTS;
    pushTriangle(0, ringStart(0) + j1, ringStart(0) + j);
    pushTriangle(ringStart(lastRing) + j, ringStart(lastRing) + j1, tip);
  }
  for (let k = 0; k < lastRing; k++) {
    const a = ringStart(k);
    const b = ringStart(k + 1);
    for (let j = 0; j < SEGMENTS; j++) {
      const j1 = (j + 1) % SEGMENTS;
      pushTriangle(a + j, b + j1, b + j);
      pushTriangle(a + j, a + j1, b + j1);
    }
  }

  const body = new BufferGeometry();
  body.setAttribute("position", new BufferAttribute(positions, 3));
  body.setAttribute("color", new BufferAttribute(colors, 3));
  body.setAttribute("normal", new BufferAttribute(vertexNormals(positions, indices), 3));
  body.setIndex(new BufferAttribute(indices, 1));
  body.computeBoundingSphere();

  // Raízes: nascem na faixa de solo logo abaixo da borda, mais perto do topo do que da ponta.
  const rootRings = profile.flatMap((ring, k) => (!ring.top && ring.under >= 0.02 && ring.under <= 0.42 ? [k] : []));
  const anchors: RootAnchor[] = [];
  for (let i = 0, count = Math.round(10 + R * 2.2); i < count; i++) {
    const k = rootRings[Math.floor(Math.pow(rand(), 1.6) * rootRings.length)];
    const j = Math.floor(rand() * SEGMENTS);
    const v = ringStart(k) + j;
    anchors.push({ position: [positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]], outward: [cosA[j], sinA[j]] });
  }

  const props = top.props.map(
    (prop): IslandProp => ({
      kind: prop.kind,
      position: [
        prop.x * R,
        top.sample(prop.x, prop.z, Math.hypot(prop.x, prop.z) / outlineToward(prop.x, prop.z), color) * R - prop.sink,
        prop.z * R,
      ],
      rotation: prop.rotation,
      scale: prop.scale,
    }),
  );

  return {
    body,
    roots: createRootGeometry(anchors, R, rand, palette),
    props,
    water: top.water && createWaterGeometry(top.water, R),
  };
}

/** Disco elíptico do espelho d'água. `aEdge` vai de 0 no centro a 1 na borda (margem mais turva). */
function createWaterGeometry(water: WaterSpec, R: number): BufferGeometry {
  const STEPS = 64;
  const [cx, cy, cz] = water.center;
  const [ux, uz] = water.axis;
  const [ra, rw] = water.radii;
  const positions = [cx * R, cy * R, cz * R];
  const edge = [0];
  const indices: number[] = [];
  for (let k = 0; k < STEPS; k++) {
    const a = (k / STEPS) * Math.PI * 2;
    const along = Math.cos(a) * ra;
    const across = Math.sin(a) * rw;
    positions.push((cx + along * ux - across * uz) * R, cy * R, (cz + along * uz + across * ux) * R);
    edge.push(1);
    // Ordem que deixa a face virada para cima.
    indices.push(0, 1 + ((k + 1) % STEPS), 1 + k);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aEdge", new Float32BufferAttribute(edge, 1));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}
