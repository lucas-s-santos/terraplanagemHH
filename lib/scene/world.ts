import type { ServiceId } from "@/content/site";

/**
 * Mapa do mundo: onde cada ilha flutua e de onde a câmera olha para ela.
 * Sem imports do three — este arquivo também é usado pelas seções (ordem das paradas).
 */
export type IslandId = "hero" | ServiceId;
/** Cada ilha é uma parada; o contato é uma parada a mais, que volta para o platô. */
export type StopId = IslandId | "contato";
export type Vec3 = readonly [number, number, number];

/**
 * O que existe no topo: o serviço tem de ser legível pela silhueta, de longe.
 * pasto · lago (reservatório) · revolvido (preparo de solo) · sulcos (aração) ·
 * estrada · destoca (metade com tocos, metade limpa) · plato (terreno nivelado).
 */
export type IslandTop = "pasto" | "lago" | "revolvido" | "sulcos" | "estrada" | "destoca" | "plato";

export interface IslandSpec {
  id: IslandId;
  center: Vec3;
  radius: number;
  /** Altura da parte de baixo (rochas e raízes), em unidades do mundo. */
  depth: number;
  seed: number;
  /** 0 = platô plano, 1 = colinas suaves. */
  relief: number;
  top: IslandTop;
  /** Posição da câmera nesta parada, relativa ao centro da ilha. */
  camera: Vec3;
  /** Altura da ilha na tela do celular (NDC), quando o texto pede outro espaço. */
  narrowY?: number;
}

// O corredor de voo passa por x ≈ -18; as ilhas alternam à esquerda e à direita dele.
// Folga mínima câmera–ilha conferida por amostragem do caminho: ~7,7 unidades além de 1,2 × raio
// no desktop e ~11,9 com a lente do celular.
export const ISLANDS: readonly IslandSpec[] = [
  { id: "hero", center: [0, 0, 0], radius: 9, depth: 13, seed: 7, relief: 0.35, top: "pasto", camera: [-17, 9, 38], narrowY: 0.46 },
  { id: "reservatorio", center: [-40, -6, -50], radius: 7, depth: 10.5, seed: 21, relief: 0.8, top: "lago", camera: [12, 6, 26] },
  { id: "preparo-solo", center: [2, 2, -95], radius: 6.5, depth: 10, seed: 34, relief: 1, top: "revolvido", camera: [-12, 6, 26] },
  { id: "aracao", center: [-38, -3, -140], radius: 7.5, depth: 11, seed: 55, relief: 0.6, top: "sulcos", camera: [12, 10, 24] },
  { id: "estradas", center: [4, -8, -190], radius: 8, depth: 12, seed: 89, relief: 0.9, top: "estrada", camera: [-12, 9, 26] },
  { id: "destoca", center: [-36, 3, -235], radius: 7, depth: 10.5, seed: 144, relief: 1, top: "destoca", camera: [12, 6, 25] },
  { id: "terrenos", center: [-12, -4, -285], radius: 8.5, depth: 12.5, seed: 233, relief: 0.15, top: "plato", camera: [-2, 8, 30] },
];

/** Parada da câmera: para qual ilha olha e de onde (relativo ao centro da ilha). */
export interface CameraStop {
  id: StopId;
  island: IslandSpec;
  camera: Vec3;
  narrowY?: number;
}

const PLATEAU = ISLANDS[ISLANDS.length - 1];

/**
 * O voo: uma parada por ilha e, no fim, o pouso no platô (contato final): mais perto,
 * mais baixo e pelo outro lado, com o barranco atrás.
 */
export const STOPS: readonly CameraStop[] = [
  ...ISLANDS.map((island) => ({ id: island.id, island, camera: island.camera, narrowY: island.narrowY })),
  { id: "contato", island: PLATEAU, camera: [13, 5, 34], narrowY: 0.46 },
];

export const STOP_IDS: readonly StopId[] = STOPS.map((stop) => stop.id);

/** Posição da câmera numa parada, em coordenadas do mundo. */
export function stopPosition(stop: CameraStop): Vec3 {
  const [cx, cy, cz] = stop.island.center;
  return [cx + stop.camera[0], cy + stop.camera[1], cz + stop.camera[2]];
}

/** Onde a ilha da parada aparece na tela (NDC: -1 a 1). No desktop, à direita do texto; no celular, acima dele. */
export const FRAMING = {
  wide: { x: 0.42, y: 0 },
  narrow: { x: 0, y: 0.3 },
} as const;

/** Lente: em telas estreitas abre o campo de visão e afasta a câmera para a ilha caber. */
export const LENS = {
  wide: { fov: 38, distance: 1 },
  narrow: { fov: 52, distance: 1.55 },
} as const;

/** A câmera mira o meio do volume da ilha (o topo fica acima, a base pendurada abaixo). */
export function islandFocus(island: IslandSpec): Vec3 {
  return [island.center[0], island.center[1] - island.depth * 0.25, island.center[2]];
}

/** Direção do sol: baixo e à direita do voo (fim de tarde). Ilumina a lateral das ilhas e aquece o céu desse lado. */
export const SUN_DIRECTION: Vec3 = [0.72, 0.2, -0.66];
