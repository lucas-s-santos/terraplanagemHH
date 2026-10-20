"use client";

import { useId, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { smoothstep } from "@/lib/math";
import { useStageStore } from "@/lib/store";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const WIDTH = 400;
const HEIGHT = 80;
const BASE = 30;
const POINTS = 64;
/** A linha do terreno e duas curvas de nível mais fracas abaixo dela. */
const CONTOURS = [
  { drop: 0, amplitude: 1, opacity: 0.62 },
  { drop: 13, amplitude: 0.68, opacity: 0.26 },
  { drop: 26, amplitude: 0.42, opacity: 0.12 },
] as const;
/** Largura da transição atrás da lâmina, em fração da linha. */
const BLADE = 0.12;
/** Se o vídeo travar, o preloader sai mesmo assim e fica o fundo de terra. */
const GIVE_UP_MS = 15000;

/** Perfil fixo (igual no servidor e no cliente): morros, um corte e cascalho, preso nas pontas. */
function relief(t: number) {
  const ends = Math.sin(Math.PI * t) ** 0.6;
  return ends * (0.6 * Math.sin(t * 5.2 + 0.7) + 0.28 * Math.sin(t * 12.1 + 2.3) + 0.12 * Math.sin(t * 29.3 + 0.4));
}

/** A lâmina anda da esquerda para a direita com o carregamento; atrás dela, o terreno fica plano. */
function bladePosition(level: number) {
  return level * (1 + BLADE);
}

function terrainPath(level: number, contour: (typeof CONTOURS)[number]) {
  const blade = bladePosition(level);
  const amplitude = 22 * contour.amplitude * (1 - 0.35 * level);
  let d = "";
  for (let i = 0; i <= POINTS; i++) {
    const t = i / POINTS;
    const y = BASE + contour.drop - relief(t) * amplitude * smoothstep(blade - BLADE, blade, t);
    d += `${i === 0 ? "M" : "L"}${(t * WIDTH).toFixed(1)} ${y.toFixed(2)}`;
  }
  return d;
}

/**
 * Preloader "nivelamento": uma linha de terreno aplainada por uma lâmina conforme o
 * primeiro clipe carrega de verdade (store.load). Em 100% o vídeo entra.
 * Fica na camada de mídia: o texto do hero pinta antes e por cima.
 */
export function Preloader() {
  const root = useRef<SVGSVGElement>(null);
  const reduced = usePrefersReducedMotion();
  // O id do React tem caracteres que atrapalham o url(#...).
  const clipId = `nivelamento-${useId().replace(/[^\w-]/g, "")}`;

  useGSAP(
    () => {
      const svg = root.current;
      if (!svg) return;
      if (useStageStore.getState().revealed) {
        gsap.set(svg, { autoAlpha: 0 });
        return;
      }
      const lines = gsap.utils.toArray<SVGPathElement>("[data-curva]", svg);
      const blade = svg.querySelector<SVGLineElement>("[data-lamina]");
      const reveal = svg.querySelector<SVGRectElement>("[data-revelar]");
      const shown = { level: 0 };

      const draw = () => {
        lines.forEach((line, i) => line.setAttribute("d", terrainPath(shown.level, CONTOURS[i])));
        const x = (Math.min(Math.max(bladePosition(shown.level) - BLADE / 2, 0), 1) * WIDTH).toFixed(1);
        blade?.setAttribute("x1", x);
        blade?.setAttribute("x2", x);
      };

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        useStageStore.getState().reveal();
        gsap.to(svg, { autoAlpha: 0, duration: reduced ? 0 : 0.8, ease: "power1.out" });
      };
      const settle = () => {
        if (useStageStore.getState().load >= 1) finish();
      };

      // A linha se desenha da esquerda para a direita ao aparecer. (Recorte, não tracejado:
      // com non-scaling-stroke o Chrome mede o tracejado em pixels e a linha sai cortada.)
      if (reveal) gsap.to(reveal, { attr: { width: WIDTH + 8 }, duration: reduced ? 0 : 0.9, ease: "power2.inOut" });
      if (blade) gsap.to(blade, { opacity: 1, duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.3 });

      const toLevel = reduced
        ? (level: number) => {
            shown.level = level;
            draw();
            settle();
          }
        : gsap.quickTo(shown, "level", { duration: 0.9, ease: "power2.out", onUpdate: draw, onComplete: settle });

      toLevel(useStageStore.getState().load);
      const unsubscribe = useStageStore.subscribe((state, previous) => {
        if (state.load !== previous.load) toLevel(state.load);
      });
      const giveUp = window.setTimeout(finish, GIVE_UP_MS);

      return () => {
        unsubscribe();
        window.clearTimeout(giveUp);
      };
    },
    { dependencies: [reduced], scope: root },
  );

  return (
    <svg ref={root} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="nivelamento" fill="none">
      <clipPath id={clipId}>
        <rect data-revelar x={-4} y={-HEIGHT} width={0} height={HEIGHT * 3} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {CONTOURS.map((contour, i) => (
          <path
            key={contour.drop}
            data-curva
            d={terrainPath(0, contour)}
            stroke="var(--poeira)"
            strokeOpacity={contour.opacity}
            strokeWidth={i === 0 ? 1.5 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      <line
        data-lamina
        x1={0}
        x2={0}
        y1={BASE - 10}
        y2={BASE + 4}
        opacity={0}
        stroke="var(--amarelo-maquina)"
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
