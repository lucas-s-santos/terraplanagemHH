import type { ReactNode } from "react";
import { ContourField } from "./ContourField";
import { TerrainEdge } from "./TerrainEdge";

/**
 * Painel de terra: depois do último serviço, as seções sobem num bloco de solo que cobre
 * o vídeo. A troca do clipe de "terrenos" para o do contato acontece logo no começo, com o
 * painel já cobrindo a tela inteira (marcadores no topo): quando ele termina, o contato
 * aparece com a própria imagem, e não com a do serviço anterior por trás.
 */
export function EarthPanel({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate bg-solo-fundo text-poeira">
      <TerrainEdge />
      {/* "terrenos" fica até o topo do painel chegar ao meio da tela; 160svh depois já é o contato.
          A mistura (35% a 65% do caminho) cai quando o topo do painel já saiu da tela. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0">
        <div data-stop="terrenos" className="absolute top-0" />
        <div data-stop="contato" className="absolute top-[160svh]" />
      </div>
      {/* Curvas de nível no fundo do bloco (z negativo: ficam atrás do texto). */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <ContourField layout="painel" />
      </div>
      {children}
      <TerrainEdge flip />
    </div>
  );
}
