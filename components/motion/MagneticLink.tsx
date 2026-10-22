"use client";

import { type ReactNode, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface MagneticLinkProps {
  href: string;
  className: string;
  children: ReactNode;
  /** Quanto o link segue o cursor (fração da distância até o centro). */
  strength?: number;
  /** Solta poeira ao passar o mouse (ver DustOnHover). */
  poeira?: boolean;
}

/**
 * Link "magnético": dentro de uma área um pouco maior que ele, é puxado de leve na direção
 * do cursor. Só com mouse; com movimento reduzido ou toque, é um link comum.
 */
export function MagneticLink({ href, className, children, strength = 0.3, poeira = false }: MagneticLinkProps) {
  const field = useRef<HTMLSpanElement>(null);
  const link = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const area = field.current;
      const target = link.current;
      if (!area || !target) return;
      if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;

      const toX = gsap.quickTo(target, "x", { duration: 0.6, ease: "power3.out" });
      const toY = gsap.quickTo(target, "y", { duration: 0.6, ease: "power3.out" });
      // Mede pela área (parada), não pelo link (que se move): sem realimentação.
      const move = (event: PointerEvent) => {
        const rect = area.getBoundingClientRect();
        toX((event.clientX - (rect.left + rect.width / 2)) * strength);
        toY((event.clientY - (rect.top + rect.height / 2)) * strength);
      };
      const leave = () => {
        toX(0);
        toY(0);
      };
      area.addEventListener("pointermove", move);
      area.addEventListener("pointerleave", leave);
      return () => {
        area.removeEventListener("pointermove", move);
        area.removeEventListener("pointerleave", leave);
      };
    },
    { scope: field },
  );

  return (
    // A área de atração passa um pouco do botão (padding) sem mudar o layout (margem negativa).
    <span ref={field} className="-m-8 inline-block p-8">
      <a ref={link} href={href} target="_blank" rel="noopener" className={className} data-poeira={poeira || undefined}>
        {children}
      </a>
    </span>
  );
}
