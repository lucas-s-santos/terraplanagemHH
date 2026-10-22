import { site } from "@/content/site";

/** Uma parada por serviço: texto à esquerda, o clipe da máquina trabalhando ao fundo. */
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
          data-stop={servico.id}
          data-regua={servico.nome}
          className="flex min-h-[115svh] items-end pb-[12svh] md:items-center md:pb-0"
        >
          <div className="mx-auto w-full max-w-(--max-conteudo) px-(--gutter)">
            <div className="veu-leitura max-w-[30rem]">
              <h3 className="titulo-secao text-[clamp(2rem,3.4vw,3.1rem)]">{servico.nome}</h3>
              <p className="mt-4 max-w-[34ch] text-lg leading-relaxed text-poeira/85">{servico.texto}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
