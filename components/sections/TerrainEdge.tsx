const WIDTH = 1200;
const HEIGHT = 80;
const STRATUM = 7;

/** Perfil fixo de terreno (igual no servidor e no cliente). */
function profile(offset: number) {
  let d = "";
  for (let i = 0; i <= 60; i++) {
    const x = (i / 60) * WIDTH;
    const y = 44 + 14 * Math.sin(x * 0.0055 + 1.1) + 7 * Math.sin(x * 0.0171 + 2.4) + 2.5 * Math.sin(x * 0.061) + offset;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(0)} ${y.toFixed(1)}`;
  }
  return `${d} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`;
}

const TOP = profile(0);
const BODY = profile(STRATUM);

/**
 * Borda irregular de um bloco de solo: uma camada de terra roxa e o solo escuro por baixo.
 * Encosta no bloco pelo lado de baixo (`bottom-full`); `flip` vira para a borda de baixo.
 */
export function TerrainEdge({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none absolute left-0 h-[clamp(2.5rem,6vw,5rem)] w-full ${flip ? "top-full -scale-y-100" : "bottom-full"} ${className}`}
    >
      {!flip && <path d={TOP} fill="var(--terra-roxa)" />}
      <path d={flip ? TOP : BODY} fill="var(--solo-fundo)" />
    </svg>
  );
}
