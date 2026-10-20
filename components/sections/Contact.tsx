import { MagneticLink } from "@/components/motion/MagneticLink";
import { site } from "@/content/site";
import { whatsappHref } from "@/lib/whatsapp";

/**
 * Contato final, sobre o clipe do terreno pronto. Só o essencial, como no hero:
 * o convite e o WhatsApp grande. Telefones, e-mail e endereço ficam no chão do rodapé.
 */
export function Contact() {
  const { contato } = site;

  return (
    <section data-stop="contato" aria-labelledby="contato-titulo" className="relative flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-(--max-conteudo) flex-1 items-end px-(--gutter) pb-[12svh] md:items-center md:pb-0">
        <div className="veu-leitura max-w-[34rem]">
          <h2 id="contato-titulo" className="titulo-display text-[clamp(2.2rem,4vw,3.8rem)]">
            {contato.titulo}
          </h2>
          <p className="mt-6 max-w-[38ch] text-[1.0625rem] leading-relaxed text-poeira/85 md:text-lg">
            {contato.apoio}
          </p>
          <div className="mt-10">
            <MagneticLink href={whatsappHref()} className="botao-primario botao-grande">
              {contato.cta}
            </MagneticLink>
          </div>
        </div>
      </div>
    </section>
  );
}
