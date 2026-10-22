"use client";

import { useId, useRef } from "react";
import { site } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";

const LENGTH = 1000;
const THICK = 40;

/** A linha de nível: ondulada no começo, reta no fim (o terreno ao longo do serviço). */
function levelPath(vertical: boolean) {
  let d = "";
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const wave = (1 - t) ** 1.4 * (9 * Math.sin(t * 19 + 0.6) + 4 * Math.sin(t * 47 + 1.7));
    const along = (t * LENGTH).toFixed(1);
    const side = (THICK / 2 + wave).toFixed(2);
    d += `${i === 0 ? "M" : "L"}${vertical ? `${side} ${along}` : `${along} ${side}`}`;
  }
  return d;
}

interface LevelLineProps {
  vertical: boolean;
  steps: number;
  className: string;
}

function LevelLine({ vertical, steps, className }: LevelLineProps) {
  const clipId = `nivel-${useId().replace(/[^\w-]/g, "")}`;
  const box = vertical ? `0 0 ${THICK} ${LENGTH}` : `0 0 ${LENGTH} ${THICK}`;
  return (
    <svg viewBox={box} preserveAspectRatio="none" aria-hidden="true" className={className} fill="none">
      <clipPath id={clipId}>
        <rect
          data-revelar-linha
          x={0}
          y={0}
          width={vertical ? THICK : LENGTH}
          height={vertical ? LENGTH : THICK}
        />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path d={levelPath(vertical)} stroke="var(--poeira)" strokeOpacity={0.55} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        {/* Estacas do gabarito, uma por etapa, alinhadas com o número (só na linha deitada; em pé, cada etapa tem a sua) */}
        {!vertical &&
          Array.from({ length: steps }, (_, i) => {
            const x = (i / steps) * LENGTH + 3;
            return (
              <line key={i} x1={x} x2={x} y1={THICK / 2 - 11} y2={THICK / 2 + 11} stroke="var(--poeira)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            );
          })}
      </g>
    </svg>
  );
}

/** Como trabalhamos: a sequência real do serviço (por isso numerada), do contato à entrega. */
export function Process() {
  const { processo } = site;
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const steps = gsap.utils.toArray<HTMLElement>("[data-etapa]", root.current);
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: "[data-etapas]", start: "top 75%", end: "bottom 55%", scrub: 0.6 },
      });
      // A linha se desenha e cada etapa acende quando ela chega na sua estaca.
      gsap.utils.toArray<SVGRectElement>("[data-revelar-linha]", root.current).forEach((rect) => {
        const vertical = rect.getAttribute("height") === String(LENGTH);
        timeline.fromTo(rect, { attr: vertical ? { height: 0 } : { width: 0 } }, { attr: vertical ? { height: LENGTH } : { width: LENGTH }, ease: "none", duration: 1 }, 0);
      });
      steps.forEach((step, i) => {
        timeline.fromTo(step, { opacity: 0.25 }, { opacity: 1, ease: "none", duration: 0.12 }, (i + 0.5) / steps.length - 0.08);
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-regua={processo.titulo} aria-labelledby="processo-titulo" className="mx-auto w-full max-w-(--max-conteudo) px-(--gutter) py-[16svh]">
      <h2 id="processo-titulo" className="titulo-secao text-[clamp(2rem,3.4vw,3.1rem)]">
        {processo.titulo}
      </h2>

      <div data-etapas className="relative mt-14 md:mt-20">
        <LevelLine vertical={false} steps={processo.etapas.length} className="hidden h-10 w-full md:block" />
        <LevelLine vertical steps={processo.etapas.length} className="absolute top-0 left-0 h-full w-10 md:hidden" />

        <ol className="grid gap-12 pl-14 md:mt-8 md:grid-cols-5 md:gap-8 md:pl-0">
          {processo.etapas.map((etapa, i) => (
            <li key={etapa.nome} data-etapa className="relative">
              {/* Estaca da etapa na linha em pé (celular) */}
              <span aria-hidden="true" className="absolute top-2 -left-[2.3rem] h-6 w-[2px] bg-poeira md:hidden" />
              <span aria-hidden="true" className="block text-[2.6rem] leading-none font-bold text-poeira/45 [font-stretch:125%]">
                {i + 1}
              </span>
              <h3 className="mt-3 text-xl font-bold [font-stretch:108%]">{etapa.nome}</h3>
              <p className="mt-2 max-w-[30ch] leading-relaxed text-poeira/75">{etapa.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
