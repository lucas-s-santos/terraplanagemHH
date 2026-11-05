import {
  type BufferGeometry,
  CanvasTexture,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshMatcapMaterial,
  Path,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Shape,
  Vector2,
  WebGLRenderer,
} from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { MAQUINA, type Ponto, type Quadratica, type Retangulo, type Roda, SIMBOLO_CAIXA, TERRENO } from "./marca";

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
/** Espessura da chapa, nas unidades do símbolo: o terreno sai mais que a máquina, como a lâmina. */
const MACHINE_DEPTH = 16;
const TERRAIN_DEPTH = 24;
const ENTRANCE_SECONDS = 1.7;
/** Pontos por trecho de curva (a curva do terreno vira um contorno). */
const CURVE_STEPS = 16;

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

// ---------- O símbolo em formas do three. No SVG há traços; aqui, cada traço vira o contorno dele. ----------
// As peças se sobrepõem (braço sobre o chassi, roda sobre o platô): faces da frente no mesmo plano e
// com o mesmo material dão a mesma cor no matcap, então a sobreposição não aparece.

function rectangle({ x, y, w, h, r }: Retangulo) {
  const shape = new Shape();
  if (!r) return shape.setFromPoints([new Vector2(x, y), new Vector2(x + w, y), new Vector2(x + w, y + h), new Vector2(x, y + h)]);
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

/** Um caminho cheio do SVG. O three decide o furo por contenção: a janela, dentro da cabine, sai vazada. */
function filledPath(d: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;
  return new SVGLoader().parse(svg).paths.flatMap((path) => path.toShapes());
}

/** Roda: o anel do traço. */
function ring({ cx, cy, r, traco }: Roda) {
  const shape = new Shape().absarc(cx, cy, r + traco / 2, 0, Math.PI * 2, false);
  shape.holes.push(new Path().absarc(cx, cy, r - traco / 2, 0, Math.PI * 2, true));
  return shape;
}

const disc = ([x, y]: Ponto, r: number) => new Shape().absarc(x, y, r, 0, Math.PI * 2, false);

/** Um trecho reto de traço: retângulo (ponta reta) ou cápsula (ponta redonda). */
function segment([ax, ay]: Ponto, [bx, by]: Ponto, width: number, round: boolean) {
  const angle = Math.atan2(by - ay, bx - ax);
  const half = width / 2;
  const nx = -Math.sin(angle) * half;
  const ny = Math.cos(angle) * half;
  if (!round) {
    return new Shape().setFromPoints([
      new Vector2(ax + nx, ay + ny),
      new Vector2(bx + nx, by + ny),
      new Vector2(bx - nx, by - ny),
      new Vector2(ax - nx, ay - ny),
    ]);
  }
  const shape = new Shape();
  shape.moveTo(ax + nx, ay + ny);
  shape.lineTo(bx + nx, by + ny);
  shape.absarc(bx, by, half, angle + Math.PI / 2, angle - Math.PI / 2, true);
  shape.lineTo(ax - nx, ay - ny);
  shape.absarc(ax, ay, half, angle - Math.PI / 2, angle - (3 * Math.PI) / 2, true);
  return shape;
}

/** A curva do terreno com espessura (pontas retas, como no SVG). */
function curveBand(parts: readonly Quadratica[], width: number) {
  const half = width / 2;
  const left: Vector2[] = [];
  const right: Vector2[] = [];
  parts.forEach(([p0, p1, p2], index) => {
    for (let k = index === 0 ? 0 : 1; k <= CURVE_STEPS; k++) {
      const t = k / CURVE_STEPS;
      const u = 1 - t;
      const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
      const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
      const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
      const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
      const length = Math.hypot(dx, dy) || 1;
      left.push(new Vector2(x - (dy / length) * half, y + (dx / length) * half));
      right.push(new Vector2(x + (dy / length) * half, y - (dx / length) * half));
    }
  });
  return new Shape([...left, ...right.reverse()]);
}

function machineShapes() {
  const shapes: Shape[] = [
    ...MAQUINA.retangulos.map(rectangle),
    ...MAQUINA.caminhos.flatMap(({ d }) => filledPath(d)),
    ...MAQUINA.rodas.map(ring),
  ];
  for (const { pontos, largura, ponta } of MAQUINA.bracos) {
    for (let i = 1; i < pontos.length; i++) shapes.push(segment(pontos[i - 1], pontos[i], largura, ponta === "redonda"));
    // Junções redondas (o braço da pá dobra).
    for (let i = 1; i < pontos.length - 1; i++) shapes.push(disc(pontos[i], largura / 2));
  }
  return shapes;
}

const terrainShapes = () => [rectangle(TERRENO.plato), curveBand(TERRENO.curva.trechos, TERRENO.curva.largura)];

function extrude(shapes: Shape[], depth: number): BufferGeometry {
  const geometry = new ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: 1.2,
    bevelSize: 0.7,
    bevelSegments: 2,
    curveSegments: 16,
  });
  // Centro do desenho na origem e a profundidade centrada (o SVG desce em y: o grupo inverte).
  const { x, y, w, h } = SIMBOLO_CAIXA;
  geometry.translate(-(x + w / 2), -(y + h / 2), -depth / 2);
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
 * O símbolo em 3D no hero, como uma chapa recortada: a retroescavadeira em pintura amarela de
 * máquina e o terreno (a curva e o platô) em aço escovado, mais saliente, como a lâmina. Dá para
 * pegar e girar (com inércia); solta, ela volta devagar a ficar de frente, balançando de leve.
 * Entra quando o vídeo entra: o terreno passa da esquerda para a direita e a máquina assenta nele.
 * Montada em etapas (com pausas entre elas); sem placa de vídeo, devolve null (fica o símbolo em SVG).
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

  // ---------- Materiais (matcap): pintura de máquina na frente, a lateral mais escura; aço no terreno ----------
  const textures = [
    matcap({ light: "#fff6d2", base: colors.yellow, shade: "#7a4d00" }),
    matcap({ light: "#f6d77e", base: "#c98d00", shade: "#4f3200" }),
    matcap({ light: "#ffffff", base: "#c9c5be", shade: "#4d4945", metal: true }),
    matcap({ light: "#e6e2db", base: "#98938c", shade: "#34312d", metal: true }),
  ];
  const [paint, paintSide, steel, steelSide] = textures.map((texture) => new MeshMatcapMaterial({ matcap: texture }));

  // ---------- O símbolo: a máquina e o terreno, cada um uma peça (para a entrada); uma pausa entre eles ----------
  const machineGeometry = extrude(machineShapes(), MACHINE_DEPTH);
  await yieldToMain();
  const terrainGeometry = extrude(terrainShapes(), TERRAIN_DEPTH);
  const mark = new Group();
  const machine = new Mesh(machineGeometry, [paint, paintSide]);
  const terrain = new Mesh(terrainGeometry, [steel, steelSide]);
  mark.add(machine, terrain);
  // Unidades do símbolo para o mundo; y invertido porque o SVG desce (o three corrige a face com escala negativa).
  const { w: MARK_WIDTH, h: MARK_HEIGHT } = SIMBOLO_CAIXA;
  const unit = 4.4 / MARK_WIDTH;
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
    const byWidth = (MARK_WIDTH * unit) / 2 / (FILL * Math.tan(halfWidth));
    const byHeight = (MARK_HEIGHT * unit * 1.9) / 2 / Math.tan(MathUtils.degToRad(FOV / 2));
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

  // ---------- Entrada: o terreno passa da esquerda, como a lâmina, e a máquina assenta nele ----------
  let entrance = calm ? ENTRANCE_SECONDS : -1;
  const place = () => {
    const t = entrance < 0 ? 0 : entrance / ENTRANCE_SECONDS;
    const terrainIn = smoothstep(t, 0, 0.55);
    terrain.position.x = lerp(-MARK_WIDTH * 1.4, 0, terrainIn);
    terrain.visible = terrainIn > 0.001;
    const machineIn = smoothstep(t, 0.3, 0.85);
    machine.position.y = lerp(-60, 0, machineIn);
    machine.rotation.x = lerp(0.9, 0, machineIn);
    machine.visible = machineIn > 0.001;
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
      [machineGeometry, terrainGeometry].forEach((geometry) => geometry.dispose());
      [paint, paintSide, steel, steelSide].forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
    },
  };
}
