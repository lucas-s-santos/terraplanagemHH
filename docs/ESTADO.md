# Estado do projeto: onde paramos

Última sessão: 28/10/2026, na branch **`feat/whatsapp-sutil`** (saiu da `main` depois do merge do PR #2, `5b4aa15`; ainda sem commit). A `feat/retroescavadeira` já está toda na `main`. A **`main` é a versão em vídeo** desde 23/10; a versão 3D das ilhas ficou na tag **`versao-3d`**.

**Fim de 28/10: WhatsApp discreto ao longo da página.**
- **Orçamento em cada serviço** (`Services.tsx`, `.link-orcamento`): embaixo do texto, um link com o balão ("Pedir orçamento de destoca") que abre o WhatsApp com o serviço já escrito (`orcamento` e `mensagem` de cada item em `content/site.ts`). A cliente recebe a conversa sabendo o que a pessoa quer.
- **Atalho fixo no celular** (`components/whatsapp/FloatingWhatsApp.tsx`, `.atalho-whatsapp`): uma etiqueta escura com o balão amarelo e "WhatsApp" no canto de baixo, no tom dos rótulos da régua (sem a bolinha verde). Aparece quando o hero sai e some quando o contato entra (dali para baixo o botão grande e o rodapé resolvem). Também sai da frente da retroescavadeira (`[data-tela-cheia]`): no celular a legenda dela fica exatamente nesse canto. Na tela larga não existe (quem leva ao contato é a régua).
- O balão (`components/whatsapp/ChatIcon.tsx`) é um ícone de conversa em traço, não a logo do WhatsApp.
- **Prompts do antes e depois reescritos** (`PROMPTS-FLOW.md`, seção 3): o "depois" da destoca descrito em cima da foto do antes que já temos, e todos os DEPOIS como edição ("Edit this photo" + tudo o que não muda). Funcionou: os três depois batem com o antes (conferido sobrepondo as fotos).
- **Antes e depois no ar com os 3 pares: destoca, terreno e estrada** (`beforeAfter` em `content/media.ts`; originais em `media-originais/*_flow_*.jpg`). WebP de 1600 px (180–350 KB, acima dos 180 KB do script, mas o `next/image` entrega AVIF no tamanho da tela: 42 KB em 828 px, 180 KB em 1920 px).
- **Estrada:** o antes veio com uma retroescavadeira com adesivos e emblema. A edição no Flow tirou o emblema, mas deixou os letreiros do capô e da lateral; eles foram apagados à mão com o `delogo` do ffmpeg (`media-originais/antes-estrada_sem-marcas.jpg`, a partir de `antes-estrada_flow_4c162aab_editado.jpg`). Ampliado dá para ver o retoque; no tamanho do site, parece pintura gasta.

**Sessão de 28/10: as pendências de 27/10 feitas e revisão completa do celular.**
- **Rodapé novo** (`SiteFooter.tsx`): saiu o "HeH" entalhado. Logo grande e WhatsApp em cima; telefones, e-mail, endereço com "Ver no mapa" (Google Maps) e a lista de serviços (cada um leva à sua parada: `id` nos artigos) em colunas; faixa final com © e "Voltar ao topo" (`#inicio`). A marca gigante bem apagada ao fundo (`.marca-fundo`), só na tela larga: no celular virava blocos soltos. Links com 44 px de toque e respeito à área segura do iPhone.
- **Logo 3D em matcap** (`lib/logo/scene.ts`): sem luzes e sem reflexo de céu (o PMREM levava 1 s só para compilar no Chrome frio, e o aço refletia o horizonte laranja e saía bronze). Matcaps desenhados em canvas: amarelo de máquina e aço de verdade. Montagem em etapas com pausas, shaders compilados sem travar (`compileAsync`), e o 3D só começa **depois do vídeo entrar e da primeira pintura**. Sem placa de vídeo (Chrome desenhando na CPU), fica a mesma logo em SVG (`.logo-plana`).
- **Ícones:** `app/icon.svg` (o H com a linha de nível; a marca inteira some em 16 px) e `app/apple-icon.png` (180 px, tela inicial do iPhone). Cor do tema na barra do navegador do celular (`viewport` em `app/layout.tsx`).
- **Celular** (varredura tela a tela em 360, 375, 390 e 430 px; sem vazamento lateral nem erro de console):
  - nos serviços, o marcador da parada passou para o **bloco de texto** (no celular o texto fica embaixo, e pelo centro do artigo o clipe trocava para o do serviço seguinte com o texto ainda na tela);
  - **mapa de "Onde atuamos"**: no celular, câmera mais de cima e enquadrada no anel de 30 km, com o canvas quadrado (os nomes do norte se encavalavam);
  - **logo 3D no fluxo do hero** no celular (posicionada por altura fixa, em tela baixa a dica "Arraste para girar" caía em cima do título);
  - alvos de toque de 44 px no telefone do cabeçalho e no "Ver serviços"; menos vão antes de "A máquina certa…".
- **Desempenho** (Lighthouse celular, mediana de 3 rodadas, build de produção, sem o `next dev` rodando): com limitação real, desempenho **78**, LCP 2,6 s, TBT 365 ms, CLS 0,009 (antes da logo: ~78, 2,4–2,5 s, 270–580 ms); acessibilidade, boas práticas e SEO em 100. O modo simulado caiu de 79 para 56: ele conta como bloqueio a criação do contexto WebGL num Chrome frio, o preço de ter 3D no hero. Para medir, rode 3 vezes: a variação entre rodadas nesta máquina é grande.
- **"Como trabalhamos" estava pesada** (o Lucas sentiu travando). O perfil da rolagem (celular simulado, CPU 4× mais lenta) mostrou duas causas:
  1. **A retroescavadeira da seção seguinte nascia ali** (é criada uma tela antes) e compilava ~20 shaders de uma vez, de forma síncrona: um travamento de 6,6 s com a CPU 4× mais lenta. Agora a cena é montada em etapas com pausas, os shaders compilam em paralelo (`compileAsync`) e nada é desenhado antes; o mapa de sombras saiu (compilava shaders próprios e dobrava o trabalho de cada quadro) e entrou uma sombra de contato desenhada em canvas, que aparece junto com a pintura.
  2. **O bloco de terra refazia ~13.500 vértices a cada quadro de rolagem** (senos, cores, normais). Agora só refaz quando a frente de corte anda, e só as colunas perto dela; as normais das paredes (planos verticais) são calculadas uma vez; sem criar arrays a cada vértice. A checagem de shaders também saiu em produção (ela força a compilação na hora).
  - Resultado: maior travamento de 6,6 s para ~1,6 s; tarefas longas de 9,5 s para ~3 s; quadros acima de 50 ms de 42 para ~15; quadro p90 de 34 para 17 ms. O que sobra é o reflexo de céu da retroescavadeira (PMREM), que compila na hora e não tem versão assíncrona no three; só pesa na primeira visita (o Chrome guarda os shaders compilados).
  - No celular, o bloco de terra e o mapa desenham em 1,5× (estavam em 1,75×).
- Ferramentas novas de revisão (no scratchpad, não no repositório): varredura do celular tela a tela, que mede vazamento, alvos de toque e texto pequeno. `__logo.at(giro)` no console (dev) congela a logo 3D num ângulo.

Sessão de 27/10:
- **Hero decidido: fica o vídeo.** A retroescavadeira 3D saiu do hero e virou a seção **"A máquina certa para cada serviço"** (`components/sections/Machines.tsx` + `lib/backhoe/blueprint.ts`). A rota `/hero-3d` foi apagada; a cena do hero 3D (chão com vala, poeira, torrões, fundo do Flow) está guardada no commit `367ab2c`.
- **Antes e depois** (`components/sections/BeforeAfter.tsx`): slider com a caçamba como controle, pronto e testado (mouse, toque e teclado). **Só aparece quando chegar o primeiro par do Flow** (`beforeAfter` em `content/media.ts`). Legenda "Imagens ilustrativas".
- **Emenda dos loops sem a máquina dupla:** a câmera do Flow anda o clipe todo e nenhum quadro do começo bate com um do fim, então a emenda passa por uma lufada de poeira (`npm run clip`). Os 9 clipes foram reprocessados.
- **9:16 do hero sem a faixa:** os últimos 30% eram outra imagem colada; trocados por chão desfocado (original corrigido em `media-originais/hero-9x16_flow_*_sem-faixa.mp4`).
- **Desempenho:** capas e fotos só da parada atual e das próximas (e no formato da tela); antes do vídeo entrar, só o hero baixa. No 4G lento, o vídeo do hero passou a entrar em 6,5 s (antes 19,9 s). Título do hero com linhas fixas: CLS de 0,132 para 0,008.
- `npm run foto` (fotos do Flow para WebP) e paradas `[seletor]@fração` no `npm run shots`.

**Noite de 27/10 (parado no meio, a pedido do Lucas): logo nova e logo 3D no hero.**
- A cliente nunca mandou a logo; o Lucas pediu uma **nova, do zero**. Conceito "a linha de nível": um monograma **H e H** cortado por uma só barra horizontal, que é o travessão dos H e a barra do e (`lib/logo/marca.ts`, a mesma geometria no SVG e no 3D). Logo com o nome embaixo em `components/brand/Logo.tsx`, já no cabeçalho do hero. É proposta: a cliente precisa aprovar.
- **Logo 3D no hero, para pegar e girar** (`components/sections/HeroLogo.tsx` + `lib/logo/scene.ts`): letras em pintura amarela de máquina, barra em aço; arrastar gira com inércia, solta ela volta de frente balançando; entra junto com o vídeo (a barra passa e as letras assentam). O vídeo do hero ficou como ambiente, mais escuro e desfocado (`.video-ambiente`). O three baixa num momento ocioso, depois da hidratação.
- As quatro pendências desta noite (rodapé, aço da logo, ícone e desempenho) foram feitas em 28/10 (acima).
- Imagens do Flow (27/10): o **antes da destoca** ficou ótimo; as duas tentativas de **depois** são de outro lugar (geradas do zero) e não servem para o slider (`media-originais/depois-destoca-outro-lugar*`). O depois precisa ser feito **editando a foto do antes**.

**Fim da tarde de 27/10: "cara de IA".** O Lucas gerou os 16:9 de estradas, destoca e terrenos e achou os vídeos (todos) com cara de IA. A causa principal eram os meus prompts: o "detalhe surreal" (torrões flutuando, que o Veo desenha como pedras voando) e a luz de pôr do sol cinematográfica. O que foi feito, sem gastar crédito:
- **Só os trechos limpos** de cada clipe (sem pedras no ar), conferidos segundo a segundo. Os curtos demais viraram câmera lenta com quadros interpolados (`minterpolate`, originais `*_lento.mp4` em `media-originais/`). Terrenos 16:9: de 0 a 3,3 s em câmera lenta (0,55×); a partir de 3,5 s os torrões sobem da lâmina. O reservatório 9:16 tinha pedras sobre a água o clipe inteiro e saiu: o celular recorta o 16:9.
- **Grão de filme** sobre a camada de mídia (`.grao-filme`): tira o liso de imagem gerada.
- **Prompts reescritos** para filmagem documental (`PROMPTS-FLOW.md`), e a memória do Claude guarda a regra.
- Estradas, destoca e terrenos agora ocupam a tela larga inteira: a janela vertical (que o Lucas não gostou) e o vazamento dela no contato sumiram.

Todas as paradas têm mídia. Prontos também: régua de nível, curvas de nível, corte de solo 3D, título que nivela, poeira no hover do WhatsApp, SEO (OG + JSON-LD), Onde atuamos e a seção das máquinas. Clipes (todos com a emenda de poeira; os em câmera lenta ficaram com loops de 4,4 a 5,2 s):

| Parada | 16:9 | 9:16 |
|---|---|---|
| hero | ✅ 27/10: de 0 a 3,8 s em câmera lenta (0,62×), 2,26 MB | ✅ 27/10: de 0 a 4 s (sem a faixa) em câmera lenta (0,65×), 0,86 MB |
| reservatório | ✅ 2,07 MB (limpo) | ❌ tirado em 27/10 (pedras sobre a água o clipe inteiro). No celular, o 16:9 recortado (`focus: 70`) |
| preparo de solo | ✅ 27/10: de 0 a 3,5 s em câmera lenta (0,6×), 1,70 MB | ❌ recusado (máquina fantasma). No celular, o 16:9 recortado (`focus: 78`) |
| aração | ✅ 27/10: de 0 a 2,7 s em câmera lenta (0,5×), 1,38 MB | opcional: no celular o 16:9 recortado (`focus: 74`) ficou bom |
| estradas | ✅ 27/10: trecho de 5,6 s a 10 s em câmera lenta (0,65×), 2,46 MB | ✅ 1,39 MB |
| destoca | ✅ 27/10: de 0 a 8 s (limpo inteiro), 2,26 MB | ✅ 1,44 MB |
| terrenos | ✅ 27/10: de 0 a 3,3 s em câmera lenta (0,55×), 1,66 MB | ✅ 1,14 MB |
| contato | ✅ **foto** WebP 99 KB, com zoom lento (`.foto-lenta`) | ✅ foto WebP 125 KB |

Alternativas das fotos do contato em `media-originais/contato-*-alt-*`. Para usar foto em qualquer parada: `photo("<arquivo>")` em `content/media.ts` (WebP em `public/media/`).

**Virada de direção (20/10):** as ilhas 3D deram lugar a **vídeos de máquinas trabalhando**, ilustrativos e gerados no Google Flow, como a cliente já fazia no site dela. O "surreal" (terra suspensa) ia para dentro dos próprios vídeos, mas em 27/10 isso foi abandonado: virava pedras voando, com cara de IA. A ousadia fica no código (3D, tipografia, régua).
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
| `lib/logo/marca.ts` + `components/brand/Logo.tsx` | A marca "H e H" com a linha de nível (caminhos SVG, altura 100) e a logo com o nome embaixo |
| `components/sections/HeroLogo.tsx` + `lib/logo/scene.ts` | A logo 3D do hero: extrusão dos caminhos da marca, arrastar para girar, entrada com o vídeo |
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
| `components/sections/EarthPanel.tsx` | Painel de terra opaco depois dos serviços. No topo, os marcadores que trocam "terrenos" pelo contato enquanto ele cobre a tela |
| `components/sections/TerrainEdge.tsx` | Borda irregular de bloco de solo (faixa de terra roxa + solo escuro); `flip` para a borda de baixo |
| `components/sections/Process.tsx` | Como trabalhamos: linha de nível (ondulada → reta) desenhada no scroll, etapas que acendem na estaca |
| `components/sections/Contact.tsx` | Contato final (parada `contato`): título, apoio e o WhatsApp grande |
| `components/sections/SiteFooter.tsx` | Rodapé: logo e WhatsApp em cima; telefones, e-mail, endereço (com "Ver no mapa") e serviços em colunas; a marca bem apagada ao fundo na tela larga |
| `components/whatsapp/FloatingWhatsApp.tsx` | Atalho do WhatsApp no celular, entre o hero e o contato; sai da frente de `[data-tela-cheia]` |

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
- **Depois dos serviços, painel de terra por cima** (decisão do Lucas, 20/10). As seções sobem num bloco de solo opaco, com borda irregular e faixa de terra roxa. A troca de "terrenos" para o contato acontece **logo no começo do painel**, com ele já cobrindo a tela (marcador `terrenos` no topo e `contato` 160svh abaixo). Antes (até 27/10) o marcador de "terrenos" ficava no fim do painel, e o contato subia com o trator de esteira por trás: o Lucas viu e pediu a correção.
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
- [ ] **Logo e ícone são proposta nossa** (`lib/logo/marca.ts`, `app/icon.svg`): a cliente precisa aprovar.
- [ ] **Textos das etapas de "Como trabalhamos"** escritos por nós (a sequência é do briefing). Confirmar com a cliente, principalmente "valor e prazo antes de qualquer máquina entrar".
- [ ] **Telefones sem rótulo de quem é quem** (o briefing pede "telefones com rótulo"). Perguntar à cliente junto com qual é o WhatsApp.
- [ ] Linha "imagens ilustrativas" discreta no rodapé, se a cliente concordar.
- [ ] **Domínio provisório** em `content/site.ts` (`seo.url`: hehterraplanagem.com.br). Ele vai no link canônico, na imagem OG e no JSON-LD. Na Vercel, a variável `NEXT_PUBLIC_SITE_URL` tem precedência.
- [ ] Pendências com a cliente: lista em `BRIEFING.md`.
- [ ] **Cidades atendidas:** o mapa de "Onde atuamos" mostra só os vizinhos de Alterosa. Com a lista da cliente, trocar em `content/site.ts` (`atuacao.cidades`) e, se fizer sentido, o texto.
- [ ] **Resto do engasgo da cena das máquinas** (~1,6 s com a CPU 4× mais lenta, só na primeira visita): o reflexo de céu (PMREM) compila na hora. Caminho: trocar por matcap, como na logo. (O `compileAsync` e a montagem em etapas já estão feitos, 28/10.)
- [ ] **TBT ~365 ms** no Lighthouse celular. Opção a decidir: logo 3D só na tela larga, logo plana no celular.

## 6. Próximos passos (ordem sugerida)

1. **Vídeos: nada a gerar.** Os créditos do Flow foram para os 16:9 de estradas, destoca e terrenos (27/10), e todas as paradas têm mídia limpa. Se um dia gerar de novo, usar os prompts documentais do `PROMPTS-FLOW.md` e conferir quadro a quadro (pedras voando, máquina que muda de forma).
2. **Pares do antes e depois** (seção 3 do `PROMPTS-FLOW.md`, com o PHOTO STYLE documental): o slider já está pronto e aparece com o primeiro par. **Destoca:** o ANTES veio ótimo (27/10, `public/media/antes-destoca.webp`, original em `media-originais/antes-destoca_flow_798aea2a.jpg`). O DEPOIS que veio é de outro lugar (gerado do zero, não editado do antes) e não serve para o slider; está guardado como `depois-destoca-outro-lugar_flow_*.jpg`. Falta o DEPOIS editado a partir do antes; aí é só `npm run foto` e ligar `destoca` em `beforeAfter`.
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
