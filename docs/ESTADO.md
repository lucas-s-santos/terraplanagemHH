# Estado do projeto: onde paramos

Última sessão: 20/10/2026, na branch **`feat/video`**.

**Virada de direção (20/10):** as ilhas 3D deram lugar a **vídeos de máquinas trabalhando**, ilustrativos e gerados no Google Flow, como a cliente já fazia no site dela. O "surreal" (terra suspensa) vai para dentro dos próprios vídeos.
- **`main`**: a versão 3D completa (`d6ad5ab`): ilhas por serviço, worker, preloader e painel. O `docs/ESTADO.md` de lá documenta as decisões do 3D.
- **`feat/video`** (esta): o three.js saiu e entrou uma camada de vídeo guiada pelo scroll. Ficam o preloader "nivelamento", o painel de terra com "Como trabalhamos", o contato e o rodapé entalhado.

**Falta para ver a versão em vídeo de verdade:** os clipes do Flow (seção 7). Até eles chegarem, cada parada mostra o fundo de terra.

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
4. **ffmpeg**, para comprimir os clipes (seção 7). Ainda não está instalado no computador do G:.
5. Reinstalar as skills, que também são por máquina (seção 8).
6. Os agentes `explorador-haiku` e `operacional-sonnet` estão no repositório (`.claude/agents/`).
7. O `next dev` cria o `AGENTS.md` (regras do Next para agentes). Ele está versionado de propósito: se for apagado, volta.

## 2. Scripts

| Comando | Para quê |
|---|---|
| `npm run dev` | Desenvolvimento |
| `npm run build` / `npm start` | Build de produção (rodar antes de fechar qualquer tarefa visual) |
| `npm run typecheck` | Só o TypeScript |
| `npm run shots` | Capturas em 1440 px e 390 px + console do navegador → `.shots/`. Espera o preloader sair. Opções: `-- --url http://localhost:3000 --stops hero,reservatorio~preparo-solo,fim --only mobile --reduced`. `a~b` = meio do caminho entre duas paradas (`terrenos~contato` cai no painel de terra); `fim` = rodapé |

**O que conferir nas capturas:** texto legível sobre o vídeo (véu escuro à esquerda no desktop e embaixo no celular); o clipe certo em cada parada; no meio do caminho, os dois clipes se fundindo; console sem erros.

Página inteira: `npm run shots -- --stops hero,reservatorio,preparo-solo,aracao,estradas,destoca,terrenos,terrenos~contato,contato,fim`.

Com o Lenis, uma captura logo depois de pular o scroll pode sair "fantasma" (duas posições sobrepostas). Se aparecer, aumente o `--wait` antes de concluir que é um bug.

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
| `components/motion/MagneticLink.tsx` | Link magnético (o WhatsApp do contato). Só com mouse e sem movimento reduzido |
| `components/sections/{Hero,Services}.tsx` | Hero e as 6 paradas de serviço |
| `components/sections/EarthPanel.tsx` | Painel de terra opaco depois dos serviços. Tem no fim o marcador que segura o clipe de "terrenos" |
| `components/sections/TerrainEdge.tsx` | Borda irregular de bloco de solo (faixa de terra roxa + solo escuro); `flip` para a borda de baixo |
| `components/sections/Process.tsx` | Como trabalhamos: linha de nível (ondulada → reta) desenhada no scroll, etapas que acendem na estaca |
| `components/sections/Contact.tsx` | Contato final (parada `contato`): título, apoio e o WhatsApp grande |
| `components/sections/SiteFooter.tsx` | Chão do rodapé: telefones, e-mail, endereço e o "H e H" entalhado |

**Para adicionar uma parada:** o id em `lib/stops.ts`, o clipe em `content/media.ts` e um marcador `data-stop="<mesmo id>"` na página, **na mesma ordem**.
**Para adicionar uma seção no painel de terra** (Frota, Antes e depois, Onde atuamos): é só colocá-la dentro do `<EarthPanel>` em `app/page.tsx`.

## 4. Decisões tomadas (e por quê)

- **TypeScript 5.9, não 7.** O 7 é a reescrita nativa e o suporte do Next ainda não foi confirmado.
- **Vídeo no lugar do 3D** (decisão do Lucas, 20/10). A cliente já ilustrava o trabalho do avô com imagens de IA e quer ver máquinas trabalhando. Misturar ilha estilizada com vídeo realista ficaria incoerente. Sem o three.js, a página ficou bem mais leve: a parte que travava no celular era o motor 3D.
- **Clipes em loop por seção, não vídeo "raspado" pelo scroll.** Controlar o `currentTime` pelo scroll trava no iPhone, e uma sequência de imagens pesaria dezenas de MB. O crossfade acontece entre 35% e 65% do caminho, para não passar a maior parte do tempo com dois clipes misturados.
- **Cada camada tem fundo próprio** (`.fundo-terra`). Quando a de cima cobre tudo, a de baixo some e pausa. Sem isso, uma parada sem clipe mostrava o clipe da anterior.
- **A página inteira ficou escura, com texto claro (`poeira`).** Texto escuro sobre vídeo não lê. O véu é escuro à esquerda no desktop e embaixo no celular, com uma faixa leve em cima para o cabeçalho. Antes do vídeo, o fundo é de terra escura, para o texto claro já ser legível no primeiro desenho (LCP).
- **Movimento reduzido:** só as capas. O vídeo nem baixa.
- **Celular:** usa o 9:16 quando existe. Sem ele, recorta o 16:9 no ponto `focus` do clipe (padrão 60%).
- **Preloader na camada de mídia, não por cima da página.** O texto do hero pinta antes de tudo e continua sendo o LCP. Progresso real em `store.load`: 10% ao hidratar e o resto conforme o primeiro clipe baixa (`progress`, `canplaythrough`). Sem clipe ou com movimento reduzido, vai direto a 100%. Se travar por 15 s, sai mesmo assim.
- **Linha do preloader com `clipPath`, não com tracejado.** Com `vector-effect: non-scaling-stroke`, o Chrome mede o tracejado em pixels de tela, e a linha saía cortada em ~70%.
- **Entrada do vídeo:** aparece em 1,4 s e se aproxima devagar (escala de 1,08 para 1 em 2,6 s). Substitui o mergulho da câmera do 3D.
- **Depois dos serviços, painel de terra por cima** (decisão do Lucas, 20/10). As seções sobem num bloco de solo opaco, com borda irregular e faixa de terra roxa. O clipe de "terrenos" fica enquanto o painel passa; quando ele termina, entra o do contato.
- **O contato é só o convite e o WhatsApp grande**, como o hero. Telefones, e-mail e endereço ficam no chão do rodapé.
- **"H e H" entalhado:** fonte em `cqi` (31% da largura do contêiner), para ocupar ~95% da largura em qualquer tela. As camadas de solo vêm de `background-clip: text`, e a aresta vem de `filter: drop-shadow` (o `text-shadow` pinta por cima do recorte e apaga as camadas).
- **Botão primário usa `translate` no `:active`, não `transform`:** o ímã do WhatsApp anima o `transform` pelo GSAP, e os dois brigariam.
- **Ao medir desempenho no Windows, aqueça o navegador:** a primeira requisição de um Chrome recém-aberto leva ~1,8 s, e isso não é do site.
- **Editar texto pelo PowerShell 5.1 corrompe acentos:** `Get-Content`/`Set-Content` leem UTF-8 sem BOM como ANSI. Use a ferramenta de edição ou o Node.

## 5. Pendências conhecidas

- [ ] **Clipes do Flow** (seção 7). Começar validando 3 variações do hero.
- [ ] **ffmpeg** neste computador, para comprimir os clipes e gerar as capas.
- [ ] **WhatsApp provisório**: usando (35) 99974-6093 (`content/site.ts`, `confirmado: false`).
- [ ] **Ícone** provisório (`app/icon.svg`) até chegar o logo.
- [ ] **Textos das etapas de "Como trabalhamos"** escritos por nós (a sequência é do briefing). Confirmar com a cliente, principalmente "valor e prazo antes de qualquer máquina entrar".
- [ ] **Telefones sem rótulo de quem é quem** (o briefing pede "telefones com rótulo"). Perguntar à cliente junto com qual é o WhatsApp.
- [ ] Linha "imagens ilustrativas" discreta no rodapé, se a cliente concordar.
- [ ] Pendências com a cliente: lista em `BRIEFING.md`.

## 6. Próximos passos (ordem sugerida)

1. **Clipes:** testar 3 variações do hero com o texto por cima, aprovar o estilo e só depois gerar os outros 7.
2. **Comprimir e ligar os clipes** (seção 7) e revisar a página inteira em 1440 e 390 px.
3. **Camada leve de poeira** por cima dos vídeos (canvas 2D, sem three): grãos e poeira reagindo ao scroll e ao mouse, para manter a "terra suspensa" viva entre os clipes.
4. **Seções que faltam, dentro do painel de terra:** Frota (scroll horizontal + blueprint, fotos reais) → Antes e depois (caçamba como controle, fotos reais) → Onde atuamos (curvas de nível + anéis de raio) → Depoimentos (só reais). Todas dependem de material da cliente.
5. **Detalhes:** tipografia que nivela (eixo `wdth` da Archivo) em 1 ou 2 títulos; curvas de nível em SVG como textura e divisores; poeira no hover do WhatsApp.
6. **SEO:** JSON-LD `LocalBusiness` e imagem OG (um quadro do clipe do hero).
7. **Performance:** Lighthouse de verdade (perfil celular) com os clipes reais.
8. **Decidir entre `main` (3D) e `feat/video`** e fazer o merge da escolhida.

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

**Compressão (quando o ffmpeg estiver instalado):** H.264 em MP4, `-an` (sem áudio), `-movflags +faststart`, CRF entre 26 e 30 até caber no orçamento, e a capa do primeiro quadro em JPG. Se o loop "pular" no fim, cortar alguns quadros para o fim casar com o começo.

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
