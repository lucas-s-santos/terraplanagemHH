import { site } from "@/content/site";
import { Icone } from "./Icone";
import { SimboloDesenho } from "./Simbolo";

/**
 * Logo completa, nas unidades do símbolo (164 × 120), como na capa da identidade: a retroescavadeira
 * em amarelo e, ao lado, "H e H" largo e "TERRAPLANAGEM" espaçado, na cor do texto. O comprimento
 * de cada linha é fixo (textLength): o desenho não muda enquanto a Archivo carrega.
 */
const COMPLETA = {
  viewBox: "0 8 490 104",
  texto: 188,
  sigla: { y: 76.5, tamanho: 94, comprimento: 300 },
  nome: { y: 110.4, tamanho: 20.8, comprimento: 274 },
} as const;

/**
 * A logo. `completa`: símbolo + "H e H" + "TERRAPLANAGEM" (rodapé, tamanhos grandes).
 * `compacta`: o ícone reduzido e o nome numa linha só (cabeçalho), como no topo das pranchas.
 */
export function Logo({ variante = "completa", className }: { variante?: "completa" | "compacta"; className?: string }) {
  if (variante === "compacta") {
    return (
      <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
        <Icone className="size-8 shrink-0 text-amarelo-maquina md:size-9" />
        <span className="text-[1.0625rem] font-semibold md:text-lg">{site.nome}</span>
      </span>
    );
  }

  const { viewBox, texto, sigla, nome } = COMPLETA;
  return (
    <span className={className}>
      <span className="sr-only">{site.nome}</span>
      <svg viewBox={viewBox} aria-hidden="true" focusable="false" className="block h-full w-auto overflow-visible">
        <g style={{ color: "var(--amarelo-maquina)" }}>
          <SimboloDesenho />
        </g>
        <text
          x={texto}
          y={sigla.y}
          fontSize={sigla.tamanho}
          textLength={sigla.comprimento}
          lengthAdjust="spacing"
          fill="currentColor"
          className="logo-sigla"
        >
          {site.marca}
        </text>
        <text
          x={texto}
          y={nome.y}
          fontSize={nome.tamanho}
          textLength={nome.comprimento}
          lengthAdjust="spacing"
          fill="currentColor"
          className="logo-nome"
        >
          {site.logo.nome}
        </text>
      </svg>
    </span>
  );
}
