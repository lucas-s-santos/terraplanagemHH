import { create } from "zustand";

interface StageState {
  /** Parada atual, contínua: 0 = hero, 1 = primeiro serviço, 2.5 = entre o 2º e o 3º. */
  stop: number;
  /** Carregamento do primeiro clipe, de 0 a 1 (só sobe). */
  load: number;
  /** O preloader terminou de nivelar e o vídeo entrou. */
  revealed: boolean;
  setStop: (stop: number) => void;
  setLoad: (load: number) => void;
  reveal: () => void;
}

/** As seções escrevem, a camada de vídeo lê (de preferência via subscribe, fora do render). */
export const useStageStore = create<StageState>()((set) => ({
  stop: 0,
  load: 0,
  revealed: false,
  setStop: (stop) => set({ stop }),
  setLoad: (load) => set((state) => ({ load: Math.max(state.load, Math.min(load, 1)) })),
  reveal: () => set({ revealed: true }),
}));
