"use client";

import { useEffect, useRef, useState } from "react";
import { STOP_IDS } from "@/lib/stops";
import { useStageStore } from "@/lib/store";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * Torrões que saem do vídeo, por cima da mídia e por baixo do texto (lib/clods/scene.ts).
 * O three só baixa depois do preloader, para não disputar com o texto e o primeiro clipe.
 * Sem WebGL ou com movimento reduzido, não aparecem.
 */
export function FloatingClods() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const revealed = useStageStore((s) => s.revealed);
  const reduced = usePrefersReducedMotion();
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!revealed || reduced || !canvas.current) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;

    import("@/lib/clods/scene")
      .then(({ createClods }) => {
        if (cancelled || !canvas.current) return;
        const styles = getComputedStyle(document.documentElement);
        const token = (name: string) => styles.getPropertyValue(`--${name}`).trim();
        const narrow = window.matchMedia("(max-aspect-ratio: 1/1)").matches;
        dispose = createClods({
          canvas: canvas.current,
          count: narrow ? 9 : 18,
          narrow,
          colors: { soil: token("terra-roxa"), dark: token("solo-fundo"), dust: token("poeira") },
          getStop: () => useStageStore.getState().stop,
          lastStop: STOP_IDS.length - 1,
        }).dispose;
        setRunning(true);
      })
      .catch(() => {
        // Sem WebGL: a página segue só com os vídeos.
      });

    return () => {
      cancelled = true;
      dispose?.();
      setRunning(false);
    };
  }, [revealed, reduced]);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[5] h-full w-full transition-opacity duration-[1600ms] ease-out ${
        running ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
