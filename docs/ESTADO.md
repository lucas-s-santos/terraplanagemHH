# Estado do projeto: onde paramos

Última sessão: 19/10/2026. Feito: setup completo e **cena base validada** (céu, neblina, 7 ilhas procedurais, blocos de terra, poeira e voo de câmera guiado pelo scroll). Ainda não há escavadeira nem as seções depois de Serviços.

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

## 2. Scripts

| Comando | Para quê |
|---|---|
| `npm run dev` | Desenvolvimento |
| `npm run build` / `npm start` | Build de produção (rodar antes de fechar qualquer tarefa visual) |
| `npm run typecheck` | Só o TypeScript |
| `npm run shots` | Capturas em 1440 px e 390 px + console do navegador → `.shots/`. Opções: `-- --url http://localhost:3000 --stops hero,reservatorio~preparo-solo --only mobile --reduced`. `a~b` = meio do voo entre duas paradas |
| `npm run check:camera` | Depois de mexer em `lib/scene/world.ts`: confere se a câmera passa longe das ilhas (hoje: folga 7,7 no desktop e 11,9 no celular) |

**O que conferir nas capturas:** nenhum bloco por cima do texto nas paradas; ilha à direita do texto no desktop e acima dele no celular; console sem erros. O único aviso esperado é `THREE.Clock: This module has been deprecated`, que vem de dentro do R3F.

## 3. Mapa do código

| Arquivo | Responsabilidade |
|---|---|
| `styles/tokens.css` | Tokens (fonte da verdade). A cena 3D lê as mesmas variáveis em tempo de execução |
| `app/globals.css` | Tailwind 4 (`@theme inline` mapeando os tokens), botão, links, céu de reserva em CSS, véu de leitura no celular |
| `content/site.ts` | Toda a copy, telefones, WhatsApp, SEO |
| `lib/store.ts` | zustand: `stop` (parada contínua da câmera) e `quality` (`high`/`low`) |
| `lib/scene/world.ts` | **Mapa do mundo**: ilhas (centro, raio, profundidade, semente, relevo, posição da câmera), enquadramento, lente, direção do sol. Sem imports do three |
| `lib/scene/palette.ts` | Lê os tokens do CSS e deriva os tons da cena (céu, neblina, pasto, camadas de solo, rocha) |
| `lib/scene/islandGeometry.ts` | Ilha procedural (perfil de revolução + ruído + cor por vértice) |
| `lib/scene/blockGeometry.ts` | Blocos: torrão, leiva (com pasto) e pedra facetada |
| `lib/scene/blockField.ts` | Onde cada bloco fica: órbita do hero, pedras sob as ilhas, detritos do voo; ordenados por prioridade |
| `components/scene/SceneRoot.tsx` | O único Canvas (dynamic import, `ssr:false`, `aria-hidden`, fade-in) |
| `components/scene/Scene.tsx` | Canvas, luzes, neblina, níveis de qualidade, `PerformanceMonitor` |
| `components/scene/CameraRig.tsx` | Voo: duas CatmullRom (posição e alvo), amortecimento, parallax do mouse (2,5°/1,5°), enquadramento |
| `components/scene/{Sky,Archipelago,EarthBlocks,Dust,Effects}.tsx` | Céu em shader, ilhas, InstancedMesh, poeira, pós (vinheta + grão) |
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

## 5. Pendências conhecidas

- [ ] **WhatsApp provisório**: usando (35) 99974-6093 (`content/site.ts`, `confirmado: false`).
- [ ] **Ícone** provisório (`app/icon.svg`) até chegar o logo.
- [ ] **Movimento reduzido**: trocar o Canvas parado por uma imagem AVIF pré-renderizada da cena (pedido do CLAUDE.md).
- [ ] **Topos das ilhas genéricos**: todas têm pasto. De longe, as silhuetas se repetem como cones invertidos. É o próximo passo.
- [ ] A ilha `terrenos` deveria ser um **platô de terra nivelada**, não pasto.
- [ ] Os agentes citados no `CLAUDE.md` (`.claude/agents/operacional-sonnet.md` e `explorador-haiku.md`) **não existem**. Criar ou tirar a seção.
- [ ] Pendências com a cliente: lista em `BRIEFING.md`.

## 6. Próximos passos (ordem sugerida)

1. **Topos por serviço + raízes penduradas.** O serviço precisa ser legível *pela silhueta*, de longe. Ideia de implementação: `kind` em `IslandSpec`, uma função de altura + cor do topo por tipo em `islandGeometry.ts`, e objetos extras (água, tocos) como componentes.
   - `reservatorio`: depressão escavada no topo + plano de água refletindo a cor do céu (fresnel barato com as cores da paleta).
   - `preparo-solo`: terra revolvida e escura, sem pasto.
   - `aracao`: sulcos paralelos (deslocamento senoidal numa direção + cor alternada).
   - `estradas`: faixa de terra batida rebaixada, em curva, cortando a ilha de ponta a ponta.
   - `destoca`: metade com tocos de eucalipto (instâncias com raízes), metade limpa.
   - `terrenos`: platô perfeitamente plano de terra nivelada.
   - Raízes: tubos finos que afinam, saindo da base de cada ilha.
2. **Escavadeira** na ilha do hero (ver seção 7).
3. **Transição do hero:** no scroll, o braço desce, cava e lança um bloco que vira a próxima ilha.
4. **Preloader "nivelamento":** linha de terreno que se aplaina com o carregamento; em 100%, a câmera mergulha.
5. **Seções restantes:** Como trabalhamos (sequência real, numeração permitida) → Frota (scroll horizontal + blueprint) → Antes e depois (caçamba como controle) → Onde atuamos (curvas de nível + anéis de raio) → Depoimentos (só reais) → Contato final (a câmera pousa na última ilha; "H e H" entalhado em terra).
6. **Detalhes:** tipografia que nivela (eixo `wdth` da Archivo) em 1 ou 2 títulos; curvas de nível em SVG como textura e divisores; poeira no hover do WhatsApp.
7. **SEO:** JSON-LD `LocalBusiness` e imagem OG renderizada da cena.
8. **Performance:** medir LCP no 4G (Lighthouse) e o tamanho do bundle do three.

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
