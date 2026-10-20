import { create } from "zustand";

export type Quality = "high" | "low";

interface SceneState {
  /** Parada atual da câmera, contínua: 0 = hero, 1 = primeiro serviço, 2.5 = entre o 2º e o 3º. */
  stop: number;
  quality: Quality;
  /** Carregamento da cena, de 0 a 1 (só sobe): página hidratada, three carregado, ilhas geradas. */
  load: number;
  /** O preloader terminou de nivelar e a cena entrou (com o mergulho da câmera). */
  revealed: boolean;
  setStop: (stop: number) => void;
  setQuality: (quality: Quality) => void;
  setLoad: (load: number) => void;
  reveal: () => void;
}

/** As seções escrevem, a cena lê (de preferência via getState() dentro do useFrame). */
export const useSceneStore = create<SceneState>()((set) => ({
  stop: 0,
  quality: "high",
  load: 0,
  revealed: false,
  setStop: (stop) => set({ stop }),
  setQuality: (quality) => set({ quality }),
  setLoad: (load) => set((state) => ({ load: Math.max(state.load, Math.min(load, 1)) })),
  reveal: () => set({ revealed: true }),
}));
