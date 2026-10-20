"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { startIslandWorker } from "@/lib/scene/islandSource";
import { useSceneStore } from "@/lib/store";
import { Preloader } from "./Preloader";
import { SceneBoundary } from "./SceneBoundary";

// O three só carrega no cliente e depois do HTML: o texto do hero pinta primeiro.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

/** O único Canvas da página, fixo atrás de todas as seções, e o preloader no lugar da ilha. */
export function SceneRoot() {
  const revealed = useSceneStore((s) => s.revealed);

  // Página hidratada: primeiro passo do nivelamento, e as ilhas começam a ser geradas
  // no worker enquanto o three ainda baixa.
  useEffect(() => {
    useSceneStore.getState().setLoad(0.1);
    startIslandWorker();
  }, []);

  return (
    <div aria-hidden="true" className="ceu-reserva pointer-events-none fixed inset-0 z-0">
      <div
        className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out motion-reduce:transition-none ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
      >
        <SceneBoundary>
          <Scene />
        </SceneBoundary>
      </div>
      <Preloader />
    </div>
  );
}
