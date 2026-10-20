/**
 * Toda a copy do site. Componentes não têm texto fixo.
 * Pendências com a cliente estão em docs/BRIEFING.md.
 */
export const site = {
  nome: "H e H Terraplanagem",
  marca: "H e H",
  regiao: "Alterosa – MG",
  endereco: "Rodovia MG 184, s/n, trevo de Alterosa, Alterosa/MG",
  email: "contato@hehterraplanagem.com.br",
  telefones: [
    { rotulo: "(35) 99974-6093", numero: "+5535999746093" },
    { rotulo: "(35) 98821-1216", numero: "+5535988211216" },
    { rotulo: "(35) 98889-7949", numero: "+5535988897949" },
  ],
  whatsapp: {
    // PROVISÓRIO: a cliente ainda não confirmou qual número é o WhatsApp.
    numero: "5535999746093",
    confirmado: false,
    mensagem: "Olá! Vim pelo site e quero fazer um orçamento.",
  },

  seo: {
    titulo: "H e H Terraplanagem | Terraplanagem e destoca em Alterosa – MG",
    descricao:
      "Terraplanagem, destoca de eucalipto, reservatórios, estradas rurais e preparo de solo em Alterosa e região.",
  },

  hero: {
    titulo: "Transformando terrenos em obras prontas para construir.",
    apoio:
      "Terraplanagem, destoca, estradas e preparo de solo para o campo e para a obra. Alterosa e região.",
    ctaPrincipal: "Chamar no WhatsApp",
    ctaSecundario: "Ver serviços",
  },

  servicos: {
    titulo: "Serviços",
    itens: [
      {
        id: "reservatorio",
        nome: "Reservatório de água",
        texto: "Represas e tanques escavados e compactados para segurar água na seca.",
      },
      {
        id: "preparo-solo",
        nome: "Preparação de solo",
        texto: "Descompactação e acerto da terra antes do plantio.",
      },
      {
        id: "aracao",
        nome: "Aração e gradagem",
        texto: "Terra virada e destorroada, no ponto de plantar.",
      },
      {
        id: "estradas",
        nome: "Abertura e manutenção de estradas",
        texto: "Estradas rurais abertas e recuperadas, com caimento e saída de água para aguentar a chuva.",
      },
      {
        id: "destoca",
        nome: "Destoca de eucalipto",
        texto: "Tocos e raízes arrancados. A área fica limpa para plantar ou construir.",
      },
      {
        id: "terrenos",
        nome: "Preparação de terrenos",
        texto: "Corte, aterro e nivelamento para a obra começar no plano certo.",
      },
    ],
  },

  // A sequência é do briefing; os textos de cada etapa ainda precisam do aval da cliente.
  processo: {
    titulo: "Como trabalhamos",
    etapas: [
      { nome: "Contato", texto: "Você chama no WhatsApp e conta o serviço e o tamanho da área." },
      { nome: "Visita técnica", texto: "Vamos até o terreno ver o solo, o acesso das máquinas e as medidas." },
      { nome: "Orçamento", texto: "Você recebe o valor e o prazo antes de qualquer máquina entrar." },
      { nome: "Execução", texto: "Cada etapa com a máquina certa, do jeito que foi combinado." },
      { nome: "Entrega", texto: "O terreno pronto, conferido junto com você." },
    ],
  },

  contato: {
    titulo: "Conte o que o seu terreno precisa.",
    apoio: "Atendemos Alterosa e região. O orçamento começa com uma conversa no WhatsApp.",
    cta: "Chamar no WhatsApp",
    rotulos: { telefones: "Telefones", email: "E-mail", endereco: "Endereço" },
  },

  rodape: {
    linha: "Terraplanagem e destoca em Alterosa – MG",
  },
} as const;

export type ServiceId = (typeof site.servicos.itens)[number]["id"];
