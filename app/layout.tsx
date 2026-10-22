import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Archivo } from "next/font/google";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/siteUrl";
import "lenis/dist/lenis.css";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

// A imagem de compartilhamento é o app/opengraph-image.jpg (convenção do Next).
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: site.seo.titulo,
  description: site.seo.descricao,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.nome,
    title: site.seo.titulo,
    description: site.seo.descricao,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: site.seo.titulo, description: site.seo.descricao },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
