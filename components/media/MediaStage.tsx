"use client";

import { useEffect, useRef } from "react";
import { type Clip, clips } from "@/content/media";
import { smoothstep } from "@/lib/math";
import { STOP_IDS } from "@/lib/stops";
import { useStageStore } from "@/lib/store";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { Preloader } from "./Preloader";

/** Além do clipe atual e do próximo, quantos começam a baixar antes de aparecer. */
const PRELOAD_AHEAD = 1;
const TALL = "(max-aspect-ratio: 1/1)";
const REDUCED = "(prefers-reduced-motion: reduce)";

// Os hooks começam com o valor do servidor (false) na hidratação. Os efeitos leem o valor real
// na hora, senão a primeira passada liga o vídeo com movimento reduzido e baixa o 16:9 no celular.
const matches = (query: string) => window.matchMedia(query).matches;

/**
 * O formato certo para a tela. Na tela larga sem 16:9, o 9:16 vai numa janela à direita
 * (`window`), sobre a própria capa desfocada, em vez de ser esticado.
 */
function sources(clip: Clip, tall: boolean) {
  if (tall && clip.tall) return { src: clip.tall.video, poster: clip.tall.poster, position: "50% 50%", window: false };
  if (!clip.wide) {
    return clip.tall ? { src: clip.tall.video, poster: clip.tall.poster, position: "50% 50%", window: true } : null;
  }
  // Sem versão vertical, o 16:9 é recortado no ponto de interesse.
  return {
    src: clip.wide.video,
    poster: clip.wide.poster,
    position: tall ? `${clip.focus ?? 60}% 50%` : "50% 50%",
    window: false,
  };
}

/**
 * A única camada de mídia, fixa atrás da página: um clipe por parada, empilhados.
 * O scroll (store.stop) escolhe o clipe; entre duas seções o próximo aparece por cima
 * no meio do caminho. Só tocam os clipes visíveis; só baixam o atual e os seguintes.
 */
export function MediaStage() {
  const reduced = usePrefersReducedMotion();
  const tall = useMediaQuery(TALL);
  const revealed = useStageStore((s) => s.revealed);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  // Progresso do preloader: hidratou (10%) e o primeiro clipe carregando (até 100%).
  useEffect(() => {
    const { setLoad } = useStageStore.getState();
    setLoad(0.1);
    const first = videos.current[0];
    if (!first || matches(REDUCED)) {
      setLoad(1);
      return;
    }
    const progress = () => {
      const { buffered, duration } = first;
      if (duration > 0 && buffered.length > 0) setLoad(0.1 + (0.9 * buffered.end(buffered.length - 1)) / duration);
    };
    const done = () => setLoad(1);
    first.addEventListener("progress", progress);
    first.addEventListener("canplaythrough", done);
    first.addEventListener("error", done);
    if (first.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) done();
    return () => {
      first.removeEventListener("progress", progress);
      first.removeEventListener("canplaythrough", done);
      first.removeEventListener("error", done);
    };
  }, [reduced]);

  // Qual clipe aparece, qual toca e qual baixa, conforme a parada.
  useEffect(() => {
    const still = matches(REDUCED);
    const portrait = matches(TALL);
    const apply = (stop: number, revealed: boolean) => {
      const current = Math.min(Math.floor(stop), STOP_IDS.length - 1);
      const blend = smoothstep(0.35, 0.65, stop - current);
      // Até o vídeo entrar, só o hero baixa: no 4G, dividir a banda com os seguintes atrasava a entrada em segundos.
      const last = revealed ? current + 1 + PRELOAD_AHEAD : current;
      STOP_IDS.forEach((id, k) => {
        // Cada camada tem fundo próprio: a de cima, quando cobre tudo, esconde (e pausa) a de baixo.
        const visible = (k === current && blend < 1) || (k === current + 1 && blend > 0);
        const layer = layers.current[k];
        if (layer) {
          layer.style.opacity = String(k <= current ? 1 : k === current + 1 ? blend : 0);
          layer.style.visibility = visible ? "visible" : "hidden";
        }
        const clip = clips[id];
        const media = clip && sources(clip, portrait);
        // Capas e fotos também só baixam perto de aparecer, e já no formato da tela (no HTML não vêm:
        // o servidor não sabe se é celular, e o celular baixava as 16:9 e depois as 9:16).
        if (layer && media && k >= current && k <= last) {
          layer.querySelectorAll("img").forEach((img) => {
            if (img.getAttribute("src") !== media.poster) img.src = media.poster;
          });
        }
        const video = videos.current[k];
        if (!video || !clip) return;
        if (media && k >= current && k <= last && video.getAttribute("poster") !== media.poster) video.poster = media.poster;
        // Com movimento reduzido fica a imagem parada (poster): o vídeo nem baixa.
        if (still) {
          if (video.hasAttribute("src")) {
            video.pause();
            video.removeAttribute("src");
            video.load();
          }
          return;
        }
        const src = media?.src;
        if (!src) return;
        if (k >= current && k <= last && video.getAttribute("src") !== src) video.src = src;
        if (visible && video.paused) video.play().catch(() => {});
        if (!visible && !video.paused) video.pause();
      });
    };
    const { stop, revealed } = useStageStore.getState();
    apply(stop, revealed);
    return useStageStore.subscribe((state, previous) => {
      if (state.stop !== previous.stop || state.revealed !== previous.revealed) apply(state.stop, state.revealed);
    });
  }, [reduced, tall]);

  return (
    <div aria-hidden="true" data-palco className="fundo-terra pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="palco absolute inset-0" data-revelado={revealed}>
        {STOP_IDS.map((id, k) => {
          const clip = clips[id];
          const media = clip && sources(clip, tall);
          return (
            <div
              key={id}
              ref={(el) => {
                layers.current[k] = el;
              }}
              className="fundo-terra absolute inset-0"
              style={{ opacity: k === 0 ? 1 : 0, visibility: k === 0 ? "visible" : "hidden" }}
            >
              {/* Capas sem src: a imagem certa entra quando a parada se aproxima (ver o efeito acima). */}
              {media?.window && <img alt="" className="janela-fundo" />}
              {media && !media.src && (
                <img alt="" className="foto-lenta h-full w-full object-cover" />
              )}
              {media?.src && (
                <div className={media.window ? "janela-video" : "absolute inset-0"}>
                  <video
                    ref={(el) => {
                      videos.current[k] = el;
                    }}
                    muted
                    loop
                    playsInline
                    preload="auto"
                    // No hero, o vídeo é ambiente atrás da logo 3D (components/sections/HeroLogo.tsx).
                    className={`h-full w-full object-cover ${id === "hero" ? "video-ambiente" : ""}`}
                    style={{ objectPosition: media.position }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="veu-video absolute inset-0" />
      <div className="grao-filme" />
      <Preloader />
    </div>
  );
}
