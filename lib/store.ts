import { create } from "zustand";

export type Quality = "high" | "low";

interface SceneState {
  /** Parada atual da câmera, contínua: 0 = hero, 1 = primeiro serviço, 2.5 = entre o 2º e o 3º. */
  stop: number;
  quality: Quality;
  setStop: (stop: number) => void;
  setQuality: (quality: Quality) => void;
}

/** As seções escrevem, a cena lê (de preferência via getState() dentro do useFrame). */
export const useSceneStore = create<SceneState>()((set) => ({
  stop: 0,
  quality: "high",
  setStop: (stop) => set({ stop }),
  setQuality: (quality) => set({ quality }),
}));
