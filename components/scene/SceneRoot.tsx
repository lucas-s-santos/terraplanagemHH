"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { SceneBoundary } from "./SceneBoundary";

// O three só carrega no cliente e depois do HTML: o texto do hero pinta primeiro.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

/** O único Canvas da página, fixo atrás de todas as seções. */
export function SceneRoot() {
  const [ready, setReady] = useState(false);

  return (
    <div aria-hidden="true" className="ceu-reserva pointer-events-none fixed inset-0 z-0">
      <div
        className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out motion-reduce:transition-none ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      >
        <SceneBoundary>
          <Scene onReady={() => setReady(true)} />
        </SceneBoundary>
      </div>
    </div>
  );
}
