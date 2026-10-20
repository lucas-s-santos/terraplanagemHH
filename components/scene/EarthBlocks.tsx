"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type InstancedMesh, MeshStandardMaterial, Object3D } from "three";
import { mulberry32, range } from "@/lib/random";
import { createBlockField } from "@/lib/scene/blockField";
import { BLOCK_VARIANTS, createBlockGeometry } from "@/lib/scene/blockGeometry";
import { getScenePalette } from "@/lib/scene/palette";

interface EarthBlocksProps {
  /** Quantos blocos ficam ativos (os mais importantes primeiro). */
  count: number;
  animate: boolean;
}

/** Blocos de terra procedurais: um InstancedMesh por variante. */
export function EarthBlocks({ count, animate }: EarthBlocksProps) {
  const field = useMemo(() => createBlockField(), []);
  const geometries = useMemo(
    () => BLOCK_VARIANTS.map((variant, i) => createBlockGeometry(variant, 11 + i * 7, getScenePalette())),
    [],
  );
  const material = useMemo(
    () => new MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 }),
    [],
  );
  const meshes = useRef<(InstancedMesh | null)[]>([]);
  const dummy = useMemo(() => new Object3D(), []);

  useEffect(
    () => () => {
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
    },
    [geometries, material],
  );

  // Variação de brilho por bloco, definida uma vez.
  useLayoutEffect(() => {
    const rand = mulberry32(5);
    const tint = new Color();
    for (const slot of field.slots) {
      meshes.current[slot.variant]?.setColorAt(slot.index, tint.setScalar(range(rand, 0.78, 1.12)));
    }
    meshes.current.forEach((mesh) => {
      if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [field]);

  const write = (time: number) => {
    const active = Math.min(count, field.slots.length);
    const used = BLOCK_VARIANTS.map(() => 0);

    for (let i = 0; i < active; i++) {
      const slot = field.slots[i];
      const mesh = meshes.current[slot.variant];
      if (!mesh) continue;
      const angle = slot.orbitAngle + slot.orbitSpeed * time;
      dummy.position.set(
        slot.pivot[0] + Math.cos(angle) * slot.orbitRadius,
        slot.pivot[1] + slot.height + Math.sin(time * 0.5 + slot.phase) * slot.bob,
        slot.pivot[2] + Math.sin(angle) * slot.orbitRadius,
      );
      dummy.rotation.set(
        slot.rotation[0] + slot.spin[0] * time,
        slot.rotation[1] + slot.spin[1] * time,
        slot.rotation[2] + slot.spin[2] * time,
      );
      dummy.scale.set(slot.scale[0], slot.scale[1], slot.scale[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(slot.index, dummy.matrix);
      used[slot.variant] = Math.max(used[slot.variant], slot.index + 1);
    }

    meshes.current.forEach((mesh, variant) => {
      if (!mesh) return;
      mesh.count = used[variant];
      mesh.instanceMatrix.needsUpdate = true;
    });
  };

  // Quadro inicial (e único, com movimento reduzido).
  useLayoutEffect(() => write(0));

  useFrame(({ clock }) => {
    if (animate) write(clock.elapsedTime);
  });

  return (
    <>
      {geometries.map((geometry, variant) => (
        <instancedMesh
          key={BLOCK_VARIANTS[variant]}
          ref={(mesh) => {
            meshes.current[variant] = mesh;
          }}
          args={[geometry, material, field.capacity[variant]]}
          frustumCulled={false}
        />
      ))}
    </>
  );
}
