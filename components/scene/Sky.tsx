"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, type Mesh, ShaderMaterial, Vector3 } from "three";
import { getScenePalette } from "@/lib/scene/palette";
import { SUN_DIRECTION } from "@/lib/scene/world";

const vertexShader = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uBelow;
  uniform vec3 uSun;
  uniform vec3 uSunDirection;
  varying vec3 vDirection;

  void main() {
    vec3 d = normalize(vDirection);
    float h = d.y;

    vec3 color = mix(uHorizon, uZenith, smoothstep(0.02, 0.7, h));
    color = mix(uBelow, color, smoothstep(-0.35, 0.02, h));

    // O lado do sol é mais quente e luminoso, do horizonte até o meio do céu
    float towardSun = max(dot(normalize(d.xz + 1e-5), normalize(uSunDirection.xz)), 0.0);
    float band = exp(-abs(h - 0.04) * 5.0);
    color = mix(color, uSun, band * (0.08 + 0.42 * pow(towardSun, 2.5)));

    // Halo largo (sem disco duro: o sol fica velado pela poeira)
    float sunDot = max(dot(d, uSunDirection), 0.0);
    color += uSun * (pow(sunDot, 6.0) * 0.28 + pow(sunDot, 48.0) * 0.45 + pow(sunDot, 600.0) * 0.6);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Cúpula de céu de fim de tarde. Acompanha a câmera, então nunca chega perto. */
export function Sky() {
  const mesh = useRef<Mesh>(null);

  const material = useMemo(() => {
    const palette = getScenePalette();
    return new ShaderMaterial({
      uniforms: {
        uZenith: { value: palette.skyZenith },
        uHorizon: { value: palette.skyHorizon },
        uBelow: { value: palette.skyBelow },
        uSun: { value: palette.sun },
        uSunDirection: { value: new Vector3(...SUN_DIRECTION).normalize() },
      },
      vertexShader,
      fragmentShader,
      side: BackSide,
      depthWrite: false,
      fog: false,
    });
  }, []);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ camera }) => {
    mesh.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[600, 48, 24]} />
    </mesh>
  );
}
