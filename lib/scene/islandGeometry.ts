import { BufferGeometry, Color, Float32BufferAttribute } from "three";
import { mulberry32, range } from "@/lib/random";
import { clamp01, fbm, smoothstep } from "./noise";
import type { ScenePalette } from "./palette";

export interface IslandShape {
  radius: number;
  depth: number;
  seed: number;
  /** 0 = platô plano, 1 = colinas suaves. */
  relief: number;
}

const SEGMENTS = 128;
const TOP_RINGS = 16;
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
 * Ilha flutuante procedural: topo de pasto, paredão com camadas de terra roxa
 * e uma base rochosa que afina até uma ponta torta. Cores por vértice.
 */
export function createIslandGeometry(shape: IslandShape, palette: ScenePalette): BufferGeometry {
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

  // Contorno irregular visto de cima e "lóbulos" que pendem mais fundo: dependem só do ângulo.
  const cosA: number[] = [];
  const sinA: number[] = [];
  const outline: number[] = [];
  const lobes: number[] = [];
  for (let j = 0; j < SEGMENTS; j++) {
    const a = (j / SEGMENTS) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    cosA.push(c);
    sinA.push(s);
    outline.push(1 + 0.18 * fbm(c * 1.1 + ox, oy, s * 1.1 + oz, 3));
    lobes.push(fbm(c * 1.7 + ox + 40, oy + 40, s * 1.7 + oz + 40, 3));
  }

  const topHeight = (x: number, z: number, rn: number) => {
    const hills = fbm(x * 1.3 + ox, oy + 5, z * 1.3 + oz, 3) * 0.07 * relief;
    const bumps = fbm(x * 7 + ox, oy + 9, z * 7 + oz, 2) * 0.008;
    const dome = 0.03 * relief * (1 - rn * rn);
    return hills + bumps + dome;
  };

  const color = new Color();

  const paintTop = (x: number, z: number) => {
    const g = fbm(x * 3 + ox, 11, z * 3 + oz, 2) + 0.5 * fbm(x * 9 + oz, 13, z * 9 + ox, 2);
    color.copy(palette.grassDark).lerp(palette.grass, clamp01(0.6 + g * 1.3));
    const dry = smoothstep(0.12, 0.4, fbm(x * 2.2 + 31, 3, z * 2.2 + 17, 2));
    color.lerp(palette.grassDry, dry * 0.5);
  };

  const paintSide = (yN: number, under: number, c: number, s: number) => {
    const lip = 0.03 + 0.05 * clamp01(0.5 + fbm(c * 4 + ox, 2, s * 4 + oz, 2));
    if (under < lip) {
      color.copy(palette.grassDark);
      return;
    }
    // Camadas de solo no paredão; mais abaixo, rocha escura.
    const band = -yN * 9 + fbm(c * 1.3 + ox, yN * 2, s * 1.3 + oz, 2) * 0.9;
    color.copy(strata[((Math.floor(band) % strata.length) + strata.length) % strata.length]);
    color.lerp(palette.rock, smoothstep(0.2, 0.55, under));
    color.multiplyScalar(1 - 0.45 * Math.pow(under, 1.4));
  };

  const positions: number[] = [];
  const colors: number[] = [];
  const pushVertex = (x: number, y: number, z: number) => {
    positions.push(x * R, y * R, z * R);
    colors.push(color.r, color.g, color.b);
  };

  // Centro do topo
  paintTop(0, 0);
  pushVertex(0, topHeight(0, 0, 0), 0);

  for (const ring of profile) {
    for (let j = 0; j < SEGMENTS; j++) {
      const c = cosA[j];
      const s = sinA[j];
      let rn = ring.r * outline[j];

      if (ring.top) {
        const x = rn * c;
        const z = rn * s;
        paintTop(x, z);
        pushVertex(x, topHeight(x, z, ring.r), z);
        continue;
      }

      const u = ring.under;
      const edgeX = outline[j] * c;
      const edgeZ = outline[j] * s;
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
        topHeight(edgeX, edgeZ, 1) * (1 - smoothstep(0, 0.15, u)) +
        u * 0.16 * fbm(c * 3 + oz, u * 3 + ox, s * 3 + oy, 2);

      paintSide(y, u, c, s);
      pushVertex(x, y, z);
    }
  }

  // Ponta de baixo
  color.copy(palette.rock).multiplyScalar(0.5);
  pushVertex(bendX, -0.06 - depthRatio, bendZ);

  const indices: number[] = [];
  const ringStart = (k: number) => 1 + k * SEGMENTS;
  const lastRing = profile.length - 1;
  const tip = 1 + profile.length * SEGMENTS;

  for (let j = 0; j < SEGMENTS; j++) {
    const j1 = (j + 1) % SEGMENTS;
    indices.push(0, ringStart(0) + j1, ringStart(0) + j);
    indices.push(ringStart(lastRing) + j, ringStart(lastRing) + j1, tip);
  }
  for (let k = 0; k < lastRing; k++) {
    const a = ringStart(k);
    const b = ringStart(k + 1);
    for (let j = 0; j < SEGMENTS; j++) {
      const j1 = (j + 1) % SEGMENTS;
      indices.push(a + j, b + j1, b + j, a + j, a + j1, b + j1);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
