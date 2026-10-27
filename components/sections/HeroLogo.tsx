"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { useStageStore } from "@/lib/store";

/**
 * A logo 3D do hero (lib/logo/scene.ts), para pegar e girar. O three baixa depois da hidratação,
 * num momento ocioso (o texto do hero é o LCP e pinta antes); a logo entra junto com o vídeo.
 * Só desenha com o hero na tela. Sem WebGL, some.
 */
export function HeroLogo({ className }: { className: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "on" | "off">("idle");
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let scene: { reveal: () => void; setVisible: (on: boolean) => void; dispose: () => void } | null = null;
    let unsubscribe: (() => void) | undefined;
    let visible = false;
    let cancelled = false;

    const start = () =>
      import("@/lib/logo/scene")
        .then(({ createLogoScene }) => {
          if (cancelled) return;
          const styles = getComputedStyle(document.documentElement);
          const token = (name: string) => styles.getPropertyValue(`--${name}`).trim();
          const created = createLogoScene({
            canvas: el,
            colors: { yellow: token("amarelo-maquina"), dark: token("solo-fundo"), soil: token("terra-roxa") },
            // Lido na hora (não pelo hook): na hidratação o hook ainda diz "false".
            still: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            onGrab: () => setHint(false),
          });
          scene = created;
          created.setVisible(visible);
          setState("on");
          const sync = ({ revealed }: { revealed: boolean }) => {
            if (!revealed) return;
            created.reveal();
            setHint(true);
          };
          sync(useStageStore.getState());
          unsubscribe = useStageStore.subscribe(sync);
        })
        .catch(() => setState("off"));

    // Num momento ocioso (o Safari não tem requestIdleCallback: lá, um pouco depois).
    const hasIdle = "requestIdleCallback" in window;
    const handle = hasIdle
      ? window.requestIdleCallback(() => void start(), { timeout: 2000 })
      : window.setTimeout(() => void start(), 300);
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      scene?.setVisible(visible);
    });
    onScreen.observe(el);

    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      onScreen.disconnect();
      unsubscribe?.();
      scene?.dispose();
    };
  }, []);

  if (state === "off") return null;
  return (
    <div aria-hidden="true" className={className}>
      <canvas
        ref={canvas}
        className={`logo-3d block h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${state === "on" ? "opacity-100" : "opacity-0"}`}
      />
      <span data-visivel={hint} className="dica-girar">
        {site.logo.dicaGirar}
      </span>
    </div>
  );
}
