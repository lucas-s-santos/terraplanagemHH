"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type Group, type Material, MeshStandardMaterial } from "three";
import { createIslandGeometry } from "@/lib/scene/islandGeometry";
import { getScenePalette } from "@/lib/scene/palette";
import { ISLANDS, type IslandSpec } from "@/lib/scene/world";

interface IslandProps {
  spec: IslandSpec;
  material: Material;
  animate: boolean;
}

function Island({ spec, material, animate }: IslandProps) {
  const group = useRef<Group>(null);
  const geometry = useMemo(() => createIslandGeometry(spec, getScenePalette()), [spec]);
  const phase = spec.seed * 0.37;

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    if (!animate || !group.current) return;
    group.current.position.y = spec.center[1] + Math.sin(clock.elapsedTime * 0.35 + phase) * 0.35;
  });

  return (
    <group ref={group} position={spec.center}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

/** As ilhas: uma para o hero e uma para cada serviço. */
export function Archipelago({ animate }: { animate: boolean }) {
  const material = useMemo(
    () => new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <>
      {ISLANDS.map((spec) => (
        <Island key={spec.id} spec={spec} material={material} animate={animate} />
      ))}
    </>
  );
}
