"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { type BufferGeometry, ShaderMaterial, Sphere, UniformsLib, UniformsUtils, Vector3 } from "three";
import { getScenePalette } from "@/lib/scene/palette";
import { SUN_DIRECTION } from "@/lib/scene/world";

const vertexShader = /* glsl */ `
  uniform vec3 uCenter;
  attribute float aEdge;
  varying vec3 vWorld;
  varying vec3 vCenter;
  varying float vEdge;
  #include <fog_pars_vertex>

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vCenter = (modelMatrix * vec4(uCenter, 1.0)).xyz;
    vEdge = aEdge;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSun;
  uniform vec3 uSunDirection;
  uniform vec3 uDeep;
  uniform vec3 uMud;
  uniform float uRadius;
  varying vec3 vWorld;
  varying vec3 vCenter;
  varying float vEdge;
  #include <fog_pars_fragment>

  void main() {
    vec3 view = normalize(vWorld - cameraPosition);

    // Ondulação: duas ondas cruzadas inclinam a normal
    vec2 p = vWorld.xz;
    vec3 n = normalize(vec3(
      0.035 * sin(p.x * 1.7 + uTime * 0.8) + 0.025 * sin((p.x + p.y) * 2.9 - uTime * 1.1),
      1.0,
      0.035 * sin(p.y * 2.1 - uTime * 0.6) + 0.025 * sin((p.x - p.y) * 3.3 + uTime * 0.9)
    ));

    // Céu refletido: o mesmo gradiente e o mesmo halo do Sky
    vec3 r = reflect(view, n);
    vec3 sky = mix(uHorizon, uZenith, smoothstep(0.02, 0.7, max(r.y, 0.0)));
    float sunDot = max(dot(r, uSunDirection), 0.0);
    sky += uSun * (pow(sunDot, 6.0) * 0.28 + pow(sunDot, 48.0) * 0.6 + pow(sunDot, 600.0) * 1.2);

    // O céu é muito mais claro que a água: reflexo por igual vira um disco cinza.
    // Então a água fica escura do lado da câmera e espelha o céu numa faixa do lado de lá.
    float facing = clamp(dot(n, -view), 0.0, 1.0);
    float fresnel = 0.04 + 0.4 * pow(1.0 - facing, 4.0);
    float far = dot(vWorld.xz - vCenter.xz, normalize(vWorld.xz - cameraPosition.xz)) / uRadius;
    float sheen = fresnel * mix(0.3, 2.6, smoothstep(-0.2, 0.75, far));
    vec3 body = mix(uDeep, uMud, smoothstep(0.55, 0.82, vEdge));
    vec3 color = mix(body, sky, clamp(sheen, 0.0, 1.0) * (1.0 - 0.45 * smoothstep(0.6, 0.85, vEdge)));

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

/** Espelho d'água do reservatório. Sem luz própria: só reflete as cores do céu da cena. */
export function Water({ geometry, animate }: { geometry: BufferGeometry; animate: boolean }) {
  const material = useMemo(() => {
    const palette = getScenePalette();
    const bounds = geometry.boundingSphere ?? new Sphere();
    return new ShaderMaterial({
      uniforms: UniformsUtils.merge([
        UniformsLib.fog,
        {
          uTime: { value: 0 },
          uCenter: { value: bounds.center },
          uRadius: { value: Math.max(bounds.radius, 1e-3) },
          uZenith: { value: palette.skyZenith },
          uHorizon: { value: palette.skyHorizon },
          uSun: { value: palette.sun },
          uSunDirection: { value: new Vector3(...SUN_DIRECTION).normalize() },
          uDeep: { value: palette.waterDeep },
          uMud: { value: palette.soilDark },
        },
      ]),
      vertexShader,
      fragmentShader,
      fog: true,
    });
  }, [geometry]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    if (animate) material.uniforms.uTime.value = clock.elapsedTime;
  });

  return <mesh geometry={geometry} material={material} />;
}
