"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { NeutralToneMapping, Vector3 } from "three";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { useSceneStore } from "@/lib/store";
import { getScenePalette } from "@/lib/scene/palette";
import { ISLANDS, SUN_DIRECTION } from "@/lib/scene/world";
import { Archipelago } from "./Archipelago";
import { CameraRig } from "./CameraRig";
import { Dust } from "./Dust";
import { EarthBlocks } from "./EarthBlocks";
import { Effects } from "./Effects";
import { Sky } from "./Sky";

const BUDGET = {
  high: { blocks: 150, dust: 700 },
  low: { blocks: 40, dust: 220 },
} as const;

const CONSTRAINED_QUERY = "(max-width: 768px), (pointer: coarse)";

export default function Scene() {
  const reduced = usePrefersReducedMotion();
  const quality = useSceneStore((s) => s.quality);
  const setQuality = useSceneStore((s) => s.setQuality);
  const [constrained] = useState(() => window.matchMedia(CONSTRAINED_QUERY).matches);

  useLayoutEffect(() => {
    if (constrained) setQuality("low");
  }, [constrained, setQuality]);

  const palette = getScenePalette();
  const sun = useMemo(() => new Vector3(...SUN_DIRECTION).normalize().multiplyScalar(120), []);
  const animate = !reduced;
  const high = quality === "high";
  const budget = BUDGET[quality];
  const first = ISLANDS[0];

  return (
    <Canvas
      dpr={high ? [1, 1.5] : 1}
      frameloop={animate ? "always" : "demand"}
      // Sem pós-processamento (celular) o MSAA nativo é o antisserrilhado.
      gl={{ antialias: constrained, powerPreference: "high-performance", toneMapping: NeutralToneMapping }}
      camera={{
        fov: 38,
        near: 0.5,
        far: 1400,
        position: [first.center[0] + first.camera[0], first.center[1] + first.camera[1], first.center[2] + first.camera[2]],
      }}
      style={{ pointerEvents: "none" }}
    >
      <fogExp2 attach="fog" args={[palette.fog, 0.0105]} />
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, 1.5]} />
      <directionalLight position={sun} color={palette.sun} intensity={3.2} />
      <directionalLight position={[-40, 50, 90]} color={palette.tokens.neblina} intensity={0.7} />

      <Sky />
      <Archipelago animate={animate} />
      <EarthBlocks count={budget.blocks} animate={animate} />
      <Dust count={budget.dust} animate={animate} />
      <CameraRig animate={animate} />

      {animate && (
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setQuality("low")}
          onIncline={() => {
            if (!constrained) setQuality("high");
          }}
          onFallback={() => setQuality("low")}
        />
      )}
      {high && <Effects />}
    </Canvas>
  );
}
