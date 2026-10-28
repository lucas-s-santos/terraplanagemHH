"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { useStageStore } from "@/lib/store";
import { whatsappHref } from "@/lib/whatsapp";
import { ChatIcon } from "./ChatIcon";

/**
 * Atalho do WhatsApp no celular: aparece quando o hero sai e some quando o contato entra (dali para
 * baixo o botão grande e o rodapé já resolvem). Também sai da frente das seções que ocupam a tela
 * inteira ([data-tela-cheia], como a retroescavadeira), onde ficaria em cima da legenda.
 */
export function FloatingWhatsApp() {
  const revealed = useStageStore((state) => state.revealed);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const contact = document.getElementById("contato");
    if (!hero || !contact) return;
    const blocking = new Set<Element>();
    let inHero = true;
    let atContact = false;
    const update = () => setVisible(!inHero && !atContact && blocking.size === 0);

    // O hero conta até a borda de baixo dele passar de 40% da tela.
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        inHero = entry.isIntersecting;
        update();
      },
      { rootMargin: "-40% 0px 0px 0px" },
    );
    // O contato conta a partir de quando a borda de cima entra na tela, e continua depois que ele passa.
    const contactObserver = new IntersectionObserver(([entry]) => {
      atContact = entry.isIntersecting || entry.boundingClientRect.top < 0;
      update();
    });
    // A seção de tela cheia conta quando chega à metade de cima da tela (antes disso, a legenda,
    // que fica embaixo do palco, ainda não alcançou o canto do atalho).
    const fullScreenObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) blocking.add(entry.target);
          else blocking.delete(entry.target);
        }
        update();
      },
      { rootMargin: "0px 0px -50% 0px" },
    );
    heroObserver.observe(hero);
    contactObserver.observe(contact);
    document.querySelectorAll("[data-tela-cheia]").forEach((el) => fullScreenObserver.observe(el));

    return () => {
      heroObserver.disconnect();
      contactObserver.disconnect();
      fullScreenObserver.disconnect();
    };
  }, []);

  const { atalho } = site.whatsapp;
  return (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noopener"
      aria-label={atalho.rotulo}
      data-visivel={revealed && visible}
      className="atalho-whatsapp"
    >
      <ChatIcon className="size-[1.15rem] text-amarelo-maquina" />
      {atalho.texto}
    </a>
  );
}
