/**
 * Gera as ilhas fora da thread principal, na ordem do voo, e devolve uma por mensagem
 * (arrays transferidos, sem cópia). Ver islandSource.ts.
 */
import { createIsland, islandBuffers } from "./islandGeometry";
import { derivePalette } from "./palette";
import type { TokenValues } from "./tokens";
import { ISLANDS } from "./world";

// Tipagem mínima do escopo do worker (a lib "webworker" do TS brigaria com a "dom" do projeto).
interface WorkerScope {
  onmessage: ((event: MessageEvent<{ tokens: TokenValues }>) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
}
const scope = self as unknown as WorkerScope;

scope.onmessage = ({ data }) => {
  const palette = derivePalette(data.tokens);
  ISLANDS.forEach((spec, index) => {
    const island = createIsland(spec, palette);
    scope.postMessage({ index, island }, islandBuffers(island));
  });
};
