"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";

const GRAINS = 18;
/** Um sopro por entrada do mouse, no máximo a cada tanto. */
const COOLDOWN_MS = 450;

/**
 * Poeira no hover: ao entrar com o mouse num elemento com [data-poeira] (os botões do
 * WhatsApp), grãos de terra saem pela base e se espalham para os lados, se desfazendo.
 * Só com mouse e sem movimento reduzido. Um listener para a página toda.
 */
export function DustOnHover() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const last = new WeakMap<Element, number>();

    const burst = (target: HTMLElement) => {
      const now = performance.now();
      if (now - (last.get(target) ?? 0) < COOLDOWN_MS) return;
      last.set(target, now);

      // Nuvem de poeira que se abre na base do botão.
      const cloud = document.createElement("span");
      cloud.className = "nuvem-poeira";
      cloud.setAttribute("aria-hidden", "true");
      target.appendChild(cloud);
      gsap.fromTo(
        cloud,
        { scaleX: 0.55, scaleY: 0.6, opacity: 1 },
        { scaleX: 1.4, scaleY: 1.7, opacity: 0, duration: 1.4, ease: "power1.out", onComplete: () => cloud.remove() },
      );

      for (let i = 0; i < GRAINS; i++) {
        const grain = document.createElement("span");
        grain.className = "grao";
        grain.setAttribute("aria-hidden", "true");
        const size = gsap.utils.random(4, 10);
        const at = gsap.utils.random(4, 96);
        grain.style.width = grain.style.height = `${size}px`;
        grain.style.left = `${at}%`;
        if (i % 3 === 0) grain.dataset.tom = "escuro";
        target.appendChild(grain);
        // Saem pela base do botão e se espalham para o lado em que estão; os das pontas sobem um pouco.
        const side = (at - 50) / 50;
        const duration = gsap.utils.random(1.1, 1.7);
        // O movimento desacelera logo; a cor some só no fim (senão o grão apaga antes de ser visto).
        gsap.fromTo(
          grain,
          { x: 0, y: 0, scale: 1 },
          {
            x: side * gsap.utils.random(26, 64) + gsap.utils.random(-8, 8),
            y: gsap.utils.random(6, 24) - Math.abs(side) * gsap.utils.random(12, 30),
            scale: gsap.utils.random(0.4, 0.75),
            duration,
            ease: "power3.out",
          },
        );
        gsap.fromTo(grain, { opacity: 1 }, { opacity: 0, duration, ease: "power2.in", onComplete: () => grain.remove() });
      }
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>("[data-poeira]");
      // Só na entrada: vindo de fora do elemento.
      if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
      burst(target);
    };

    document.addEventListener("pointerover", onOver, { passive: true });
    return () => document.removeEventListener("pointerover", onOver);
  }, []);

  return null;
}
