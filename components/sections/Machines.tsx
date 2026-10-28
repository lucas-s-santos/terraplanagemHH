"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import type { BlueprintFrame, CalloutId, Point } from "@/lib/backhoe/blueprint";
import { ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const { maquinas } = site;
/** A máquina inteira e uma legenda por peça: os mesmos trechos da cena (SEGMENTS em lib/backhoe/blueprint.ts). */
const ITEMS = [{ ...maquinas.abertura, id: null }, ...maquinas.pecas] as const;

/** Onde a legenda está no palco: o topo do bloco e o fim do título da peça ativa. */
interface Anchor {
  top: number;
  titleRight: number;
  titleY: number;
  wide: boolean;
}

/**
 * Linha de chamada da legenda até a peça, em ângulo reto, como numa planta. Na tela larga, se
 * a peça fica à direita, sai do fim do título; senão (e sempre no celular), sobe do topo da legenda.
 */
function leaderPath(part: Point, anchor: Anchor) {
  const x = part.x.toFixed(1);
  const y = part.y.toFixed(1);
  if (anchor.wide && part.x > anchor.titleRight + 40) return `M${anchor.titleRight + 16} ${anchor.titleY} H${x} V${y}`;
  return `M${x} ${anchor.top - 16} V${y}`;
}

/**
 * Máquinas: a retroescavadeira 3D (lib/backhoe/blueprint.ts) presa na tela enquanto o scroll
 * passa. Ela começa como desenho de planta e vira máquina; depois cada peça trabalha no seu
 * trecho, com a linha de chamada saindo da legenda. Com movimento reduzido (ou sem WebGL),
 * a máquina fica parada e as legendas viram uma lista.
 */
export function Machines() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const legend = useRef<HTMLUListElement>(null);
  const ground = useRef<SVGLineElement>(null);
  const blade = useRef<SVGLineElement>(null);
  const leader = useRef<SVGPathElement>(null);
  const marker = useRef<SVGGElement>(null);
  const progress = useRef(0);
  const callout = useRef<CalloutId | null>(null);
  const anchor = useRef<Anchor>({ top: 0, titleRight: 0, titleY: 0, wide: true });
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<"idle" | "on" | "off">("idle");
  const [active, setActive] = useState(0);
  const still = reduced || state === "off";

  useGSAP(
    () => {
      if (still) return;
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-pecas]",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          onUpdate: (self) => {
            progress.current = self.progress;
            const next = Math.min(ITEMS.length - 1, Math.floor(self.progress * ITEMS.length));
            callout.current = ITEMS[next].id;
            setActive(next);
          },
        },
      });
      // A palavra gigante atravessa a tela devagar, sempre saindo pela borda.
      timeline.fromTo("[data-palavra]", { xPercent: 4 }, { xPercent: -46, ease: "none" });
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [still], revertOnUpdate: true },
  );

  // Onde a legenda ativa está no palco (a linha de chamada sai dela).
  useEffect(() => {
    const measure = () => {
      const title = legend.current?.children[active]?.querySelector("h4");
      if (!title || !caption.current || !stage.current) return;
      const from = stage.current.getBoundingClientRect();
      const rect = title.getBoundingClientRect();
      anchor.current = {
        top: caption.current.getBoundingClientRect().top - from.top,
        titleRight: rect.right - from.left,
        titleY: rect.top + rect.height / 2 - from.top,
        wide: from.width >= 768,
      };
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (stage.current) observer.observe(stage.current);
    // A legenda entra subindo um pouco: mede de novo quando ela assenta.
    const list = legend.current;
    list?.addEventListener("transitionend", measure);
    // A linha se desenha de novo a cada peça.
    const path = leader.current;
    if (path) {
      path.style.transition = "none";
      path.style.strokeDashoffset = "1";
      void path.getBoundingClientRect();
      path.style.transition = "";
      path.style.strokeDashoffset = "0";
    }
    return () => {
      observer.disconnect();
      list?.removeEventListener("transitionend", measure);
    };
  }, [active]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let scene: { setRunning: (on: boolean) => void; dispose: () => void } | null = null;
    let visible = false;
    let cancelled = false;

    const onFrame = (frame: BlueprintFrame) => {
      const [a, b] = frame.ground;
      ground.current?.setAttribute("x1", a.x.toFixed(1));
      ground.current?.setAttribute("y1", a.y.toFixed(1));
      ground.current?.setAttribute("x2", b.x.toFixed(1));
      ground.current?.setAttribute("y2", b.y.toFixed(1));
      if (blade.current) {
        blade.current.setAttribute("x1", frame.blade.from.x.toFixed(1));
        blade.current.setAttribute("y1", frame.blade.from.y.toFixed(1));
        blade.current.setAttribute("x2", frame.blade.to.x.toFixed(1));
        blade.current.setAttribute("y2", frame.blade.to.y.toFixed(1));
        blade.current.style.opacity = frame.blade.on ? "1" : "0";
      }
      const id = callout.current;
      if (!id || !leader.current || !marker.current) return;
      const part = frame.callouts[id];
      leader.current.setAttribute("d", leaderPath(part, anchor.current));
      marker.current.setAttribute("transform", `translate(${part.x.toFixed(1)} ${part.y.toFixed(1)})`);
    };

    const start = () =>
      import("@/lib/backhoe/blueprint")
        .then(({ createBackhoeBlueprint }) => {
          if (cancelled) return;
          const styles = getComputedStyle(document.documentElement);
          const token = (name: string) => styles.getPropertyValue(`--${name}`).trim();
          // Montada em etapas e compilada em paralelo (lib/backhoe/blueprint.ts): não trava a rolagem.
          return createBackhoeBlueprint({
            canvas: el,
            colors: {
              yellow: token("amarelo-maquina"),
              soil: token("terra-roxa"),
              dark: token("solo-fundo"),
              dust: token("poeira"),
            },
            getProgress: () => progress.current,
            onFrame,
            still: reduced,
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

    // Baixa um pouco antes de aparecer; desenha só enquanto aparece.
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

  const part = ITEMS[active].id;

  return (
    <section ref={root} data-regua={maquinas.titulo} aria-labelledby="maquinas-titulo">
      <div className="mx-auto w-full max-w-(--max-conteudo) px-(--gutter) pt-[6svh] md:pt-[14svh]">
        <h2 id="maquinas-titulo" className="titulo-secao text-[clamp(2rem,3.4vw,3.1rem)]">
          {maquinas.titulo}
        </h2>
        <p className="mt-5 max-w-[44ch] leading-relaxed text-poeira/75">{maquinas.apoio}</p>
      </div>

      <div data-pecas style={still ? undefined : { height: `${ITEMS.length * 100}svh` }}>
        <div ref={stage} className={still ? "relative" : "sticky top-0 h-svh overflow-hidden"}>
          <div
            aria-hidden="true"
            className={state === "off" ? "hidden" : still ? "relative h-[60svh] overflow-hidden" : "absolute inset-0"}
          >
            <p data-palavra className="palavra-gigante">
              {maquinas.nome}
            </p>
            <canvas
              ref={canvas}
              className={`absolute inset-0 block h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${state === "on" ? "opacity-100" : "opacity-0"}`}
            />
            <svg className="planta absolute inset-0 h-full w-full overflow-visible">
              <line ref={ground} className="planta-chao" />
              <line ref={blade} className="planta-lamina" />
              <g data-visivel={!still && part !== null}>
                <path ref={leader} pathLength={1} className="planta-chamada" />
                <g ref={marker}>
                  <circle r={11} className="planta-alvo" />
                  <circle r={4.5} className="planta-ponto" />
                </g>
              </g>
            </svg>
          </div>

          <div
            ref={caption}
            className={
              still
                ? "mx-auto max-w-(--max-conteudo) px-(--gutter) pb-[10svh]"
                : "absolute inset-x-(--gutter) bottom-[7svh] md:right-auto md:bottom-[11svh] md:w-[min(30rem,36vw)]"
            }
          >
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-amarelo-maquina [font-stretch:112%]">{maquinas.nome}</h3>
              {!still && (
                <span aria-hidden="true" className="flex gap-1.5">
                  {ITEMS.map((item, i) => (
                    <span key={item.nome} data-ativo={i === active} className="planta-marco" />
                  ))}
                </span>
              )}
            </div>
            <ul ref={legend} data-estatico={still} className="legendas mt-4">
              {ITEMS.map((item, i) => (
                <li key={item.nome} data-ativo={i === active}>
                  <h4 className="w-fit text-[clamp(1.6rem,2.3vw,2.1rem)] leading-tight font-bold [font-stretch:112%]">{item.nome}</h4>
                  <p className="mt-3 max-w-[36ch] leading-relaxed text-poeira/75">{item.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
