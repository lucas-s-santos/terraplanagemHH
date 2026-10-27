import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  NeutralToneMapping,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Quaternion,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { CYCLE_SECONDS, DUMP_WINDOW, SCRAPE_WINDOW, TRAVEL, cyclePose, introPose, stillPose } from "./cycle";
import { type BackhoeColors, createMaterials } from "./materials";
import { type Pose, createBackhoe } from "./model";
import { clod } from "./parts";
import { skyReflection } from "./sky";

const { clamp, damp, lerp, smoothstep } = MathUtils;

export interface BackhoeSceneOptions {
  canvas: HTMLCanvasElement;
  colors: BackhoeColors;
  /** Movimento reduzido: uma pose parada, desenhada uma vez. */
  still: boolean;
  /** Parada do scroll (store.stop): 0 no hero, 1 no primeiro serviço. */
  getStop: () => number;
}

/** Enquadramento: na tela larga a máquina fica à direita (o texto mora à esquerda); em pé, em cima. */
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
const WIDE: Framing = { azimuth: 0.86, elevation: 0.12, fill: 0.54, shiftX: -0.225, shiftY: 0.02 };
const TALL: Framing = { azimuth: 1.0, elevation: 0.15, fill: 0.9, shiftX: 0.0, shiftY: 0.17 };
const FOV = 28;
/** Meio comprimento da máquina trabalhando (da caçamba esticada até a pá). */
const MACHINE_RADIUS = 4.9;
const TARGET = new Vector3(-1.45, 1.25, 0);
/** De onde vem o sol (da direita da tela, baixo, como nos vídeos). */
const SUN = new Vector3(-0.62, 0.42, -0.66).normalize();
const INTRO_SECONDS = 3.2;

// ---------- Ruído determinístico (o chão é sempre o mesmo) ----------
const hash = (x: number, z: number) => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const noise = (x: number, z: number) => {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  return lerp(lerp(hash(ix, iz), hash(ix + 1, iz), ux), lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), ux), uz);
};
const fbm = (x: number, z: number) =>
  noise(x, z) * 0.5 + noise(x * 2.1 + 5.2, z * 2.1 - 1.3) * 0.3 + noise(x * 4.7 - 2.7, z * 4.7 + 8.1) * 0.2;

/** Distância do ponto ao segmento ab, no plano do chão. */
function segmentDistance(px: number, pz: number, a: Vector2, b: Vector2) {
  const abx = b.x - a.x;
  const abz = b.y - a.y;
  const t = clamp(((px - a.x) * abx + (pz - a.y) * abz) / (abx * abx + abz * abz || 1), 0, 1);
  return Math.hypot(px - (a.x + abx * t), pz - (a.y + abz * t));
}

/**
 * O chão perto da máquina: terra roxa seca, as marcas dos pneus, a vala que a retro está
 * abrindo e o monte de terra tirada. Some aos poucos nas bordas, para casar com a foto de fundo.
 */
function createGround(colors: BackhoeColors, dig: [Vector2, Vector2], dump: Vector2) {
  const soil = new Color(colors.soil);
  const dark = new Color(colors.dark);
  const dust = new Color(colors.dust);
  // Terra roxa no sol do fim da tarde: mais alaranjada que o token (que é a cor na sombra).
  const lit = new Color("#b5562c");
  const dry = soil.clone().lerp(lit, 0.6).lerp(dust, 0.12);
  const dryDark = soil.clone().lerp(lit, 0.35).lerp(dark, 0.06);
  const moist = soil.clone().lerp(dark, 0.25);

  const W = 22;
  const D = 16;
  const center = new Vector2(-1.6, -0.9);
  const geometry = new PlaneGeometry(W, D, 140, 102).rotateX(-Math.PI / 2).translate(center.x, 0, center.y);

  const height = (x: number, z: number) => {
    let h = (fbm(x * 0.9, z * 0.9) - 0.5) * 0.06 + (noise(x * 7, z * 7) - 0.5) * 0.012;
    // Marcas dos pneus, de onde a máquina chegou (pela frente).
    for (const track of [0.93, -0.93, 0.86, -0.86]) {
      const along = smoothstep(x, -1.1, -0.6) * (1 - smoothstep(x, 7, 10));
      h -= 0.022 * Math.exp(-(((z - track) / 0.16) ** 2)) * along * (0.8 + 0.2 * Math.sin(x * 34));
    }
    // Vala: uma cápsula entre o começo e o fim da raspada, com a borda de terra solta.
    const r = segmentDistance(x, z, dig[0], dig[1]);
    h -= 0.26 * (1 - smoothstep(r, 0.22, 0.46));
    h += 0.05 * Math.exp(-(((r - 0.58) / 0.14) ** 2));
    // Monte da terra tirada.
    const m = Math.hypot(x - dump.x, z - dump.y) / 1.05;
    if (m < 1) h += 0.52 * (1 - m * m) ** 1.6 * (0.85 + 0.3 * fbm(x * 3, z * 3)) + (noise(x * 14, z * 14) - 0.5) * 0.05 * (1 - m);
    return h;
  };

  const position = geometry.getAttribute("position");
  const color = new Float32Array(position.count * 4);
  const c = new Color();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    position.setY(i, height(x, z));
    c.copy(dry).lerp(dryDark, smoothstep(fbm(x * 0.6 + 3, z * 0.6), 0.35, 0.75));
    c.multiplyScalar(0.92 + 0.16 * noise(x * 9, z * 9));
    const r = segmentDistance(x, z, dig[0], dig[1]);
    const m = Math.hypot(x - dump.x, z - dump.y);
    c.lerp(moist, Math.max(1 - smoothstep(r, 0.3, 0.75), 1 - smoothstep(m, 0.7, 1.35)));
    // Borda: some aos poucos (elipse em volta da máquina).
    const e = Math.hypot((x - center.x) / (W / 2), (z - center.y) / (D / 2));
    color.set([c.r, c.g, c.b, 1 - smoothstep(e, 0.55, 0.96)], i * 4);
  }
  geometry.setAttribute("color", new BufferAttribute(color, 4));
  geometry.computeVertexNormals();
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.97, metalness: 0, transparent: true });
  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.renderOrder = -1;
  return { mesh, height };
}

// ---------- Poeira (pontos macios) ----------
const DUST_VERTEX = `
attribute float aSize;
attribute float aAlpha;
varying float vAlpha;
uniform float uScale;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uScale / -mv.z;
  vAlpha = aAlpha;
}`;
const DUST_FRAGMENT = `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

interface Mote {
  p: Vector3;
  v: Vector3;
  age: number;
  life: number;
  size: number;
  grow: number;
  alpha: number;
  /** Ciscos que flutuam no sol para sempre; nuvens de poeira que nascem e somem. */
  ambient: boolean;
}

/** Torrão que sobe e fica no ar (o detalhe surreal da série de vídeos). */
interface Clod {
  active: boolean;
  p: Vector3;
  v: Vector3;
  q: Quaternion;
  axis: Vector3;
  spin: number;
  age: number;
  life: number;
  hover: number;
  scale: number;
  phase: number;
}

/** Terra caindo da caçamba. */
interface Grain {
  active: boolean;
  p: Vector3;
  v: Vector3;
  scale: number;
}

export function createBackhoeScene({ canvas, colors, still, getStop }: BackhoeSceneOptions) {
  const tall = () => canvas.clientWidth < canvas.clientHeight;
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  // Em produção, sem checar shaders: compila mais rápido e não enche o console de avisos do ANGLE.
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  const reflection = skyReflection(renderer, SUN);
  scene.environment = reflection.texture;
  scene.environmentIntensity = 0.55;

  const camera = new PerspectiveCamera(FOV, 1, 0.5, 200);

  // ---------- Luz: sol baixo e quente, céu de fill e um contraluz frio ----------
  const dust = new Color(colors.dust);
  scene.add(new HemisphereLight(new Color("#ffd8a8"), new Color(colors.soil), 0.75));
  const sun = new DirectionalLight(new Color("#ffcf96"), 3.1);
  sun.position.copy(TARGET).addScaledVector(SUN, 30);
  sun.target.position.copy(TARGET);
  sun.castShadow = true;
  const shadowSize = tall() ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 7;
  sun.shadow.camera.bottom = -7;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 50;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const rim = new DirectionalLight(new Color("#b9c6e6"), 0.55);
  rim.position.set(6, 5, 8);
  scene.add(rim);

  // ---------- Máquina ----------
  const materials = createMaterials(colors);
  const backhoe = createBackhoe(materials);
  scene.add(backhoe.root);
  const pose: Pose = { ...TRAVEL };

  // A vala e o monte saem do próprio ciclo: onde a caçamba raspa e onde ela despeja.
  const mouthAt = (phase: number) => {
    backhoe.setPose(cyclePose(phase, pose));
    const p = backhoe.mouth.getWorldPosition(new Vector3());
    return new Vector2(p.x, p.z);
  };
  const dig: [Vector2, Vector2] = [mouthAt(SCRAPE_WINDOW[0] + 0.02), mouthAt(SCRAPE_WINDOW[1])];
  const dumpSpot = mouthAt(0.76);
  const ground = createGround(colors, dig, dumpSpot);
  scene.add(ground.mesh);

  // ---------- Torrões e terra caindo ----------
  const clodGeometry = clod(0.1, 1.7);
  const grainGeometry = clod(0.05, 4.2);
  const clodMesh = new InstancedMesh(clodGeometry, materials.load, 14);
  const grainMesh = new InstancedMesh(grainGeometry, materials.load, 56);
  clodMesh.castShadow = true;
  grainMesh.castShadow = true;
  clodMesh.frustumCulled = false;
  grainMesh.frustumCulled = false;
  scene.add(clodMesh, grainMesh);
  const clods: Clod[] = Array.from({ length: clodMesh.count }, () => ({
    active: false,
    p: new Vector3(),
    v: new Vector3(),
    q: new Quaternion(),
    axis: new Vector3(0, 1, 0),
    spin: 0,
    age: 0,
    life: 1,
    hover: 2,
    scale: 1,
    phase: 0,
  }));
  const grains: Grain[] = Array.from({ length: grainMesh.count }, () => ({
    active: false,
    p: new Vector3(),
    v: new Vector3(),
    scale: 1,
  }));

  // ---------- Poeira ----------
  const MOTES = 150;
  const motes: Mote[] = Array.from({ length: MOTES }, (_, i) => ({
    p: new Vector3(),
    v: new Vector3(),
    age: 0,
    life: 1,
    size: 0,
    grow: 0,
    alpha: 0,
    ambient: i < 70,
  }));
  const dustPositions = new Float32Array(MOTES * 3);
  const dustSizes = new Float32Array(MOTES);
  const dustAlphas = new Float32Array(MOTES);
  const dustGeometry = new BufferGeometry();
  dustGeometry.setAttribute("position", new BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute("aSize", new BufferAttribute(dustSizes, 1));
  dustGeometry.setAttribute("aAlpha", new BufferAttribute(dustAlphas, 1));
  const dustMaterial = new ShaderMaterial({
    uniforms: { uColor: { value: dust.clone().lerp(new Color("#ffffff"), 0.15) }, uScale: { value: 800 } },
    vertexShader: DUST_VERTEX,
    fragmentShader: DUST_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  const dustPoints = new Points(dustGeometry, dustMaterial);
  dustPoints.frustumCulled = false;
  scene.add(dustPoints);

  // Ciscos no ar em volta da máquina, devagar, brilhando no sol.
  const resetAmbient = (mote: Mote, anywhere: boolean) => {
    mote.p.set(lerp(-8, 5, Math.random()), lerp(0.2, 4.2, Math.random()), lerp(-4.5, 3, Math.random()));
    if (!anywhere) mote.p.y = 0.15;
    mote.v.set(lerp(0.05, 0.16, Math.random()), lerp(0.02, 0.08, Math.random()), lerp(-0.04, 0.04, Math.random()));
    mote.size = lerp(0.025, 0.06, Math.random());
    mote.alpha = lerp(0.25, 0.6, Math.random());
    mote.age = 0;
    mote.life = lerp(10, 22, Math.random());
  };
  motes.forEach((mote) => {
    if (mote.ambient) {
      resetAmbient(mote, true);
      mote.age = Math.random() * mote.life;
    }
  });
  let nextPuff = 70;
  const puff = (at: Vector3, strength: number) => {
    const mote = motes[nextPuff];
    nextPuff = nextPuff + 1 >= MOTES ? 70 : nextPuff + 1;
    mote.p.copy(at).add(new Vector3((Math.random() - 0.5) * 0.5, Math.random() * 0.2, (Math.random() - 0.5) * 0.5));
    mote.v.set(lerp(0.1, 0.3, Math.random()), lerp(0.15, 0.4, Math.random()) * strength, (Math.random() - 0.5) * 0.15);
    mote.size = lerp(0.35, 0.7, Math.random()) * strength;
    mote.grow = lerp(0.35, 0.6, Math.random());
    mote.alpha = lerp(0.12, 0.22, Math.random());
    mote.age = 0;
    mote.life = lerp(2.2, 3.6, Math.random());
  };

  let nextClod = 0;
  const releaseClod = (at: Vector3) => {
    const item = clods[nextClod];
    nextClod = (nextClod + 1) % clods.length;
    item.active = true;
    item.p.copy(at).add(new Vector3((Math.random() - 0.5) * 0.4, -0.1, (Math.random() - 0.5) * 0.4));
    item.v.set((Math.random() - 0.5) * 0.5, -lerp(0.4, 1.2, Math.random()), (Math.random() - 0.5) * 0.5);
    item.q.setFromAxisAngle(new Vector3(Math.random(), Math.random(), Math.random()).normalize(), Math.random() * 6);
    item.axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    item.spin = lerp(0.15, 0.45, Math.random());
    item.age = 0;
    item.life = lerp(14, 22, Math.random());
    item.hover = lerp(2.0, 3.6, Math.random());
    item.scale = lerp(0.55, 1.5, Math.random());
    item.phase = Math.random() * 6;
  };
  let nextGrain = 0;
  const pourGrain = (at: Vector3) => {
    const item = grains[nextGrain];
    nextGrain = (nextGrain + 1) % grains.length;
    item.active = true;
    item.p.copy(at).add(new Vector3((Math.random() - 0.5) * 0.45, 0, (Math.random() - 0.5) * 0.45));
    item.v.set((Math.random() - 0.5) * 0.3, -lerp(0.2, 0.8, Math.random()), (Math.random() - 0.5) * 0.3);
    item.scale = lerp(0.6, 1.4, Math.random());
  };

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
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, tall() ? 1.5 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    framing = w < h ? TALL : WIDE;
    const halfWidth = Math.atan(Math.tan(MathUtils.degToRad(FOV / 2)) * camera.aspect);
    distance = MACHINE_RADIUS / (framing.fill * Math.tan(halfWidth));
    camera.setViewOffset(w, h, framing.shiftX * w, framing.shiftY * h, w, h);
    dustMaterial.uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan(MathUtils.degToRad(FOV / 2)));
    if (still) render();
  };

  const placeCamera = (stop: number) => {
    // No scroll, a câmera chega um pouco mais perto e contorna a máquina, até o clipe seguinte entrar.
    const leave = smoothstep(stop, 0, 0.65);
    const azimuth = framing.azimuth + pointer.sx * 0.045 + leave * 0.12;
    const elevation = framing.elevation - pointer.sy * 0.02 + leave * 0.04;
    const d = distance * (1 - leave * 0.1);
    camera.position.set(
      TARGET.x + Math.sin(azimuth) * Math.cos(elevation) * d,
      TARGET.y + Math.sin(elevation) * d,
      TARGET.z - Math.cos(azimuth) * Math.cos(elevation) * d,
    );
    camera.lookAt(TARGET);
  };

  // ---------- Simulação ----------
  const temp = new Vector3();
  const mouth = new Vector3();
  const dummy = new Object3D();
  const hidden = new Matrix4().makeScale(0, 0, 0);
  let phasePrev = 0;

  const simulate = (dt: number, phase: number, working: boolean, time: number) => {
    backhoe.mouth.getWorldPosition(mouth);
    const inDump = working && phase > DUMP_WINDOW[0] && phase < DUMP_WINDOW[1];
    const inScrape = working && phase > SCRAPE_WINDOW[0] + 0.02 && phase < SCRAPE_WINDOW[1];
    if (inDump) {
      // Terra caindo e, no começo do despejo, alguns torrões que não chegam ao chão.
      for (let k = 0; k < Math.round(dt * 90); k++) pourGrain(mouth);
      const startedDump = phasePrev <= DUMP_WINDOW[0] + 0.02 && phase > DUMP_WINDOW[0] + 0.02;
      if (startedDump) for (let k = 0; k < 4; k++) releaseClod(mouth);
    }
    if (inScrape && Math.random() < dt * 7) puff(temp.set(mouth.x, Math.max(ground.height(mouth.x, mouth.z), mouth.y - 0.3), mouth.z), 1);
    phasePrev = phase;

    grains.forEach((item, i) => {
      if (item.active) {
        item.v.y -= 9.8 * dt;
        item.p.addScaledVector(item.v, dt);
        const floor = ground.height(item.p.x, item.p.z);
        if (item.p.y < floor) {
          item.active = false;
          if (Math.random() < 0.12) puff(item.p.setY(floor), 0.8);
        }
      }
      if (!item.active) grainMesh.setMatrixAt(i, hidden);
      else {
        dummy.position.copy(item.p);
        dummy.rotation.set(item.p.x * 7, item.p.y * 5, item.p.z * 3);
        dummy.scale.setScalar(item.scale);
        dummy.updateMatrix();
        grainMesh.setMatrixAt(i, dummy.matrix);
      }
    });
    grainMesh.instanceMatrix.needsUpdate = true;

    clods.forEach((item, i) => {
      if (item.active) {
        item.age += dt;
        // Caem um instante com a terra, freiam no ar e sobem devagar até ficar flutuando.
        const lift = smoothstep(item.age, 0.15, 0.9);
        const target = item.hover + Math.sin(time * 0.6 + item.phase) * 0.08;
        item.v.y += (lerp(-9.8, 0, lift) + lift * ((target - item.p.y) * 0.35 - item.v.y * 0.9)) * dt;
        item.v.x = damp(item.v.x, 0.05, 0.6, dt);
        item.v.z = damp(item.v.z, 0, 0.6, dt);
        item.p.addScaledVector(item.v, dt);
        item.q.premultiply(new Quaternion().setFromAxisAngle(item.axis, item.spin * dt));
        if (item.age > item.life) item.active = false;
      }
      if (!item.active) clodMesh.setMatrixAt(i, hidden);
      else {
        const fade = smoothstep(item.age, 0, 0.2) * (1 - smoothstep(item.age, item.life - 1.5, item.life));
        dummy.position.copy(item.p);
        dummy.quaternion.copy(item.q);
        dummy.scale.setScalar(item.scale * fade);
        dummy.updateMatrix();
        clodMesh.setMatrixAt(i, dummy.matrix);
      }
    });
    clodMesh.instanceMatrix.needsUpdate = true;

    motes.forEach((mote, i) => {
      mote.age += dt;
      if (mote.ambient) {
        if (mote.age > mote.life) resetAmbient(mote, true);
        mote.p.addScaledVector(mote.v, dt);
        mote.p.y += Math.sin(time * 0.7 + i) * 0.02 * dt;
        const fade = smoothstep(mote.age, 0, 2) * (1 - smoothstep(mote.age, mote.life - 2, mote.life));
        dustAlphas[i] = mote.alpha * fade;
        dustSizes[i] = mote.size;
      } else {
        const alive = mote.age < mote.life;
        mote.p.addScaledVector(mote.v, dt);
        mote.v.multiplyScalar(1 - 0.6 * dt);
        const k = mote.age / mote.life;
        dustAlphas[i] = alive ? mote.alpha * smoothstep(k, 0, 0.12) * (1 - smoothstep(k, 0.3, 1)) : 0;
        dustSizes[i] = mote.size * (1 + mote.grow * mote.age * 2);
      }
      dustPositions.set([mote.p.x, mote.p.y, mote.p.z], i * 3);
    });
    dustGeometry.attributes.position.needsUpdate = true;
    dustGeometry.attributes.aSize.needsUpdate = true;
    dustGeometry.attributes.aAlpha.needsUpdate = true;
  };

  /** Movimento reduzido: alguns torrões parados no ar, sem poeira nascendo. */
  const freezeClods = () => {
    const spots = [
      [-3.3, 2.4, -2.6, 1.2],
      [-2.6, 3.1, -3.4, 0.8],
      [-4.1, 2.9, -2.2, 1.0],
      [-3.0, 3.6, -1.6, 0.6],
    ] as const;
    spots.forEach(([x, y, z, s], i) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(i * 1.3, i * 0.7, i * 2.1);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      clodMesh.setMatrixAt(i, dummy.matrix);
    });
    for (let i = spots.length; i < clodMesh.count; i++) clodMesh.setMatrixAt(i, hidden);
    for (let i = 0; i < grainMesh.count; i++) grainMesh.setMatrixAt(i, hidden);
    motes.forEach((mote, i) => {
      dustAlphas[i] = mote.ambient ? mote.alpha * 0.8 : 0;
      dustSizes[i] = mote.size;
      dustPositions.set([mote.p.x, mote.p.y, mote.p.z], i * 3);
    });
  };

  // ---------- Laço ----------
  let state: "waiting" | "intro" | "working" = still ? "working" : "waiting";
  let introTime = 0;
  let cycleTime = 0;
  let time = 0;
  let frame = 0;
  let running = false;
  let last = performance.now();
  let rendered = false;
  let onFirstFrame: (() => void) | undefined;

  const render = () => {
    renderer.render(scene, camera);
    if (!rendered) {
      rendered = true;
      onFirstFrame?.();
    }
  };

  const step = (dt: number) => {
    time += dt;
    pointer.sx = damp(pointer.sx, pointer.x, 2.5, dt);
    pointer.sy = damp(pointer.sy, pointer.y, 2.5, dt);
    let phase = 0;
    // Esperando o preloader: fica na pose de transporte (já aplicada).
    if (state === "intro") {
      introTime += dt;
      backhoe.setPose(introPose(introTime / INTRO_SECONDS, pose));
      if (introTime >= INTRO_SECONDS) state = "working";
    } else if (state === "working") {
      cycleTime += dt;
      phase = (cycleTime / CYCLE_SECONDS) % 1;
      backhoe.setPose(cyclePose(phase, pose));
    }
    // Giroflex piscando enquanto a máquina trabalha.
    materials.beacon.emissiveIntensity = state === "waiting" ? 0.3 : 0.4 + 2.2 * Math.max(0, Math.sin(time * 5.5)) ** 6;
    simulate(dt, phase, state === "working", time);
    placeCamera(getStop());
    render();
  };

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    // O carimbo do rAF pode vir antes do performance.now() guardado: nunca deixa o tempo voltar.
    const dt = clamp((now - last) / 1000, 0, 1 / 20);
    last = now;
    step(dt);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  if (still) {
    backhoe.setPose(Object.assign(pose, stillPose()));
    freezeClods();
    placeCamera(0);
    render();
  } else {
    backhoe.setPose(Object.assign(pose, TRAVEL));
    placeCamera(0);
    render();
  }

  if (process.env.NODE_ENV !== "production") {
    // Para revisar a máquina pelo console (e pelas capturas): __retro.pose({ boom: -0.5 }), __retro.at(0.7).
    // Os dois congelam o laço, para a captura sair no quadro pedido.
    const freeze = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    (window as unknown as Record<string, unknown>).__retro = {
      pose: (partial: Partial<Pose>) => {
        freeze();
        backhoe.setPose(Object.assign(pose, partial));
        render();
      },
      at: (phase: number) => {
        freeze();
        state = "working";
        cycleTime = phase * CYCLE_SECONDS;
        step(0);
      },
      view: (partial: Partial<Framing>) => {
        framing = { ...framing, ...partial };
        placeCamera(getStop());
        render();
      },
      info: () => ({ state, running, time, cycleTime, stop: getStop(), triangles: renderer.info.render.triangles, calls: renderer.info.render.calls }),
    };
  }

  return {
    /** Promessa resolvida quando o primeiro quadro foi desenhado (para o preloader). */
    ready: new Promise<void>((resolve) => {
      if (rendered) resolve();
      else onFirstFrame = resolve;
    }),
    /** A máquina "acorda": desce a pá e as sapatas e começa a cavar. */
    start() {
      if (state === "waiting") state = "intro";
    },
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
      [ground.mesh.geometry, clodGeometry, grainGeometry, dustGeometry].forEach((geometry) => geometry.dispose());
      ground.mesh.material.dispose();
      dustMaterial.dispose();
      clodMesh.dispose();
      grainMesh.dispose();
      reflection.dispose();
      renderer.dispose();
    },
  };
}
