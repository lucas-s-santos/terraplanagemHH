/**
 * A marca "H e H": dois H e um e cortados por uma só linha de nível, que é ao mesmo tempo o
 * travessão dos H e a barra do e (o terreno nivelado, a mesma ideia do preloader e da régua).
 * Unidades: altura 100. As letras ficam fora da faixa da barra, então nada se sobrepõe: no SVG
 * cada parte tem a sua cor e no 3D o seu material, sem duas faces no mesmo lugar.
 * A mesma geometria serve o SVG (components/brand/Logo.tsx) e o 3D (lib/logo/scene.ts).
 */

const H = 100;
/** A faixa da linha de nível (de cima para baixo). */
const BAND_TOP = 41;
const BAND_BOTTOM = 59;
/** Haste do H e largura do H. */
const STEM = 24;
const H_WIDTH = 80;
const GAP = 16;
/** O e: anel com o corte embaixo à direita, centrado na barra. */
const E_OUTER = 31;
const E_INNER = 14;
const E_CUT_DEG = 40;

const E_CENTER_X = H_WIDTH + GAP + E_OUTER;
const RIGHT_H = E_CENTER_X + E_OUTER + GAP;
export const MARCA_WIDTH = RIGHT_H + H_WIDTH;
export const MARCA_HEIGHT = H;

const n = (value: number) => Number(value.toFixed(2));
const rect = (x: number, y: number, w: number, h: number) => `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`;

/** Um H: as duas hastes, sem o trecho que a barra cobre (`under`: quanto entram por baixo dela). */
function letterH(x: number, under: number) {
  const top = BAND_TOP + under;
  const bottom = BAND_BOTTOM - under;
  return [
    rect(x, 0, STEM, top),
    rect(x + H_WIDTH - STEM, 0, STEM, top),
    rect(x, bottom, STEM, H - bottom),
    rect(x + H_WIDTH - STEM, bottom, STEM, H - bottom),
  ];
}

/** O e: o arco de cima (acima da barra) e o de baixo (abaixo dela, até o corte). */
function letterE(under: number) {
  const cx = E_CENTER_X;
  const cy = H / 2;
  const half = (BAND_BOTTOM - BAND_TOP) / 2 - under;
  const outerX = Math.sqrt(E_OUTER ** 2 - half ** 2);
  const innerX = Math.sqrt(E_INNER ** 2 - half ** 2);
  const cut = (E_CUT_DEG * Math.PI) / 180;
  const top = cy - half;
  const bottom = cy + half;
  const upper =
    `M${n(cx - outerX)} ${n(top)}A${E_OUTER} ${E_OUTER} 0 0 1 ${n(cx + outerX)} ${n(top)}` +
    `L${n(cx + innerX)} ${n(top)}A${E_INNER} ${E_INNER} 0 0 0 ${n(cx - innerX)} ${n(top)}Z`;
  // De baixo: da esquerda, contorna por baixo até o corte inclinado, e volta por dentro.
  const lower =
    `M${n(cx - outerX)} ${n(bottom)}A${E_OUTER} ${E_OUTER} 0 0 0 ${n(cx + E_OUTER * Math.cos(cut))} ${n(cy + E_OUTER * Math.sin(cut))}` +
    `L${n(cx + E_INNER * Math.cos(cut))} ${n(cy + E_INNER * Math.sin(cut))}` +
    `A${E_INNER} ${E_INNER} 0 0 1 ${n(cx - innerX)} ${n(bottom)}Z`;
  return [upper, lower];
}

/**
 * As letras (sem a barra), cada parte um caminho fechado. No 3D, encostadas na barra; no SVG,
 * entrando 1 unidade por baixo dela (a barra é desenhada por cima), senão o antialias deixa um fio.
 */
export const LETRAS: readonly string[] = [...letterH(0, 0), ...letterE(0), ...letterH(RIGHT_H, 0)];
export const LETRAS_SVG: readonly string[] = [...letterH(0, 1), ...letterE(1), ...letterH(RIGHT_H, 1)];
/** A linha de nível, de ponta a ponta. */
export const NIVEL = rect(0, BAND_TOP, MARCA_WIDTH, BAND_BOTTOM - BAND_TOP);
