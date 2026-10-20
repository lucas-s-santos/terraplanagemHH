/**
 * Perlin "melhorado" (Ken Perlin, 2002): o mesmo do ImprovedNoise do three, com a mesma
 * tabela e a mesma ordem de contas (dá valores idênticos, então as ilhas não mudam),
 * mas com a tabela em Uint8Array e o gradiente tabelado. Gerar as ilhas é quase todo ruído.
 */
const PERMUTATION = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10,
  23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87,
  174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,
  133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208,
  89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5,
  202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119,
  248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
  178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249,
  14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205,
  93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];
const P = new Uint8Array(512);
for (let i = 0; i < 512; i++) P[i] = PERMUTATION[i & 255];

// Gradiente de cada hash como coeficientes de x, y e z (o grad() de Perlin, sem os desvios).
const GX = new Float64Array(16);
const GY = new Float64Array(16);
const GZ = new Float64Array(16);
for (let h = 0; h < 16; h++) {
  const su = (h & 1) === 0 ? 1 : -1;
  const sv = (h & 2) === 0 ? 1 : -1;
  if (h < 8) GX[h] += su;
  else GY[h] += su;
  if (h < 4) GY[h] += sv;
  else if (h === 12 || h === 14) GX[h] += sv;
  else GZ[h] += sv;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;
const grad = (hash: number, x: number, y: number, z: number) => {
  const h = hash & 15;
  return GX[h] * x + GY[h] * y + GZ[h] * z;
};

export function perlin(x: number, y: number, z: number): number {
  const floorX = Math.floor(x);
  const floorY = Math.floor(y);
  const floorZ = Math.floor(z);
  const X = floorX & 255;
  const Y = floorY & 255;
  const Z = floorZ & 255;
  x -= floorX;
  y -= floorY;
  z -= floorZ;
  const x1 = x - 1;
  const y1 = y - 1;
  const z1 = z - 1;
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = P[X] + Y;
  const AA = P[A] + Z;
  const AB = P[A + 1] + Z;
  const B = P[X + 1] + Y;
  const BA = P[B] + Z;
  const BB = P[B + 1] + Z;
  return lerp(
    lerp(lerp(grad(P[AA], x, y, z), grad(P[BA], x1, y, z), u), lerp(grad(P[AB], x, y1, z), grad(P[BB], x1, y1, z), u), v),
    lerp(
      lerp(grad(P[AA + 1], x, y, z1), grad(P[BA + 1], x1, y, z1), u),
      lerp(grad(P[AB + 1], x, y1, z1), grad(P[BB + 1], x1, y1, z1), u),
      v,
    ),
    w,
  );
}

/** Ruído fractal (Perlin em oitavas). Saída aproximadamente em [-0.7, 0.7]. */
export function fbm(x: number, y: number, z: number, octaves = 3): number {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * perlin(x * frequency, y * frequency, z * frequency);
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
