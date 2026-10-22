import type { ReactNode } from "react";
import { ContourField } from "./ContourField";
import { TerrainEdge } from "./TerrainEdge";

/**
 * Painel de terra: depois do último serviço, as seções sobem num bloco de solo que cobre
 * o vídeo. O clipe de "terrenos" fica enquanto ele passa (o marcador no fim repete a
 * parada) e, quando ele termina, entra o clipe do contato.
 */
export function EarthPanel({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate bg-solo-fundo text-poeira">
      <TerrainEdge />
      {/* Curvas de nível no fundo do bloco (z negativo: ficam atrás do texto). */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <ContourField layout="painel" />
      </div>
      {children}
      <TerrainEdge flip />
      <div data-stop="terrenos" aria-hidden="true" />
    </div>
  );
}
