import { Logo } from "@/components/brand/Logo";
import { site } from "@/content/site";
import { whatsappHref } from "@/lib/whatsapp";
import { ContourField } from "./ContourField";
import { TerrainEdge } from "./TerrainEdge";

/** Busca do endereço no Google Maps (abre o app no celular). */
const mapsHref = (endereco: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;

/**
 * Rodapé: a página termina em chão firme. A logo e o WhatsApp em cima; os contatos por extenso,
 * o endereço com o mapa e os serviços (que levam a cada parada) em colunas; a marca gigante bem
 * apagada ao fundo, saindo pela borda.
 */
export function SiteFooter() {
  const { contato, telefones, email, endereco, rodape, servicos } = site;
  const rotulo = "text-sm font-semibold text-poeira/60";
  const link = "link-discreto inline-flex min-h-11 items-center text-lg font-medium";

  return (
    <footer aria-label={rodape.rotuloRodape} className="relative z-10 bg-solo-fundo text-poeira">
      <TerrainEdge />
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <ContourField layout="rodape" />
        <Logo nome={false} decorativa className="marca-fundo" />
      </div>

      <div className="mx-auto w-full max-w-(--max-conteudo) px-(--gutter) pt-[12svh] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Logo className="block h-16 text-poeira md:h-20" />
            <p className="mt-6 max-w-[40ch] leading-relaxed text-poeira/70">{rodape.linha}</p>
          </div>
          <a href={whatsappHref()} target="_blank" rel="noopener" className="botao-primario self-start md:self-auto" data-poeira>
            {contato.cta}
          </a>
        </div>

        <div className="mt-14 grid gap-x-12 gap-y-10 border-t border-poeira/12 pt-10 sm:grid-cols-2 lg:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
          <div>
            <h2 className={rotulo}>{contato.rotulos.telefones}</h2>
            <ul className="mt-2">
              {telefones.map((telefone) => (
                <li key={telefone.numero}>
                  <a href={`tel:${telefone.numero}`} className={link}>
                    {telefone.rotulo}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={rotulo}>{contato.rotulos.email}</h2>
            <a href={`mailto:${email}`} className={`${link} mt-2 break-all`}>
              {email}
            </a>
          </div>
          <div>
            <h2 className={rotulo}>{contato.rotulos.endereco}</h2>
            <p className="mt-4 max-w-[30ch] text-lg leading-snug">{endereco}</p>
            <a href={mapsHref(endereco)} target="_blank" rel="noopener" className="link-secundario mt-3 inline-flex min-h-11 items-center">
              {rodape.mapa}
            </a>
          </div>
          <nav aria-label={rodape.rotuloServicos}>
            <h2 className={rotulo}>{rodape.rotuloServicos}</h2>
            <ul className="mt-2">
              {servicos.itens.map((servico) => (
                <li key={servico.id}>
                  <a href={`#${servico.id}`} className="link-discreto inline-flex min-h-10 items-center text-poeira/85">
                    {servico.nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-poeira/12 pt-6 text-sm text-poeira/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.nome} · {site.regiao}
          </p>
          <a href="#inicio" className="link-discreto inline-flex min-h-11 items-center">
            {rodape.topo}
          </a>
        </div>
      </div>
    </footer>
  );
}
