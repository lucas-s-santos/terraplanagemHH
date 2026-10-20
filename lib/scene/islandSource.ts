import { create } from "zustand";
import { useSceneStore } from "@/lib/store";
import type { IslandData } from "./islandGeometry";
import { readTokens } from "./tokens";
import { ISLANDS } from "./world";

/**
 * De onde vêm as ilhas: um Web Worker que começa a gerar assim que a página hidrata,
 * em paralelo ao download do three. Sem three aqui (entra no bundle inicial).
 * Se o worker falhar, `failed` liga e o Archipelago gera o que faltar na thread principal.
 */
interface IslandSourceState {
  /** Por índice de ISLANDS; `undefined` enquanto a ilha não ficou pronta. */
  islands: (IslandData | undefined)[];
  failed: boolean;
}

export const useIslandSource = create<IslandSourceState>()(() => ({ islands: [], failed: false }));

/** Cada ilha pronta avança o preloader de 10% a 66%; os 100% vêm quando a cena monta todas. */
export function provideIsland(index: number, island: IslandData) {
  const islands = [...useIslandSource.getState().islands];
  islands[index] = island;
  useIslandSource.setState({ islands });
  useSceneStore.getState().setLoad(0.1 + (0.56 * islands.filter(Boolean).length) / ISLANDS.length);
}

let started = false;

export function startIslandWorker() {
  if (started) return;
  started = true;
  const fail = () => useIslandSource.setState({ failed: true });
  try {
    const worker = new Worker(new URL("./island.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }: MessageEvent<{ index: number; island: IslandData }>) => {
      provideIsland(data.index, data.island);
      if (useIslandSource.getState().islands.filter(Boolean).length === ISLANDS.length) worker.terminate();
    };
    worker.onerror = () => {
      worker.terminate();
      fail();
    };
    worker.postMessage({ tokens: readTokens() });
  } catch {
    fail();
  }
}
