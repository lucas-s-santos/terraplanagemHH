import { site } from "@/content/site";
import { TerrainEdge } from "./TerrainEdge";

/** Rodapé: a página termina em chão firme. Os contatos por extenso e a marca entalhada na terra. */
export function SiteFooter() {
  const { contato, telefones, email, endereco } = site;
  const rotulo = "text-sm font-semibold text-poeira/60";

  return (
    <footer className="relative z-10 bg-solo-fundo text-poeira">
      <TerrainEdge />
      <div className="mx-auto w-full max-w-(--max-conteudo) overflow-hidden px-(--gutter) pt-[10svh] pb-8">
        <dl className="grid gap-x-16 gap-y-8 sm:grid-cols-[auto_auto_1fr]">
          <div>
            <dt className={rotulo}>{contato.rotulos.telefones}</dt>
            <dd className="mt-2">
              <ul className="space-y-1">
                {telefones.map((telefone) => (
                  <li key={telefone.numero}>
                    <a href={`tel:${telefone.numero}`} className="link-discreto text-lg font-medium">
                      {telefone.rotulo}
                    </a>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt className={rotulo}>{contato.rotulos.email}</dt>
            <dd className="mt-2">
              <a href={`mailto:${email}`} className="link-discreto text-lg font-medium">
                {email}
              </a>
            </dd>
          </div>
          <div>
            <dt className={rotulo}>{contato.rotulos.endereco}</dt>
            <dd className="mt-2 max-w-[28ch] text-lg leading-snug">{endereco}</dd>
          </div>
        </dl>

        <div className="@container mt-[10svh]">
          <p aria-hidden="true" className="marca-entalhada">
            {site.marca}
          </p>
        </div>
        <p className="mt-8 text-sm text-poeira/60">
          {site.nome} · {site.rodape.linha}
        </p>
      </div>
    </footer>
  );
}
