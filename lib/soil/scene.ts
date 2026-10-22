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
  WebGLRenderer,
} from "three";

export interface SoilColors {
  soil: string;
  dark: string;
  dust: string;
  grass: string;
  yellow: string;
}

export interface SoilCutOptions {
  canvas: HTMLCanvasElement;
  colors: SoilColors;
  /** Progresso das etapas, 0 (contato) a 1 (entrega). Lido a cada quadro. */
  getProgress: () => number;
  /** Sem giro nem parallax (movimento reduzido). */
  still: boolean;
}

const N = 56;
const SIZE_X = 1.25;
const SIZE_Z = 0.95;
const BOTTOM = -1.05;
// Linhas por parede: com poucas, as camadas de solo saem em degraus.
const ROWS = 44;
const FLAT = -0.02;

const { smoothstep, lerp, clamp } = MathUtils;

/** Relevo original do terreno, em coordenadas normalizadas (-1 a 1). Fixo, sem ruído aleatório. */
const hills = (x: number, z: number) =>
  0.13 * Math.sin(1.7 * x + 0.4) * Math.cos(1.3 * z - 0.2) +
  0.08 * Math.sin(3.1 * x - 2 * z + 1) +
  0.04 * Math.sin(6.3 * x + 4.1 * z) +
  0.018 * Math.sin(12.7 * x - 8.3 * z + 0.7) +
  0.07;

/**
 * Corte de solo: um bloco de terra com camadas (terra roxa, ocre, solo escuro), relevo de pasto
 * no topo. Conforme as etapas avançam, aparecem as estacas do gabarito e uma frente de corte
 * atravessa o bloco deixando o topo plano e de terra batida. Na entrega, está nivelado.
 */
export function createSoilCut({ canvas, colors, getProgress, still }: SoilCutOptions) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);

  const c = {
    soil: new Color(colors.soil),
    dark: new Color(colors.dark),
    dust: new Color(colors.dust),
    grass: new Color(colors.grass),
    yellow: new Color(colors.yellow),
  };
  const grassDark = c.grass.clone().lerp(c.dark, 0.35);
  const grassDry = c.grass.clone().lerp(c.dust, 0.35);
  const packed = c.soil.clone().lerp(c.dust, 0.42);
  const ochre = c.soil.clone().lerp(c.dust, 0.22);
  const deep = c.soil.clone().lerp(c.dark, 0.6);
  const strata = [c.soil, deep, ochre, c.soil, deep, c.dark.clone().lerp(c.soil, 0.25)];

  scene.add(new HemisphereLight(c.dust.clone().lerp(new Color("#ffffff"), 0.3), c.soil, 1.35));
  const sun = new DirectionalLight(c.dust.clone().lerp(new Color("#ffffff"), 0.5), 2.6);
  sun.position.set(4, 5, 2.5);
  scene.add(sun);
  const rim = new DirectionalLight(c.dust, 0.6);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  const block = new Group();
  scene.add(block);

  // ---------- Topo: grade N × N ----------
  const topCount = (N + 1) * (N + 1);
  const topPos = new Float32Array(topCount * 3);
  const topCol = new Float32Array(topCount * 3);
  const topIdx: number[] = [];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i;
      topIdx.push(a, a + N + 1, a + 1, a + 1, a + N + 1, a + N + 2);
    }
  }
  const top = new BufferGeometry();
  top.setAttribute("position", new BufferAttribute(topPos, 3));
  top.setAttribute("color", new BufferAttribute(topCol, 3));
  top.setIndex(topIdx);
  block.add(new Mesh(top, material));

  // ---------- Paredes: quatro faixas, do contorno do topo até a base ----------
  // Cada lado percorre a borda com N + 1 colunas; a linha 0 acompanha o topo.
  const edges: [number, number][][] = [
    Array.from({ length: N + 1 }, (_, i) => [-1 + (2 * i) / N, 1]), // frente (z+)
    Array.from({ length: N + 1 }, (_, i) => [1, 1 - (2 * i) / N]), // direita
    Array.from({ length: N + 1 }, (_, i) => [1 - (2 * i) / N, -1]), // fundo
    Array.from({ length: N + 1 }, (_, i) => [-1, -1 + (2 * i) / N]), // esquerda
  ];
  const wallCount = 4 * (N + 1) * (ROWS + 1);
  const wallPos = new Float32Array(wallCount * 3);
  const wallCol = new Float32Array(wallCount * 3);
  const wallIdx: number[] = [];
  edges.forEach((_, s) => {
    const base = s * (N + 1) * (ROWS + 1);
    for (let r = 0; r < ROWS; r++) {
      for (let i = 0; i < N; i++) {
        const a = base + r * (N + 1) + i;
        const b = a + N + 1;
        wallIdx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  });
  const walls = new BufferGeometry();
  walls.setAttribute("position", new BufferAttribute(wallPos, 3));
  walls.setAttribute("color", new BufferAttribute(wallCol, 3));
  walls.setIndex(wallIdx);
  block.add(new Mesh(walls, material));

  // Base
  const bottom = new BoxGeometry(SIZE_X * 2, 0.02, SIZE_Z * 2);
  bottom.translate(0, BOTTOM, 0);
  const bottomColors = new Float32Array(bottom.getAttribute("position").count * 3).fill(0);
  for (let i = 0; i < bottomColors.length; i += 3) bottomColors.set([c.dark.r * 0.6, c.dark.g * 0.6, c.dark.b * 0.6], i);
  bottom.setAttribute("color", new BufferAttribute(bottomColors, 3));
  block.add(new Mesh(bottom, material));

  // ---------- Estacas do gabarito (aparecem na visita técnica) ----------
  const stakeGeo = new BoxGeometry(0.026, 0.3, 0.026, 1, 4, 1);
  stakeGeo.translate(0, 0.15, 0);
  const stakeCol = new Float32Array(stakeGeo.getAttribute("position").count * 3);
  const sp = stakeGeo.getAttribute("position");
  const wood = c.dust.clone().lerp(c.soil, 0.15);
  for (let i = 0; i < sp.count; i++) {
    const col = sp.getY(i) > 0.22 ? c.yellow : wood;
    stakeCol.set([col.r, col.g, col.b], i * 3);
  }
  stakeGeo.setAttribute("color", new BufferAttribute(stakeCol, 3));
  const stakeSpots: [number, number][] = [
    [-0.82, 0.78],
    [0.82, 0.78],
    [-0.82, -0.78],
    [0.82, -0.78],
    [0, 0.78],
    [0, -0.78],
  ];
  const stakes = stakeSpots.map(() => {
    const mesh = new Mesh(stakeGeo, material);
    block.add(mesh);
    return mesh;
  });

  // ---------- Terreno em função do progresso ----------
  const color = new Color();
  const tmp = new Color();
  /** Fração já nivelada no ponto x (a frente de corte anda da esquerda para a direita). */
  let front = -2;
  const leveled = (x: number) => 1 - smoothstep(x, front - 0.22, front + 0.04);
  const heightAt = (x: number, z: number) => lerp(hills(x, z), FLAT, leveled(x));

  const paintTop = (x: number, z: number, out: Color) => {
    const h = hills(x, z);
    // Pasto mais seco nas cristas, terra aparecendo nos barrancos.
    out.copy(grassDark).lerp(c.grass, clamp(0.5 + h * 3, 0, 1));
    out.lerp(grassDry, smoothstep(Math.sin(4.3 * x + 2.2 * z) * 0.5 + 0.5, 0.55, 0.95) * 0.6);
    // Terra batida com as passadas do rolo, depois do corte.
    const stripes = 0.5 + 0.5 * Math.sin(z * 26);
    tmp.copy(packed).multiplyScalar(0.94 + 0.08 * stripes);
    out.lerp(tmp, leveled(x));
    // Faixa de terra solta logo na frente da lâmina.
    out.lerp(c.soil, Math.exp(-(((x - front) / 0.08) ** 2)) * 0.8);
  };

  /** Camadas de solo: levemente onduladas ao longo da parede, com a passagem entre elas suavizada. */
  const strataAt = (x: number, z: number, y: number, out: Color) => {
    const wobble = 0.35 * Math.sin(x * 4.7 + z * 3.1 + 0.6) + 0.15 * Math.sin(x * 11 - z * 9);
    const depth = ((0.2 - y) / (0.2 - BOTTOM)) * strata.length + wobble;
    const band = clamp(Math.floor(depth), 0, strata.length - 1);
    const next = clamp(band + 1, 0, strata.length - 1);
    out.copy(strata[band]).lerp(strata[next], smoothstep(depth - Math.floor(depth), 0.8, 1));
    out.multiplyScalar(lerp(1, 0.55, clamp((0.1 - y) / (0.1 - BOTTOM), 0, 1)));
  };

  const update = (p: number) => {
    const cut = smoothstep(p, 0.45, 0.9);
    front = lerp(-1.35, 1.35, cut);

    for (let j = 0; j <= N; j++) {
      for (let i = 0; i <= N; i++) {
        const x = -1 + (2 * i) / N;
        const z = -1 + (2 * j) / N;
        const v = j * (N + 1) + i;
        topPos.set([x * SIZE_X, heightAt(x, z), z * SIZE_Z], v * 3);
        paintTop(x, z, color);
        topCol.set([color.r, color.g, color.b], v * 3);
      }
    }
    edges.forEach((edge, s) => {
      const base = s * (N + 1) * (ROWS + 1);
      edge.forEach(([x, z], i) => {
        const yTop = heightAt(x, z);
        for (let r = 0; r <= ROWS; r++) {
          const y = lerp(yTop, BOTTOM, r / ROWS);
          const v = base + r * (N + 1) + i;
          wallPos.set([x * SIZE_X, y, z * SIZE_Z], v * 3);
          if (r === 0) paintTop(x, z, color);
          else strataAt(x, z, y, color);
          wallCol.set([color.r, color.g, color.b], v * 3);
        }
      });
    });
    top.attributes.position.needsUpdate = true;
    top.attributes.color.needsUpdate = true;
    walls.attributes.position.needsUpdate = true;
    walls.attributes.color.needsUpdate = true;
    top.computeVertexNormals();
    walls.computeVertexNormals();

    // Estacas sobem uma a uma na visita técnica e ficam no nível do chão.
    stakes.forEach((stake, k) => {
      const [x, z] = stakeSpots[k];
      const grow = smoothstep(p, 0.16 + k * 0.025, 0.3 + k * 0.025);
      stake.visible = grow > 0.01;
      stake.scale.set(1, grow, 1);
      stake.position.set(x * SIZE_X, heightAt(x, z) - 0.02, z * SIZE_Z);
    });
  };

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Enquadra o bloco inteiro em qualquer proporção.
    const fit = Math.max(1, 1.25 / camera.aspect);
    camera.position.set(3.1 * fit, 2.35 * fit, 3.9 * fit);
    camera.lookAt(0, -0.32, 0);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const pointer = { x: 0, sx: 0 };
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType === "mouse") pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  };
  if (!still) window.addEventListener("pointermove", onPointer, { passive: true });

  let lastP = -1;
  let frame = 0;
  let running = false;
  let last = performance.now();
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    const p = still ? 1 : getProgress();
    if (Math.abs(p - lastP) > 0.0005) {
      update(p);
      lastP = p;
    }
    if (!still) {
      pointer.sx = MathUtils.damp(pointer.sx, pointer.x, 3, dt);
      block.rotation.y = Math.sin(now / 1000 / 6) * 0.14 - 0.35 + pointer.sx * 0.12;
    } else {
      block.rotation.y = -0.35;
    }
    renderer.render(scene, camera);
  };

  return {
    /** Só desenha enquanto a seção está na tela. */
    setRunning(on: boolean) {
      if (on === running) return;
      running = on;
      if (on) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(frame);
      }
    },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      [top, walls, bottom, stakeGeo].forEach((geometry) => geometry.dispose());
      material.dispose();
      renderer.dispose();
    },
  };
}
