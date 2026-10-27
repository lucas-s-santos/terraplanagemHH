"use client";

import { useEffect, useRef, useState } from "react";
import { useStageStore } from "@/lib/store";

/** Acima disto o clipe seguinte já cobre o hero (crossfade da MediaStage): a cena pausa. */
const HIDDEN_FROM_STOP = 0.66;

/**
 * A retroescavadeira 3D do hero (lib/backhoe/), na camada de mídia, por cima da foto de fundo.
 * O three baixa depois da hidratação; o preloader espera o primeiro quadro. Sem WebGL, fica a foto.
 */
export function BackhoeStage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "on" | "off">("idle");

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const { setLoad } = useStageStore.getState();
    let scene: { start: () => void; setRunning: (on: boolean) => void; dispose: () => void } | null = null;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    import("@/lib/backhoe/scene")
      .then(({ createBackhoeScene }) => {
        if (cancelled) return;
        setLoad(0.6);
        const styles = getComputedStyle(document.documentElement);
        const token = (name: string) => styles.getPropertyValue(`--${name}`).trim();
        const created = createBackhoeScene({
          canvas: el,
          colors: {
            yellow: token("amarelo-maquina"),
            soil: token("terra-roxa"),
            dark: token("solo-fundo"),
            dust: token("poeira"),
          },
          // Lido na hora (não pelo hook): na hidratação o hook ainda diz "false".
          still: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          getStop: () => useStageStore.getState().stop,
        });
        scene = created;
        setState("on");
        void created.ready.then(() => setLoad(1));
        const sync = ({ stop, revealed }: { stop: number; revealed: boolean }) => {
          created.setRunning(stop < HIDDEN_FROM_STOP);
          if (revealed) created.start();
        };
        sync(useStageStore.getState());
        unsubscribe = useStageStore.subscribe(sync);
      })
      .catch(() => {
        setState("off");
        setLoad(1);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
      scene?.dispose();
    };
  }, []);

  if (state === "off") return null;
  return <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 block h-full w-full" />;
}
