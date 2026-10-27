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
    // PROVISÓRIO: o domínio ainda não foi confirmado com a cliente. Na Vercel, NEXT_PUBLIC_SITE_URL tem precedência.
    url: "https://hehterraplanagem.com.br",
    titulo: "H e H Terraplanagem | Terraplanagem e destoca em Alterosa – MG",
    descricao:
      "Terraplanagem, destoca de eucalipto, reservatórios, estradas rurais e preparo de solo em Alterosa e região.",
    // Para os dados estruturados (LocalBusiness).
    endereco: { rua: "Rodovia MG 184, s/n, trevo de Alterosa", cidade: "Alterosa", estado: "MG", pais: "BR" },
    areaAtendida: "Alterosa e região, Sul de Minas Gerais",
  },

  hero: {
    // Linhas fixas (\n): a quebra não depende da fonte, então a troca da reserva pela Archivo (larga) não
    // mexe no layout (antes, 3 linhas viravam 4 e o hero inteiro pulava: CLS 0,13 no 4G).
    titulo: "Transformando\nterrenos em\nobras prontas\npara construir.",
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

  // Máquinas: para que serve cada uma (explicação, não "nossa frota": a lista da cliente ainda não veio).
  // Os ids das peças são os pontos da planta em lib/backhoe/blueprint.ts.
  maquinas: {
    titulo: "A máquina certa para cada serviço",
    apoio: "Cada uma resolve uma parte da obra. Veja a retroescavadeira, peça por peça.",
    nome: "Retroescavadeira",
    abertura: {
      nome: "Duas máquinas numa só",
      texto: "Na frente, uma pá carregadeira. Atrás, uma escavadeira. Ela anda, carrega e cava sem trocar de máquina.",
    },
    pecas: [
      {
        id: "loader",
        nome: "Pá carregadeira",
        texto: "Raspa, carrega e espalha terra solta. Também ajuda a deixar o chão no nível.",
      },
      {
        id: "stabilizer",
        nome: "Sapatas",
        texto: "Antes de cavar, descem e travam a máquina no chão. Firme, ela não balança e o corte sai no lugar certo.",
      },
      {
        id: "boom",
        nome: "Lança e braço",
        texto: "Dão o alcance: abrem valas e cavam fundo sem a máquina sair do lugar.",
      },
      {
        id: "bucket",
        nome: "Caçamba",
        texto: "Os dentes rasgam o solo. A caçamba enche, sobe e despeja a terra ao lado da vala.",
      },
    ],
  },

  // Antes e depois: pares ilustrativos do Flow (não são obras da empresa, e a legenda diz isso).
  // Só aparecem os pares com imagem em content/media.ts; sem nenhum, a seção sai.
  antesDepois: {
    titulo: "Antes e depois",
    apoio: "O mesmo lugar, antes e depois do serviço. Arraste a caçamba para raspar o terreno.",
    rotuloAntes: "Antes",
    rotuloDepois: "Depois",
    rotuloControle: "Caçamba: arraste para comparar o antes e o depois",
    rotuloPares: "Escolha o serviço",
    aviso: "Imagens ilustrativas.",
    pares: [
      {
        id: "destoca",
        nome: "Destoca",
        altAntes: "Área de eucalipto cortado, com tocos, raízes e galhos no chão",
        altDepois: "A mesma área sem tocos, com a terra gradeada e pronta para plantar",
      },
      {
        id: "terreno",
        nome: "Terreno",
        altAntes: "Lote em declive com mato alto e uma erosão de terra vermelha",
        altDepois: "O mesmo lote nivelado e compactado, com o talude cortado ao fundo",
      },
      {
        id: "estrada",
        nome: "Estrada rural",
        altAntes: "Estrada de terra com buracos, poças e valetas de erosão",
        altDepois: "A mesma estrada patrolada, com caimento e valetas laterais",
      },
    ],
  },

  // Onde atuamos: maquete da região. A lista de cidades atendidas ainda não veio da cliente: o mapa mostra
  // os municípios vizinhos e a distância em linha reta, sem prometer área de atendimento.
  atuacao: {
    titulo: "Onde atuamos",
    texto:
      "Saímos do trevo de Alterosa, na MG-184, na região do Lago de Furnas. Sua obra fica em outra cidade? Chame no WhatsApp e consulte.",
    rotuloLista: "Distância em linha reta a partir de Alterosa",
    rotuloMapa: "Maquete do relevo da região, com Alterosa no centro e as cidades vizinhas",
    origem: { nome: "Alterosa", detalhe: "Trevo da MG-184", lat: -21.254, lon: -46.143 },
    // Sedes dos municípios vizinhos (plano municipal de saúde de Alterosa); posições aproximadas.
    cidades: [
      { nome: "Areado", lat: -21.359, lon: -46.146 },
      { nome: "Conceição da Aparecida", lat: -21.096, lon: -46.205 },
      { nome: "Monte Belo", lat: -21.326, lon: -46.368 },
      { nome: "Alfenas", lat: -21.429, lon: -45.947 },
      { nome: "Carmo do Rio Claro", lat: -20.972, lon: -46.126 },
      { nome: "Nova Resende", lat: -21.129, lon: -46.416 },
    ],
    /** Anéis de distância, em km. */
    aneis: [15, 30],
  },

  contato: {
    titulo: "Conte o que o seu terreno precisa.",
    apoio: "Atendemos Alterosa e região. O orçamento começa com uma conversa no WhatsApp.",
    cta: "Chamar no WhatsApp",
    rotulos: { telefones: "Telefones", email: "E-mail", endereco: "Endereço" },
  },

  // Régua de nível (a barra de rolagem do site): uma estaca por seção.
  regua: {
    rotulo: "Seções da página",
    inicio: "Início",
    contato: "Contato",
  },

  rodape: {
    linha: "Terraplanagem e destoca em Alterosa – MG",
  },
} as const;

export type ServiceId = (typeof site.servicos.itens)[number]["id"];
export type BeforeAfterId = (typeof site.antesDepois.pares)[number]["id"];
