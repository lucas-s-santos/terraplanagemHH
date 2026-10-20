"use client";

import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useSceneStore } from "@/lib/store";
import { STOP_IDS, type StopId } from "@/lib/scene/world";

interface Anchor {
  /** Scroll em que o marcador passa pelo centro da tela. */
  y: number;
  /** Índice da parada em STOP_IDS. */
  stop: number;
}

/**
 * Converte o scroll em "parada" da câmera. A parada acontece quando o centro de um
 * marcador [data-stop=id] passa pelo centro da tela; entre dois marcadores, interpola.
 * Uma parada pode ter mais de um marcador (na ordem do documento): entre eles a câmera
 * fica parada. É assim que ela espera no platô enquanto o painel de terra passa.
 */
export function ScrollDirector() {
  useGSAP(() => {
    const setStop = useSceneStore.getState().setStop;
    let anchors: Anchor[] = [];

    const measure = () => {
      const max = ScrollTrigger.maxScroll(window);
      let previous = 0;
      anchors = [];
      for (const el of document.querySelectorAll<HTMLElement>("[data-stop]")) {
        const stop = STOP_IDS.indexOf(el.dataset.stop as StopId);
        if (stop < 0) continue;
        const rect = el.getBoundingClientRect();
        const center = rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
        previous = Math.min(Math.max(center, previous), max);
        anchors.push({ y: previous, stop });
      }
      if (process.env.NODE_ENV !== "production") {
        const missing = STOP_IDS.filter((_, i) => !anchors.some((anchor) => anchor.stop === i));
        if (missing.length > 0) console.warn(`[scroll] sem marcador data-stop para: ${missing.join(", ")}`);
      }
    };

    const toStop = (y: number) => {
      if (anchors.length === 0) return 0;
      if (y <= anchors[0].y) return anchors[0].stop;
      for (let i = 1; i < anchors.length; i++) {
        const a = anchors[i - 1];
        const b = anchors[i];
        if (y < b.y) return a.stop + (b.y > a.y ? (y - a.y) / (b.y - a.y) : 1) * (b.stop - a.stop);
      }
      return anchors[anchors.length - 1].stop;
    };

    ScrollTrigger.create({
      start: 0,
      end: "max",
      onRefresh: (self) => {
        measure();
        setStop(toStop(self.scroll()));
      },
      onUpdate: (self) => setStop(toStop(self.scroll())),
    });

    measure();
    setStop(toStop(window.scrollY));
  });

  return null;
}
