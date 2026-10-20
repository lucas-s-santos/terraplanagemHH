"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, ShaderMaterial, Vector3 } from "three";
import { mulberry32 } from "@/lib/random";
import { getScenePalette } from "@/lib/scene/palette";
import { SUN_DIRECTION } from "@/lib/scene/world";

const MAX_PARTICLES = 800;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uBox;
  uniform vec3 uSunDirection;
  attribute float aSeed;
  varying float vAlpha;
  varying float vScatter;

  void main() {
    vec3 p = position;
    p += vec3(sin(uTime * 0.11 + aSeed * 6.28), sin(uTime * 0.07 + aSeed * 12.0) * 0.6, cos(uTime * 0.09 + aSeed * 3.1)) * 1.5;
    p.y += uTime * 0.12 * (0.5 + aSeed);

    // A caixa de poeira acompanha a câmera (repetição infinita).
    p = mod(p - cameraPosition + uBox * 0.5, uBox) - uBox * 0.5 + cameraPosition;

    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    gl_PointSize = min(uSize * uPixelRatio * (0.5 + aSeed) * (30.0 / max(dist, 0.001)), 36.0);

    vec3 dir = normalize(p - cameraPosition);
    vScatter = pow(max(dot(dir, uSunDirection), 0.0), 6.0);
    float edge = 1.0 - smoothstep(uBox.x * 0.3, uBox.x * 0.5, length(p - cameraPosition));
    vAlpha = edge * smoothstep(1.5, 5.0, dist);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunColor;
  varying float vAlpha;
  varying float vScatter;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float soft = smoothstep(0.5, 0.0, d);
    float alpha = soft * vAlpha * (0.16 + 0.7 * vScatter);
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(mix(uColor, uSunColor, vScatter), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Poeira suspensa que acende contra o sol. */
export function Dust({ count, animate }: { count: number; animate: boolean }) {
  const geometry = useMemo(() => {
    const rand = mulberry32(3);
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const seeds = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      positions[i * 3] = rand() * 70;
      positions[i * 3 + 1] = rand() * 40;
      positions[i * 3 + 2] = rand() * 70;
      seeds[i] = rand();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    return g;
  }, []);

  const material = useMemo(() => {
    const palette = getScenePalette();
    return new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 2.2 },
        uPixelRatio: { value: 1 },
        uBox: { value: new Vector3(70, 40, 70) },
        uSunDirection: { value: new Vector3(...SUN_DIRECTION).normalize() },
        uColor: { value: palette.dust },
        uSunColor: { value: palette.sun },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  geometry.setDrawRange(0, Math.min(count, MAX_PARTICLES));

  useFrame(({ viewport }, delta) => {
    material.uniforms.uPixelRatio.value = viewport.dpr;
    if (animate) material.uniforms.uTime.value += delta;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
