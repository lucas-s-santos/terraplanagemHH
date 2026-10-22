import { site } from "@/content/site";
import { siteUrl } from "@/lib/siteUrl";

/**
 * Dados estruturados (schema.org) da empresa, para o Google mostrar endereço, telefone e
 * área atendida nas buscas locais. GeneralContractor é o tipo de LocalBusiness mais próximo
 * de uma empresa de terraplanagem.
 */
export function LocalBusinessJsonLd() {
  const { nome, email, telefones, servicos, seo } = site;
  const data = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    name: nome,
    url: siteUrl.href,
    image: new URL("/opengraph-image.jpg", siteUrl).href,
    description: seo.descricao,
    email,
    telephone: telefones[0].numero,
    address: {
      "@type": "PostalAddress",
      streetAddress: seo.endereco.rua,
      addressLocality: seo.endereco.cidade,
      addressRegion: seo.endereco.estado,
      addressCountry: seo.endereco.pais,
    },
    areaServed: seo.areaAtendida,
    knowsAbout: servicos.itens.map((servico) => servico.nome),
  };

  return (
    <script
      type="application/ld+json"
      // O "<" escapado impede que um texto feche a tag <script> por engano.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
