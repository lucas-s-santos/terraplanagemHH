# Estado do projeto: onde paramos

Última sessão: 27/10/2026, na branch **`feat/retroescavadeira`** (commits `367ab2c` e o seguinte; sem push). A **`main` é a versão em vídeo** desde 23/10; a versão 3D das ilhas ficou na tag **`versao-3d`**.

Novidades desta sessão (27/10):
- **Hero decidido: fica o vídeo.** A retroescavadeira 3D saiu do hero e virou a seção **"A máquina certa para cada serviço"** (`components/sections/Machines.tsx` + `lib/backhoe/blueprint.ts`). A rota `/hero-3d` foi apagada; a cena do hero 3D (chão com vala, poeira, torrões, fundo do Flow) está guardada no commit `367ab2c`.
- **Antes e depois** (`components/sections/BeforeAfter.tsx`): slider com a caçamba como controle, pronto e testado (mouse, toque e teclado). **Só aparece quando chegar o primeiro par do Flow** (`beforeAfter` em `content/media.ts`). Legenda "Imagens ilustrativas".
- **Emenda dos loops sem a máquina dupla:** a câmera do Flow anda o clipe todo e nenhum quadro do começo bate com um do fim, então a emenda passa por uma lufada de poeira (`npm run clip`). Os 9 clipes foram reprocessados.
- **9:16 do hero sem a faixa:** os últimos 30% eram outra imagem colada; trocados por chão desfocado (original corrigido em `media-originais/hero-9x16_flow_*_sem-faixa.mp4`).
- **Desempenho:** capas e fotos só da parada atual e das próximas (e no formato da tela); antes do vídeo entrar, só o hero baixa. No 4G lento, o vídeo do hero passou a entrar em 6,5 s (antes 19,9 s). Título do hero com linhas fixas: CLS de 0,132 para 0,008.
- `npm run foto` (fotos do Flow para WebP) e paradas `[seletor]@fração` no `npm run shots`.

**Prioridade agora: os 16:9 de estradas, destoca e terrenos** (prompts 5, 6 e 7 do `PROMPTS-FLOW.md`). Na tela larga eles aparecem numa janela vertical, que o Lucas não gostou (27/10), e a janela de "terrenos" aparece por cima do contato na transição. Com o 16:9 ligado em `content/media.ts`, a janela some sozinha.

Todas as paradas têm mídia. Prontos também: régua de nível, curvas de nível, corte de solo 3D, título que nivela, poeira no hover do WhatsApp, SEO (OG + JSON-LD), Onde atuamos e a seção das máquinas. Clipes (todos com a emenda de poeira, 7,1 s):

| Parada | 16:9 | 9:16 |
|---|---|---|
| hero | ✅ 2,15 MB | ✅ 1,33 MB (sem a faixa) |
| reservatório | ✅ 2,07 MB | ✅ 1,22 MB |
| preparo de solo | ✅ 2,25 MB | ❌ recusado (máquina fantasma). No celular, o 16:9 recortado (`focus: 78`) |
| aração | ✅ 2,36 MB | opcional: no celular o 16:9 recortado (`focus: 74`) ficou bom |
| estradas, destoca, terrenos | **faltam (prioridade)**: na tela larga, o 9:16 aparece numa janela à direita | ✅ 1,39 / 1,44 / 1,14 MB |
| contato | ✅ **foto** WebP 99 KB, com zoom lento (`.foto-lenta`) | ✅ foto WebP 125 KB |

Alternativas das fotos do contato em `media-originais/contato-*-alt-*`. Para usar foto em qualquer parada: `photo("<arquivo>")` em `content/media.ts` (WebP em `public/media/`).

**Virada de direção (20/10):** as ilhas 3D deram lugar a **vídeos de máquinas trabalhando**, ilustrativos e gerados no Google Flow, como a cliente já fazia no site dela. O "surreal" (terra suspensa) vai para dentro dos próprios vídeos.
- **Tag `versao-3d`** (`d6ad5ab`): a versão 3D completa, com ilhas por serviço, worker, preloader e painel. O `docs/ESTADO.md` de lá documenta as decisões do 3D.
- **`main`** (desde 23/10, igual à `feat/video`): a camada de vídeo guiada pelo scroll. Ficam o preloader "nivelamento", o painel de terra com "Como trabalhamos", o contato e o rodapé entalhado.

**Clipes que faltam:** os 16:9 de estradas, destoca e terrenos (prioridade) e, opcional, o 9:16 do preparo de solo. Sem 16:9, a tela larga mostra o 9:16 numa janela; sem 9:16, o celular recorta o 16:9.

A direção criativa está em [`BRIEFING.md`](BRIEFING.md) (com a atualização de 20/10 no topo). Este arquivo guarda o estado técnico, as decisões e os próximos passos. **Atualize no fim de cada sessão**: a memória do Claude Code fica na máquina, não vai para o git.

---

## 1. Para continuar em outro computador

1. **Node 24 LTS** (testado com 24.14 e 24.15).
2. Clonar **fora do OneDrive** (ele sincroniza `node_modules` e `.next` e deixa tudo lento):
   ```bash
   git clone https://github.com/lucas-s-santos/terraplanagemHH.git
   cd terraplanagemHH
   git switch feat/video   # versão em vídeo; a main é a 3D
   npm ci
   npm run dev        # http://localhost:3000
   ```
3. **Google Chrome** instalado, para as capturas (`npm run shots`). Ele também decodifica H.264, que o Chromium do Playwright não decodifica.
4. **ffmpeg**, para preparar os clipes (`npm run clip`, seção 7): `winget install --id Gyan.FFmpeg -e`. Já instalado no computador do G: (21/10).
5. Reinstalar as skills, que também são por máquina (seção 8).
6. Os agentes `explorador-haiku` e `operacional-sonnet` estão no repositório (`.claude/agents/`).
7. O `next dev` cria o `AGENTS.md` (regras do Next para agentes). Ele está versionado de propósito: se for apagado, volta.

## 2. Scripts

| Comando | Para quê |
|---|---|
| `npm run dev` | Desenvolvimento |
| `npm run build` / `npm start` | Build de produção (rodar antes de fechar qualquer tarefa visual) |
| `npm run typecheck` | Só o TypeScript |
| `npm run clip -- <original.mp4> <parada> <16x9\|9x16>` | Prepara um clipe do Flow: loop sem pulo (o fim se funde com o começo por trás de uma lufada de poeira, então o clipe fica com 7,1 s), H.264 sem áudio até caber no orçamento (tenta a maior largura com a melhor qualidade) e capa JPEG ≤ 120 KB. Saída em `public/media/` |
| `npm run shots` | Capturas em 1440 px e 390 px + console do navegador → `.shots/`. Espera o preloader sair. Opções: `-- --url http://localhost:3000 --stops hero,reservatorio~preparo-solo,fim --only mobile --reduced`. `a~b` = meio do caminho entre duas paradas (`terrenos~contato` cai no painel de terra, hoje dentro da seção das máquinas); `fim` = rodapé; `[seletor]@0.4` = 40% do trecho em que um bloco alto atravessa a tela (ex.: `[data-pecas]@0.5`, o meio da seção das máquinas) |
| `npm run foto -- <original> <nome> [largura]` | Foto do Flow para WebP (1600 px, até 180 KB) em `public/media/<nome>.webp`. Para os pares do antes e depois e as fotos da frota |

**O que conferir nas capturas:** texto legível sobre o vídeo (véu escuro à esquerda no desktop e embaixo no celular); o clipe certo em cada parada; no meio do caminho, os dois clipes se fundindo; console sem erros.

Página inteira: `npm run shots -- --stops hero,reservatorio,preparo-solo,aracao,estradas,destoca,terrenos,terrenos~contato,contato,fim`.

Com o Lenis, uma captura logo depois de pular o scroll pode sair "fantasma" (duas posições sobrepostas). Se aparecer, aumente o `--wait` antes de concluir que é um bug.

**Canvas 3D apagado ou vazio numa captura** depois de um salto direto para o meio de uma seção: no Chrome das capturas (sem GPU) a cena leva segundos para ser criada, e o canvas só acende quando ela fica pronta. Num navegador de verdade é rápido. Para conferir, no console (só em dev): `__planta.info()` mostra se o laço da seção das máquinas está rodando.

**Clipes de teste:** `public/media/teste/` (no `.gitignore`) tem clipes falsos (listras com o nome da parada), gerados no próprio Chrome com `MediaRecorder`. Para testar a camada sem os clipes reais, aponte o `content/media.ts` para eles e **volte para `null` antes do commit**.

## 3. Mapa do código

| Arquivo | Responsabilidade |
|---|---|
| `styles/tokens.css` | Tokens (fonte da verdade) |
| `app/globals.css` | Tailwind 4 (`@theme inline` mapeando os tokens), fundo de terra, entrada da mídia (`.palco`), véu sobre o vídeo (`.veu-video`), botões, links, preloader, marca entalhada |
| `content/site.ts` | Toda a copy, telefones, WhatsApp, SEO |
| `content/media.ts` | **Um clipe por parada** (16:9, 9:16 opcional, capas, ponto de recorte). `null` = fundo de terra |
| `lib/stops.ts` | As paradas na ordem da página: `hero`, os 6 serviços, `contato` |
| `lib/store.ts` | zustand: `stop` (parada contínua), `load` (0 a 1, só sobe) e `revealed` (o vídeo entrou) |
| `lib/useMediaQuery.ts` | Media query reativa (`usePrefersReducedMotion` usa) |
| `components/media/MediaStage.tsx` | **A camada de mídia fixa**: clipes empilhados, crossfade entre 35% e 65% do caminho, só tocam os visíveis, só baixam o atual e os próximos, recorte do 16:9 no celular |
| `components/media/Preloader.tsx` | Preloader "nivelamento": linha de terreno aplainada por uma lâmina amarela conforme o primeiro clipe carrega |
| `components/motion/SmoothScroll.tsx` | Lenis no ticker do GSAP (desligado com movimento reduzido) |
| `components/motion/ScrollDirector.tsx` | Scroll → `stop`: a parada acontece quando um marcador `[data-stop]` está centralizado. **Vários marcadores da mesma parada = o clipe espera** entre eles |
| `components/motion/ScrollRuler.tsx` | **Régua de nível** (no lugar da barra de rolagem, em telas largas com mouse): perfil de terreno, uma estaca por `[data-regua]`, lâmina amarela no ponto atual (o trecho rolado fica plano). Clique na estaca leva à seção; clique/arrasto no trilho rola até o ponto |
| `lib/scroll.ts` | `scrollToY` (pelo Lenis quando ativo), `maxScroll`, `centerScroll` |
| `components/sections/ContourField.tsx` | Curvas de nível em SVG (geradas por código, sem cruzar) no fundo do painel e do rodapé; desenham-se com o scroll |
| `components/sections/SoilCut.tsx` + `lib/soil/scene.ts` | **Corte de solo 3D** em "Como trabalhamos": bloco com camadas de solo; estacas do gabarito sobem na visita técnica, a frente de corte nivela o topo na execução, entrega com terra batida. Preso na tela (sticky) enquanto as etapas passam. three.js sob demanda, só desenha visível; movimento reduzido = estado final parado |
| `components/Landing.tsx` | A página inteira (`app/page.tsx` só a usa) |
| `lib/backhoe/` | **Retroescavadeira 3D**: `materials.ts` (pintura, aço, borracha, vidro e poeira de terra roxa no shader), `parts.ts` (perfis curvos, pneus, aros, caçambas, cilindros hidráulicos, fusão de peças fixas), `model.ts` (montagem, juntas e os pontos das linhas de chamada: giro, lança, braço, caçamba com balancim e biela, pá, sapatas), `cycle.ts` (pose de transporte e ciclo de escavação), `sky.ts` (reflexo de céu), `blueprint.ts` (a cena da seção das máquinas). A cena do antigo hero 3D está no commit `367ab2c` |
| `components/sections/Machines.tsx` | **A máquina certa para cada serviço**: palco preso na tela (`[data-pecas]`, 5 trechos de 100svh). A retro, de lado, começa como desenho de arestas (planta técnica) e a lâmina amarela a pinta (planos de recorte); depois pá, sapatas, lança e braço e caçamba trabalham, cada uma no seu trecho, com a linha de chamada saindo da legenda. Palavra gigante atrás. Movimento reduzido ou sem WebGL: máquina parada e as legendas em lista |
| `components/sections/BeforeAfter.tsx` | **Antes e depois**: lâmina com a caçamba como controle (`role="slider"`, setas, Home/End), um botão por par, entrada automática até o meio. Só os pares com imagem em `content/media.ts`; sem nenhum, não aparece |
| `components/sections/Region.tsx` + `lib/region/scene.ts` + `lib/geo.ts` | **Onde atuamos**: lista das cidades vizinhas com a distância em linha reta (a informação) e a maquete 3D (bloco de solo, curvas de nível, anéis, estacas, nomes em HTML projetados) |
| `components/motion/LevelingTitle.tsx` | Título do hero que nivela: palavras desniveladas que se alinham no fim do preloader |
| `components/motion/DustOnHover.tsx` | Poeira ao passar o mouse em `[data-poeira]` (os botões do WhatsApp) |
| `components/seo/LocalBusinessJsonLd.tsx` + `lib/siteUrl.ts` | Dados estruturados da empresa; endereço público do site |
| `app/opengraph-image.jpg` (+ `.alt.txt`) | Imagem de compartilhamento |
| `components/motion/MagneticLink.tsx` | Link magnético (o WhatsApp do contato). Só com mouse e sem movimento reduzido |
| `components/sections/{Hero,Services}.tsx` | Hero e as 6 paradas de serviço |
| `components/sections/EarthPanel.tsx` | Painel de terra opaco depois dos serviços. Tem no fim o marcador que segura o clipe de "terrenos" |
| `components/sections/TerrainEdge.tsx` | Borda irregular de bloco de solo (faixa de terra roxa + solo escuro); `flip` para a borda de baixo |
| `components/sections/Process.tsx` | Como trabalhamos: linha de nível (ondulada → reta) desenhada no scroll, etapas que acendem na estaca |
| `components/sections/Contact.tsx` | Contato final (parada `contato`): título, apoio e o WhatsApp grande |
| `components/sections/SiteFooter.tsx` | Chão do rodapé: telefones, e-mail, endereço e o "H e H" entalhado |

**Para adicionar uma parada:** o id em `lib/stops.ts`, o clipe em `content/media.ts` e um marcador `data-stop="<mesmo id>"` na página, **na mesma ordem**.
**Para adicionar uma seção no painel de terra:** é só colocá-la dentro do `<EarthPanel>` em `components/Landing.tsx`. Ordem atual: Como trabalhamos, Máquinas, Antes e depois, Onde atuamos.
**Para ligar um par do antes e depois:** `npm run foto -- media-originais/antes-destoca.jpg antes-destoca` (e o `depois-`), depois `destoca: { antes: "/media/antes-destoca.webp", depois: "/media/depois-destoca.webp" }` em `beforeAfter` (`content/media.ts`).

## 4. Decisões tomadas (e por quê)

- **TypeScript 5.9, não 7.** O 7 é a reescrita nativa e o suporte do Next ainda não foi confirmado.
- **Vídeo no lugar do 3D** (decisão do Lucas, 20/10). A cliente já ilustrava o trabalho do avô com imagens de IA e quer ver máquinas trabalhando. Misturar ilha estilizada com vídeo realista ficaria incoerente. Sem o three.js, a página ficou bem mais leve: a parte que travava no celular era o motor 3D.
- **Clipes em loop por seção, não vídeo "raspado" pelo scroll.** Controlar o `currentTime` pelo scroll trava no iPhone, e uma sequência de imagens pesaria dezenas de MB. O crossfade acontece entre 35% e 65% do caminho, para não passar a maior parte do tempo com dois clipes misturados.
- **Cada camada tem fundo próprio** (`.fundo-terra`). Quando a de cima cobre tudo, a de baixo some e pausa. Sem isso, uma parada sem clipe mostrava o clipe da anterior.
- **A página inteira ficou escura, com texto claro (`poeira`).** Texto escuro sobre vídeo não lê. O véu é escuro à esquerda no desktop e embaixo no celular, com uma faixa leve em cima para o cabeçalho. Antes do vídeo, o fundo é de terra escura, para o texto claro já ser legível no primeiro desenho (LCP).
- **Movimento reduzido:** só as capas. O vídeo nem baixa. Os efeitos da `MediaStage` leem o `matchMedia` na hora: os hooks começam com o valor do servidor (`false`) na hidratação, e a primeira passada ligava o vídeo mesmo com movimento reduzido (e baixava o 16:9 no celular antes do 9:16).
- **Loop com lufada de poeira** (`npm run clip`, 27/10): o clipe do Flow começa e termina em posições diferentes. Sem fusão, o loop dá um pulo; com a fusão simples de 1 s, a máquina aparecia em dois lugares (o "fantasma" do hero). Procurar o par de quadros mais parecido não resolve, porque a câmera anda o clipe todo (diferença ~35 entre começo e fim, contra ~2 entre quadros vizinhos). Agora a emenda dura 0,9 s: um véu da cor `poeira` sobe até 70% e desce, e a troca de imagem acontece só no terço do meio, com o véu mais denso.
- **Celular:** usa o 9:16 quando existe. Sem ele, recorta o 16:9 no ponto `focus` do clipe (padrão 60%).
- **Tela larga sem 16:9:** o 9:16 aparece numa janela vertical à direita (`.janela-video`), sobre a própria capa desfocada (`.janela-fundo`). Os créditos do Flow acabaram antes dos 16:9 de estradas, destoca e terrenos; esticar um vídeo de 720 px de largura para a tela cheia ficaria borrado. Se o 16:9 vier, ele substitui a janela sozinho.
- **Preloader na camada de mídia, não por cima da página.** O texto do hero pinta antes de tudo e continua sendo o LCP. Progresso real em `store.load`: 10% ao hidratar e o resto conforme o primeiro clipe baixa (`progress`, `canplaythrough`). Sem clipe ou com movimento reduzido, vai direto a 100%. Se travar por 15 s, sai mesmo assim.
- **Linha do preloader com `clipPath`, não com tracejado.** Com `vector-effect: non-scaling-stroke`, o Chrome mede o tracejado em pixels de tela, e a linha saía cortada em ~70%.
- **Barra de rolagem nativa escondida só onde a régua aparece** (largura ≥ 48rem e `pointer: fine`). No toque, a barra nativa já é sobreposta e some sozinha, e uma régua por cima do texto atrapalharia.
- **Corte de solo: camadas com 44 linhas por parede e transição suavizada.** Com 12 linhas, os estratos saíam em degraus.
- **Título que nivela por palavra, não por letra.** Separar as letras em spans quebra o kerning (o espaço entre pares como "Tr" e "fo"), o que aparece num título grande. Só `translate`/`rotate` (sem mudar a largura): mudar o eixo `wdth` por palavra mudaria as quebras de linha e causaria layout shift. O texto pinta desnivelado de primeira (é o LCP) e nivela no fim do preloader.
- **Poeira no hover:** nuvem por trás da base do botão e grãos na frente da borda. Por trás, os grãos ficavam escondidos pelo próprio botão.
- **Imagem OG** (`app/opengraph-image.jpg`, 1200×630, 106 KB): quadro do hero aos 4,8 s (torrões no ar) com o título na Archivo e o véu, montada no Chrome a partir de um HTML. Em `next dev` a `og:image` aponta para localhost (comportamento do Next); no build usa o `metadataBase`.
- **JSON-LD `GeneralContractor`** (o tipo de LocalBusiness mais próximo de terraplanagem), com endereço, telefone, área atendida e serviços.
- **Torrões 3D flutuando por cima do site: testados e removidos** (22/10, o Lucas não gostou). O código está no commit `1279aa1`, se um dia servir de base.
- **Entrada do vídeo:** aparece em 1,4 s e se aproxima devagar (escala de 1,08 para 1 em 2,6 s). Substitui o mergulho da câmera do 3D.
- **Depois dos serviços, painel de terra por cima** (decisão do Lucas, 20/10). As seções sobem num bloco de solo opaco, com borda irregular e faixa de terra roxa. O clipe de "terrenos" fica enquanto o painel passa; quando ele termina, entra o do contato.
- **O contato é só o convite e o WhatsApp grande**, como o hero. Telefones, e-mail e endereço ficam no chão do rodapé.
- **"H e H" entalhado:** fonte em `cqi` (31% da largura do contêiner), para ocupar ~95% da largura em qualquer tela. As camadas de solo vêm de `background-clip: text`, e a aresta vem de `filter: drop-shadow` (o `text-shadow` pinta por cima do recorte e apaga as camadas).
- **Botão primário usa `translate` no `:active`, não `transform`:** o ímã do WhatsApp anima o `transform` pelo GSAP, e os dois brigariam.
- **Ao medir desempenho no Windows, aqueça o navegador:** a primeira requisição de um Chrome recém-aberto leva ~1,8 s, e isso não é do site.
- **Editar texto pelo PowerShell 5.1 corrompe acentos:** `Get-Content`/`Set-Content` leem UTF-8 sem BOM como ANSI. Use a ferramenta de edição ou o Node.
- **Retroescavadeira feita em código, não comprada** (decisão do Lucas, 23/10). As referências eram fotos de uma Caterpillar 432F2; a nossa é genérica: sem CAT, sem número de modelo, sem Michelin. Peças com pivô na junta, então tudo anima: lança, braço, caçamba, pá, sapatas e cilindros que esticam.
- **Hero com vídeo; a retroescavadeira 3D virou seção** (decisão do Lucas, 27/10). Ao lado dos vídeos realistas, a máquina 3D no hero parecia computação gráfica (o mesmo motivo que tirou as ilhas). Na seção de máquinas, como planta técnica, o visual de desenho é natural. A versão no hero (na camada de mídia, com chão, vala, monte, poeira e torrões sobre uma foto do Flow) está no commit `367ab2c`.
- **Seção das máquinas como explicação, não como "nossa frota":** a lista da cliente ainda não veio. Os textos dizem o que cada peça faz (verdade sobre qualquer retroescavadeira), sem afirmar que a empresa tem a máquina.
- **Planta que vira máquina com planos de recorte:** cada malha ganha as arestas (`EdgesGeometry`, 28°) num `LineSegments` filho; a parte pintada fica de um lado do plano e o desenho do outro. Sem os cravos dos pneus (instanciados), que deixavam o desenho poluído. Luz mais clara que a do hero: sem a foto de fim de tarde atrás, a luz alaranjada puxava o amarelo para o laranja.
- **Linhas de chamada em ângulo reto:** na tela larga saem do fim do título da peça (medido com `w-fit`); no celular sobem do topo da legenda, acima da linha "Retroescavadeira".
- **Antes e depois honesto:** as fotos são do Flow, então a legenda diz "Imagens ilustrativas". O "depois" fica à esquerda: a caçamba empurra para a direita e deixa o terreno pronto para trás.
- **Capas sob demanda e só o hero antes do vídeo entrar** (27/10). No HTML não vai capa nenhuma: o servidor não sabe se é celular, e o celular baixava as 16:9 e depois as 9:16. A camada de mídia fica invisível até o preloader sair, então nada se perde.
- **Título do hero com linhas fixas** (`
` em `site.hero.titulo`): com a fonte reserva cabia em 3 linhas e com a Archivo larga em 4, e o hero pulava quando a fonte chegava (CLS 0,13). No celular, "Ver serviços" fica sempre embaixo do botão pelo mesmo motivo.
- **Lighthouse no Windows:** o modo simulado abre um Chrome frio (primeiro desenho em ~2,6 s mesmo sem limitação) e conta como dependência do LCP tudo o que começou antes disso. Compare com `--throttling-method=devtools`.
- **Capturas com movimento reduzido:** os canvas 3D não fazem fade (`motion-reduce:transition-none`). No Chrome das capturas, sem quadros novos, a transição congelava no meio e a máquina saía apagada.
- **Articulação da caçamba de trás como na máquina real:** o cilindro empurra um balancim, que puxa a biela presa na caçamba. A posição do balancim sai da interseção de dois círculos (`solveBucketLinkage`).
- **Desempenho da retroescavadeira:** peças fixas fundidas por material (de 345 para 134 chamadas de desenho por quadro, contando a sombra; ~130 mil triângulos por passada). Pixel ratio até 1,5 no celular e sombra de 1024 px.
- **O `dt` do laço nunca é negativo.** O carimbo do `requestAnimationFrame` pode vir antes do `performance.now()` guardado; no Chrome headless isso deu segundos negativos, e a entrada "andava para trás".
- **`checkShaderErrors` desligado em produção** nas cenas com three. No Windows, o ANGLE solta avisos `X4122` nos shaders de sombra do próprio three: inofensivos, mas enchiam o console.
- **`__planta` no console (só em dev):** `__planta.at(0.5)` congela a sequência da seção das máquinas num ponto; `__planta.info()` mostra se o laço está rodando.
- **Onde atuamos sem prometer área de atendimento:** só os 6 municípios vizinhos (lista e direções do plano municipal de saúde de Alterosa; coordenadas conferidas com ~1 km de margem) e a distância em linha reta. O relevo da maquete é estilizado, não o real. A cliente ainda precisa dizer quais cidades atende.

## 5. Pendências conhecidas

- [ ] **Clipes do Flow que faltam** (tabela no topo e seção 7).
- [ ] **WhatsApp provisório**: usando (35) 99974-6093 (`content/site.ts`, `confirmado: false`).
- [ ] **Ícone** provisório (`app/icon.svg`) até chegar o logo.
- [ ] **Textos das etapas de "Como trabalhamos"** escritos por nós (a sequência é do briefing). Confirmar com a cliente, principalmente "valor e prazo antes de qualquer máquina entrar".
- [ ] **Telefones sem rótulo de quem é quem** (o briefing pede "telefones com rótulo"). Perguntar à cliente junto com qual é o WhatsApp.
- [ ] Linha "imagens ilustrativas" discreta no rodapé, se a cliente concordar.
- [ ] **Domínio provisório** em `content/site.ts` (`seo.url`: hehterraplanagem.com.br). Ele vai no link canônico, na imagem OG e no JSON-LD. Na Vercel, a variável `NEXT_PUBLIC_SITE_URL` tem precedência.
- [ ] Pendências com a cliente: lista em `BRIEFING.md`.
- [ ] **Cidades atendidas:** o mapa de "Onde atuamos" mostra só os vizinhos de Alterosa. Com a lista da cliente, trocar em `content/site.ts` (`atuacao.cidades`) e, se fizer sentido, o texto.
- [ ] **Criação da cena das máquinas trava a página por um instante** (compilação dos shaders de pintura, recorte e sombra). No Chrome sem GPU leva segundos; num celular deve ser bem menos, mas pode dar um engasgo ao entrar na seção. Caminho: `renderer.compileAsync` antes do primeiro desenho e criar a cena mais cedo.
- [ ] **TBT ~550 ms** no Lighthouse celular (JavaScript da hidratação). Investigar o chunk maior (`bootup-time`).

## 6. Próximos passos (ordem sugerida)

1. **Gerar no Flow os 16:9 de estradas, destoca e terrenos** (prompts 5, 6 e 7 do `PROMPTS-FLOW.md`, com o COMPOSITION 16:9). O Lucas tem 66 créditos (27/10): um por serviço, conferindo cada um antes de gastar o seguinte. Ligar com `npm run clip` e `wide: source(...)` em `content/media.ts`; a janela vertical some sozinha.
2. **Pares do antes e depois** (seção 3 do `PROMPTS-FLOW.md`): o slider já está pronto e aparece com o primeiro par.
3. **Outras máquinas na seção de máquinas** (fotos de lado, seção 2 do `PROMPTS-FLOW.md`), **só das que a cliente tem**: cartões depois da retroescavadeira, com as mesmas linhas de chamada em SVG por cima da foto.
4. **Desempenho:** `compileAsync` na cena das máquinas e o TBT (pendências acima). Resultado de 27/10 (celular, produção): desempenho 79, acessibilidade, boas práticas e SEO 100; LCP 2,4 s com limitação real, CLS 0,008.
5. **Números e depoimentos:** só com dados reais da cliente.

## 7. Vídeos

**Onde e com que nome:** `public/media/<parada>-16x9.mp4` e, se houver, `<parada>-9x16.mp4`, mais as capas `<parada>-16x9.jpg` / `<parada>-9x16.jpg`. Paradas: `hero`, `reservatorio`, `preparo-solo`, `aracao`, `estradas`, `destoca`, `terrenos`, `contato`. Depois, ligar em `content/media.ts`.

**Orçamento, já comprimido:** 16:9 ≤ 2,5 MB (1280–1920 px), 9:16 ≤ 1,5 MB (720×1280), de 6 a 8 s, **sem áudio**. Capa ≤ 120 KB. Só o clipe atual e os próximos baixam.

**Prompts prontos, um por parada (em inglês, com estilo e composição em comum):** [`PROMPTS-FLOW.md`](PROMPTS-FLOW.md).

**Na geração (Flow):**
- O mesmo mundo em todos os clipes: fim de tarde, terra roxa do sul de Minas, máquina amarela genérica **sem logo, marca ou texto**, câmera lenta e estável, sem cortes, horizonte no terço de cima (ajuda o crossfade).
- Um toque surreal discreto: torrões que sobem e ficam suspensos.
- Espaço calmo para o texto: terço esquerdo no 16:9, metade de baixo no 9:16.
- 16:9 em todos; 9:16 pelo menos no hero e no contato.
- Conferir cada quadro: logo ou texto escondido, máquina deformada, braço atravessando a cabine.

**Fluxo de cada clipe:**
1. O MP4 do Flow vai para `media-originais/` (fora do `public/` e do git: pesado).
2. `npm run clip -- media-originais/<arquivo>.mp4 <parada> 16x9` (e o mesmo com `9x16`, se houver).
3. Ligar em `content/media.ts`: `wide: source("<parada>-16x9")` e/ou `tall: source("<parada>-9x16")` (e `focus` se não houver 9:16).
4. **Conferir de perto antes de aceitar** (`ffmpeg ... crop` em resolução cheia): emblema no braço e no contrapeso, máquina que se transforma no meio do clipe, e se a máquina não cai em cima do texto (no 16:9, terço esquerdo livre).
5. Conferir em 1440 e 390 px, também com `--reduced`.

Resultados (21/10): hero 16:9 2,30 MB e 9:16 1,43 MB; preparo de solo 16:9 2,29 MB; reservatório 9:16 1,29 MB. Capas entre 96 e 111 KB.

## 8. Skills (instalar em cada computador)

Kit enxuto para este projeto. Cada skill pesa no contexto de toda sessão, e regras de skills diferentes começam a se contradizer:
- `frontend-design` (Anthropic): a base.
- `web-design-guidelines` (vercel-labs): interface e acessibilidade.
- `vercel-react-best-practices` (vercel-labs): performance do Next.
- `webapp-testing` (Anthropic, Playwright): o `npm run shots` já cobre o básico.
- Skill de GSAP.
- Opcional: `design-taste-frontend` (taste-skill, leonxlnx). **Cuidado** com `high-end-visual-design`: ela define fontes e sombras próprias, o que pode brigar com a Archivo e os tokens.
- **Não usar aqui:** UI/UX Pro Max (estilos glass/clay/neumorphism), shadcn, daisyUI. Botões, menus e cards são feitos sob medida a partir dos tokens.

Comando padrão: `npx skills add <repo> --agent claude-code`. Conferir o comando no README de cada uma.

## 9. Lembretes de direção

- A ousadia fica num lugar só: **os vídeos**. Tipografia, layout e UI são quietos e disciplinados. Se tudo brilhar, nada brilha.
- Proibidos (do `CLAUDE.md`): eyebrow em caixa alta, destacar uma palavra só no título, "→" em botões, cards idênticos com sombra cinza, numeração 01/02/03 fora de sequência real.
- Copy direta e regional: "gradagem" (não "gradiação"), nomes da frota em português, nada de "soluções de excelência".
