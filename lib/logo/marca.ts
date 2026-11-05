/**
 * A marca H e H (identidade de 05/11, em docs/identidade-visual/): uma retroescavadeira de perfil em
 * traço chapado. A caçamba cava a curva (o terreno como chega) e as rodas andam sobre o platô (o
 * terreno como a H e H entrega). Para tamanhos pequenos, o ícone: um H com a curva por cima e o
 * platô por baixo.
 * Unidades do desenho original (símbolo 164 × 120, ícone 120 × 120), y para baixo. A mesma
 * geometria serve o SVG (components/brand/) e o 3D (lib/logo/scene.ts).
 */

export type Ponto = readonly [number, number];

export interface Retangulo {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Raio dos cantos. */
  r: number;
}

/** Curva de Bézier quadrática: início, controle e fim. */
export type Quadratica = readonly [Ponto, Ponto, Ponto];

export interface Traco {
  pontos: readonly Ponto[];
  largura: number;
  /** Ponta redonda (o braço da retro) ou reta (o braço da pá); as junções são sempre redondas. */
  ponta: "redonda" | "reta";
}

export interface Roda {
  cx: number;
  cy: number;
  r: number;
  traco: number;
}

export const SIMBOLO_LARGURA = 164;
export const SIMBOLO_ALTURA = 120;
/** Onde o desenho está de fato dentro do quadro de 164 × 120 (o alto do quadro é vazio). */
export const SIMBOLO_CAIXA = { x: 0, y: 30, w: 162, h: 81 } as const;

/** A máquina: chassi, cabine (com a janela vazada), capô, pá da frente, caçamba, rodas e braços. */
export const MAQUINA = {
  retangulos: [
    { x: 50, y: 66, w: 88, h: 14, r: 2 },
    { x: 100, y: 52, w: 32, h: 14, r: 2 },
  ] satisfies Retangulo[],
  /** Caminhos cheios (só M, H, V, L, Q e Z). A cabine é vazada (evenodd). */
  caminhos: [
    { d: "M70 36 H96 L102 66 H70 Z M76 42 V58 H97 L94 42 Z", vazado: true },
    { d: "M139 68 L153 68 L161 97 L161 101 L142 101 Q134 86 139 68 Z", vazado: false },
    { d: "M10 76 Q7 94 24 97 L26 87 Q17 85 19 76 Z", vazado: false },
  ],
  rodas: [
    { cx: 62, cy: 88, r: 12, traco: 8 },
    { cx: 124, cy: 92, r: 8, traco: 6 },
  ] satisfies Roda[],
  bracos: [
    { pontos: [[104, 50], [128, 50], [144, 72]], largura: 5, ponta: "reta" },
    { pontos: [[54, 68], [30, 34]], largura: 7, ponta: "redonda" },
    { pontos: [[30, 34], [15, 78]], largura: 6, ponta: "redonda" },
  ] satisfies Traco[],
};

/** O terreno: a curva que a caçamba cava e o platô em que a máquina anda. */
export const TERRENO = {
  plato: { x: 42, y: 101, w: 119, h: 6, r: 0 } satisfies Retangulo,
  curva: {
    // "M2 104 Q12 96 22 104 T42 104" com o T escrito por extenso (o controle refletido).
    trechos: [
      [[2, 104], [12, 96], [22, 104]],
      [[22, 104], [32, 112], [42, 104]],
    ] satisfies Quadratica[],
    largura: 6,
  },
};

/** O ícone reduzido: as duas hastes do H, a curva (traço) e o platô. */
export const ICONE_LADO = 120;
export const ICONE = {
  hastes: [
    { x: 10, y: 10, w: 26, h: 100, r: 3 },
    { x: 84, y: 10, w: 26, h: 100, r: 3 },
  ] satisfies Retangulo[],
  curva: {
    trechos: [
      [[34, 44], [48, 32], [60, 44]],
      [[60, 44], [72, 56], [86, 44]],
    ] satisfies Quadratica[],
    largura: 12,
  },
  plato: { x: 34, y: 64, w: 52, h: 12, r: 0 } satisfies Retangulo,
};

/** A curva em `d` de SVG. */
export const curvaD = (trechos: readonly Quadratica[]) =>
  trechos
    .map(([inicio, controle, fim], i) => `${i === 0 ? `M${inicio[0]} ${inicio[1]} ` : ""}Q${controle[0]} ${controle[1]} ${fim[0]} ${fim[1]}`)
    .join(" ");

/** Uma linha quebrada em `d` de SVG. */
export const tracoD = (pontos: readonly Ponto[]) => pontos.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
