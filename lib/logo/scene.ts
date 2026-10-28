import {
  type BufferGeometry,
  CanvasTexture,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshMatcapMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { LETRAS, MARCA_HEIGHT, MARCA_WIDTH, NIVEL } from "./marca";

const { clamp, damp, lerp, smoothstep } = MathUtils;

export interface LogoColors {
  yellow: string;
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
const ENTRANCE_SECONDS = 1.7;

interface MatcapTones {
  /** Brilho (no alto, à esquerda), cor do corpo e sombra (na borda). */
  light: string;
  base: string;
  shade: string;
  /** Aço: o horizonte refletido, uma faixa clara em cima e uma escura no meio. */
  metal?: boolean;
}

/**
 * Matcap: a "esfera" do material vista de frente, desenhada num canvas. A cor de cada ponto da
 * peça sai da direção da superfície, então o brilho corre pelas faces quando ela gira. Sem luzes,
 * sem reflexo de céu (o PMREM levava 1 s só para compilar os shaders no Chrome frio) e com o
 * shader mais barato que há.
 */
function matcap({ light, base, shade, metal = false }: MatcapTones) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2D indisponível");
  const body = ctx.createRadialGradient(size * 0.36, size * 0.3, size * 0.02, size * 0.5, size * 0.5, size * 0.56);
  body.addColorStop(0, light);
  body.addColorStop(0.42, base);
  body.addColorStop(1, shade);
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, size, size);
  if (metal) {
    const horizon = ctx.createLinearGradient(0, 0, 0, size);
    horizon.addColorStop(0, "rgb(255 255 255 / 0.45)");
    horizon.addColorStop(0.42, "rgb(255 255 255 / 0)");
    horizon.addColorStop(0.5, "rgb(20 16 12 / 0.45)");
    horizon.addColorStop(0.6, "rgb(20 16 12 / 0)");
    horizon.addColorStop(1, "rgb(255 244 228 / 0.2)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 0, size, size);
  }
  // Contraluz quente na borda, como o sol de fim de tarde dos vídeos.
  const rim = ctx.createRadialGradient(size / 2, size / 2, size * 0.4, size / 2, size / 2, size * 0.5);
  rim.addColorStop(0, "rgb(255 226 180 / 0)");
  rim.addColorStop(1, "rgb(255 226 180 / 0.4)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

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
    bevelSegments: 2,
    curveSegments: 20,
  });
  // Centro da marca na origem e a profundidade centrada (o SVG desce em y: o grupo inverte).
  geometry.translate(-MARCA_WIDTH / 2, -MARCA_HEIGHT / 2, -depth / 2);
  return geometry;
}

/**
 * O Chrome desenhando sem placa de vídeo (SwiftShader, llvmpipe, como no Lighthouse e no PageSpeed):
 * aí montar e animar a cena custa segundos de CPU.
 */
function isSoftwareRenderer(renderer: WebGLRenderer) {
  const gl = renderer.getContext();
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  return /swiftshader|llvmpipe|software|basic render/i.test(name);
}

/** Devolve a vez ao navegador entre as etapas da montagem: nenhum pedaço trava a página por muito tempo. */
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * A logo em 3D no hero: as letras em pintura amarela de máquina e a linha de nível em aço
 * escovado, mais saliente, como a lâmina. Dá para pegar e girar (com inércia); solta, ela volta
 * devagar a ficar de frente, balançando de leve. Entra quando o vídeo entra: a barra passa da
 * esquerda para a direita e as letras assentam nela.
 * Montada em etapas (com pausas entre elas); sem placa de vídeo, devolve null (fica a logo em SVG).
 */
export async function createLogoScene({ canvas, colors, still, onGrab }: LogoSceneOptions) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  if (isSoftwareRenderer(renderer)) {
    renderer.dispose();
    renderer.forceContextLoss();
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  // Movimento reduzido: montada e parada, só redesenha enquanto alguém arrasta.
  const calm = still;
  await yieldToMain();

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 1, 100);

  // ---------- Materiais (matcap): pintura de máquina na frente, a lateral mais escura; aço na barra ----------
  const textures = [
    matcap({ light: "#fff6d2", base: colors.yellow, shade: "#7a4d00" }),
    matcap({ light: "#f6d77e", base: "#c98d00", shade: "#4f3200" }),
    matcap({ light: "#ffffff", base: "#c9c5be", shade: "#4d4945", metal: true }),
    matcap({ light: "#e6e2db", base: "#98938c", shade: "#34312d", metal: true }),
  ];
  const [paint, paintSide, steel, steelSide] = textures.map((texture) => new MeshMatcapMaterial({ matcap: texture }));

  // ---------- A marca: cada letra separada (para a entrada) e a barra; de quatro em quatro peças, uma pausa ----------
  const letterGeometries: BufferGeometry[] = [];
  for (const d of LETRAS) {
    letterGeometries.push(extrude([d], LETTER_DEPTH));
    if (letterGeometries.length % 4 === 0) await yieldToMain();
  }
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 700 ? 1.25 : 1.75));
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
    if (calm) {
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
  let entrance = calm ? ENTRANCE_SECONDS : -1;
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

  /** Nada é desenhado antes de os shaders compilarem (senão o primeiro desenho compila e trava a página). */
  let compiled = false;
  const render = () => {
    if (compiled) renderer.render(scene, camera);
  };
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
      const settle = calm ? 0 : smoothstep(idle, 1.2, 3.5);
      const front = Math.round(spin.yaw / (Math.PI * 2)) * Math.PI * 2;
      const sway = calm ? 0 : Math.sin(time * 0.55) * 0.32;
      spin.yaw = damp(spin.yaw, front + sway, 1.4 * settle, dt);
      spin.pitch = damp(spin.pitch, calm ? 0 : Math.sin(time * 0.4) * 0.06, 1.6 * settle, dt);
    }
    pivot.rotation.set(spin.pitch, spin.yaw, 0);
    // Uma flutuação mínima, para não parecer colada na tela.
    pivot.position.y = calm ? 0 : Math.sin(time * 0.8) * 0.04;
    render();
  };
  let skipped = 0;
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const dt = clamp((now - last) / 1000, 0, 1 / 20);
    last = now;
    // Só balançando (sem arraste, sem inércia, entrada feita): metade dos quadros basta.
    const swaying = !dragging && entrance >= ENTRANCE_SECONDS && Math.abs(spin.vYaw) < 0.05;
    if (swaying && skipped === 0) {
      skipped = dt;
      return;
    }
    step(dt + skipped);
    skipped = 0;
  };
  /** O laço roda com o hero na tela, depois da entrada começar; com movimento reduzido, só enquanto arrasta. */
  const sync = () => {
    const run = visible && entrance >= 0 && (!calm || dragging);
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
  resize();
  // Compila os shaders sem travar a página (KHR_parallel_shader_compile, quando o navegador tem). As
  // peças estão visíveis só para isso (o three pula as invisíveis); depois, a pose da entrada.
  const ready = renderer.compileAsync(scene, camera).then(() => {
    compiled = true;
    place();
    render();
  });

  if (process.env.NODE_ENV !== "production") {
    // Para revisar pelo console (e pelas capturas): __logo.at(0.6) congela a logo girada 0,6 rad, já montada.
    (window as unknown as Record<string, unknown>).__logo = {
      at: (yaw: number, pitch = 0) => {
        cancelAnimationFrame(frame);
        running = false;
        entrance = ENTRANCE_SECONDS;
        place();
        pivot.rotation.set(pitch, yaw, 0);
        pivot.position.y = 0;
        render();
      },
    };
  }

  return {
    /** Os shaders compilaram: a logo já pode aparecer. */
    ready,
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
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
    },
  };
}
