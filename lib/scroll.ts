import type Lenis from "lenis";

let lenis: Lenis | null = null;

/** O SmoothScroll registra o Lenis aqui (e null ao desmontar ou com movimento reduzido). */
export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

/** Rola a página até `y` (px): pelo Lenis quando ele está ativo, senão pelo scroll nativo. */
export function scrollToY(y: number, immediate = false) {
  if (lenis) {
    lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.3 });
    return;
  }
  window.scrollTo({ top: y, behavior: immediate ? "instant" : "smooth" });
}

/** Quanto a página rola, em px. */
export function maxScroll() {
  return Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
}

/** Posição de scroll em que o centro do elemento passa pelo centro da tela (a mesma regra das paradas). */
export function centerScroll(el: Element) {
  const rect = el.getBoundingClientRect();
  return Math.min(Math.max(rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2, 0), maxScroll());
}
