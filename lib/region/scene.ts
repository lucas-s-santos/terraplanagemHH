import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";

export interface RegionColors {
  soil: string;
  dark: string;
  dust: string;
  yellow: string;
}

/** Um lugar no mapa, em km a partir de Alterosa. */
export interface Place {
  east: number;
  north: number;
}

/** Onde desenhar cada rótulo (px dentro do canvas). */
export interface LabelPoint {
  x: number;
  y: number;
  visible: boolean;
}

export interface RegionSceneOptions {
  canvas: HTMLCanvasElement;
  colors: RegionColors;
  /** O primeiro é a origem (Alterosa); os outros, as cidades. */
  places: Place[];
  /** Anéis de distância, em km. */
  rings: number[];
  /** Progresso do scroll pela seção (0 a 1): a maquete gira um pouco. */
  getProgress: () => number;
  /** A cada quadro: posição dos rótulos (lugares, depois anéis). */
  onFrame: (points: LabelPoint[]) => void;
  still: boolean;
}

/** 1 unidade = 10 km. O bloco cobre 42 km para cada lado do trevo. */
const KM = 0.1;
const HALF = 4.2;
const N = 180;
const ROWS = 18;
const BOTTOM = -0.75;
const { smoothstep, lerp, clamp } = MathUtils;

/** Relevo estilizado (não é o relevo real): morros suaves e um vale, sempre iguais. */
const relief = (x: number, z: number) =>
  0.17 * Math.sin(0.9 * x + 0.3) * Math.cos(0.7 * z - 0.5) +
  0.1 * Math.sin(1.7 * x - 1.1 * z + 1.2) +
  0.05 * Math.sin(3.3 * x + 2.1 * z) +
  0.012 * Math.sin(6.1 * x - 4.7 * z + 0.4) +
  0.2;

/** Coordenadas da cena: leste é +x, norte é -z (o norte fica no fundo). */
const toScene = ({ east, north }: Place) => new Vector3(east * KM, 0, -north * KM);

/**
 * Maquete topográfica da região: bloco de terra com camadas nas paredes, curvas de nível no
 * topo, anéis de distância a partir do trevo de Alterosa (com um pulso saindo dele) e uma
 * estaca em cada cidade. Os nomes são HTML (acessíveis), posicionados pela projeção.
 */
export function createRegionMap({ canvas, colors, places, rings, getProgress, onFrame, still }: RegionSceneOptions) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  // No celular, 1,5x basta (menos pixels para a GPU pintar a cada quadro, sem diferença visível).
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, canvas.clientWidth < 700 ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.toneMapping = NeutralToneMapping;

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.5, 80);
  const c = {
    soil: new Color(colors.soil),
    dark: new Color(colors.dark),
    dust: new Color(colors.dust),
    yellow: new Color(colors.yellow),
  };

  scene.add(new HemisphereLight(c.dust.clone().lerp(new Color("#ffffff"), 0.3), c.dark, 1.2));
  // Luz de noroeste, como nos mapas de relevo.
  const sun = new DirectionalLight(c.dust.clone().lerp(new Color("#ffffff"), 0.4), 2.4);
  sun.position.set(-5, 6, -3);
  scene.add(sun);

  const block = new Group();
  scene.add(block);

  // ---------- Topo com curvas de nível e anéis ----------
  const top = new BufferGeometry();
  const count = (N + 1) * (N + 1);
  const topPos = new Float32Array(count * 3);
  const index: number[] = [];
  for (let j = 0; j <= N; j++) {
    for (let i = 0; i <= N; i++) {
      const x = -HALF + (2 * HALF * i) / N;
      const z = -HALF + (2 * HALF * j) / N;
      topPos.set([x, relief(x, z), z], (j * (N + 1) + i) * 3);
      if (i < N && j < N) {
        const a = j * (N + 1) + i;
        index.push(a, a + N + 1, a + 1, a + 1, a + N + 1, a + N + 2);
      }
    }
  }
  top.setAttribute("position", new BufferAttribute(topPos, 3));
  top.setIndex(index);
  top.computeVertexNormals();

  const uniforms = {
    uTime: { value: 0 },
    uPulse: { value: still ? 0 : 1 },
    uLine: { value: c.dust.clone() },
    uRing: { value: c.yellow.clone() },
    uRings: { value: [rings[0] * KM, (rings[1] ?? rings[0]) * KM] },
  };
  const topMaterial = new MeshStandardMaterial({ color: c.soil.clone().lerp(c.dark, 0.35), roughness: 0.92 });
  topMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vMapPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvMapPos = transformed;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vMapPos;
uniform float uTime;
uniform float uPulse;
uniform vec3 uLine;
uniform vec3 uRing;
uniform float uRings[2];
float lineAt(float value, float width) {
  float d = abs(fract(value - 0.5) - 0.5) / max(fwidth(value), 1e-4);
  return 1.0 - smoothstep(0.0, width, d);
}
float ringAt(float r, float radius, float width) {
  return 1.0 - smoothstep(0.0, width, abs(r - radius) / max(fwidth(r), 1e-4));
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float h = vMapPos.y * 16.0;
float contour = lineAt(h, 0.9) * 0.2 + lineAt(h / 5.0, 1.5) * 0.5;
diffuseColor.rgb = mix(diffuseColor.rgb, uLine, contour);
float r = length(vMapPos.xz);
float ring = max(ringAt(r, uRings[0], 1.6), ringAt(r, uRings[1], 1.6));
// O pulso sai do trevo e some antes de chegar à borda.
float travel = mod(uTime * 0.55, 3.8);
float pulse = uPulse * ringAt(r, travel, 4.0) * (1.0 - smoothstep(0.4, 3.8, travel)) * smoothstep(0.0, 0.25, travel);
float glow = max(ring * 0.85, pulse * 0.7);
diffuseColor.rgb = mix(diffuseColor.rgb, uRing, glow);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uRing * glow * 0.55 + uLine * contour * 0.12;",
      );
  };
  block.add(new Mesh(top, topMaterial));

  // ---------- Paredes com as camadas de solo ----------
  const ochre = c.soil.clone().lerp(c.dust, 0.22);
  const deep = c.soil.clone().lerp(c.dark, 0.6);
  const strata = [c.soil, deep, ochre, c.soil, deep, c.dark.clone().lerp(c.soil, 0.25)];
  const edges: [number, number][][] = [
    Array.from({ length: N + 1 }, (_, i) => [-HALF + (2 * HALF * i) / N, HALF]),
    Array.from({ length: N + 1 }, (_, i) => [HALF, HALF - (2 * HALF * i) / N]),
    Array.from({ length: N + 1 }, (_, i) => [HALF - (2 * HALF * i) / N, -HALF]),
    Array.from({ length: N + 1 }, (_, i) => [-HALF, -HALF + (2 * HALF * i) / N]),
  ];
  const wallCount = 4 * (N + 1) * (ROWS + 1);
  const wallPos = new Float32Array(wallCount * 3);
  const wallCol = new Float32Array(wallCount * 3);
  const wallIdx: number[] = [];
  const color = new Color();
  edges.forEach((edge, s) => {
    const base = s * (N + 1) * (ROWS + 1);
    edge.forEach(([x, z], i) => {
      const yTop = relief(x, z);
      for (let row = 0; row <= ROWS; row++) {
        const y = lerp(yTop, BOTTOM, row / ROWS);
        const v = base + row * (N + 1) + i;
        wallPos.set([x, y, z], v * 3);
        const wobble = 0.3 * Math.sin(x * 2.3 + z * 1.7);
        const depth = ((0.45 - y) / (0.45 - BOTTOM)) * strata.length + wobble;
        const band = clamp(Math.floor(depth), 0, strata.length - 1);
        color.copy(strata[band]).lerp(strata[clamp(band + 1, 0, strata.length - 1)], smoothstep(depth - Math.floor(depth), 0.8, 1));
        color.multiplyScalar(lerp(1, 0.5, row / ROWS));
        wallCol.set([color.r, color.g, color.b], v * 3);
        if (row < ROWS && i < N) wallIdx.push(v, v + N + 1, v + 1, v + 1, v + N + 1, v + N + 2);
      }
    });
  });
  const walls = new BufferGeometry();
  walls.setAttribute("position", new BufferAttribute(wallPos, 3));
  walls.setAttribute("color", new BufferAttribute(wallCol, 3));
  walls.setIndex(wallIdx);
  walls.computeVertexNormals();
  const wallMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  block.add(new Mesh(walls, wallMaterial));

  // ---------- Estacas: Alterosa (alta, ponta amarela) e as cidades ----------
  const stakeMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
  const stakeGeometry = (height: number, width: number) => {
    const geometry = new BoxGeometry(width, height, width, 1, 6, 1).translate(0, height / 2, 0);
    const position = geometry.getAttribute("position");
    const tint = new Float32Array(position.count * 3);
    const wood = c.dust.clone().lerp(c.soil, 0.2);
    for (let i = 0; i < position.count; i++) {
      const tip = position.getY(i) > height * 0.72 ? c.yellow : wood;
      tint.set([tip.r, tip.g, tip.b], i * 3);
    }
    geometry.setAttribute("color", new BufferAttribute(tint, 3));
    return geometry;
  };
  const originStake = stakeGeometry(0.46, 0.05);
  const cityStake = stakeGeometry(0.3, 0.032);
  const anchors: Vector3[] = places.map((place, i) => {
    const p = toScene(place);
    p.y = relief(p.x, p.z);
    const mesh = new Mesh(i === 0 ? originStake : cityStake, stakeMaterial);
    mesh.position.copy(p).setY(p.y - 0.01);
    block.add(mesh);
    return p.clone().setY(p.y + (i === 0 ? 0.46 : 0.3));
  });
  // Rótulos dos anéis: do lado sudeste, virado para a câmera.
  rings.forEach((km) => {
    const angle = MathUtils.degToRad(30);
    const x = Math.cos(angle) * km * KM;
    const z = Math.sin(angle) * km * KM;
    anchors.push(new Vector3(x, relief(x, z) + 0.02, z));
  });

  // ---------- Câmera e laço ----------
  let distance = 20;
  /** Tela estreita (celular): o mapa inteiro ficava pequeno e os nomes do norte se encavalavam. */
  let narrow = false;
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    narrow = w < 600;
    const halfV = MathUtils.degToRad(camera.fov / 2);
    const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
    // Cabe a largura do bloco visto de cima em diagonal e a altura dele em perspectiva. No celular,
    // só o anel de 30 km com os nomes (as bordas do bloco saem um pouco da tela).
    distance = narrow
      ? Math.max(4.0 / Math.tan(halfH), 3.7 / Math.tan(halfV))
      : Math.max(5.7 / Math.tan(halfH), 4.1 / Math.tan(halfV));
    camera.updateProjectionMatrix();
    if (still) draw(0);
  };

  const pointer = { x: 0, sx: 0 };
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType === "mouse") pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  };
  if (!still) window.addEventListener("pointermove", onPointer, { passive: true });

  const projected = new Vector3();
  const labels: LabelPoint[] = anchors.map(() => ({ x: 0, y: 0, visible: false }));
  const draw = (progress: number) => {
    const azimuth = lerp(-0.32, 0.22, progress) + pointer.sx * 0.08;
    // No celular, mais de cima: em 45°, as cidades do norte ficavam comprimidas umas sobre as outras.
    const elevation = narrow ? 1.02 : 0.78;
    camera.position.set(
      Math.sin(azimuth) * Math.cos(elevation) * distance,
      Math.sin(elevation) * distance,
      Math.cos(azimuth) * Math.cos(elevation) * distance,
    );
    camera.lookAt(0, -0.05, 0.25);
    renderer.render(scene, camera);
    const { clientWidth: w, clientHeight: h } = canvas;
    anchors.forEach((anchor, i) => {
      projected.copy(anchor).project(camera);
      labels[i].x = ((projected.x + 1) / 2) * w;
      labels[i].y = ((1 - projected.y) / 2) * h;
      labels[i].visible = projected.z < 1;
    });
    onFrame(labels);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  let frame = 0;
  let running = false;
  let last = performance.now();
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const dt = clamp((now - last) / 1000, 0, 1 / 20);
    last = now;
    uniforms.uTime.value += dt;
    pointer.sx = MathUtils.damp(pointer.sx, pointer.x, 3, dt);
    draw(getProgress());
  };
  if (still) draw(0.5);

  return {
    setRunning(on: boolean) {
      if (still || on === running) return;
      running = on;
      if (on) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      } else cancelAnimationFrame(frame);
    },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      [top, walls, originStake, cityStake].forEach((geometry) => geometry.dispose());
      [topMaterial, wallMaterial, stakeMaterial].forEach((material) => material.dispose());
      renderer.dispose();
    },
  };
}
