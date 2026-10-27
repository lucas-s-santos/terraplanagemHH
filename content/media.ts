import type { BeforeAfterId } from "@/content/site";
import type { StopId } from "@/lib/stops";

/**
 * Um clipe por parada: máquinas trabalhando, ilustrativos, gerados no Google Flow.
 * `null` enquanto o clipe não chega: a parada mostra o fundo de terra.
 * Arquivos em public/media/ (como preparar: docs/ESTADO.md, seção "Vídeos").
 */
/**
 * Um formato do clipe: o vídeo e a capa (quadro parado, para carregar e para movimento reduzido).
 * Sem vídeo, é uma foto: aparece parada, com um zoom bem lento.
 */
export interface ClipSource {
  video?: string;
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
const photo = (file: string): ClipSource => ({ poster: `/media/${file}.webp` });

export const clips: Record<StopId, Clip | null> = {
  hero: { wide: source("hero-16x9"), tall: source("hero-9x16") },
  reservatorio: { wide: source("reservatorio-16x9"), tall: source("reservatorio-9x16") },
  // 9:16 recusado (máquina "fantasma" no meio do clipe): no celular, o 16:9 recortado na máquina.
  "preparo-solo": { wide: source("preparo-solo-16x9"), focus: 78 },
  aracao: { wide: source("aracao-16x9"), focus: 74 },
  // Só em pé: na tela larga aparecem numa janela à direita (ver MediaStage).
  estradas: { tall: source("estradas-9x16") },
  destoca: { tall: source("destoca-9x16") },
  terrenos: { tall: source("terrenos-9x16") },
  // Foto (cena parada: fim do dia, terreno pronto). As alternativas estão em media-originais/.
  contato: { wide: photo("contato-16x9"), tall: photo("contato-9x16") },
};

/**
 * Fundo do hero na versão com a retroescavadeira 3D (rota /hero-3d): só a paisagem, desfocada
 * como profundidade de campo. A máquina e o chão perto dela vêm do three.js (lib/backhoe/).
 * Quadro dos 6 s do clipe do Flow (media-originais/hero-3d-fundo-16x9_flow_*.mp4): o sol entra pela direita, como a luz
 * da cena. O 9:16 é um recorte do mesmo quadro, sem o céu de cima e nos eucaliptos, com o chão na altura do celular.
 */
export const heroBackdrop3d = {
  wide: "/media/hero-3d-fundo-16x9.webp",
  tall: "/media/hero-3d-fundo-9x16.webp",
} as const;

/**
 * Antes e depois (o slider da caçamba): o mesmo lugar, com a mesma câmera, ilustrativos, gerados no Flow
 * ("Antes e depois" em docs/PROMPTS-FLOW.md). WebP 16:9 em public/media/. `null` até o par chegar:
 * só aparecem os pares com imagem e, sem nenhum, a seção sai.
 */
export interface BeforeAfterPair {
  antes: string;
  depois: string;
}

export const beforeAfter: Record<BeforeAfterId, BeforeAfterPair | null> = {
  destoca: null,
  terreno: null,
  estrada: null,
};
