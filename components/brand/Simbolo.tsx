import { MAQUINA, type Retangulo, SIMBOLO_CAIXA, TERRENO, curvaD, tracoD } from "@/lib/logo/marca";

const Ret = ({ x, y, w, h, r }: Retangulo) => <rect x={x} y={y} width={w} height={h} rx={r || undefined} />;

/**
 * O desenho do símbolo (a retroescavadeira sobre a curva e o platô), em `currentColor`, nas
 * unidades de lib/logo/marca.ts. Vai dentro de um <svg> (a logo completa) ou sozinho (<Simbolo />).
 */
export function SimboloDesenho() {
  return (
    <>
      <g fill="currentColor">
        {MAQUINA.retangulos.map((r) => (
          <Ret key={`${r.x}-${r.y}`} {...r} />
        ))}
        {MAQUINA.caminhos.map(({ d, vazado }) => (
          <path key={d} d={d} fillRule={vazado ? "evenodd" : undefined} />
        ))}
        <Ret {...TERRENO.plato} />
      </g>
      <g fill="none" stroke="currentColor">
        {MAQUINA.rodas.map(({ cx, cy, r, traco }) => (
          <circle key={cx} cx={cx} cy={cy} r={r} strokeWidth={traco} />
        ))}
        {MAQUINA.bracos.map(({ pontos, largura, ponta }) => (
          <path
            key={tracoD(pontos)}
            d={tracoD(pontos)}
            strokeWidth={largura}
            strokeLinecap={ponta === "redonda" ? "round" : undefined}
            strokeLinejoin="round"
          />
        ))}
        <path d={curvaD(TERRENO.curva.trechos)} strokeWidth={TERRENO.curva.largura} />
      </g>
    </>
  );
}

/** O símbolo sozinho, recortado no desenho (sem o vazio do alto do quadro). Sempre decorativo. */
export function Simbolo({ className }: { className?: string }) {
  const { x, y, w, h } = SIMBOLO_CAIXA;
  return (
    <svg viewBox={`${x} ${y - 1} ${w + 1} ${h + 2}`} aria-hidden="true" focusable="false" className={className}>
      <SimboloDesenho />
    </svg>
  );
}
