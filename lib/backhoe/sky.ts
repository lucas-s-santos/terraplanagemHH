import { BackSide, Mesh, PMREMGenerator, Scene, ShaderMaterial, SphereGeometry, type Vector3, type WebGLRenderer } from "three";

/** Reflexo de céu de fim de tarde (sem baixar HDR): gradiente com o sol, para a pintura e o vidro. */
export function skyReflection(renderer: WebGLRenderer, sun: Vector3) {
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
  const target = pmrem.fromScene(envScene, 0.02);
  sky.geometry.dispose();
  sky.material.dispose();
  pmrem.dispose();
  return target;
}
