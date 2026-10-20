import { CatmullRomCurve3, Vector3 } from "three";
import { mulberry32, range } from "@/lib/random";
import { BLOCK_VARIANTS } from "./blockGeometry";
import { ISLANDS, STOPS, type Vec3, stopPosition } from "./world";

/**
 * Cada bloco gira em volta de um pivô (velocidade ~0 para os que só flutuam).
 * posição = pivô + (cos(ângulo)·raio, altura + balanço, sen(ângulo)·raio)
 */
export interface BlockSlot {
  variant: number;
  /** Índice dentro do InstancedMesh da variante. */
  index: number;
  pivot: Vec3;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  height: number;
  bob: number;
  phase: number;
  scale: Vec3;
  rotation: Vec3;
  spin: Vec3;
}

export interface BlockField {
  /** Ordenados por prioridade: com N blocos ativos, usa os N primeiros. */
  slots: BlockSlot[];
  /** Quantos blocos de cada variante existem no total (capacidade dos InstancedMesh). */
  capacity: number[];
}

/** Meia-abertura do cone de visão (a partir da direção da ilha) que fica sem detritos nas paradas. */
const STOP_FRAME_ANGLE = (48 * Math.PI) / 180;

interface Draft extends Omit<BlockSlot, "variant" | "index"> {
  priority: number;
}

export function createBlockField(seed = 1984): BlockField {
  const rand = mulberry32(seed);
  const drafts: Draft[] = [];

  const shape = (size: number): Pick<Draft, "scale" | "rotation" | "spin"> => ({
    scale: [size * range(rand, 0.8, 1.25), size * range(rand, 0.75, 1.1), size * range(rand, 0.8, 1.25)],
    rotation: [range(rand, 0, Math.PI * 2), range(rand, 0, Math.PI * 2), range(rand, 0, Math.PI * 2)],
    spin: [range(rand, -0.12, 0.12), range(rand, -0.18, 0.18), range(rand, -0.12, 0.12)],
  });

  // 1. Órbita lenta em volta da ilha principal
  const hero = ISLANDS[0];
  for (let i = 0; i < 30; i++) {
    drafts.push({
      priority: i < 14 ? i : 100 + i,
      pivot: hero.center,
      orbitRadius: hero.radius * range(rand, 1.1, 1.45),
      orbitAngle: range(rand, 0, Math.PI * 2),
      orbitSpeed: range(rand, 0.025, 0.07) * (rand() < 0.8 ? 1 : -1),
      height: hero.radius * range(rand, -0.6, 0.3),
      bob: range(rand, 0.1, 0.4),
      phase: range(rand, 0, Math.PI * 2),
      ...shape(range(rand, 0.22, 0.75)),
    });
  }

  // 2. Pedras soltas por baixo e em volta de cada ilha
  ISLANDS.forEach((island, k) => {
    for (let i = 0; i < 6; i++) {
      const below = i % 2 === 0;
      drafts.push({
        priority: i < 2 ? 20 + k * 2 + i : 120 + k * 6 + i,
        pivot: island.center,
        orbitRadius: below ? island.radius * range(rand, 0, 0.35) : island.radius * range(rand, 1.15, 1.5),
        orbitAngle: range(rand, 0, Math.PI * 2),
        orbitSpeed: range(rand, 0.004, 0.015),
        height: below ? -island.depth * range(rand, 1.05, 1.4) : -island.depth * range(rand, 0.1, 0.5),
        bob: range(rand, 0.15, 0.5),
        phase: range(rand, 0, Math.PI * 2),
        ...shape(range(rand, 0.25, 0.7)),
      });
    }
  });

  // 3. Detritos ao longo do voo, longe do caminho da câmera e fora do quadro das paradas
  //    (onde o texto está sendo lido): eles só cruzam a tela durante o voo.
  const stopCameras = STOPS.map((stop) => new Vector3(...stopPosition(stop)));
  const stopViews = STOPS.map((stop, k) => new Vector3(...stop.island.center).sub(stopCameras[k]).normalize());
  const inStopFrame = (point: Vector3) =>
    stopCameras.some((camera, k) => {
      const toPoint = point.clone().sub(camera);
      const distance = toPoint.length();
      return distance < 26 || (distance < 120 && toPoint.angleTo(stopViews[k]) < STOP_FRAME_ANGLE);
    });
  const path = new CatmullRomCurve3(stopCameras, false, "centripetal");
  const p = new Vector3();
  const pivot = new Vector3();
  for (let i = 0; i < 78; i++) {
    let attempts = 0;
    do {
      path.getPoint(rand(), p);
      const angle = range(rand, 0, Math.PI * 2);
      const distance = range(rand, 12, 34);
      pivot.set(p.x + Math.cos(angle) * distance, p.y + Math.sin(angle) * distance * 0.6, p.z + range(rand, -10, 10));
    } while (inStopFrame(pivot) && ++attempts < 400);
    if (attempts >= 400) continue;
    drafts.push({
      priority: i < 12 ? 40 + i : 200 + i,
      pivot: [pivot.x, pivot.y, pivot.z],
      orbitRadius: 0,
      orbitAngle: 0,
      orbitSpeed: 0,
      height: 0,
      bob: range(rand, 0.2, 0.6),
      phase: range(rand, 0, Math.PI * 2),
      ...shape(range(rand, 0.2, 1)),
    });
  }

  drafts.sort((a, b) => a.priority - b.priority);

  const capacity = BLOCK_VARIANTS.map(() => 0);
  const slots = drafts.map(({ priority: _priority, ...draft }): BlockSlot => {
    const r = rand();
    const variant = r < 0.45 ? 0 : r < 0.75 ? 1 : 2;
    return { ...draft, variant, index: capacity[variant]++ };
  });

  return { slots, capacity };
}
