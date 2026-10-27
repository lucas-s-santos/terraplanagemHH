import { Color, type Material, MeshPhysicalMaterial, MeshStandardMaterial } from "three";

export interface BackhoeColors {
  yellow: string;
  soil: string;
  dark: string;
  dust: string;
}

interface DirtOptions {
  color: Color;
  /** Quanto suja no máximo (0 a 1). */
  amount: number;
  /** Até que altura a poeira sobe, em metros. */
  height: number;
  /**
   * "world": a sujeira vem do chão (para o que não se mexe). "object": fica presa na peça
   * (caçambas), pela altura da própria geometria.
   */
  space: "world" | "object";
}

/**
 * Poeira de terra roxa: escurece e deixa fosca a parte de baixo, com manchas irregulares.
 * Sem textura (nada para baixar): ruído calculado no próprio shader.
 */
function withDirt<T extends MeshStandardMaterial>(material: T, { color, amount, height, space }: DirtOptions): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDirtColor = { value: color };
    shader.uniforms.uDirtAmount = { value: amount };
    shader.uniforms.uDirtHeight = { value: height };
    const model = space === "world" ? "modelMatrix * " : "";
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDirtPos;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
#ifdef USE_INSTANCING
vDirtPos = (${model}instanceMatrix * vec4(transformed, 1.0)).xyz;
#else
vDirtPos = (${model}vec4(transformed, 1.0)).xyz;
#endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vDirtPos;
uniform vec3 uDirtColor;
uniform float uDirtAmount;
uniform float uDirtHeight;
float dirtHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float dirtNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(dirtHash(i), dirtHash(i + vec3(1, 0, 0)), f.x), mix(dirtHash(i + vec3(0, 1, 0)), dirtHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(dirtHash(i + vec3(0, 0, 1)), dirtHash(i + vec3(1, 0, 1)), f.x), mix(dirtHash(i + vec3(0, 1, 1)), dirtHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float dirtBlotch = dirtNoise(vDirtPos * 3.1) * 0.65 + dirtNoise(vDirtPos * 11.0) * 0.35;
float dirt = (1.0 - smoothstep(0.0, uDirtHeight, vDirtPos.y + (dirtBlotch - 0.5) * uDirtHeight * 0.7)) * uDirtAmount;
dirt = clamp(dirt * (0.75 + dirtBlotch * 0.5), 0.0, 1.0);
diffuseColor.rgb = mix(diffuseColor.rgb, uDirtColor * (0.75 + dirtBlotch * 0.4), dirt);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.95, dirt);",
      );
  };
  // Cada variação de sujeira compila o seu programa.
  material.customProgramCacheKey = () => `dirt-${space}-${amount}-${height}`;
  return material;
}

/** Os materiais da máquina. Cores da marca vêm dos tokens; o resto é aço, borracha e vidro. */
export function createMaterials(colors: BackhoeColors) {
  const soil = new Color(colors.soil);
  const dust = new Color(colors.dust);
  // Poeira seca de terra roxa: o vermelho do solo clareado pelo pó.
  const dirt = soil.clone().lerp(dust, 0.32);

  const paint = withDirt(
    new MeshPhysicalMaterial({
      color: new Color(colors.yellow),
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.3,
    }),
    { color: dirt, amount: 0.75, height: 1.15, space: "world" },
  );
  // A caçamba da frente: tinta gasta e terra por dentro.
  const bucketPaint = withDirt(
    new MeshPhysicalMaterial({ color: new Color(colors.yellow), roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.5 }),
    { color: soil.clone().lerp(dust, 0.15), amount: 0.6, height: 0.45, space: "object" },
  );
  const steel = withDirt(new MeshStandardMaterial({ color: new Color("#1f1d1b"), roughness: 0.5, metalness: 0.35 }), {
    color: dirt,
    amount: 0.6,
    height: 1.0,
    space: "world",
  });
  // A caçamba de trás: aço escuro, gasto no fio e sujo de terra.
  const bucketSteel = withDirt(new MeshStandardMaterial({ color: new Color("#22201e"), roughness: 0.6, metalness: 0.4 }), {
    color: soil.clone().lerp(dust, 0.12),
    amount: 0.9,
    height: 0.7,
    space: "object",
  });
  const rubber = withDirt(new MeshStandardMaterial({ color: new Color("#191715"), roughness: 0.92, metalness: 0 }), {
    color: dirt,
    amount: 0.55,
    height: 1.6,
    space: "world",
  });
  const chrome = new MeshStandardMaterial({ color: new Color("#e6e2dc"), roughness: 0.12, metalness: 1 });
  const pin = new MeshStandardMaterial({ color: new Color("#b9b4ac"), roughness: 0.3, metalness: 0.85 });
  const interior = new MeshStandardMaterial({ color: new Color("#2e2c2a"), roughness: 0.8 });
  const glass = new MeshPhysicalMaterial({
    color: new Color("#3a3f40"),
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    envMapIntensity: 1.6,
  });
  const beacon = new MeshStandardMaterial({
    color: new Color("#ff8a1c"),
    emissive: new Color("#ff6a00"),
    emissiveIntensity: 0.6,
    roughness: 0.25,
    transparent: true,
    opacity: 0.9,
  });
  const lamp = new MeshStandardMaterial({ color: new Color("#fff4dc"), emissive: new Color("#fff1d0"), emissiveIntensity: 0.4 });
  const tail = new MeshStandardMaterial({ color: new Color("#8a1410"), emissive: new Color("#5a0a06"), roughness: 0.3 });
  // A terra que a caçamba carrega e os torrões.
  const load = new MeshStandardMaterial({ color: soil.clone().lerp(new Color(colors.dark), 0.15), roughness: 1, flatShading: true });

  const all: Material[] = [paint, bucketPaint, steel, bucketSteel, rubber, chrome, pin, interior, glass, beacon, lamp, tail, load];
  return {
    paint,
    bucketPaint,
    steel,
    bucketSteel,
    rubber,
    chrome,
    pin,
    interior,
    glass,
    beacon,
    lamp,
    tail,
    load,
    dispose: () => all.forEach((material) => material.dispose()),
  };
}

export type BackhoeMaterials = ReturnType<typeof createMaterials>;
