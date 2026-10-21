import type { StopId } from "@/lib/stops";

/**
 * Um clipe por parada: máquinas trabalhando, ilustrativos, gerados no Google Flow.
 * `null` enquanto o clipe não chega: a parada mostra o fundo de terra.
 * Arquivos em public/media/ (como preparar: docs/ESTADO.md, seção "Vídeos").
 */
/** Um formato do clipe: o vídeo e a capa (quadro parado, para carregar e para movimento reduzido). */
export interface ClipSource {
  video: string;
  poster: string;
}

/**
 * Pelo menos um dos formatos. No celular usa o 9:16; sem ele, recorta o 16:9 no ponto `focus`.
 * Na tela larga só usa o 16:9; sem ele, fica o fundo de terra.
 */
export interface Clip {
  wide?: ClipSource;
  tall?: ClipSource;
  /** Onde recortar o 16:9 no celular (0 = esquerda, 100 = direita). Padrão: 60. */
  focus?: number;
}

const source = (file: string): ClipSource => ({ video: `/media/${file}.mp4`, poster: `/media/${file}.jpg` });

export const clips: Record<StopId, Clip | null> = {
  hero: { wide: source("hero-16x9"), tall: source("hero-9x16") },
  // 16:9 recusado (logo "CAT" legível no braço): gerar de novo.
  reservatorio: { tall: source("reservatorio-9x16") },
  // 9:16 recusado (máquina "fantasma" no meio do clipe): no celular, o 16:9 recortado na máquina.
  "preparo-solo": { wide: source("preparo-solo-16x9"), focus: 78 },
  aracao: null,
  estradas: null,
  destoca: null,
  terrenos: null,
  contato: null,
};
