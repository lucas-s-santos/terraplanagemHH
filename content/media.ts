import type { StopId } from "@/lib/stops";

/**
 * Um clipe por parada: máquinas trabalhando, ilustrativos, gerados no Google Flow.
 * `null` enquanto o clipe não chega: a parada mostra o fundo de terra.
 * Arquivos em public/media/ (como preparar: docs/ESTADO.md, seção "Vídeos").
 */
export interface Clip {
  /** 16:9, para telas largas. */
  wide: string;
  /** 9:16, para o celular. Sem ele, o 16:9 é recortado no ponto `focus`. */
  tall?: string;
  /** Quadro parado: capa enquanto carrega e imagem fixa com movimento reduzido. */
  poster: string;
  posterTall?: string;
  /** Onde recortar o 16:9 no celular (0 = esquerda, 100 = direita). Padrão: 60. */
  focus?: number;
}

export const clips: Record<StopId, Clip | null> = {
  hero: {
    wide: "/media/hero-16x9.mp4",
    tall: "/media/hero-9x16.mp4",
    poster: "/media/hero-16x9.jpg",
    posterTall: "/media/hero-9x16.jpg",
  },
  reservatorio: null,
  "preparo-solo": null,
  aracao: null,
  estradas: null,
  destoca: null,
  terrenos: null,
  contato: null,
};
