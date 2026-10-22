# H e H Terraplanagem — Landing page

Landing de alto impacto visual para uma empresa de terraplanagem de Alterosa/MG.
Objetivo: gerar contato no WhatsApp e servir de peça de portfólio de UI/UX.
**Antes de criar ou alterar qualquer seção, leia `docs/BRIEFING.md`.**
**Onde paramos, decisões e próximos passos: `docs/ESTADO.md`. Atualize ao fim de cada sessão.**

## Stack
- Next.js (App Router) + TypeScript estrito + Tailwind
- Mídia: clipes de vídeo (máquinas trabalhando, ilustrativos, gerados no Google Flow) em `public/media/`
- 3D leve: three.js puro (sem React Three Fiber) só para os torrões flutuantes (`lib/clods/`), carregado depois do preloader
- Motion: GSAP (ScrollTrigger, SplitText) + Lenis para scroll suave
- Imagens: next/image (AVIF/WebP). Deploy: Vercel

## Arquitetura (não negociável)
- **Uma única camada de mídia fixa** atrás da página inteira (`components/media/MediaStage.tsx`), com um clipe por parada, empilhados. Nunca colocar um `<video>` de fundo dentro de uma seção.
- Seções são HTML por cima da mídia (`components/sections/`). O scroll vira "parada" (`ScrollDirector`, marcadores `[data-stop]`) e a camada troca de clipe com crossfade no meio do caminho.
- Estado do scroll compartilhado num store leve (zustand): a mídia lê, as seções escrevem.
- Só tocam os clipes visíveis; só baixam o atual e os próximos. Clipes e capas ficam listados em `content/media.ts`.
- Máquinas genéricas: **sem logo da Caterpillar ou de qualquer marca** em nenhum quadro.
- (Até 20/10/2026 a cena era 3D com three.js. Essa versão está na `main`; a de vídeo, na branch `feat/video`.)

## Design tokens (fonte da verdade: `styles/tokens.css`)
- Cores: solo-fundo #2B1D15 · terra-roxa #6B2E1D · amarelo-maquina #F2B705 · poeira #E7C78F · pasto #5E6B3A · neblina #CBB89A
- Tipografia: Archivo (variável, eixo de largura). Títulos em largura expandida/peso alto; corpo em largura normal.
- Proibido: eyebrow em CAIXA ALTA acima de títulos, destacar uma palavra só no título, "→" em botões, cards idênticos com sombra cinza, numeração 01/02/03 fora de sequências reais.

## Performance (orçamento)
- LCP < 2,5 s no 4G. O texto do hero pinta antes do vídeo (o vídeo só entra depois do preloader).
- Por clipe, já comprimido: 16:9 ≤ 2,5 MB (1280–1920 px) e 9:16 ≤ 1,5 MB (720×1280), de 6 a 8 s, sem áudio. Capa (poster) ≤ 120 KB.
- `prefers-reduced-motion`: só as capas (o vídeo nem baixa) e scroll nativo.

## Padrões de código
- Componentes pequenos, sem `any`. Animações GSAP dentro de `useGSAP` com cleanup.
- Textos em `content/site.ts` (nada de copy hardcoded nos componentes).
- Acessibilidade: foco visível, contraste AA, `aria-hidden` na camada de mídia, conteúdo legível sem vídeo.
- Antes de concluir uma tarefa visual: rodar `npm run build`, checar o console e revisar em 390 px e 1440 px (`npm run shots` faz as capturas e mostra o console).

## Delegação de agentes
- O modelo principal planeja, decide e revisa. Tarefas independentes e delimitadas vão para `.claude/agents/operacional-sonnet.md`; pesquisa de leitura vai para `.claude/agents/explorador-haiku.md`.
- Não delegar tudo. Pedir aos agentes um resumo com evidências, sem colar arquivos inteiros.
