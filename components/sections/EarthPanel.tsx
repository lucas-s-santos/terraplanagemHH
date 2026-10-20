import type { ReactNode } from "react";
import { TerrainEdge } from "./TerrainEdge";

/**
 * Painel de terra: depois do último serviço, as seções sobem num bloco de solo que cobre
 * o vídeo. O clipe de "terrenos" fica enquanto ele passa (o marcador no fim repete a
 * parada) e, quando ele termina, entra o clipe do contato.
 */
export function EarthPanel({ children }: { children: ReactNode }) {
  return (
    <div className="relative bg-solo-fundo text-poeira">
      <TerrainEdge />
      {children}
      <TerrainEdge flip />
      <div data-stop="terrenos" aria-hidden="true" />
    </div>
  );
}
