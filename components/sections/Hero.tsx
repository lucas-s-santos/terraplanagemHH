import { Logo } from "@/components/brand/Logo";
import { LevelingTitle } from "@/components/motion/LevelingTitle";
import { site } from "@/content/site";
import { whatsappHref } from "@/lib/whatsapp";
import { HeroLogo } from "./HeroLogo";

export function Hero() {
  const { hero, telefones } = site;
  const telefone = telefones[0];

  return (
    <section id="inicio" data-stop="hero" data-regua={site.regua.inicio} aria-labelledby="hero-titulo" className="relative flex min-h-svh flex-col">
      <header className="relative z-10 mx-auto flex w-full max-w-(--max-conteudo) items-center justify-between px-(--gutter) pt-6 md:pt-8">
        <Logo className="block h-9 text-poeira md:h-11" />
        <a href={`tel:${telefone.numero}`} className="link-discreto inline-flex min-h-11 items-center text-[0.95rem] font-medium">
          {telefone.rotulo}
        </a>
      </header>

      {/* A logo 3D: no celular no fluxo, entre o cabeçalho e o texto (em tela baixa, posicionada por
          altura fixa, ela invadia o título); na tela larga, solta à direita, sobre o vídeo desfocado. */}
      <HeroLogo className="relative mt-[2svh] h-[30svh] w-full shrink-0 md:absolute md:inset-x-auto md:top-[13svh] md:right-[3vw] md:mt-0 md:h-[70svh] md:w-[46vw]" />

      <div className="mx-auto flex w-full max-w-(--max-conteudo) flex-1 items-end px-(--gutter) pb-[9svh] md:items-center md:pb-[4svh]">
        <div className="veu-leitura max-w-[44rem]">
          <LevelingTitle id="hero-titulo" text={hero.titulo} className="titulo-display text-[clamp(2.4rem,4.9vw,4.75rem)]" />
          <p className="mt-6 max-w-[38ch] text-[1.0625rem] leading-relaxed text-poeira/85 md:text-lg">
            {hero.apoio}
          </p>
          {/* No celular, o link fica sempre embaixo do botão: lado a lado, ele cabia ou não conforme a fonte já tivesse chegado. */}
          <div className="mt-9 flex flex-col items-start gap-x-8 gap-y-4 sm:flex-row sm:flex-wrap sm:items-center">
            <a href={whatsappHref()} target="_blank" rel="noopener" className="botao-primario" data-poeira>
              {hero.ctaPrincipal}
            </a>
            <a href="#servicos" className="link-secundario inline-flex min-h-11 items-center">
              {hero.ctaSecundario}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
