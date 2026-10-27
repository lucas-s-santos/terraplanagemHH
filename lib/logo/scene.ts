import {
  type BufferGeometry,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { skyReflection } from "@/lib/backhoe/sky";
import { LETRAS, MARCA_HEIGHT, MARCA_WIDTH, NIVEL } from "./marca";

const { clamp, damp, lerp, smoothstep } = MathUtils;

export interface LogoColors {
  yellow: string;
  dark: string;
  soil: string;
}

export interface LogoSceneOptions {
  canvas: HTMLCanvasElement;
  colors: LogoColors;
  /** Movimento reduzido: sem entrada animada nem balanço; arrastar continua girando. */
  still: boolean;
  /** Chamado no primeiro arraste (para esconder a dica). */
  onGrab?: () => void;
}

/** Quanto a marca ocupa da largura do canvas. */
const FILL = 0.84;
const FOV = 26;
/** Espessura das letras e da barra, nas unidades da marca (altura 100): a barra sai mais, como uma lâmina. */
const LETTER_DEPTH = 26;
const BAR_DEPTH = 38;
/** Luz principal: do alto, à direita e pela frente (como o sol dos vídeos). */
const KEY = new Vector3(0.55, 0.6, 0.58).normalize();
/**
 * O sol do reflexo fica à frente e no alto: a face da frente do aço reflete o céu claro (com o sol
 * atrás, refletia o chão escuro e a barra saía marrom), e ao girar um brilho passa pela peça.
 */
const REFLECTION_SUN = new Vector3(0.25, 0.5, 0.83).normalize();
const ENTRANCE_SECONDS = 1.7;

/** Os caminhos da marca (SVG) em formas do three. */
function shapesOf(paths: readonly string[]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">${paths.map((d) => `<path d="${d}"/>`).join("")}</svg>`;
  // Cada caminho é um contorno fechado, sem furo (o furo do e é a própria barra). O three decide
  // furo por contenção, então a orientação do SVG (y para baixo) não importa.
  return new SVGLoader().parse(svg).paths.flatMap((path) => path.toShapes());
}

function extrude(paths: readonly string[], depth: number): BufferGeometry {
  const geometry = new ExtrudeGeometry(shapesOf(paths), {
    depth,
    bevelEnabled: true,
    bevelThickness: 2.4,
    bevelSize: 1.6,
    bevelSegments: 4,
    curveSegments: 40,
  });
  // Centro da marca na origem e a profundidade centrada (o SVG desce em y: o grupo inverte).
  geometry.translate(-MARCA_WIDTH / 2, -MARCA_HEIGHT / 2, -depth / 2);
  return geometry;
}

/**
 * A logo em 3D no hero: as letras em pintura amarela de máquina e a linha de nível em aço
 * escovado, mais saliente, como a lâmina. Dá para pegar e girar (com inércia); solta, ela volta
 * devagar a ficar de frente, balançando de leve. Entra quando o vídeo entra: a barra passa da
 * esquerda para a direita e as letras assentam nela.
 */
export function createLogoScene({ canvas, colors, still, onGrab }: LogoSceneOptions) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.toneMapping = NeutralToneMapping;

  const scene = new Scene();
  const reflection = skyReflection(renderer, REFLECTION_SUN);
  scene.environment = reflection.texture;
  scene.environmentIntensity = 0.9;
  const camera = new PerspectiveCamera(FOV, 1, 1, 100);

  // Luz quase neutra: quente demais, o amarelo de máquina puxa para o laranja.
  scene.add(new HemisphereLight(new Color("#fff6ea"), new Color(colors.soil), 0.75));
  const key = new DirectionalLight(new Color("#fff3e0"), 2.4);
  key.position.copy(KEY).multiplyScalar(10);
  const rim = new DirectionalLight(new Color("#ffe7c4"), 1.3);
  rim.position.set(-6, 3, -8);
  scene.add(key, rim);

  // ---------- Materiais: pintura de máquina (frente) e a lateral um pouco mais escura; aço na barra ----------
  const yellow = new Color(colors.yellow);
  const paint = new MeshPhysicalMaterial({ color: yellow, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.22 });
  const paintSide = new MeshPhysicalMaterial({
    color: yellow.clone().lerp(new Color(colors.soil), 0.18),
    roughness: 0.5,
    clearcoat: 0.4,
    clearcoatRoughness: 0.35,
  });
  const steel = new MeshStandardMaterial({ color: new Color("#e4e0d8"), metalness: 1, roughness: 0.24, envMapIntensity: 1.4 });
  const steelSide = new MeshStandardMaterial({ color: new Color("#a8a39b"), metalness: 1, roughness: 0.36, envMapIntensity: 1.2 });

  // ---------- A marca: cada letra separada (para a entrada) e a barra ----------
  const letterGeometries = LETRAS.map((d) => extrude([d], LETTER_DEPTH));
  const barGeometry = extrude([NIVEL], BAR_DEPTH);
  const mark = new Group();
  const letters = letterGeometries.map((geometry) => {
    const mesh = new Mesh(geometry, [paint, paintSide]);
    mark.add(mesh);
    return mesh;
  });
  const bar = new Mesh(barGeometry, [steel, steelSide]);
  mark.add(bar);
  // Unidades da marca para o mundo; y invertido porque o SVG desce (o three corrige a face com escala negativa).
  const unit = 4.4 / MARCA_WIDTH;
  mark.scale.set(unit, -unit, unit);
  const pivot = new Group();
  pivot.add(mark);
  scene.add(pivot);

  // ---------- Câmera ----------
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 700 ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const halfWidth = Math.atan(Math.tan(MathUtils.degToRad(FOV / 2)) * camera.aspect);
    // Cabe pela largura e, em telas baixas, pela altura (a marca girada ocupa mais).
    const byWidth = (MARCA_WIDTH * unit) / 2 / (FILL * Math.tan(halfWidth));
    const byHeight = (MARCA_HEIGHT * unit * 1.9) / 2 / Math.tan(MathUtils.degToRad(FOV / 2));
    camera.position.set(0, 0, Math.max(byWidth, byHeight));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    render();
  };

  // ---------- Arrastar para girar ----------
  const spin = { yaw: 0, pitch: 0, vYaw: 0, vPitch: 0 };
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let idle = 0;
  let grabbed = false;
  const onDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    spin.vYaw = 0;
    spin.vPitch = 0;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
    if (!grabbed) {
      grabbed = true;
      onGrab?.();
    }
    sync();
  };
  const onMove = (event: PointerEvent) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    const k = 4.2 / Math.max(canvas.clientWidth, 1);
    spin.yaw += dx * k;
    spin.pitch = clamp(spin.pitch + dy * k * 0.6, -0.6, 0.6);
    // A velocidade do último movimento vira a inércia ao soltar.
    spin.vYaw = (dx * k) / (1 / 60);
    spin.vPitch = (dy * k * 0.6) / (1 / 60);
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    idle = 0;
    canvas.style.cursor = "";
    if (still) {
      spin.vYaw = 0;
      spin.vPitch = 0;
    }
    sync();
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  // ---------- Entrada: a barra passa da esquerda e as letras assentam nela ----------
  let entrance = still ? ENTRANCE_SECONDS : -1;
  const place = () => {
    const t = entrance < 0 ? 0 : entrance / ENTRANCE_SECONDS;
    const barIn = smoothstep(t, 0, 0.55);
    bar.position.x = lerp(-MARCA_WIDTH * 1.4, 0, barIn);
    letters.forEach((letter, i) => {
      // Da esquerda para a direita, como a lâmina passando.
      const from = 0.25 + (i / letters.length) * 0.45;
      const k = smoothstep(t, from, from + 0.3);
      letter.position.y = lerp(-70, 0, k);
      letter.rotation.x = lerp(0.9, 0, k);
      letter.visible = k > 0.001;
    });
    bar.visible = barIn > 0.001;
  };

  // ---------- Laço ----------
  let time = 0;
  let frame = 0;
  let running = false;
  let visible = false;
  let last = performance.now();

  const render = () => renderer.render(scene, camera);
  const step = (dt: number) => {
    time += dt;
    if (entrance >= 0 && entrance < ENTRANCE_SECONDS) entrance = Math.min(entrance + dt, ENTRANCE_SECONDS);
    place();
    if (!dragging) {
      idle += dt;
      spin.yaw += spin.vYaw * dt;
      spin.pitch += spin.vPitch * dt;
      spin.vYaw = damp(spin.vYaw, 0, 2.2, dt);
      spin.vPitch = damp(spin.vPitch, 0, 3, dt);
      // Parada há um tempo: volta a ficar de frente (a volta inteira mais próxima), balançando de leve.
      const settle = still ? 0 : smoothstep(idle, 1.2, 3.5);
      const front = Math.round(spin.yaw / (Math.PI * 2)) * Math.PI * 2;
      const sway = still ? 0 : Math.sin(time * 0.55) * 0.32;
      spin.yaw = damp(spin.yaw, front + sway, 1.4 * settle, dt);
      spin.pitch = damp(spin.pitch, still ? 0 : Math.sin(time * 0.4) * 0.06, 1.6 * settle, dt);
    }
    pivot.rotation.set(spin.pitch, spin.yaw, 0);
    // Uma flutuação mínima, para não parecer colada na tela.
    pivot.position.y = still ? 0 : Math.sin(time * 0.8) * 0.04;
    render();
  };
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const dt = clamp((now - last) / 1000, 0, 1 / 20);
    last = now;
    step(dt);
  };
  /** O laço roda com o hero na tela, depois da entrada começar; com movimento reduzido, só enquanto arrasta. */
  const sync = () => {
    const run = visible && entrance >= 0 && (!still || dragging);
    if (run && !running) {
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    } else if (!run && running) {
      running = false;
      cancelAnimationFrame(frame);
      render();
    }
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  place();
  resize();

  return {
    /** O vídeo entrou: começa a entrada. */
    reveal() {
      if (entrance < 0) entrance = 0;
      sync();
    },
    /** Só desenha enquanto o hero aparece. */
    setVisible(on: boolean) {
      visible = on;
      sync();
    },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      [...letterGeometries, barGeometry].forEach((geometry) => geometry.dispose());
      [paint, paintSide, steel, steelSide].forEach((material) => material.dispose());
      reflection.dispose();
      renderer.dispose();
    },
  };
}
