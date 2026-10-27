import { MathUtils } from "three";
import type { Pose } from "./model";

const { lerp, smoothstep } = MathUtils;

/** Retro recolhida para andar: lança em pé, braço dobrado, pá erguida, sapatas em cima. */
export const TRAVEL: Pose = {
  swing: 0,
  boom: -1.3,
  stick: 2.15,
  bucket: 1.7,
  loaderLift: 0.3,
  loaderTilt: 0.55,
  stabilizers: 0,
  load: 0,
};

/** Na obra: pá apoiada no chão e sapatas abaixadas (é assim que o operador trava a máquina para cavar). */
const PARKED = { loaderLift: -0.02, loaderTilt: 0, stabilizers: 1 } as const;

type ArmPose = Pick<Pose, "swing" | "boom" | "stick" | "bucket" | "load">;

/** Um ciclo de escavação, em fração do tempo do ciclo. */
const KEYS: readonly (ArmPose & { at: number })[] = [
  // Estica o braço com a caçamba aberta.
  { at: 0, swing: 0, boom: -0.3, stick: -0.62, bucket: -0.5, load: 0 },
  // Desce até o chão.
  { at: 0.1, swing: 0, boom: 0.02, stick: -0.7, bucket: -0.42, load: 0 },
  // Puxa o braço para perto, raspando, e fecha a caçamba: enche.
  { at: 0.22, swing: 0, boom: 0.1, stick: -0.15, bucket: 0.2, load: 0.45 },
  { at: 0.34, swing: 0, boom: 0.02, stick: 0.38, bucket: 1.0, load: 1 },
  // Levanta.
  { at: 0.46, swing: 0, boom: -0.72, stick: 0.55, bucket: 1.3, load: 1 },
  // Gira para o lado do monte.
  { at: 0.6, swing: -1.2, boom: -0.72, stick: 0.45, bucket: 1.3, load: 1 },
  // Despeja: estica o braço e abre a caçamba.
  { at: 0.7, swing: -1.2, boom: -0.68, stick: -0.15, bucket: -0.75, load: 0.15 },
  { at: 0.8, swing: -1.2, boom: -0.68, stick: -0.2, bucket: -0.85, load: 0 },
  // Volta para a vala.
  { at: 1, swing: 0, boom: -0.3, stick: -0.62, bucket: -0.5, load: 0 },
];

/** Duração de um ciclo, em segundos. Lento de propósito: o vídeo de fundo também é calmo. */
export const CYCLE_SECONDS = 11;
/** Trecho do ciclo em que a terra cai da caçamba (para soltar os torrões). */
export const DUMP_WINDOW = [0.64, 0.78] as const;
/** Trecho em que a caçamba raspa o chão (para levantar poeira). */
export const SCRAPE_WINDOW = [0.1, 0.34] as const;

const fields = ["swing", "boom", "stick", "bucket", "load"] as const;

/** A pose do braço num ponto do ciclo (0 a 1), com aceleração e frenagem em cada trecho. */
export function cyclePose(phase: number, out: Pose): Pose {
  const t = phase - Math.floor(phase);
  let i = 0;
  while (i < KEYS.length - 2 && t >= KEYS[i + 1].at) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const k = smoothstep((t - a.at) / (b.at - a.at), 0, 1);
  for (const field of fields) out[field] = lerp(a[field], b[field], k);
  out.loaderLift = PARKED.loaderLift;
  out.loaderTilt = PARKED.loaderTilt;
  out.stabilizers = PARKED.stabilizers;
  return out;
}

/**
 * Entrada (depois do preloader): da pose de transporte até o começo do ciclo.
 * Primeiro descem a pá e as sapatas, depois a retro se desdobra.
 */
export function introPose(progress: number, out: Pose): Pose {
  const start = cyclePose(0, { ...TRAVEL });
  const ground = smoothstep(progress, 0, 0.45);
  const arm = smoothstep(progress, 0.3, 1);
  out.loaderLift = lerp(TRAVEL.loaderLift, PARKED.loaderLift, ground);
  out.loaderTilt = lerp(TRAVEL.loaderTilt, PARKED.loaderTilt, ground);
  out.stabilizers = lerp(TRAVEL.stabilizers, PARKED.stabilizers, smoothstep(progress, 0.12, 0.5));
  for (const field of fields) out[field] = lerp(TRAVEL[field], start[field], arm);
  return out;
}

/** Pose parada para movimento reduzido: a caçamba cheia, saindo da vala. */
export function stillPose(): Pose {
  return cyclePose(0.42, { ...TRAVEL });
}
