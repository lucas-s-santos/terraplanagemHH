import { site } from "@/content/site";
import { whatsappHref } from "@/lib/whatsapp";

export function Hero() {
  const { hero, telefones } = site;
  const telefone = telefones[0];

  return (
    <section data-stop="hero" aria-labelledby="hero-titulo" className="relative flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-(--max-conteudo) items-center justify-between px-(--gutter) pt-6 md:pt-8">
        <span className="text-[0.95rem] font-bold tracking-[-0.01em] [font-stretch:112%]">{site.nome}</span>
        <a href={`tel:${telefone.numero}`} className="link-discreto text-[0.95rem] font-medium">
          {telefone.rotulo}
        </a>
      </header>

      <div className="mx-auto flex w-full max-w-(--max-conteudo) flex-1 items-end px-(--gutter) pb-[9svh] md:items-center md:pb-[4svh]">
        <div className="veu-leitura max-w-[44rem]">
          <h1 id="hero-titulo" className="titulo-display text-[clamp(2.4rem,4.9vw,4.75rem)]">
            {hero.titulo}
          </h1>
          <p className="mt-6 max-w-[38ch] text-[1.0625rem] leading-relaxed text-solo-fundo/85 md:text-lg">
            {hero.apoio}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <a href={whatsappHref()} target="_blank" rel="noopener" className="botao-primario">
              {hero.ctaPrincipal}
            </a>
            <a href="#servicos" className="link-secundario">
              {hero.ctaSecundario}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
