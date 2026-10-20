import { Color } from "three";
import { range } from "@/lib/random";
import { clamp01, fbm, smoothstep } from "./noise";
import type { ScenePalette } from "./palette";
import type { PropKind } from "./propGeometry";
import type { IslandTop, Vec3 } from "./world";

/**
 * Topos das ilhas: cada serviço vira um relevo, uma cor e alguns objetos.
 * Coordenadas normalizadas pelo raio (x, z e a altura). rn = fração do caminho até a borda
 * (0 no centro, 1 no contorno irregular).
 */
export interface TopSurface {
  /** Altura do topo em (x, z). Escreve a cor do ponto em `out`. */
  sample(x: number, z: number, rn: number, out: Color): number;
  props: TopProp[];
  water: WaterSpec | null;
}

/** Objeto sobre o topo. Rotação em ordem YXZ (inclina e depois gira); escala em unidades do mundo. */
export interface TopProp {
  kind: PropKind;
  x: number;
  z: number;
  rotation: Vec3;
  scale: Vec3;
  /** Quanto afunda no chão, em unidades do mundo. */
  sink: number;
}

/** Espelho d'água: elipse no plano do topo (centro com a altura da água). */
export interface WaterSpec {
  center: Vec3;
  /** Direção do primeiro raio da elipse. */
  axis: readonly [number, number];
  radii: readonly [number, number];
}

export interface TopContext {
  palette: ScenePalette;
  radius: number;
  relief: number;
  /** Deslocamentos do ruído desta ilha (os mesmos da encosta). */
  ox: number;
  oy: number;
  oz: number;
  /** Direção horizontal (normalizada) da ilha para a câmera da parada. */
  view: readonly [number, number];
  /** Raio do contorno na direção do ponto (x, z). */
  outline(x: number, z: number): number;
  rand: () => number;
}

const TAU = Math.PI * 2;
const scratch = new Color();

/** Eixos no plano do topo, girados `turn` radianos a partir da direção da câmera. */
function axes(view: readonly [number, number], turn: number) {
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  const ux = view[0] * c - view[1] * s;
  const uz = view[0] * s + view[1] * c;
  return {
    ux,
    uz,
    along: (x: number, z: number) => x * ux + z * uz,
    /** De lado. Positivo fica à esquerda de quem olha da câmera (com turn = 0). */
    across: (x: number, z: number) => z * ux - x * uz,
    point: (along: number, across: number): [number, number] => [along * ux - across * uz, along * uz + across * ux],
  };
}

const gauss = (x: number, width: number) => Math.exp(-((x / width) ** 2));

/**
 * Pasto com colinas suaves: o topo original e o chão de base dos outros.
 * Altura e cor separadas para os outros topos só pagarem o ruído onde o pasto aparece.
 */
function grassland({ palette, relief, ox, oy, oz }: TopContext) {
  return {
    height(x: number, z: number, rn: number) {
      const hills = fbm(x * 1.3 + ox, oy + 5, z * 1.3 + oz, 3) * 0.07 * relief;
      const bumps = fbm(x * 7 + ox, oy + 9, z * 7 + oz, 2) * 0.008;
      const dome = 0.03 * relief * (1 - rn * rn);
      return hills + bumps + dome;
    },
    paint(x: number, z: number, out: Color) {
      const g = fbm(x * 3 + ox, 11, z * 3 + oz, 2) + 0.5 * fbm(x * 9 + oz, 13, z * 9 + ox, 2);
      out.copy(palette.grassDark).lerp(palette.grass, clamp01(0.6 + g * 1.3));
      const dry = smoothstep(0.12, 0.4, fbm(x * 2.2 + 31, 3, z * 2.2 + 17, 2));
      out.lerp(palette.grassDry, dry * 0.5);
    },
  };
}

function pasture(ctx: TopContext): TopSurface {
  const base = grassland(ctx);
  return {
    sample(x, z, rn, out) {
      base.paint(x, z, out);
      return base.height(x, z, rn);
    },
    props: [],
    water: null,
  };
}

/** Reservatório: bacia escavada com água refletindo o céu e o aterro do barramento do lado de trás. */
function reservoir(ctx: TopContext): TopSurface {
  const base = grassland(ctx);
  const { palette, ox, oz } = ctx;
  const f = axes(ctx.view, 0.3);
  const [cx, cz] = f.point(0.06, 0);
  const RA = 0.46;
  const RW = 0.6;
  const ground = base.height(cx, cz, 0);

  return {
    sample(x, z, rn, out) {
      const a = f.along(x - cx, z - cz) / RA;
      const d = Math.hypot(a, f.across(x - cx, z - cz) / RW) + 0.07 * fbm(x * 3 + ox, 21, z * 3 + oz, 2);
      // O barramento fica no lado oposto à câmera, para não esconder a água.
      const dam = smoothstep(0, 0.5, -a) * gauss(d - 1.15, 0.13);

      // Margem de terra exposta; o pasto volta em distâncias irregulares, para não virar um anel.
      const bare = 1 - smoothstep(0.9, 1.06 + 0.12 * dam, d + 0.12 * fbm(x * 6 + oz, 23, z * 6 + ox, 2));
      if (bare < 1) base.paint(x, z, out);
      scratch.copy(palette.soil).lerp(palette.soilDark, 1 - smoothstep(0.72, 0.86, d));
      out.lerp(scratch.lerp(palette.soilOchre, dam * 0.7), bare);

      // Terreno acertado em volta da escavação; mais longe, o pasto original.
      const blend = smoothstep(1.05, 1.5, d);
      const graded = blend > 0 ? ground + (base.height(x, z, rn) - ground) * blend : ground;
      return graded - 0.085 * (1 - smoothstep(0.5, 0.95, d)) + 0.04 * dam;
    },
    props: [],
    // A elipse passa um pouco da margem: a borda fica escondida embaixo do talude.
    water: { center: [cx, ground - 0.035, cz], axis: [f.ux, f.uz], radii: [RA * 0.93, RW * 0.93] },
  };
}

/** Preparo de solo: terra revolvida e escura com torrões soltos, e uma faixa de pasto na borda. */
function tilled(ctx: TopContext): TopSurface {
  const base = grassland(ctx);
  const { palette, ox, oz, rand } = ctx;

  const props: TopProp[] = [];
  for (let i = 0; i < 46; i++) {
    const angle = range(rand, 0, TAU);
    const r = Math.sqrt(rand()) * 0.8;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const size = range(rand, 0.12, 0.3);
    if (r > 0.76 * ctx.outline(x, z)) continue;
    props.push({
      kind: "torrao",
      x,
      z,
      rotation: [range(rand, 0, TAU), range(rand, 0, TAU), range(rand, 0, TAU)],
      scale: [size, size * 0.8, size],
      sink: size * 0.35,
    });
  }

  return {
    sample(x, z, rn, out) {
      const field = 1 - smoothstep(0.8, 0.88, rn);
      const lumps = fbm(x * 9 + ox, 41, z * 9 + oz, 2);
      if (field < 1) base.paint(x, z, out);
      scratch.copy(palette.soilDark).lerp(palette.soil, clamp01(0.3 + lumps * 1.4));
      // Manchas mais úmidas
      scratch.multiplyScalar(0.85 + 0.25 * clamp01(0.5 + fbm(x * 2.5 + oz, 45, z * 2.5 + ox, 2)));
      out.lerp(scratch, field);

      const terrain = base.height(x, z, rn);
      return terrain + (0.006 + 0.014 * lumps - terrain * 0.3) * field;
    },
    props,
    water: null,
  };
}

/** Período dos sulcos, em raios. Abaixo de ~4 vértices por período a malha serrilha. */
const FURROW = 0.11;

/** Aração: sulcos paralelos apontando para a câmera (linhas que convergem) e cabeceira de pasto. */
function furrows(ctx: TopContext): TopSurface {
  const base = grassland(ctx);
  const { palette, ox, oz } = ctx;
  const f = axes(ctx.view, 0.45);

  return {
    sample(x, z, rn, out) {
      const field = 1 - smoothstep(0.78, 0.86, rn);
      const w = f.across(x, z) + 0.012 * fbm(x * 2 + ox, 51, z * 2 + oz, 2);
      const ridge = 0.5 + 0.5 * Math.cos((w / FURROW) * TAU);
      if (field < 1) base.paint(x, z, out);
      scratch.copy(palette.soilDark).lerp(palette.soilOchre, ridge * ridge * 0.85);
      out.lerp(scratch, field);

      const terrain = base.height(x, z, rn);
      return terrain + (0.004 + 0.011 * ridge - terrain * 0.5) * field;
    },
    props: [],
    water: null,
  };
}

/** Estrada: leito de terra batida em curva, com valetas e talude de corte, de ponta a ponta. */
function road(ctx: TopContext): TopSurface {
  const base = grassland(ctx);
  const { palette, ox, oz } = ctx;
  // Em diagonal para a câmera: a curva em S fica visível (de lado, ela vira uma risca).
  const f = axes(ctx.view, 0.55);
  const W = 0.085;
  const bend = (s: number) => 0.2 * Math.sin(s * 2.4 + 0.5);
  const bendSlope = (s: number) => 0.48 * Math.cos(s * 2.4 + 0.5);
  const ditch = (d: number) => gauss(d - W - 0.022, 0.014);

  // Greide: o relevo suavizado e rebaixado sob o eixo, tabelado ao longo da estrada.
  const GRADE_SPAN = 1.3;
  const GRADE_STEPS = 96;
  const gradeTable = Array.from({ length: GRADE_STEPS + 1 }, (_, i) => {
    const s = -GRADE_SPAN + (2 * GRADE_SPAN * i) / GRADE_STEPS;
    const [gx, gz] = f.point(s, bend(s));
    return base.height(gx, gz, Math.min(Math.hypot(gx, gz), 1)) * 0.6 - 0.03;
  });
  const grade = (s: number) => {
    const k = Math.min(Math.max(((s + GRADE_SPAN) / (2 * GRADE_SPAN)) * GRADE_STEPS, 0), GRADE_STEPS - 1e-6);
    const i = Math.floor(k);
    return gradeTable[i] + (gradeTable[i + 1] - gradeTable[i]) * (k - i);
  };

  return {
    sample(x, z, rn, out) {
      const s = f.along(x, z);
      const d = Math.abs(f.across(x, z) - bend(s)) / Math.hypot(1, bendSlope(s));

      const bed = 1 - smoothstep(W - 0.01, W + 0.02, d);
      if (bed < 1) {
        base.paint(x, z, out);
        // Talude de corte: terra roxa exposta entre o pasto e a valeta
        scratch.copy(palette.soil).lerp(palette.soilOchre, clamp01(0.5 + fbm(x * 6 + ox, 71, z * 6 + oz, 2)));
        out.lerp(scratch, 1 - smoothstep(W + 0.07, W + 0.12, d));
        out.lerp(palette.soilDark, ditch(d) * 0.8);
      }
      // Leito com as trilhas dos pneus
      scratch.copy(palette.soilPacked).multiplyScalar(1 - 0.1 * gauss(d - W * 0.45, 0.02));
      out.lerp(scratch, bed);

      const level = grade(s) + 0.004 * clamp01(1 - (d / W) ** 2) - 0.012 * ditch(d);
      const blend = smoothstep(W + 0.035, W + 0.13, d);
      return blend > 0 ? level + (base.height(x, z, rn) - level) * blend : level;
    },
    props: [],
    water: null,
  };
}

/** Destoca: à esquerda, fileiras de tocos de eucalipto; no meio, a leira de tocos arrancados; à direita, terra limpa. */
function stumpField(ctx: TopContext): TopSurface {
  const base = grassland(ctx);
  const { palette, radius, ox, oz, rand } = ctx;
  const f = axes(ctx.view, -0.2);
  const side = (x: number, z: number) => f.across(x, z) + 0.035 * fbm(x * 2.5 + ox, 61, z * 2.5 + oz, 2);

  const props: TopProp[] = [];
  // Linhas de plantio a cada ~0,62 unidade e tocos a cada ~0,5 (normalizados pelo raio).
  const row = 0.62 / radius;
  const step = 0.5 / radius;
  for (let w = 0.07; w < 1; w += row) {
    for (let a = -1; a < 1; a += step) {
      const [x, z] = f.point(a + range(rand, -0.25, 0.25) * step, w + range(rand, -0.15, 0.15) * row);
      const r = range(rand, 0.1, 0.17);
      const h = range(rand, 0.14, 0.36);
      const skip = rand() < 0.18;
      if (skip || side(x, z) < 0.06 || Math.hypot(x, z) > 0.84 * ctx.outline(x, z)) continue;
      props.push({
        kind: "toco",
        x,
        z,
        rotation: [range(rand, -0.08, 0.08), range(rand, 0, TAU), range(rand, -0.08, 0.08)],
        scale: [r, h, r],
        sink: 0.05,
      });
    }
  }
  for (let i = 0; i < 11; i++) {
    const [x, z] = f.point(-0.66 + (i / 10) * 1.32 + range(rand, -0.03, 0.03), range(rand, -0.03, 0.03));
    const s = range(rand, 0.32, 0.45);
    const rotation: Vec3 = [range(rand, 1.1, 2), range(rand, 0, TAU), range(rand, -0.4, 0.4)];
    if (Math.hypot(x, z) > 0.8 * ctx.outline(x, z)) continue;
    props.push({ kind: "tocoArrancado", x, z, rotation, scale: [s, s, s], sink: s * 0.3 });
  }

  return {
    sample(x, z, rn, out) {
      const t = side(x, z);
      const cleared = 1 - smoothstep(-0.1, -0.03, t);
      const windrow = gauss(t, 0.045) * (1 - smoothstep(0.72, 0.85, rn));
      if (cleared < 1) {
        // Chão do eucaliptal: folha seca e terra, com rebrota verde aqui e ali
        base.paint(x, z, out);
        out.lerp(scratch.copy(palette.grassDry).lerp(palette.soilOchre, 0.45), 0.6);
      }
      if (cleared > 0) {
        // Metade limpa: terra gradeada
        scratch.copy(palette.soil).lerp(palette.soilOchre, clamp01(0.45 + fbm(x * 5 + oz, 63, z * 5 + ox, 2) * 1.2));
        out.lerp(scratch, cleared);
      }
      out.lerp(palette.soilDark, windrow * 0.7);

      const terrain = base.height(x, z, rn);
      return terrain - terrain * 0.45 * cleared + 0.05 * windrow;
    },
    props,
    water: null,
  };
}

/** Terreno: platô perfeitamente plano de terra batida; atrás, o barranco de pasto que sobrou do corte. */
function plateau(ctx: TopContext): TopSurface {
  const base = grassland(ctx);
  const { palette, ox, oz, rand } = ctx;
  const f = axes(ctx.view, 0.12);
  const CUT = -0.36;
  const BANK = 0.1;
  const RISE = 0.09;

  // Estacas do gabarito nos cantos do platô
  const props: TopProp[] = [];
  for (const [a, w] of [
    [0.55, -0.45],
    [0.55, 0.45],
    [-0.28, -0.5],
    [-0.28, 0.5],
  ]) {
    const [x, z] = f.point(a, w);
    const rotation: Vec3 = [range(rand, -0.06, 0.06), range(rand, 0, TAU), range(rand, -0.06, 0.06)];
    if (Math.hypot(x, z) > 0.86 * ctx.outline(x, z)) continue;
    props.push({ kind: "estaca", x, z, rotation, scale: [0.07, 0.55, 0.07], sink: 0.1 });
  }

  return {
    sample(x, z, rn, out) {
      // 0 no platô, 1 no alto do barranco. Linear: o talude é reto, de máquina.
      const mound = clamp01((CUT - f.along(x, z)) / BANK);
      // Passadas do rolo compactador
      const stripe = 0.5 + 0.5 * Math.cos((f.across(x, z) / 0.14) * TAU);
      out.copy(palette.soilPacked).multiplyScalar(0.95 + 0.06 * stripe);
      const pad = 0.0012 * fbm(x * 6 + ox, 81, z * 6 + oz, 2);
      if (mound <= 0) return pad;

      scratch.copy(palette.soil).lerp(palette.soilOchre, clamp01(0.4 + fbm(x * 5 + ox, 83, z * 5 + oz, 2)));
      out.lerp(scratch, smoothstep(0.02, 0.2, mound));
      if (mound > 0.85) {
        base.paint(x, z, scratch);
        out.lerp(scratch, smoothstep(0.88, 0.98, mound));
      }
      return pad + (RISE + base.height(x, z, rn) * 0.6 - pad) * mound;
    },
    props,
    water: null,
  };
}

const TOPS: Record<IslandTop, (ctx: TopContext) => TopSurface> = {
  pasto: pasture,
  lago: reservoir,
  revolvido: tilled,
  sulcos: furrows,
  estrada: road,
  destoca: stumpField,
  plato: plateau,
};

export function createTop(top: IslandTop, ctx: TopContext): TopSurface {
  return TOPS[top](ctx);
}
