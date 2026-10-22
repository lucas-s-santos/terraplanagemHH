"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { ScrollTrigger } from "@/lib/gsap";
import { smoothstep } from "@/lib/math";
import { centerScroll, maxScroll, scrollToY } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const LENGTH = 1000;
const MID = 20;
const POINTS = 90;
/** Faixa logo à frente da lâmina em que o terreno sai do plano e volta a ondular. */
const FADE = 70;

/** Perfil fixo do terreno ao longo da régua (igual no servidor e no cliente). */
const wave = (y: number) => 7 * Math.sin(y * 0.021 + 0.8) + 4 * Math.sin(y * 0.057 + 2.1) + 1.6 * Math.sin(y * 0.16);

/** O trecho já rolado fica plano (uma reta); o que falta, ondulado. */
function paths(level: number) {
  let ahead = "";
  for (let i = 0; i <= POINTS; i++) {
    const y = (i / POINTS) * LENGTH;
    if (y < level - LENGTH / POINTS) continue;
    const x = MID + wave(y) * smoothstep(level, level + FADE, y);
    ahead += `${ahead ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(1)}`;
  }
  return { done: `M${MID} 0L${MID} ${level.toFixed(1)}`, ahead };
}

interface Mark {
  label: string;
  y: number;
  frac: number;
}

/**
 * Régua de nível: a barra de rolagem do site, como uma régua de topografia na lateral.
 * Uma estaca por seção ([data-regua]); conforme a página rola, a lâmina amarela desce e o
 * terreno atrás dela fica plano. Clicar numa estaca leva à seção; clicar ou arrastar o
 * trilho rola até aquele ponto. Só em telas largas com mouse; no toque, fica a barra nativa.
 */
export function ScrollRuler() {
  const reduced = usePrefersReducedMotion();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [active, setActive] = useState(0);
  const trail = useRef<HTMLDivElement>(null);
  const done = useRef<SVGPathElement>(null);
  const ahead = useRef<SVGPathElement>(null);
  const blade = useRef<HTMLDivElement>(null);
  const marksRef = useRef<Mark[]>([]);

  // Onde cada seção está, em fração do scroll. Remede quando o layout muda.
  useEffect(() => {
    const measure = () => {
      const max = maxScroll();
      const next = Array.from(document.querySelectorAll<HTMLElement>("[data-regua]")).map((el) => {
        const y = centerScroll(el);
        return { label: el.dataset.regua ?? "", y, frac: y / max };
      });
      marksRef.current = next;
      setMarks(next);
    };
    measure();
    ScrollTrigger.addEventListener("refresh", measure);
    window.addEventListener("resize", measure);
    return () => {
      ScrollTrigger.removeEventListener("refresh", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // A lâmina segue o scroll.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const p = Math.min(Math.max(window.scrollY / maxScroll(), 0), 1);
      const level = p * LENGTH;
      const { done: d, ahead: a } = paths(level);
      done.current?.setAttribute("d", d);
      ahead.current?.setAttribute("d", a);
      if (blade.current) blade.current.style.top = `${p * 100}%`;
      const list = marksRef.current;
      let current = 0;
      list.forEach((mark, i) => {
        if (mark.frac <= p + 0.02) current = i;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [marks]);

  // Clicar ou arrastar o trilho rola até aquele ponto.
  useEffect(() => {
    const el = trail.current;
    if (!el) return;
    const toPointer = (event: PointerEvent, immediate: boolean) => {
      const rect = el.getBoundingClientRect();
      const frac = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
      scrollToY(frac * maxScroll(), immediate || reduced);
    };
    const down = (event: PointerEvent) => {
      el.setPointerCapture(event.pointerId);
      toPointer(event, false);
    };
    const move = (event: PointerEvent) => {
      if (el.hasPointerCapture(event.pointerId)) toPointer(event, true);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
    };
  }, [reduced]);

  const initial = paths(0);

  return (
    <nav aria-label={site.regua.rotulo} className="regua">
      <div ref={trail} className="regua-trilho" aria-hidden="true">
        <svg viewBox={`0 0 40 ${LENGTH}`} preserveAspectRatio="none" fill="none" className="h-full w-full overflow-visible">
          <path ref={ahead} d={initial.ahead} stroke="var(--poeira)" strokeOpacity={0.4} strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
          <path ref={done} d={initial.done} stroke="var(--poeira)" strokeOpacity={0.9} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </svg>
        <div ref={blade} className="regua-lamina" />
      </div>
      <ol>
        {marks.map((mark, i) => (
          <li key={`${mark.label}-${i}`} className="regua-estaca" style={{ top: `${mark.frac * 100}%` }}>
            <button
              type="button"
              aria-current={i === active ? "location" : undefined}
              onClick={() => scrollToY(mark.y, reduced)}
            >
              <span className="regua-rotulo">{mark.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
