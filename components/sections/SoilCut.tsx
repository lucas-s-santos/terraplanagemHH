"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * O bloco de terra 3D de "Como trabalhamos" (lib/soil/scene.ts). O three só baixa quando a
 * seção se aproxima da tela e só desenha enquanto ela está visível. Sem WebGL, some.
 */
export function SoilCut({ progress }: { progress: RefObject<number> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<"idle" | "on" | "off">("idle");

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let scene: { setRunning: (on: boolean) => void; dispose: () => void } | null = null;
    let visible = false;
    let cancelled = false;

    const start = () =>
      import("@/lib/soil/scene")
        .then(({ createSoilCut }) => {
          if (cancelled) return;
          const styles = getComputedStyle(document.documentElement);
          const token = (name: string) => styles.getPropertyValue(`--${name}`).trim();
          scene = createSoilCut({
            canvas: el,
            colors: {
              soil: token("terra-roxa"),
              dark: token("solo-fundo"),
              dust: token("poeira"),
              grass: token("pasto"),
              yellow: token("amarelo-maquina"),
            },
            getProgress: () => progress.current ?? 0,
            still: reduced,
          });
          scene.setRunning(visible);
          setState("on");
        })
        .catch(() => setState("off"));

    // Baixa um pouco antes de aparecer; desenha só enquanto aparece.
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !scene) {
          near.disconnect();
          void start();
        }
      },
      { rootMargin: "100% 0px" },
    );
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      scene?.setRunning(visible);
    });
    near.observe(el);
    onScreen.observe(el);

    return () => {
      cancelled = true;
      near.disconnect();
      onScreen.disconnect();
      scene?.dispose();
    };
  }, [progress, reduced]);

  if (state === "off") return null;
  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className={`block h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${state === "on" ? "opacity-100" : "opacity-0"}`}
    />
  );
}
