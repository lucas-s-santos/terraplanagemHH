"use client";

import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useSceneStore } from "@/lib/store";
import { STOP_IDS } from "@/lib/scene/world";

/**
 * Converte o scroll em "parada" da câmera. A parada i acontece quando o centro
 * da seção [data-stop=id] passa pelo centro da tela; entre duas seções, interpola.
 */
export function ScrollDirector() {
  useGSAP(() => {
    const setStop = useSceneStore.getState().setStop;
    let anchors: number[] = [];

    const measure = () => {
      const max = ScrollTrigger.maxScroll(window);
      let previous = 0;
      anchors = STOP_IDS.map((id) => {
        const el = document.querySelector<HTMLElement>(`[data-stop="${id}"]`);
        if (!el) {
          if (process.env.NODE_ENV !== "production") console.warn(`[scroll] seção data-stop="${id}" não encontrada`);
          return previous;
        }
        const rect = el.getBoundingClientRect();
        const center = rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
        previous = Math.min(Math.max(center, previous), max);
        return previous;
      });
    };

    const toStop = (y: number) => {
      if (anchors.length === 0 || y <= anchors[0]) return 0;
      for (let i = 1; i < anchors.length; i++) {
        const a = anchors[i - 1];
        const b = anchors[i];
        if (y < b) return i - 1 + (b > a ? (y - a) / (b - a) : 1);
      }
      return anchors.length - 1;
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
