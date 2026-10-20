"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type BufferGeometry, type Group, type InstancedMesh, type Material, MeshStandardMaterial, Object3D } from "three";
import { useSceneStore } from "@/lib/store";
import { createIsland, type IslandData, type IslandProp } from "@/lib/scene/islandGeometry";
import { provideIsland, startIslandWorker, useIslandSource } from "@/lib/scene/islandSource";
import { toGeometry } from "@/lib/scene/meshData";
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
  data: IslandData;
  material: Material;
  propGeometries: PropGeometries;
  animate: boolean;
}

function Island({ spec, data, material, propGeometries, animate }: IslandProps) {
  const group = useRef<Group>(null);
  // Os arrays chegam prontos (do worker); aqui só viram BufferGeometry, o que é barato.
  const parts = useMemo(
    () => ({ body: toGeometry(data.body), roots: toGeometry(data.roots), water: data.water && toGeometry(data.water) }),
    [data],
  );
  const propsByKind = useMemo(
    () => PROP_KINDS.map((kind) => ({ kind, props: data.props.filter((prop) => prop.kind === kind) })),
    [data],
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
 * As ilhas: uma para o hero e uma para cada serviço. São geradas no worker
 * (islandSource.ts) e entram aqui conforme ficam prontas; a cena só aparece com todas
 * montadas (o preloader fecha em 100%).
 */
export function Archipelago({ animate }: { animate: boolean }) {
  const islands = useIslandSource((s) => s.islands);
  const failed = useIslandSource((s) => s.failed);
  const ready = islands.filter(Boolean).length;

  // O SceneRoot já iniciou o worker ao hidratar; aqui é só garantia.
  useEffect(() => startIslandWorker(), []);

  // Reserva sem worker: gera o que faltar aqui mesmo, uma ilha por tarefa.
  useEffect(() => {
    if (!failed) return;
    const missing = ISLANDS.findIndex((_, i) => !islands[i]);
    if (missing < 0) return;
    const id = window.setTimeout(() => provideIsland(missing, createIsland(ISLANDS[missing], getScenePalette())), 0);
    return () => window.clearTimeout(id);
  }, [failed, islands]);

  useEffect(() => {
    if (ready === ISLANDS.length) useSceneStore.getState().setLoad(1);
  }, [ready]);

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
      {ISLANDS.map((spec, i) => {
        const data = islands[i];
        return (
          data && (
            <Island
              key={spec.id}
              spec={spec}
              data={data}
              material={material}
              propGeometries={propGeometries}
              animate={animate}
            />
          )
        );
      })}
    </>
  );
}
