"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const W = 1000;
const H = 700;
const POINTS = 120;

interface Hill {
  cx: number;
  cy: number;
  levels: number;
  step: number;
  seed: number;
  /** Alongamento horizontal do morro. */
  stretch: number;
}

const LAYOUTS: Record<"painel" | "rodape", Hill[]> = {
  painel: [
    { cx: 760, cy: 300, levels: 11, step: 30, seed: 1.3, stretch: 1.35 },
    { cx: 140, cy: 640, levels: 6, step: 28, seed: 4.1, stretch: 1.2 },
  ],
  rodape: [{ cx: 820, cy: 520, levels: 9, step: 34, seed: 2.7, stretch: 1.5 }],
};

/**
 * Um anel de curva de nível. O raio varia com o ângulo por senos de frequência inteira
 * (o anel fecha sem emenda). A deformação comum a todos os anéis é proporcional ao raio
 * e a individual é menor que o espaçamento, então um anel nunca cruza o vizinho.
 */
function ring({ cx, cy, step, seed, stretch }: Hill, k: number) {
  let d = "";
  for (let i = 0; i < POINTS; i++) {
    const a = (i / POINTS) * Math.PI * 2;
    const shared = 0.55 * Math.sin(2 * a + seed) + 0.3 * Math.sin(3 * a + 2 * seed) + 0.15 * Math.sin(5 * a + 3 * seed);
    const own = 0.6 * Math.sin(4 * a + k * 0.9 + seed) + 0.4 * Math.sin(7 * a - k * 1.3);
    const r = (k + 1) * step * (1 + 0.25 * shared) + 0.3 * step * own;
    d += `${i === 0 ? "M" : "L"}${(cx + Math.cos(a) * r * stretch).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  return `${d}Z`;
}

/**
 * Curvas de nível: a linguagem da topografia como textura de fundo (painel de terra e rodapé).
 * Os anéis se desenham do centro do morro para fora conforme a seção entra na tela.
 * Uma a cada cinco é mais grossa, como nas cartas topográficas.
 */
export function ContourField({ layout }: { layout: keyof typeof LAYOUTS }) {
  const root = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const lines = gsap.utils.toArray<SVGPathElement>("path", root.current);
      // Sem JS (ou com movimento reduzido) as linhas já aparecem inteiras.
      gsap.set(lines, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.to(lines, {
        strokeDashoffset: 0,
        ease: "none",
        stagger: 0.08,
        scrollTrigger: { trigger: root.current?.parentElement, start: "top 85%", end: "center 40%", scrub: 0.8 },
      });
    },
    { scope: root },
  );

  return (
    <svg
      ref={root}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      fill="none"
      className="h-full w-full"
    >
      {LAYOUTS[layout].flatMap((hill, h) =>
        Array.from({ length: hill.levels }, (_, k) => (
          <path
            key={`${h}-${k}`}
            d={ring(hill, k)}
            pathLength={1}
            stroke="var(--poeira)"
            strokeOpacity={k % 5 === 4 ? 0.2 : 0.11}
            strokeWidth={k % 5 === 4 ? 1.6 : 1}
          />
        )),
      )}
    </svg>
  );
}
