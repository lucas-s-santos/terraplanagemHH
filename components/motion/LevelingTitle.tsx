"use client";

import { Fragment, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useStageStore } from "@/lib/store";

/** Desnível de cada palavra (fixo: igual no servidor e no cliente), em em e em graus. */
const unevenness = (i: number) => ({
  y: 0.075 * (0.65 * Math.sin(i * 1.9 + 0.4) + 0.35 * Math.sin(i * 4.3 + 1.2)),
  tilt: 1.6 * Math.sin(i * 2.7 + 0.9),
});

interface LevelingTitleProps {
  id: string;
  text: string;
  className: string;
}

/**
 * Título que nivela: as palavras começam desniveladas, como placas de terreno, e quando o
 * vídeo entra (store.revealed, fim do preloader) a lâmina passa da esquerda para a direita e
 * deixa todas na mesma linha. Só transform (sem layout shift); o texto pinta de primeira.
 * Com movimento reduzido, já começa nivelado. `\n` no texto marca as quebras de linha.
 */
export function LevelingTitle({ id, text, className }: LevelingTitleProps) {
  const root = useRef<HTMLHeadingElement>(null);
  const lines = text.split("\n").map((line) => line.split(" "));
  // O desnível segue a contagem das palavras no título inteiro, não por linha.
  const firstOfLine = lines.map((_, l) => lines.slice(0, l).reduce((total, line) => total + line.length, 0));

  useGSAP(
    () => {
      const parts = gsap.utils.toArray<HTMLElement>("[data-palavra]", root.current);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(parts, { "--desnivel": 0, "--inclinacao": 0 });
        return;
      }
      const level = () =>
        gsap.to(parts, {
          "--desnivel": 0,
          "--inclinacao": 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: { amount: 0.7 },
        });
      if (useStageStore.getState().revealed) {
        level();
        return;
      }
      return useStageStore.subscribe((state, previous) => {
        if (state.revealed && !previous.revealed) level();
      });
    },
    { scope: root },
  );

  return (
    <h1 ref={root} id={id} className={className} aria-label={text.replaceAll("\n", " ")}>
      {lines.map((words, l) => (
        <Fragment key={l}>
          {l > 0 && <br />}
          {words.map((word, w) => {
            const i = firstOfLine[l] + w;
            const { y, tilt } = unevenness(i);
            return (
              <span key={`${word}-${i}`} aria-hidden="true">
                <span
                  data-palavra
                  className="palavra-desnivel"
                  style={{ "--desnivel": y, "--inclinacao": tilt } as React.CSSProperties}
                >
                  {word}
                </span>
                {w < words.length - 1 && " "}
              </span>
            );
          })}
        </Fragment>
      ))}
    </h1>
  );
}
