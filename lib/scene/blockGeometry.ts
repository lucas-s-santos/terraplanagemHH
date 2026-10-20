import { BufferAttribute, type BufferGeometry, Color, IcosahedronGeometry, Vector3 } from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { mulberry32, range } from "@/lib/random";
import { clamp01, fbm } from "./noise";
import type { ScenePalette } from "./palette";

/** torrão = terra solta · leiva = terra com pasto em cima · pedra = rocha. */
export const BLOCK_VARIANTS = ["torrao", "leiva", "pedra"] as const;
export type BlockVariant = (typeof BLOCK_VARIANTS)[number];

/**
 * Bloco de terra procedural: icosaedro deformado por duas camadas de ruído
 * (forma + esfarelado), com cor por vértice.
 */
export function createBlockGeometry(variant: BlockVariant, seed: number, palette: ScenePalette): BufferGeometry {
  const base = new IcosahedronGeometry(1, 3);
  base.deleteAttribute("normal");
  base.deleteAttribute("uv");
  const geometry = mergeVertices(base);
  base.dispose();

  const rand = mulberry32(seed);
  const ox = range(rand, 0, 50);
  const oy = range(rand, 0, 50);
  const oz = range(rand, 0, 50);

  const position = geometry.getAttribute("position") as BufferAttribute;
  const colors = new Float32Array(position.count * 3);
  const color = new Color();
  const v = new Vector3();

  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const shape = fbm(v.x * 1.1 + ox, v.y * 1.1 + oy, v.z * 1.1 + oz, 3);
    const crumble = fbm(v.x * 4.5 + oz, v.y * 4.5 + ox, v.z * 4.5 + oy, 2);
    v.multiplyScalar(1 + 0.42 * shape + (variant === "pedra" ? 0.04 : 0.09) * crumble);
    v.y *= variant === "pedra" ? 0.85 : 0.72;
    if (variant === "leiva" && v.y > 0.3) v.y = 0.3 + (v.y - 0.3) * 0.2;
    position.setXYZ(i, v.x, v.y, v.z);

    const n = clamp01(0.5 + fbm(v.x * 3 + oz, v.y * 3 + ox, v.z * 3 + oy, 2) * 1.5);
    if (variant === "pedra") {
      color.copy(palette.rock).lerp(palette.tokens.neblina, n * 0.25);
    } else if (variant === "leiva" && v.y > 0.22) {
      color.copy(palette.grassDark).lerp(palette.grass, n);
    } else {
      color.copy(palette.soilDark).lerp(palette.soil, n);
      if (crumble > 0.25) color.lerp(palette.soilOchre, 0.5);
    }
    colors.set([color.r, color.g, color.b], i * 3);
  }

  geometry.setAttribute("color", new BufferAttribute(colors, 3));

  // Terra fica arredondada; pedra fica facetada (normais por face).
  if (variant !== "pedra") {
    geometry.computeVertexNormals();
    return geometry;
  }
  const faceted = geometry.toNonIndexed();
  geometry.dispose();
  faceted.computeVertexNormals();
  return faceted;
}
