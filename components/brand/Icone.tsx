import { ICONE, ICONE_LADO, curvaD } from "@/lib/logo/marca";

/** O ícone reduzido (o H com a curva e o platô), em `currentColor`. Sempre decorativo. */
export function Icone({ className }: { className?: string }) {
  const { hastes, curva, plato } = ICONE;
  return (
    <svg viewBox={`0 0 ${ICONE_LADO} ${ICONE_LADO}`} aria-hidden="true" focusable="false" className={className}>
      <g fill="currentColor">
        {hastes.map(({ x, y, w, h, r }) => (
          <rect key={x} x={x} y={y} width={w} height={h} rx={r} />
        ))}
        <rect x={plato.x} y={plato.y} width={plato.w} height={plato.h} />
      </g>
      <path d={curvaD(curva.trechos)} fill="none" stroke="currentColor" strokeWidth={curva.largura} />
    </svg>
  );
}
