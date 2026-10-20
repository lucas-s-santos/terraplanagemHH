import { CatmullRomCurve3, Color, Vector3 } from "three";
import { range } from "@/lib/random";
import type { MeshData } from "./meshData";
import { vertexNormals } from "./normals";
import type { ScenePalette } from "./palette";
import type { Vec3 } from "./world";

/** Ponto da encosta de onde sai uma raiz, com a direção horizontal para fora. */
export interface RootAnchor {
  position: Vec3;
  outward: readonly [number, number];
}

const SIDES = 5;
const STEPS = 12;

/**
 * Raízes penduradas: tubos finos que nascem dentro da encosta, saem um pouco para fora
 * e caem afinando até a ponta. Todas numa geometria só, com cor por vértice.
 * O anel de cada ponto é orientado por transporte paralelo (sem torção e sem o custo
 * das curvas por comprimento de arco).
 */
export function createRootGeometry(
  anchors: readonly RootAnchor[],
  islandRadius: number,
  rand: () => number,
  palette: ScenePalette,
): MeshData {
  const perRoot = (STEPS + 1) * SIDES;
  const positions = new Float32Array(anchors.length * perRoot * 3);
  const colors = new Float32Array(positions.length);
  const indices = new Uint32Array(anchors.length * STEPS * SIDES * 6);
  const color = new Color();
  const points = Array.from({ length: STEPS + 1 }, () => new Vector3());
  const tangent = new Vector3();
  const normal = new Vector3();
  const binormal = new Vector3();
  let v = 0;
  let n = 0;

  anchors.forEach(({ position, outward }, root) => {
    const [ax, ay, az] = position;
    const [nx, nz] = outward;
    const length = range(rand, 0.15, 0.5) * islandRadius;
    const reach = range(rand, 0.2, 0.6);
    const sway = () => range(rand, -0.5, 0.5);
    const curve = new CatmullRomCurve3([
      new Vector3(ax - nx * 0.3, ay + 0.05, az - nz * 0.3),
      new Vector3(ax + nx * reach * 0.6, ay - 0.15, az + nz * reach * 0.6),
      new Vector3(ax + nx * reach + sway(), ay - length * 0.5, az + nz * reach + sway()),
      new Vector3(ax + nx * reach * 1.2 + sway(), ay - length, az + nz * reach * 1.2 + sway()),
    ]);
    const thickness = range(rand, 0.05, 0.11);
    points.forEach((point, i) => curve.getPoint(i / STEPS, point));

    // Primeiro anel: qualquer perpendicular à tangente; depois, transporte paralelo.
    tangent.subVectors(points[1], points[0]).normalize();
    normal.set(-tangent.z, 0, tangent.x);
    if (normal.lengthSq() < 1e-6) normal.set(1, 0, 0);
    normal.normalize();

    for (let i = 0; i <= STEPS; i++) {
      tangent.subVectors(points[Math.min(i + 1, STEPS)], points[Math.max(i - 1, 0)]).normalize();
      normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
      binormal.crossVectors(tangent, normal);

      const t = i / STEPS;
      const r = thickness * Math.pow(1 - t, 0.9) + 0.006;
      color.copy(palette.root).lerp(palette.rock, t * 0.35);
      for (let k = 0; k < SIDES; k++) {
        const a = (k / SIDES) * Math.PI * 2;
        const cos = Math.cos(a) * r;
        const sin = Math.sin(a) * r;
        positions[v] = points[i].x + normal.x * cos + binormal.x * sin;
        positions[v + 1] = points[i].y + normal.y * cos + binormal.y * sin;
        positions[v + 2] = points[i].z + normal.z * cos + binormal.z * sin;
        colors[v] = color.r;
        colors[v + 1] = color.g;
        colors[v + 2] = color.b;
        v += 3;
      }
    }

    const start = root * perRoot;
    for (let i = 0; i < STEPS; i++) {
      for (let k = 0; k < SIDES; k++) {
        const a = start + i * SIDES + k;
        const b = start + i * SIDES + ((k + 1) % SIDES);
        indices.set([a, b, a + SIDES, b, b + SIDES, a + SIDES], n);
        n += 6;
      }
    }
  });

  return {
    attributes: {
      position: { array: positions, itemSize: 3 },
      color: { array: colors, itemSize: 3 },
      normal: { array: vertexNormals(positions, indices), itemSize: 3 },
    },
    index: indices,
  };
}
