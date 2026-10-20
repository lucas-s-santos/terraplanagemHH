import type { ReactNode } from "react";
import { TerrainEdge } from "./TerrainEdge";

/**
 * Painel de terra: depois da última ilha de serviço, as seções sobem num bloco de solo que
 * cobre a cena. A câmera espera no platô enquanto ele passa (o marcador no fim repete a
 * parada "terrenos") e pousa quando ele termina, na seção de contato.
 */
export function EarthPanel({ children }: { children: ReactNode }) {
  return (
    <div className="chao relative bg-solo-fundo text-poeira">
      <TerrainEdge />
      {children}
      <TerrainEdge flip />
      <div data-stop="terrenos" aria-hidden="true" />
    </div>
  );
}
