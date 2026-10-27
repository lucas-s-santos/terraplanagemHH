"use client";

import Image from "next/image";
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { beforeAfter } from "@/content/media";
import { site } from "@/content/site";
import { gsap } from "@/lib/gsap";

const { antesDepois } = site;
/** Só os pares que já têm imagem (content/media.ts). */
const PAIRS = antesDepois.pares.flatMap((par) => {
  const images = beforeAfter[par.id];
  return images ? [{ ...par, ...images }] : [];
});
/** Onde a lâmina fica parada, e onde ela começa antes da entrada (quase tudo "antes"). */
const REST = 50;
const START = 8;
const SIZES = "(min-width: 90rem) 84rem, 100vw";

const clampCut = gsap.utils.clamp(0, 100);

/**
 * A caçamba da pá, de lado (o mesmo perfil da retroescavadeira 3D), com a boca e o dente virados
 * para a direita. O monte de terra que ela empurra passa da lâmina, para o lado do "antes".
 */
function Bucket() {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" className="comparacao-cacamba">
      {/* Terra empurrada na frente do dente */}
      <path d="M58 70.5c3-7 9-11.5 15-11.5 6 0 10.5 5 14 11.5Z" fill="var(--terra-roxa)" />
      <path d="M64 70.5c2-4 5.5-6.5 9-6.5s6.5 2.5 8.5 6.5Z" fill="#8e4428" />
      <circle cx={88} cy={68.5} r={1.8} fill="var(--terra-roxa)" />
      <circle cx={92.5} cy={70} r={1.2} fill="#8e4428" />
      {/* Chapa lateral */}
      <path
        d="M30.9 10.6 11.7 13.4 4 30.2l.6 20.1 8.4 13.5 16.6 4.4h37.1L53.9 49.2 39.2 23.4Z"
        fill="var(--amarelo-maquina)"
        stroke="var(--solo-fundo)"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Sombra do fundo curvo e a espessura da boca */}
      <path d="M29 14.5C15 16 8.5 25 8.5 40c0 12 6.5 20 20 24" fill="none" stroke="var(--solo-fundo)" strokeOpacity={0.22} strokeWidth={5} />
      <path d="m35.6 24.5 14.6 25.4 11.6 16" fill="none" stroke="var(--solo-fundo)" strokeOpacity={0.45} strokeWidth={1.6} />
      {/* Orelhas e pinos do braço da pá */}
      <path d="M10 22.5 15 9l14-2.5 3.5 8" fill="var(--amarelo-maquina)" stroke="var(--solo-fundo)" strokeWidth={2} strokeLinejoin="round" />
      <circle cx={16.5} cy={15} r={3.4} fill="var(--solo-fundo)" />
      <circle cx={16.5} cy={15} r={1.3} fill="var(--neblina)" />
      <circle cx={28} cy={11} r={2.8} fill="var(--solo-fundo)" />
      <circle cx={28} cy={11} r={1.1} fill="var(--neblina)" />
      {/* Fio de corte e dente */}
      <path d="M29.6 68.2h37.1" stroke="#2a2522" strokeWidth={3.6} strokeLinecap="round" />
      <path d="m61.5 64.5 14 4.8-12.5 1.9Z" fill="#2a2522" />
    </svg>
  );
}

/**
 * Antes e depois: o mesmo lugar, com uma lâmina no meio e a caçamba como controle. Arrastar
 * (ou usar as setas) raspa o "antes" e revela o "depois". Na primeira vez que aparece, a
 * caçamba avança sozinha até o meio, para mostrar que dá para arrastar. Sem pares, não aparece.
 */
export function BeforeAfter() {
  return PAIRS.length ? <Comparison /> : null;
}

function Comparison() {
  const frame = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const cut = useRef(REST);
  const intro = useRef<gsap.core.Tween | null>(null);
  const dragging = useRef(false);
  const settle = useRef(0);
  const [current, setCurrent] = useState(0);
  const pair = PAIRS[current];

  /** Move a lâmina. A caçamba inclina um pouco para o lado em que anda e volta quando para. */
  const setCut = (value: number) => {
    const next = clampCut(value);
    const tilt = gsap.utils.clamp(-12, 12, (cut.current - next) * 2);
    cut.current = next;
    const el = frame.current;
    if (!el) return;
    el.style.setProperty("--corte", `${next}%`);
    el.style.setProperty("--inclinacao", `${tilt}deg`);
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => el.style.setProperty("--inclinacao", "0deg"), 120);
    handle.current?.setAttribute("aria-valuenow", String(Math.round(next)));
  };

  useEffect(() => {
    const el = frame.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setCut(START);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const proxy = { value: cut.current };
        intro.current = gsap.to(proxy, {
          value: REST,
          duration: 1.8,
          delay: 0.2,
          ease: "power2.inOut",
          onUpdate: () => setCut(proxy.value),
        });
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      intro.current?.kill();
      window.clearTimeout(settle.current);
    };
    // setCut só mexe em refs e no DOM: não precisa entrar nas dependências.
  }, []);

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setCut(((event.clientX - rect.left) / rect.width) * 100);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    intro.current?.kill();
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    fromPointer(event);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 };
    let next: number | null = null;
    if (event.key in steps) next = cut.current + steps[event.key];
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 100;
    if (next === null) return;
    event.preventDefault();
    intro.current?.kill();
    setCut(next);
  };

  return (
    <section
      data-regua={antesDepois.titulo}
      aria-labelledby="antes-depois-titulo"
      className="mx-auto w-full max-w-(--max-conteudo) px-(--gutter) py-[12svh]"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div>
          <h2 id="antes-depois-titulo" className="titulo-secao text-[clamp(2rem,3.4vw,3.1rem)]">
            {antesDepois.titulo}
          </h2>
          <p className="mt-5 max-w-[44ch] leading-relaxed text-poeira/75">{antesDepois.apoio}</p>
        </div>
        {PAIRS.length > 1 && (
          <div role="group" aria-label={antesDepois.rotuloPares} className="flex flex-wrap gap-2">
            {PAIRS.map((par, i) => (
              <button key={par.id} type="button" aria-pressed={i === current} className="botao-par" onClick={() => setCurrent(i)}>
                {par.nome}
              </button>
            ))}
          </div>
        )}
      </div>

      <figure className="mt-10">
        <div
          ref={frame}
          className="comparacao"
          style={{ "--corte": `${REST}%` } as React.CSSProperties}
          onPointerDown={onPointerDown}
          onPointerMove={(event) => dragging.current && fromPointer(event)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <Image src={pair.depois} alt={pair.altDepois} fill sizes={SIZES} className="object-cover" draggable={false} />
          <div className="comparacao-antes">
            <Image src={pair.antes} alt={pair.altAntes} fill sizes={SIZES} className="object-cover" draggable={false} />
          </div>
          <span aria-hidden="true" className="comparacao-rotulo left-3 md:left-4">
            {antesDepois.rotuloDepois}
          </span>
          <span aria-hidden="true" className="comparacao-rotulo right-3 md:right-4">
            {antesDepois.rotuloAntes}
          </span>
          <div
            ref={handle}
            role="slider"
            tabIndex={0}
            aria-label={antesDepois.rotuloControle}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={REST}
            onKeyDown={onKeyDown}
            className="comparacao-lamina"
          >
            <Bucket />
          </div>
        </div>
        <figcaption className="mt-3 text-sm text-poeira/60">{antesDepois.aviso}</figcaption>
      </figure>
    </section>
  );
}
