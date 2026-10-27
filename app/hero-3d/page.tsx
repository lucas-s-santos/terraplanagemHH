import type { Metadata } from "next";
import { Landing } from "@/components/Landing";

// Versão de comparação (hero 3D x hero em vídeo): fora do Google, e o canônico é a home.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

export default function Hero3d() {
  return <Landing hero3d />;
}
