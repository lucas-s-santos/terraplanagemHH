import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";

const perlin = new ImprovedNoise();

/** Ruído fractal (Perlin em oitavas). Saída aproximadamente em [-0.7, 0.7]. */
export function fbm(x: number, y: number, z: number, octaves = 3): number {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * perlin.noise(x * frequency, y * frequency, z * frequency);
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return sum / norm;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export function clamp01(x: number): number {
  return Math.min(Math.max(x, 0), 1);
}
