"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { distanceKm, offsetKm } from "@/lib/geo";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const { origem, cidades, aneis } = site.atuacao;
const CITIES = cidades
  .map((cidade) => ({ ...cidade, km: Math.round(distanceKm(origem, cidade)) }))
  .sort((a, b) => a.km - b.km);
/** Origem primeiro, depois as cidades (a mesma ordem dos rótulos na cena). */
const PLACES = [{ east: 0, north: 0 }, ...CITIES.map((cidade) => offsetKm(origem, cidade))];

/**
 * Onde atuamos: maquete 3D da região (lib/region/scene.ts) com Alterosa no centro, anéis de
 * distância e as cidades vizinhas. A informação está na lista; o mapa ilustra.
 */
export function Region() {
  const { atuacao: regiao } = site;
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const progress = useRef(0.5);
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<"idle" | "on" | "off">("idle");

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          progress.current = self.progress;
        },
      });
    },
    { scope: root },
  );

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let scene: { setRunning: (on: boolean) => void; dispose: () => void } | null = null;
    let visible = false;
    let cancelled = false;

    const start = () =>
      import("@/lib/region/scene")
        .then(({ createRegionMap }) => {
          if (cancelled) return;
          const styles = getComputedStyle(document.documentElement);
          const token = (name: string) => styles.getPropertyValue(`--${name}`).trim();
          // Montada em etapas e compilada em paralelo (lib/region/scene.ts): não trava a rolagem.
          return createRegionMap({
            canvas: el,
            colors: { soil: token("terra-roxa"), dark: token("solo-fundo"), dust: token("poeira"), yellow: token("amarelo-maquina") },
            places: PLACES,
            rings: [...aneis],
            getProgress: () => progress.current,
            still: reduced,
            onFrame: (points) => {
              points.forEach((point, i) => {
                const label = labels.current[i];
                if (!label) return;
                label.style.transform = `translate(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px)`;
                label.style.opacity = point.visible ? "1" : "0";
              });
            },
          });
        })
        .then((created) => {
          if (!created) return;
          if (cancelled) {
            created.dispose();
            return;
          }
          scene = created;
          created.setRunning(visible);
          setState("on");
        })
        .catch(() => setState("off"));

    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !scene) {
          near.disconnect();
          void start();
        }
      },
      { rootMargin: "100% 0px" },
    );
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      scene?.setRunning(visible);
    });
    near.observe(el);
    onScreen.observe(el);

    return () => {
      cancelled = true;
      near.disconnect();
      onScreen.disconnect();
      scene?.dispose();
    };
  }, [reduced]);

  const setLabel = (i: number) => (el: HTMLSpanElement | null) => {
    labels.current[i] = el;
  };

  return (
    <section
      ref={root}
      data-regua={regiao.titulo}
      aria-labelledby="regiao-titulo"
      className="mx-auto w-full max-w-(--max-conteudo) px-(--gutter) py-[12svh]"
    >
      <div className="grid gap-8 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] md:items-center md:gap-14">
        <div>
          <h2 id="regiao-titulo" className="titulo-secao text-[clamp(2rem,3.4vw,3.1rem)]">
            {regiao.titulo}
          </h2>
          <p className="mt-5 max-w-[40ch] leading-relaxed text-poeira/75">{regiao.texto}</p>
          <p id="regiao-lista" className="mt-9 text-[0.9375rem] font-semibold text-poeira/60">
            {regiao.rotuloLista}
          </p>
          <ul aria-labelledby="regiao-lista" className="mt-3 max-w-[26rem] border-t border-poeira/12">
            {CITIES.map((cidade) => (
              <li key={cidade.nome} className="flex items-baseline justify-between border-b border-poeira/12 py-2.5">
                <span className="font-medium">{cidade.nome}</span>
                <span className="text-poeira/60 tabular-nums">{cidade.km} km</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          role="img"
          aria-label={regiao.rotuloMapa}
          className={`relative -mx-(--gutter) aspect-square md:mx-0 md:aspect-[6/5] ${state === "off" ? "hidden" : ""}`}
        >
          <canvas
            ref={canvas}
            aria-hidden="true"
            className={`block h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${state === "on" ? "opacity-100" : "opacity-0"}`}
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <span ref={setLabel(0)} className="rotulo-mapa rotulo-mapa-origem">
              <span>{origem.nome}</span>
              <span className="rotulo-mapa-detalhe">{origem.detalhe}</span>
            </span>
            {CITIES.map((cidade, i) => (
              <span key={cidade.nome} ref={setLabel(i + 1)} className="rotulo-mapa">
                {cidade.nome}
              </span>
            ))}
            {aneis.map((km, i) => (
              <span key={km} ref={setLabel(CITIES.length + 1 + i)} className="rotulo-mapa rotulo-mapa-anel">
                {km} km
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
