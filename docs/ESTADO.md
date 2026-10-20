# Estado do projeto: onde paramos

Última sessão: 20/10/2026. Feito:
- **Topos por serviço e raízes penduradas.** Cada ilha conta o serviço pela silhueta: lago com reflexo do céu, terra revolvida com torrões, sulcos de aração, estrada de terra com talude de corte, fileiras de tocos de eucalipto com leira e metade limpa, platô nivelado com barranco e estacas de gabarito.
- **Preloader "nivelamento"** com o carregamento real e **mergulho da câmera** na entrada.
- **Ilhas geradas num Web Worker**, em paralelo ao download do three.
Antes (19/10): setup completo e cena base validada (céu, neblina, 7 ilhas, blocos, poeira, voo guiado pelo scroll). Ainda não há escavadeira nem as seções depois de Serviços.

A direção criativa completa está em [`BRIEFING.md`](BRIEFING.md). Este arquivo guarda o estado técnico, as decisões e os próximos passos. **Atualize no fim de cada sessão**: a memória do Claude Code e a lista de tarefas do claude-mem ficam na máquina, não vão para o git.

---

## 1. Para continuar em outro computador

1. **Node 24 LTS** (testado com 24.15; mínimo 22.18 por causa do `check:camera`).
2. Clonar **fora do OneDrive** (ele sincroniza `node_modules` e `.next` e deixa tudo lento):
   ```bash
   git clone https://github.com/lucas-s-santos/terraplanagemHH.git
   cd terraplanagemHH
   npm ci
   npm run dev        # http://localhost:3000
   ```
3. **Google Chrome** instalado, para as capturas (`npm run shots`).
4. Reinstalar as skills, que também são por máquina (ver seção 8).
5. Os agentes `explorador-haiku` e `operacional-sonnet` agora estão no repositório (`.claude/agents/`), então não precisam ser recriados.
6. O `next dev` cria o `AGENTS.md` (regras do Next para agentes). Ele está versionado de propósito: se for apagado, volta.

## 2. Scripts

| Comando | Para quê |
|---|---|
| `npm run dev` | Desenvolvimento |
| `npm run build` / `npm start` | Build de produção (rodar antes de fechar qualquer tarefa visual) |
| `npm run typecheck` | Só o TypeScript |
| `npm run shots` | Capturas em 1440 px e 390 px + console do navegador → `.shots/`. Opções: `-- --url http://localhost:3000 --stops hero,reservatorio~preparo-solo --only mobile --reduced`. `a~b` = meio do voo entre duas paradas |
| `npm run check:camera` | Depois de mexer em `lib/scene/world.ts`: confere se a câmera passa longe das ilhas (hoje: folga 7,7 no desktop e 11,9 no celular) |

**O que conferir nas capturas:** nenhum bloco por cima do texto nas paradas; ilha à direita do texto no desktop e acima dele no celular; o serviço legível no topo de cada ilha; console sem erros. O único aviso esperado é `THREE.Clock: This module has been deprecated`, que vem de dentro do R3F. Para julgar uma cor, meça os pixels (`System.Drawing` no PowerShell): ao lado da terra roxa saturada, um cáqui médio parece quase branco.

Todas as paradas: `npm run shots -- --stops hero,reservatorio,preparo-solo,aracao,estradas,destoca,terrenos`.

## 3. Mapa do código

| Arquivo | Responsabilidade |
|---|---|
| `styles/tokens.css` | Tokens (fonte da verdade). A cena 3D lê as mesmas variáveis em tempo de execução |
| `app/globals.css` | Tailwind 4 (`@theme inline` mapeando os tokens), botão, links, céu de reserva em CSS, véu de leitura no celular |
| `content/site.ts` | Toda a copy, telefones, WhatsApp, SEO |
| `lib/store.ts` | zustand: `stop` (parada contínua da câmera), `quality` (`high`/`low`), `load` (0 a 1, só sobe) e `revealed` (a cena entrou) |
| `lib/scene/world.ts` | **Mapa do mundo**: ilhas (centro, raio, profundidade, semente, relevo, **tipo de topo**, posição da câmera), enquadramento, lente, direção do sol. Sem imports do three |
| `lib/scene/tokens.ts` | Lê os tokens de cor do CSS (sem three: fica no bundle inicial) |
| `lib/scene/palette.ts` | `derivePalette()` deriva os tons da cena dos tokens, sem DOM (o worker usa); `getScenePalette()` é a versão da página, com cache |
| `lib/scene/islandGeometry.ts` | Ilha procedural (perfil de revolução + ruído + cor por vértice). Devolve **arrays crus** (`IslandData`): corpo, raízes, objetos do topo e espelho d'água |
| `lib/scene/island.worker.ts` | Web Worker: gera as 7 ilhas na ordem do voo e devolve uma por mensagem (buffers transferidos) |
| `lib/scene/islandSource.ts` | Inicia o worker ao hidratar e guarda as ilhas prontas (store próprio). Se o Worker falhar, liga `failed` e o Archipelago gera na thread principal |
| `lib/scene/meshData.ts` | Formato `MeshData` (arrays) e `toGeometry()` para virar BufferGeometry na página |
| `lib/scene/islandTops.ts` | **Um topo por serviço**: `sample()` dá altura e cor de cada ponto; também os objetos (tocos, torrões, estacas) e a elipse da água. Orientado pela câmera da parada |
| `lib/scene/rootGeometry.ts` | Raízes penduradas (tubos que afinam, uma geometria por ilha) |
| `lib/scene/propGeometry.ts` | Toco, toco arrancado, torrão e estaca (instanciados por ilha) |
| `lib/scene/noise.ts` | Perlin (port do `ImprovedNoise` com valores idênticos, 2× mais rápido), fbm, smoothstep |
| `lib/scene/normals.ts` | Normais por vértice direto nos arrays |
| `lib/scene/blockGeometry.ts` | Blocos: torrão, leiva (com pasto) e pedra facetada |
| `lib/scene/blockField.ts` | Onde cada bloco fica: órbita do hero, pedras sob as ilhas, detritos do voo; ordenados por prioridade |
| `components/scene/SceneRoot.tsx` | O único Canvas (dynamic import, `ssr:false`, `aria-hidden`), o preloader e o fade-in quando `revealed` |
| `components/scene/Preloader.tsx` | Preloader "nivelamento": linha de terreno + 2 curvas de nível, aplainadas por uma lâmina amarela conforme `load` |
| `components/scene/Scene.tsx` | Canvas, luzes, neblina, níveis de qualidade, `PerformanceMonitor` |
| `components/scene/CameraRig.tsx` | Voo: duas CatmullRom (posição e alvo), amortecimento, parallax do mouse (2,5°/1,5°), enquadramento, mergulho de entrada (`DIVE`) |
| `components/scene/{Sky,Archipelago,EarthBlocks,Dust,Effects}.tsx` | Céu em shader, ilhas (montadas conforme chegam do worker), InstancedMesh, poeira, pós (vinheta + grão) |
| `components/scene/Water.tsx` | Água do reservatório: shader sem luz que reflete o gradiente do céu, com neblina |
| `components/motion/SmoothScroll.tsx` | Lenis no ticker do GSAP (desligado com movimento reduzido) |
| `components/motion/ScrollDirector.tsx` | Scroll → `stop`: a câmera chega na ilha quando a seção `[data-stop]` está centralizada |
| `components/sections/{Hero,Services}.tsx` | Seções atuais |

**Para adicionar uma parada:** criar a ilha em `world.ts` e uma seção com `data-stop="<mesmo id>"`, **na mesma ordem**. Depois rodar `npm run check:camera`.

## 4. Decisões tomadas (e por quê)

- **TypeScript 5.9, não 7.** O 7 é a reescrita nativa e o suporte do Next ainda não foi confirmado.
- **Tone mapping Neutral** no renderer e no efeito. O ACES deixava o céu cinza e lavava as cores da marca; o Neutral mantém os tokens fiéis. Os dois níveis de qualidade usam o mesmo, para ficarem iguais.
- **As cores da cena derivam dos tokens.** Mudar um token em `tokens.css` muda o 3D também.
- **Sol baixo e à direita** `(0.72, 0.2, -0.66)`, sem disco duro (velado pela poeira). Ilumina a lateral das ilhas e aquece esse lado do céu.
- **As ilhas flutuam sobre neblina clara**, então a luz de baixo (hemisfério) é quente. Com luz de baixo escura, a base virava uma mancha.
- **Neblina** `FogExp2(0.0105)` na cor do horizonte: o arquipélago distante aparece no hero e no voo, dando profundidade.
- **Silhueta das ilhas:** paredão curto com camadas de solo, base que afina com "lóbulos" (alguns lados pendem mais) e ponta torta. Sem os lóbulos, virava casquinha de sorvete.
- **Enquadramento** (`FRAMING`, em NDC): desloca o ponto de mira para a ilha cair a 42% à direita do centro (desktop) ou acima do texto (celular). `narrowY` por ilha: no hero é 0.46, porque o título ocupa a metade de baixo no celular.
- **Lente:** em tela estreita, fov 52 e câmera 1,55× mais longe, para a ilha caber na largura.
- **Texto limpo:** os detritos nunca ficam num cone de 48° em volta da direção de cada parada, nem a menos de 26 unidades das câmeras de parada. Só cruzam a tela durante o voo. A órbita do hero vai de 1,1× a 1,45× o raio.
- **Qualidade:** celular ou toque começa em `low` (40 blocos, 220 partículas, sem pós, DPR 1, MSAA nativo). Desktop começa em `high` (150 blocos, 700 partículas, DPR até 1,5, vinheta + grão) e o `PerformanceMonitor` baixa para `low` se o FPS cair. **No notebook com Intel HD 630 o desktop cai para `low` em segundos**, então a cena precisa ficar bonita sem pós-processamento.
- **Movimento reduzido:** sem Lenis (scroll nativo), Canvas com `frameloop="demand"` e câmera parada no hero. É provisório (ver pendências).
- **Header** só com nome e telefone, sem logo (o logo em vetor está pendente). Ícone da aba provisório: linhas de terreno se nivelando.
- **Topos orientados pela câmera da parada.** Sulcos, estrada, fileiras de tocos, eixo do lago e barranco do platô são definidos a partir da direção ilha → câmera. Os sulcos e as fileiras apontam para quem olha (linhas que convergem). A estrada vem em diagonal: de lado, ela virava uma risca. **Mudar `camera` de uma ilha gira o topo junto.**
- **Malha 160 segmentos × 40 anéis no topo** por causa dos sulcos: abaixo de ~4 vértices por período, a aração serrilha. Por isso as cores com borda dura (estrada, talude) têm transição de ~0,03 raio: mais estreita vira zigue-zague.
- **A borda gramada do paredão pega a cor do topo** (escurecida), então o platô tem borda de terra e as outras, de pasto.
- **Água:** o céu é muito mais claro que a água, e a câmera passa rente (~12°). Reflexo por igual virava um disco cinza. A solução foi fresnel contido mais uma faixa de céu refletido do lado de lá: escura perto, clara longe. O barramento (aterro) fica no lado oposto à câmera para não esconder a água.
- **Destoca conta a história da esquerda para a direita:** tocos em fileiras → leira de tocos arrancados → terra limpa.
- **Ilhas num Web Worker.** Gerar uma ilha custa de 18 a 60 ms no desktop e de 100 a 450 ms num celular fraco. Na thread principal, isso travava a lâmina do preloader e atrasava um toque no WhatsApp. O worker começa assim que a página hidrata, em paralelo ao download do three, e devolve arrays (buffers transferidos, sem cópia); a página só monta as `BufferGeometry`. **Reserva:** sem Worker, as ilhas são geradas na thread principal, uma por tarefa. Testado removendo `window.Worker`. Antes disso, a geração já tinha ficado 2× mais rápida: Perlin próprio com valores idênticos ao do three (conferido em 1 milhão de pontos), normais em arrays tipados e arrays pré-alocados.
- **Preloader na camada da cena, não por cima da página.** O texto do hero pinta antes de tudo e continua sendo o LCP. A linha fica onde a ilha do hero vai aparecer (`.nivelamento` em `globals.css`, com `min-aspect-ratio: 1/1` como o `FRAMING`). Quando a cena entra, a ilha surge debaixo da linha.
- **Progresso real** em `store.load`: 10% ao hidratar, até 66% conforme o worker entrega as ilhas, e 100% quando a cena monta todas. A lâmina anima até o valor (GSAP `quickTo`, 0,9 s). Se travar por 15 s, o preloader sai mesmo assim. Se a cena falhar (sem WebGL), o `SceneBoundary` manda 100% e fica o céu de reserva.
- **Linha desenhada com `clipPath`, não com tracejado.** Com `vector-effect: non-scaling-stroke`, o Chrome mede o tracejado em pixels de tela e a normalização do `pathLength` em unidades do SVG, e a linha saía cortada em ~70%.
- **Mergulho:** a câmera começa 1,9× mais longe e 20 unidades mais alta e desce em 2,4 s (ease-out cúbico), com o passo limitado a 1/30 s para não pular. Com movimento reduzido, não há mergulho.
- **Números (produção, celular emulado em 4G lento + CPU 4×):** LCP 1,15 s (o título do hero); o preloader sai em 6 a 7 s; bloqueio acima de 50 ms em torno de 1,0 s (era 1,4 s antes do worker). O que sobra é o próprio motor 3D: avaliar o three, criar o Canvas e **compilar os shaders** (tarefas de 170 a 460 ms). **Ao medir no Windows, aqueça o navegador:** a primeira requisição de um Chrome recém-aberto leva ~1,8 s, e isso não é do site (o servidor responde em 6 ms).

## 5. Pendências conhecidas

- [ ] **WhatsApp provisório**: usando (35) 99974-6093 (`content/site.ts`, `confirmado: false`).
- [ ] **Ícone** provisório (`app/icon.svg`) até chegar o logo.
- [ ] **Movimento reduzido**: trocar o Canvas parado por uma imagem AVIF pré-renderizada da cena (pedido do CLAUDE.md).
- [ ] Pendências com a cliente: lista em `BRIEFING.md`.
- [ ] **Ajustes finos dos topos** (revisar com olhar fresco, no navegador e não só em captura):
  - preparo de solo e aração ficaram próximos em cor; o que separa os dois é a textura (torrões × sulcos);
  - a margem de terra do reservatório ainda lembra um anel;
  - as estacas do platô são quase invisíveis no celular (pode ficar assim, é detalhe).
- [ ] O hero continua só com pasto: o lugar da escavadeira e da área escavada vem com ela.

## 6. Próximos passos (ordem sugerida)

1. **Escavadeira** na ilha do hero (ver seção 7). Depende de comprar o modelo.
2. **Transição do hero:** no scroll, o braço desce, cava e lança um bloco que vira a próxima ilha.
3. **Seções restantes:** Como trabalhamos (sequência real, numeração permitida) → Frota (scroll horizontal + blueprint) → Antes e depois (caçamba como controle) → Onde atuamos (curvas de nível + anéis de raio) → Depoimentos (só reais) → Contato final (a câmera pousa na última ilha; "H e H" entalhado em terra). Sem material da cliente, dá para fazer agora **Como trabalhamos** e **Contato final**. Frota, Antes e depois e Onde atuamos dependem de fotos e da lista de cidades. Antes, decidir o que a cena faz depois da última ilha de serviço: as seções seguintes ficam sobre a cena parada no platô?
4. **Detalhes:** tipografia que nivela (eixo `wdth` da Archivo) em 1 ou 2 títulos; curvas de nível em SVG como textura e divisores; poeira no hover do WhatsApp.
5. **SEO:** JSON-LD `LocalBusiness` e imagem OG renderizada da cena.
6. **Performance:** compilar os shaders sem travar (`renderer.compileAsync` antes de revelar a cena), rodar o Lighthouse de verdade (perfil celular) e medir o bundle do three.

Se a escavadeira ainda não tiver sido comprada, o 3 (seções em HTML) não depende dela.

## 7. Escavadeira: comprar, não modelar

Modelar do zero leva semanas. Ao comprar, exigir:
- **Peças separadas com pivô na junta:** base, cabine (gira), lança, braço e caçamba. Sem isso não dá para animar a escavação.
- **Licença** que permita uso na web e modificação.
- Por volta de **40 mil triângulos**, materiais PBR.
- **Nenhum logo** (remover Caterpillar ou qualquer marca no Blender).

Pipeline: Blender (tirar logos, aplicar escala, nomear os nós `cabine`, `lanca`, `braco`, `cacamba`) → `gltf-transform` (Draco ou Meshopt + texturas KTX2) → `public/models/escavadeira.glb` com **≤ 1,5 MB**.
Escala: a ilha do hero tem raio 9 unidades; a escavadeira deve ter uns 5–6 de comprimento.

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

- A ousadia fica num lugar só: **o voo 3D**. Tipografia, layout e UI são quietos e disciplinados. Se tudo brilhar, nada brilha.
- Proibidos (do `CLAUDE.md`): eyebrow em caixa alta, destacar uma palavra só no título, "→" em botões, cards idênticos com sombra cinza, numeração 01/02/03 fora de sequência real.
- Copy direta e regional: "gradagem" (não "gradiação"), nomes da frota em português, nada de "soluções de excelência".
