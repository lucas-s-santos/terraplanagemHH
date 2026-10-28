import { ChatIcon } from "@/components/whatsapp/ChatIcon";
import { site } from "@/content/site";
import { whatsappHref } from "@/lib/whatsapp";

/**
 * Uma parada por serviço: texto à esquerda, o clipe da máquina trabalhando ao fundo. Embaixo, um
 * link discreto que abre o WhatsApp com o serviço já escrito na mensagem.
 */
export function Services() {
  const { servicos } = site;

  return (
    <section id="servicos" aria-labelledby="servicos-titulo">
      <h2 id="servicos-titulo" className="sr-only">
        {servicos.titulo}
      </h2>
      {servicos.itens.map((servico) => (
        <article
          key={servico.id}
          id={servico.id}
          data-regua={servico.nome}
          className="flex min-h-[115svh] items-end pb-[12svh] md:items-center md:pb-0"
        >
          <div className="mx-auto w-full max-w-(--max-conteudo) px-(--gutter)">
            {/* O marcador da parada é o texto, não o artigo: no celular o texto fica embaixo, e pelo centro
                do artigo o clipe trocava para o do serviço seguinte com o texto ainda na tela. */}
            <div data-stop={servico.id} className="veu-leitura max-w-[30rem]">
              <h3 className="titulo-secao text-[clamp(2rem,3.4vw,3.1rem)]">{servico.nome}</h3>
              <p className="mt-4 max-w-[34ch] text-lg leading-relaxed text-poeira/85">{servico.texto}</p>
              <a href={whatsappHref(servico.mensagem)} target="_blank" rel="noopener" className="link-orcamento mt-4">
                <ChatIcon className="size-[1.1rem] shrink-0 text-amarelo-maquina" />
                {servico.orcamento}
              </a>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
