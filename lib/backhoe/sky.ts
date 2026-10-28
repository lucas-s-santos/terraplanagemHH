import {
  BackSide,
  BufferGeometry,
  Float32BufferAttribute,
  type Material,
  Mesh,
  OrthographicCamera,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  type Vector3,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from "three";

/** Tamanho do cubo do reflexo (o padrão do fromScene). */
const SIZE = 256;

/** Partes internas do PMREMGenerator (three r186) que deixam compilar os shaders dele antes de usar. */
interface PmremInternals {
  _setSize(size: number): void;
  _allocateTargets(): WebGLRenderTarget;
  _ggxMaterial: Material | null;
  _blurMaterial: Material | null;
}

/**
 * Compila em paralelo (compileAsync) os shaders do próprio PMREM e o do céu, como se fossem desenhar
 * no alvo de meia precisão dele. Sem isso, o fromScene compilava na hora e travava a página por
 * ~1,4 s (o filtro GGX tem um laço de 256 amostras), mesmo com placa de vídeo.
 * Se uma versão nova do three mudar essas partes internas, só perde o aquecimento: o fromScene segue igual.
 */
async function warmUp(renderer: WebGLRenderer, pmrem: PMREMGenerator, sky: Mesh) {
  const internals = pmrem as unknown as Partial<PmremInternals>;
  if (typeof internals._setSize !== "function" || typeof internals._allocateTargets !== "function") return;
  internals._setSize(SIZE);
  const target = internals._allocateTargets();
  const warm = new Scene();
  warm.add(sky.clone());
  // Com um atributo de posição, como as malhas do PMREM: sem ele, a chave do programa muda e o three
  // compilava outro na hora de usar.
  const plane = new BufferGeometry().setAttribute("position", new Float32BufferAttribute(new Float32Array(9), 3));
  for (const material of [internals._ggxMaterial, internals._blurMaterial]) {
    if (material) warm.add(new Mesh(plane, material));
  }
  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  const ready = renderer.compileAsync(warm, new OrthographicCamera());
  renderer.setRenderTarget(previous);
  await ready;
  target.dispose();
  plane.dispose();
}

/** Reflexo de céu de fim de tarde (sem baixar HDR): gradiente com o sol, para a pintura e o vidro. */
export async function skyReflection(renderer: WebGLRenderer, sun: Vector3) {
  const pmrem = new PMREMGenerator(renderer);
  const envScene = new Scene();
  const sky = new Mesh(
    new SphereGeometry(50, 32, 16),
    new ShaderMaterial({
      side: BackSide,
      uniforms: { uSun: { value: sun } },
      vertexShader: "varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `
        varying vec3 vDir;
        uniform vec3 uSun;
        void main() {
          vec3 d = normalize(vDir);
          vec3 zenith = vec3(0.32, 0.36, 0.44);
          vec3 horizon = vec3(1.0, 0.68, 0.38);
          vec3 ground = vec3(0.16, 0.07, 0.04);
          vec3 col = d.y > 0.0 ? mix(horizon, zenith, pow(d.y, 0.55)) : mix(horizon * 0.45, ground, pow(-d.y, 0.35));
          float s = max(dot(d, uSun), 0.0);
          col += vec3(1.0, 0.8, 0.55) * (pow(s, 600.0) * 60.0 + pow(s, 12.0) * 0.8);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  envScene.add(sky);
  await warmUp(renderer, pmrem, sky);
  const target = pmrem.fromScene(envScene, 0.02, 0.1, 100, { size: SIZE });
  sky.geometry.dispose();
  sky.material.dispose();
  pmrem.dispose();
  return target;
}
