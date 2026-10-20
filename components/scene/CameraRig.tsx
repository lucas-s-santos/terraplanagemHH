"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { CatmullRomCurve3, MathUtils, type PerspectiveCamera, Vector2, Vector3 } from "three";
import { useSceneStore } from "@/lib/store";
import { FRAMING, ISLANDS, LENS, islandFocus } from "@/lib/scene/world";

const Y_AXIS = new Vector3(0, 1, 0);
const YAW = MathUtils.degToRad(2.5);
const PITCH = MathUtils.degToRad(1.5);
/** Mergulho de entrada (quando o preloader termina): começa mais longe e mais alto e desce até a parada. */
const DIVE = { seconds: 2.4, distance: 0.9, rise: 20 };

/**
 * Voo da câmera: a parada atual (store) vira um ponto em duas curvas,
 * uma para a posição e outra para o alvo. Cada ilha é um ponto de controle.
 */
export function CameraRig({ animate }: { animate: boolean }) {
  const curves = useMemo(() => {
    const positions = ISLANDS.map((island) => new Vector3(...island.center).add(new Vector3(...island.camera)));
    const targets = ISLANDS.map((island) => new Vector3(...islandFocus(island)));
    return {
      position: new CatmullRomCurve3(positions, false, "centripetal"),
      target: new CatmullRomCurve3(targets, false, "centripetal"),
    };
  }, []);
  const narrowY = useMemo(() => ISLANDS.map((island) => island.narrowY ?? FRAMING.narrow.y), []);

  const rig = useMemo(
    () => ({
      position: new Vector3(),
      target: new Vector3(),
      desiredPosition: new Vector3(),
      desiredTarget: new Vector3(),
      offset: new Vector3(),
      right: new Vector3(),
      up: new Vector3(),
      look: new Vector3(),
      pointer: new Vector2(),
      smoothPointer: new Vector2(),
      ready: false,
      /** Progresso do mergulho de entrada, 0 a 1. */
      intro: 0,
    }),
    [],
  );

  // Parallax só com mouse; no toque não faz nada.
  useEffect(() => {
    if (!animate) return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      rig.pointer.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [animate, rig]);

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const wide = MathUtils.smoothstep(state.size.width / state.size.height, 0.75, 1.15);

    const fov = MathUtils.lerp(LENS.narrow.fov, LENS.wide.fov, wide);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    const scene = useSceneStore.getState();
    const stop = animate ? scene.stop : 0;
    // Passo limitado: a geração das ilhas pode travar alguns quadros e o mergulho não deve pular.
    if (animate && scene.revealed && rig.intro < 1) rig.intro = Math.min(rig.intro + Math.min(delta, 1 / 30) / DIVE.seconds, 1);
    const dive = animate ? (1 - rig.intro) ** 3 : 0;
    const t = MathUtils.clamp(stop / (ISLANDS.length - 1), 0, 1);
    const from = Math.floor(stop);
    const stopNarrowY = MathUtils.lerp(narrowY[from] ?? 0, narrowY[from + 1] ?? narrowY[from] ?? 0, stop - from);

    const distanceScale = MathUtils.lerp(LENS.narrow.distance, LENS.wide.distance, wide);
    const frameX = MathUtils.lerp(FRAMING.narrow.x, FRAMING.wide.x, wide);
    const frameY = MathUtils.lerp(stopNarrowY, FRAMING.wide.y, wide);
    curves.position.getPoint(t, rig.desiredPosition);
    curves.target.getPoint(t, rig.desiredTarget);

    if (!animate || !rig.ready) {
      rig.position.copy(rig.desiredPosition);
      rig.target.copy(rig.desiredTarget);
      rig.ready = true;
    } else {
      easing.damp3(rig.position, rig.desiredPosition, 0.3, delta);
      easing.damp3(rig.target, rig.desiredTarget, 0.25, delta);
      easing.damp2(rig.smoothPointer, rig.pointer, 0.6, delta);
    }

    rig.offset.subVectors(rig.position, rig.target).multiplyScalar(distanceScale * (1 + DIVE.distance * dive));
    rig.offset.y += DIVE.rise * dive;
    if (animate) {
      rig.offset.applyAxisAngle(Y_AXIS, rig.smoothPointer.x * YAW);
      rig.right.crossVectors(Y_AXIS, rig.offset).normalize();
      rig.offset.applyAxisAngle(rig.right, rig.smoothPointer.y * PITCH);
    }

    camera.position.copy(rig.target).add(rig.offset);
    camera.lookAt(rig.target);

    // Enquadramento: desloca o ponto de mira para a ilha cair ao lado do texto.
    const distance = rig.offset.length();
    const tanV = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const tanH = tanV * camera.aspect;
    rig.right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    rig.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    rig.look
      .copy(rig.target)
      .addScaledVector(rig.right, -frameX * tanH * distance)
      .addScaledVector(rig.up, -frameY * tanV * distance);
    camera.lookAt(rig.look);
  });

  return null;
}
