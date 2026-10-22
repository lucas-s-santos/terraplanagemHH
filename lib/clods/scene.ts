import {
  BufferAttribute,
  type BufferGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  MathUtils,
  MeshStandardMaterial,
  NeutralToneMapping,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

export interface ClodColors {
  soil: string;
  dark: string;
  dust: string;
}

export interface ClodsOptions {
  canvas: HTMLCanvasElement;
  count: number;
  /** Tela em pé: os torrões se espalham por toda a largura (no desktop, mais à direita, longe do texto). */
  narrow: boolean;
  colors: ClodColors;
  /** Parada atual (contínua) e a última: no contato a terra assenta. */
  getStop: () => number;
  lastStop: number;
}

const perlin = new ImprovedNoise();
const fbm = (x: number, y: number, z: number, octaves: number) => {
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
};

/** Torrão procedural: icosaedro deformado por ruído, achatado, com terra mais clara por cima (sol). */
function clodGeometry(seed: number, colors: ClodColors): BufferGeometry {
  const base = new IcosahedronGeometry(1, 3);
  base.deleteAttribute("normal");
  base.deleteAttribute("uv");
  const geometry = mergeVertices(base);
  base.dispose();

  const soil = new Color(colors.soil);
  const dark = new Color(colors.dark);
  const dust = new Color(colors.dust);
  const color = new Color();
  const v = new Vector3();
  const position = geometry.getAttribute("position") as BufferAttribute;
  const rgb = new Float32Array(position.count * 3);
  const o = seed * 17.3;

  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const shape = fbm(v.x * 1.1 + o, v.y * 1.1 + o, v.z * 1.1 + o, 3);
    const crumble = fbm(v.x * 4.5 + o, v.y * 4.5 - o, v.z * 4.5 + o, 2);
    v.multiplyScalar(1 + 0.42 * shape + 0.09 * crumble);
    v.y *= 0.74;
    position.setXYZ(i, v.x, v.y, v.z);

    const tone = MathUtils.clamp(0.5 + fbm(v.x * 3 + o, v.y * 3, v.z * 3 - o, 2) * 1.5, 0, 1);
    color.copy(dark).lerp(soil, tone);
    // Terra seca de sol no topo do torrão.
    color.lerp(dust, MathUtils.smoothstep(v.y, 0.15, 0.7) * 0.32);
    rgb.set([color.r, color.g, color.b], i * 3);
  }

  geometry.setAttribute("color", new BufferAttribute(rgb, 3));
  geometry.computeVertexNormals();
  return geometry;
}

interface Clod {
  mesh: number;
  index: number;
  x: number;
  y: number;
  z: number;
  scale: Vector3;
  rotation: Vector3;
  spin: Vector3;
  rise: number;
  phase: number;
}

/**
 * Torrões que saem do vídeo: poucos torrões de terra roxa em 3D, num canvas transparente
 * entre o vídeo e o texto. Sobem devagar (como os dos clipes), aceleram com o scroll,
 * acompanham o mouse e, no contato, param de subir e assentam: a terra fica pronta.
 */
export function createClods({ canvas, count, narrow, colors, getStop, lastStop }: ClodsOptions) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, narrow ? 1.25 : 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NeutralToneMapping;
  // O canvas fica acima do véu escuro do vídeo: sem baixar a exposição, os torrões brilham mais
  // que a cena e parecem colados por cima.
  renderer.toneMappingExposure = 0.72;

  const scene = new Scene();
  // Os de longe somem numa névoa da cor da terra sob o véu.
  scene.fog = new Fog(new Color(colors.dark).lerp(new Color(colors.soil), 0.25), 20, 38);
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 22);

  // A luz dos vídeos: sol baixo de fim de tarde vindo da direita, luz quente de baixo.
  const sun = new Color(colors.dust).lerp(new Color("#ffffff"), 0.45);
  scene.add(new HemisphereLight(new Color(colors.dust), new Color(colors.soil), 1.3));
  const key = new DirectionalLight(sun, 2.8);
  key.position.set(9, 5, 6);
  scene.add(key);

  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  const geometries = [clodGeometry(1, colors), clodGeometry(2, colors)];
  const meshes = geometries.map((geometry) => {
    const mesh = new InstancedMesh(geometry, material, Math.ceil(count / 2));
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  });

  // Área visível no plano z = 0 (recalculada no resize).
  const view = { halfW: 1, halfH: 1 };
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    view.halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    view.halfW = view.halfH * camera.aspect;
  };
  resize();

  // No desktop o texto fica à esquerda: os torrões nascem mais à direita.
  const spawnX = () => {
    const u = narrow ? Math.random() : Math.sqrt(Math.random());
    return MathUtils.lerp(-view.halfW * 1.05, view.halfW * 1.05, u);
  };

  const clods: Clod[] = Array.from({ length: count }, (_, i) => {
    const z = MathUtils.randFloat(-14, 4);
    const size = MathUtils.randFloat(0.14, 0.42) * (narrow ? 0.85 : 1);
    return {
      mesh: i % 2,
      index: Math.floor(i / 2),
      x: spawnX(),
      y: MathUtils.randFloat(-view.halfH * 1.2, view.halfH * 1.2),
      z,
      scale: new Vector3(size * MathUtils.randFloat(0.8, 1.25), size * MathUtils.randFloat(0.75, 1.1), size * MathUtils.randFloat(0.8, 1.25)),
      rotation: new Vector3(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28),
      spin: new Vector3(MathUtils.randFloatSpread(0.5), MathUtils.randFloatSpread(0.6), MathUtils.randFloatSpread(0.5)),
      rise: MathUtils.randFloat(0.25, 0.6),
      phase: Math.random() * 6.28,
    };
  });

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("resize", resize);

  const dummy = new Object3D();
  let lastScroll = window.scrollY;
  let boost = 0;
  let last = performance.now();
  let frame = 0;

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    if (document.hidden) return;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    const t = now / 1000;

    // Rolar a página empurra os torrões para cima (o scroll "levanta a terra").
    const scrolled = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    boost = MathUtils.damp(boost, MathUtils.clamp(scrolled / 18, -3, 6), 6, dt);

    // No contato a terra assenta: param de subir, descem devagar e quase param de girar.
    const settle = MathUtils.smoothstep(getStop(), lastStop - 0.6, lastStop);
    const drift = MathUtils.lerp(1, -0.35, settle);
    const spinRate = 1 - 0.8 * settle;

    pointer.sx = MathUtils.damp(pointer.sx, pointer.x, 3, dt);
    pointer.sy = MathUtils.damp(pointer.sy, pointer.y, 3, dt);
    camera.position.x = pointer.sx * 1.2;
    camera.position.y = -pointer.sy * 0.8;
    camera.lookAt(0, 0, 0);

    for (const clod of clods) {
      // Os de perto andam mais com o scroll (profundidade).
      const depth = MathUtils.mapLinear(clod.z, -14, 4, 0.55, 1.35);
      clod.y += (clod.rise * drift + boost * depth) * dt;
      const limit = view.halfH * 1.25 + 2;
      if (clod.y > limit) {
        clod.y = -limit;
        clod.x = spawnX();
      } else if (clod.y < -limit) {
        clod.y = limit;
        clod.x = spawnX();
      }
      clod.rotation.addScaledVector(clod.spin, dt * spinRate);

      dummy.position.set(clod.x + Math.sin(t * 0.3 + clod.phase) * 0.25, clod.y, clod.z);
      dummy.rotation.set(clod.rotation.x, clod.rotation.y, clod.rotation.z);
      dummy.scale.copy(clod.scale);
      dummy.updateMatrix();
      meshes[clod.mesh].setMatrixAt(clod.index, dummy.matrix);
    }
    for (const mesh of meshes) mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(tick);

  return {
    dispose() {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
      renderer.dispose();
    },
  };
}
