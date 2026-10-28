"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { site } from "@/content/site";
import { useStageStore } from "@/lib/store";

/**
 * A logo 3D do hero (lib/logo/scene.ts), para pegar e girar. O three só baixa depois que o vídeo
 * do hero entrou (fim do preloader), num momento ocioso: carregar e montar a cena junto com a
 * página disputava a CPU com a hidratação (TBT de 5 s no Lighthouse). Só desenha com o hero na
 * tela. Sem placa de vídeo (ou sem WebGL), fica a mesma logo em SVG, parada.
 */
export function HeroLogo({ className }: { className: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "on" | "flat">("idle");
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
          return createLogoScene({
            canvas: el,
            colors: { yellow: token("amarelo-maquina") },
            // Lido na hora (não pelo hook): na hidratação o hook ainda diz "false".
            still: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            onGrab: () => setHint(false),
          });
        })
        .then((created) => {
          if (cancelled) {
            created?.dispose();
            return;
          }
          // Sem placa de vídeo: a cena não se monta e fica a logo em SVG.
          if (!created) {
            setState("flat");
            return;
          }
          scene = created;
          created.setVisible(visible);
          // Só aparece com os shaders compilados (sem travar a página).
          return created.ready.then(() => {
            if (cancelled) return;
            created.reveal();
            setState("on");
            setHint(true);
          });
        })
        .catch(() => setState("flat"));

    // Depois do vídeo entrar e da primeira pintura da página, num momento ocioso (o Safari não tem
    // requestIdleCallback: lá, um pouco depois). Criar o primeiro WebGL liga o processo da GPU e trava;
    // num navegador frio o vídeo podia entrar antes da primeira pintura, e a montagem atrasava o texto.
    const begin = () => {
      if (!cancelled) void start();
    };
    const hasIdle = "requestIdleCallback" in window;
    let handle = 0;
    let paintObserver: PerformanceObserver | undefined;
    const whenIdle = () => {
      handle = hasIdle ? window.requestIdleCallback(begin, { timeout: 1500 }) : window.setTimeout(begin, 300);
    };
    const schedule = () => {
      if (performance.getEntriesByName("first-contentful-paint").length > 0 || !("PerformanceObserver" in window)) {
        whenIdle();
        return;
      }
      paintObserver = new PerformanceObserver((list) => {
        if (list.getEntriesByName("first-contentful-paint").length === 0) return;
        paintObserver?.disconnect();
        whenIdle();
      });
      paintObserver.observe({ type: "paint", buffered: true });
    };
    if (useStageStore.getState().revealed) schedule();
    else
      unsubscribe = useStageStore.subscribe((state, previous) => {
        if (!state.revealed || previous.revealed) return;
        unsubscribe?.();
        unsubscribe = undefined;
        schedule();
      });
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      scene?.setVisible(visible);
    });
    onScreen.observe(el);

    return () => {
      cancelled = true;
      paintObserver?.disconnect();
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      onScreen.disconnect();
      unsubscribe?.();
      scene?.dispose();
    };
  }, []);

  return (
    <div aria-hidden="true" className={className}>
      {state === "flat" ? (
        <div className="flex h-full items-center justify-center">
          <Logo nome={false} decorativa className="logo-plana" />
        </div>
      ) : (
        <>
          <canvas
            ref={canvas}
            className={`logo-3d block h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${state === "on" ? "opacity-100" : "opacity-0"}`}
          />
          <span data-visivel={hint} className="dica-girar">
            {site.logo.dicaGirar}
          </span>
        </>
      )}
    </div>
  );
}
