"use client";

import { useId, useRef } from "react";
import { site } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { SoilCut } from "./SoilCut";

const LENGTH = 1000;
const THICK = 40;

/** A linha de nível em pé: ondulada no começo, reta no fim (o terreno ao longo do serviço). */
function levelPath() {
  let d = "";
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const wave = (1 - t) ** 1.4 * (9 * Math.sin(t * 19 + 0.6) + 4 * Math.sin(t * 47 + 1.7));
    d += `${i === 0 ? "M" : "L"}${(THICK / 2 + wave).toFixed(2)} ${(t * LENGTH).toFixed(1)}`;
  }
  return d;
}

function LevelLine({ className }: { className: string }) {
  const clipId = `nivel-${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg viewBox={`0 0 ${THICK} ${LENGTH}`} preserveAspectRatio="none" aria-hidden="true" className={className} fill="none">
      <clipPath id={clipId}>
        <rect data-revelar-linha x={0} y={0} width={THICK} height={LENGTH} />
      </clipPath>
      <path
        d={levelPath()}
        clipPath={`url(#${clipId})`}
        stroke="var(--poeira)"
        strokeOpacity={0.55}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Como trabalhamos: a sequência real do serviço (por isso numerada), do contato à entrega.
 * Ao lado (no celular, em cima) um bloco de terra 3D acompanha as etapas: as estacas do
 * gabarito sobem na visita técnica e a frente de corte nivela o terreno até a entrega.
 */
export function Process() {
  const { processo } = site;
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        progress.current = 1;
        return;
      }
      const steps = gsap.utils.toArray<HTMLElement>("[data-etapa]", root.current);
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-etapas]",
          start: "top 45%",
          end: "bottom 65%",
          scrub: 0.6,
          onUpdate: (self) => {
            progress.current = self.progress;
          },
        },
      });
      // A linha se desenha e cada etapa acende quando ela chega na sua estaca.
      timeline.fromTo("[data-revelar-linha]", { attr: { height: 0 } }, { attr: { height: LENGTH }, ease: "none", duration: 1 }, 0);
      steps.forEach((step, i) => {
        timeline.fromTo(step, { opacity: 0.25 }, { opacity: 1, ease: "none", duration: 0.1 }, (i + 0.35) / steps.length - 0.05);
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-regua={processo.titulo}
      aria-labelledby="processo-titulo"
      className="mx-auto w-full max-w-(--max-conteudo) px-(--gutter) py-[14svh]"
    >
      <h2 id="processo-titulo" className="titulo-secao text-[clamp(2rem,3.4vw,3.1rem)]">
        {processo.titulo}
      </h2>

      <div data-etapas className="mt-10 grid md:mt-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-16">
        {/* O bloco 3D fica preso na tela enquanto as etapas passam. Sem WebGL, a caixa some. */}
        <div className="sticky top-0 z-10 -mx-(--gutter) h-[38svh] self-start bg-linear-to-b from-solo-fundo from-80% to-transparent not-has-[canvas]:hidden md:top-[14svh] md:order-2 md:mx-0 md:h-[72svh] md:bg-none">
          <SoilCut progress={progress} />
        </div>

        <div className="relative md:order-1">
          <LevelLine className="absolute top-0 left-0 h-full w-10" />
          <ol className="pl-14">
            {processo.etapas.map((etapa, i) => (
              <li key={etapa.nome} data-etapa className="relative flex min-h-[30svh] flex-col justify-center md:min-h-[42svh]">
                {/* Estaca da etapa na linha */}
                <span aria-hidden="true" className="absolute top-1/2 -left-[2.3rem] mt-[-1.6rem] h-6 w-[2px] bg-poeira" />
                <span aria-hidden="true" className="block text-[2.6rem] leading-none font-bold text-poeira/45 [font-stretch:125%]">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-xl font-bold [font-stretch:108%]">{etapa.nome}</h3>
                <p className="mt-2 max-w-[34ch] leading-relaxed text-poeira/75">{etapa.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
