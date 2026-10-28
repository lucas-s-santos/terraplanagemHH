import {
  CanvasTexture,
  Color,
  DirectionalLight,
  EdgesGeometry,
  HemisphereLight,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  type Material,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { TRAVEL, cyclePose } from "./cycle";
import { type BackhoeColors, createMaterials } from "./materials";
import { type Pose, createBackhoe } from "./model";
import { skyReflection } from "./sky";

const { clamp, damp, lerp, smoothstep } = MathUtils;

/** As peças apontadas pela planta, na ordem em que a seção as mostra (depois da máquina inteira). */
export const CALLOUTS = ["loader", "stabilizer", "boom", "bucket"] as const;
export type CalloutId = (typeof CALLOUTS)[number];
/** Trechos do scroll: a máquina inteira (o desenho vira máquina) e um por peça, todos do mesmo tamanho. */
export const SEGMENTS = CALLOUTS.length + 1;

export interface Point {
  x: number;
  y: number;
}

/** O que a seção desenha por cima do canvas, em pixels do canvas, a cada quadro. */
export interface BlueprintFrame {
  callouts: Record<CalloutId, Point>;
  /** A linha do chão, de ponta a ponta da cena. */
  ground: [Point, Point];
  /** A lâmina que pinta o desenho: só aparece enquanto ele vira máquina. */
  blade: { from: Point; to: Point; on: boolean };
}

export interface BlueprintOptions {
  canvas: HTMLCanvasElement;
  colors: BackhoeColors;
  /** Progresso do scroll na seção (0 a 1). */
  getProgress: () => number;
  onFrame: (frame: BlueprintFrame) => void;
  /** Movimento reduzido: a máquina pintada, na pose final, desenhada uma vez. */
  still: boolean;
}

interface Framing {
  /** Ângulo em volta da máquina: 0 = de lado, positivo = mais pela frente. */
  azimuth: number;
  elevation: number;
  /** Fração da largura da tela que a máquina ocupa. */
  fill: number;
  /** Deslocamento da imagem (fração da tela): x negativo leva a máquina para a direita, y positivo para cima. */
  shiftX: number;
  shiftY: number;
}
// Quase de perfil, como num desenho técnico, mas com um pouco da frente para ter volume.
const WIDE: Framing = { azimuth: 0.2, elevation: 0.09, fill: 0.6, shiftX: -0.04, shiftY: 0.07 };
const TALL: Framing = { azimuth: 0.2, elevation: 0.11, fill: 0.85, shiftX: 0, shiftY: 0.04 };
const FOV = 24;
/** Meio comprimento da máquina com a retro esticada no chão (da caçamba até a pá). */
const HALF_LENGTH = 4.75;
const TARGET = new Vector3(-1.0, 1.15, 0);
/** Luz principal: do alto, do lado da câmera e um pouco pela frente. */
const KEY = new Vector3(0.45, 0.72, -0.55).normalize();

/** Onde a pintura passa (x): da frente (a pá) para trás (a retro). */
const PAINT_FROM = 4.4;
const PAINT_TO = -4.6;

const at = (segment: number, t: number) => (segment + t) / SEGMENTS;
/** 0 → 1 dentro de um trecho do scroll (t em fração do trecho). */
const span = (p: number, segment: number, from: number, to: number) => smoothstep(p, at(segment, from), at(segment, to));

/** Quanto do desenho já virou máquina. */
const paintAt = (p: number) => span(p, 0, 0.1, 0.85);

const ARM = ["swing", "boom", "stick", "bucket", "load"] as const;
const ARM_OUT = cyclePose(0, { ...TRAVEL });
const ARM_DOWN = cyclePose(0.1, { ...TRAVEL });
const dig: Pose = { ...TRAVEL };

/** A pose da máquina em cada ponto do scroll: cada peça trabalha no seu trecho. */
function sequencePose(p: number, out: Pose): Pose {
  // Pá carregadeira: desce raspando, sobe carregada e, nas sapatas, volta a apoiar no chão.
  const scrape = span(p, 1, 0.08, 0.4);
  const carry = span(p, 1, 0.5, 0.88);
  const park = span(p, 2, 0.05, 0.4);
  out.loaderLift = lerp(lerp(lerp(TRAVEL.loaderLift, -0.02, scrape), 0.85, carry), -0.02, park);
  out.loaderTilt = lerp(lerp(lerp(TRAVEL.loaderTilt, 0, scrape), 0.65, carry), 0, park);
  out.stabilizers = span(p, 2, 0.35, 0.85);
  // Lança e braço: desdobram e esticam até o chão. Caçamba: raspa, enche e levanta (o ciclo de escavação, de 0,1 a 0,46).
  const filling = span(p, 4, 0.08, 0.9);
  if (filling > 0) {
    cyclePose(lerp(0.1, 0.46, filling), dig);
    for (const field of ARM) out[field] = dig[field];
  } else {
    const unfold = span(p, 3, 0.08, 0.5);
    const reach = span(p, 3, 0.55, 0.92);
    for (const field of ARM) out[field] = lerp(lerp(TRAVEL[field], ARM_OUT[field], unfold), ARM_DOWN[field], reach);
  }
  return out;
}

/** Devolve a vez ao navegador entre as etapas da montagem: a cena nasce enquanto a pessoa ainda rola a seção anterior. */
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Sombra de contato: uma mancha macia sob a máquina, desenhada num canvas. */
function contactShadow() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2D indisponível");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgb(0 0 0 / 1)");
  g.addColorStop(0.55, "rgb(0 0 0 / 0.6)");
  g.addColorStop(1, "rgb(0 0 0 / 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

/**
 * A retroescavadeira da seção de máquinas, como planta técnica: começa só nas arestas e vira
 * máquina com o scroll; depois cada peça trabalha no seu trecho. Fundo transparente (o painel
 * de terra aparece por trás), com uma sombra de contato sob as rodas.
 * Montada em etapas e com os shaders compilados em paralelo (compileAsync): criada de uma vez,
 * ela travava a página por mais de um segundo enquanto a pessoa rolava "Como trabalhamos".
 * Sem mapa de sombras: ele compilava shaders próprios na hora e dobrava o trabalho de cada quadro.
 */
export async function createBackhoeBlueprint({ canvas, colors, getProgress, onFrame, still }: BlueprintOptions) {
  const tall = () => canvas.clientWidth < canvas.clientHeight;
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  // Em produção, sem checar shaders: compila mais rápido e não enche o console de avisos do ANGLE.
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.toneMapping = NeutralToneMapping;
  renderer.localClippingEnabled = true;

  const scene = new Scene();
  const reflection = await skyReflection(renderer, KEY);
  scene.environment = reflection.texture;
  scene.environmentIntensity = 0.5;
  const camera = new PerspectiveCamera(FOV, 1, 0.5, 200);
  await yieldToMain();

  // ---------- Luz: chave clara, céu de fill e um contraluz que recorta a máquina do fundo escuro ----------
  // Menos quente que a do hero: sem a foto de fim de tarde atrás, a luz alaranjada puxava o amarelo para o laranja.
  scene.add(new HemisphereLight(new Color("#fff0dc"), new Color(colors.soil), 0.8));
  const key = new DirectionalLight(new Color("#fff1dc"), 2.6);
  key.position.copy(TARGET).addScaledVector(KEY, 30);
  key.target.position.copy(TARGET);
  scene.add(key, key.target);
  const rim = new DirectionalLight(new Color("#fff1dc"), 1.3);
  rim.position.set(-4, 6, 9);
  scene.add(rim);

  // Sombra de contato sob o corpo (da pá às sapatas); aparece junto com a pintura.
  const shadowTexture = contactShadow();
  const ground = new Mesh(
    new PlaneGeometry(7.6, 3.4).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ map: shadowTexture, color: new Color(colors.dark).multiplyScalar(0.5), transparent: true, opacity: 0, depthWrite: false }),
  );
  ground.position.set(0.15, 0.005, 0);
  scene.add(ground);

  // ---------- Máquina e o desenho das arestas ----------
  const materials = createMaterials(colors);
  const backhoe = createBackhoe(materials);
  scene.add(backhoe.root);
  const pose: Pose = { ...TRAVEL };
  await yieldToMain();

  // A parte pintada fica na frente do corte; o desenho, atrás dele.
  const paintClip = new Plane(new Vector3(1, 0, 0), 0);
  const drawingClip = new Plane(new Vector3(-1, 0, 0), 0);
  const lineMaterial = new LineBasicMaterial({
    color: new Color(colors.dust),
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    clippingPlanes: [drawingClip],
  });
  const meshes: Mesh[] = [];
  backhoe.root.traverse((object) => {
    if (object instanceof Mesh) meshes.push(object);
  });
  const solids = new Set<Material>();
  const edges: EdgesGeometry[] = [];
  for (const [i, mesh] of meshes.entries()) {
    solids.add(mesh.material as Material);
    // Os cravos dos pneus e as porcas (instanciados) e a terra da caçamba ficam fora do desenho.
    if (mesh instanceof InstancedMesh || mesh.material === materials.load) continue;
    const geometry = new EdgesGeometry(mesh.geometry, 28);
    edges.push(geometry);
    mesh.add(new LineSegments(geometry, lineMaterial));
    if (i % 16 === 15) await yieldToMain();
  }
  for (const material of solids) material.clippingPlanes = [paintClip];

  // ---------- Câmera ----------
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  };
  if (!still) window.addEventListener("pointermove", onPointer, { passive: true });

  let framing = WIDE;
  let distance = 20;
  let width = 1;
  let height = 1;
  const placeCamera = () => {
    const azimuth = framing.azimuth + pointer.sx * 0.05;
    const elevation = framing.elevation - pointer.sy * 0.02;
    camera.position.set(
      TARGET.x + Math.sin(azimuth) * Math.cos(elevation) * distance,
      TARGET.y + Math.sin(elevation) * distance,
      TARGET.z - Math.cos(azimuth) * Math.cos(elevation) * distance,
    );
    camera.lookAt(TARGET);
    camera.updateMatrixWorld();
  };

  // ---------- Quadro ----------
  const frameData: BlueprintFrame = {
    callouts: { loader: { x: 0, y: 0 }, stabilizer: { x: 0, y: 0 }, boom: { x: 0, y: 0 }, bucket: { x: 0, y: 0 } },
    ground: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    blade: { from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, on: false },
  };
  const projected = new Vector3();
  const toScreen = (world: Vector3, out: Point) => {
    projected.copy(world).project(camera);
    out.x = ((projected.x + 1) / 2) * width;
    out.y = ((1 - projected.y) / 2) * height;
  };
  const world = new Vector3();

  let time = 0;
  /** Nada é desenhado antes de os shaders compilarem (o primeiro desenho compilaria tudo de uma vez). */
  let compiled = false;
  const draw = (p: number) => {
    backhoe.setPose(sequencePose(p, pose));
    const paint = paintAt(p);
    // Fora da pintura, o corte vai para longe: a retro esticada passa das pontas da varredura.
    const cut = paint <= 0 ? 1e3 : paint >= 1 ? -1e3 : lerp(PAINT_FROM, PAINT_TO, paint);
    paintClip.constant = -cut;
    drawingClip.constant = cut;
    // Giroflex: aceso quando a máquina está pintada, piscando enquanto trabalha.
    materials.beacon.emissiveIntensity = paint < 1 ? 0.2 : still ? 0.6 : 0.4 + 2.2 * Math.max(0, Math.sin(time * 5.5)) ** 6;
    ground.material.opacity = 0.6 * paint;
    placeCamera();
    if (compiled) renderer.render(scene, camera);

    for (const id of CALLOUTS) toScreen(backhoe.callouts[id].getWorldPosition(world), frameData.callouts[id]);
    toScreen(world.set(-14, 0, 0), frameData.ground[0]);
    toScreen(world.set(12, 0, 0), frameData.ground[1]);
    frameData.blade.on = paint > 0 && paint < 1;
    toScreen(world.set(cut, 0, -1.3), frameData.blade.from);
    toScreen(world.set(cut, 3.6, -1.3), frameData.blade.to);
    onFrame(frameData);
  };

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    width = w;
    height = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, tall() ? 1.5 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    framing = w < h ? TALL : WIDE;
    const halfWidth = Math.atan(Math.tan(MathUtils.degToRad(FOV / 2)) * camera.aspect);
    distance = HALF_LENGTH / (framing.fill * Math.tan(halfWidth));
    camera.setViewOffset(w, h, framing.shiftX * w, framing.shiftY * h, w, h);
    draw(still ? 1 : shown);
  };

  // ---------- Laço (só enquanto a seção aparece) ----------
  let shown = still ? 1 : getProgress();
  let frame = 0;
  let running = false;
  let last = performance.now();
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    // O carimbo do rAF pode vir antes do performance.now() guardado: nunca deixa o tempo voltar.
    const dt = clamp((now - last) / 1000, 0, 1 / 20);
    last = now;
    time += dt;
    // O scroll já vem suavizado; isto só tira o degrau das rodinhas do mouse.
    shown = damp(shown, getProgress(), 8, dt);
    pointer.sx = damp(pointer.sx, pointer.x, 2.5, dt);
    pointer.sy = damp(pointer.sy, pointer.y, 2.5, dt);
    draw(shown);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  // Compila em paralelo, sem travar a página (KHR_parallel_shader_compile, quando o navegador tem).
  await renderer.compileAsync(scene, camera);
  compiled = true;
  draw(still ? 1 : shown);

  if (process.env.NODE_ENV !== "production") {
    // Para revisar pelo console (e pelas capturas): __planta.at(0.5) congela a sequência num ponto; __planta.info() mostra o estado.
    (window as unknown as Record<string, unknown>).__planta = {
      at: (p: number) => {
        running = false;
        cancelAnimationFrame(frame);
        shown = p;
        draw(p);
      },
      info: () => ({ running, shown, progress: getProgress(), frames: renderer.info.render.frame }),
    };
  }

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
      backhoe.dispose();
      materials.dispose();
      edges.forEach((geometry) => geometry.dispose());
      lineMaterial.dispose();
      ground.geometry.dispose();
      ground.material.dispose();
      shadowTexture.dispose();
      reflection.dispose();
      renderer.dispose();
    },
  };
}
