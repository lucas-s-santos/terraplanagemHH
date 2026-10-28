import { site } from "@/content/site";
import { LETRAS_SVG, MARCA_HEIGHT, MARCA_WIDTH, NIVEL } from "@/lib/logo/marca";

/** Espaço entre a marca e o nome, e a altura do nome, nas unidades da marca (altura 100). */
const NAME_GAP = 16;
const NAME_SIZE = 25;

/**
 * A logo: a marca "H e H" (letras na cor do texto, linha de nível em amarelo) e, com `nome`,
 * "Terraplanagem" por extenso embaixo, na largura exata da marca. O nome por extenso vai
 * para leitores de tela; o desenho, não.
 */
export function Logo({ className, nome = true, decorativa = false }: { className?: string; nome?: boolean; decorativa?: boolean }) {
  const height = nome ? MARCA_HEIGHT + NAME_GAP + NAME_SIZE : MARCA_HEIGHT;
  return (
    <span className={className} aria-hidden={decorativa || undefined}>
      {!decorativa && <span className="sr-only">{site.nome}</span>}
      <svg viewBox={`0 0 ${MARCA_WIDTH} ${height}`} aria-hidden="true" className="block h-full w-auto overflow-visible">
        <path d={LETRAS_SVG.join("")} fill="currentColor" />
        <path d={NIVEL} fill="var(--amarelo-maquina)" />
        {nome && (
          <text
            x={0}
            y={height}
            textLength={MARCA_WIDTH}
            lengthAdjust="spacing"
            fill="currentColor"
            fontSize={NAME_SIZE}
            className="logo-nome"
          >
            {site.logo.nome}
          </text>
        )}
      </svg>
    </span>
  );
}
