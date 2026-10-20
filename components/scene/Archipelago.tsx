"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { type BufferGeometry, type Group, type InstancedMesh, type Material, MeshStandardMaterial, Object3D } from "three";
import { useSceneStore } from "@/lib/store";
import { createIsland, type IslandProp } from "@/lib/scene/islandGeometry";
import { getScenePalette } from "@/lib/scene/palette";
import { PROP_KINDS, type PropKind, createPropGeometry } from "@/lib/scene/propGeometry";
import { ISLANDS, type IslandSpec } from "@/lib/scene/world";
import { Water } from "./Water";

type PropGeometries = Record<PropKind, BufferGeometry>;

interface PropInstancesProps {
  props: readonly IslandProp[];
  geometry: BufferGeometry;
  material: Material;
}

/** Objetos de um tipo sobre uma ilha (tocos, torrões, estacas): posições fixas, definidas uma vez. */
function PropInstances({ props, geometry, material }: PropInstancesProps) {
  const mesh = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new Object3D();
    dummy.rotation.order = "YXZ";
    props.forEach((prop, i) => {
      dummy.position.set(...prop.position);
      dummy.rotation.set(...prop.rotation);
      dummy.scale.set(...prop.scale);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [props]);

  return <instancedMesh ref={mesh} args={[geometry, material, props.length]} />;
}

interface IslandProps {
  spec: IslandSpec;
  material: Material;
  propGeometries: PropGeometries;
  animate: boolean;
}

function Island({ spec, material, propGeometries, animate }: IslandProps) {
  const group = useRef<Group>(null);
  const parts = useMemo(() => createIsland(spec, getScenePalette()), [spec]);
  const propsByKind = useMemo(
    () => PROP_KINDS.map((kind) => ({ kind, props: parts.props.filter((prop) => prop.kind === kind) })),
    [parts],
  );
  const phase = spec.seed * 0.37;

  useEffect(
    () => () => {
      parts.body.dispose();
      parts.roots.dispose();
      parts.water?.dispose();
    },
    [parts],
  );

  useFrame(({ clock }) => {
    if (!animate || !group.current) return;
    group.current.position.y = spec.center[1] + Math.sin(clock.elapsedTime * 0.35 + phase) * 0.35;
  });

  return (
    <group ref={group} position={spec.center}>
      <mesh geometry={parts.body} material={material} />
      <mesh geometry={parts.roots} material={material} />
      {propsByKind.map(
        ({ kind, props }) =>
          props.length > 0 && (
            <PropInstances key={kind} props={props} geometry={propGeometries[kind]} material={material} />
          ),
      )}
      {parts.water && <Water geometry={parts.water} animate={animate} />}
    </group>
  );
}

/**
 * As ilhas: uma para o hero e uma para cada serviço.
 * Cada ilha custa dezenas de ms para gerar; elas entram uma por tarefa, na ordem do voo,
 * para a abertura não virar uma tarefa longa só. É esse avanço que o preloader mostra
 * (de 30% a 100%), e a cena só aparece com todas prontas.
 */
export function Archipelago({ animate }: { animate: boolean }) {
  const [mounted, setMounted] = useState(1);

  useEffect(() => {
    useSceneStore.getState().setLoad(0.3 + (0.7 * mounted) / ISLANDS.length);
    if (mounted >= ISLANDS.length) return;
    const id = window.setTimeout(() => setMounted((n) => n + 1), 0);
    return () => window.clearTimeout(id);
  }, [mounted]);

  const material = useMemo(
    () => new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }),
    [],
  );
  const propGeometries = useMemo(() => {
    const palette = getScenePalette();
    return Object.fromEntries(PROP_KINDS.map((kind) => [kind, createPropGeometry(kind, palette)])) as PropGeometries;
  }, []);

  useEffect(
    () => () => {
      material.dispose();
      Object.values(propGeometries).forEach((geometry) => geometry.dispose());
    },
    [material, propGeometries],
  );

  return (
    <>
      {ISLANDS.slice(0, mounted).map((spec) => (
        <Island key={spec.id} spec={spec} material={material} propGeometries={propGeometries} animate={animate} />
      ))}
    </>
  );
}
