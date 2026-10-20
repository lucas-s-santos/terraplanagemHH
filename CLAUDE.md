# H e H Terraplanagem — Landing page

Landing de alto impacto visual para uma empresa de terraplanagem de Alterosa/MG.
Objetivo: gerar contato no WhatsApp e servir de peça de portfólio de UI/UX.
**Antes de criar ou alterar qualquer seção, leia `docs/BRIEFING.md`.**
**Onde paramos, decisões e próximos passos: `docs/ESTADO.md`. Atualize ao fim de cada sessão.**

## Stack
- Next.js (App Router) + TypeScript estrito + Tailwind
- 3D: @react-three/fiber v9, @react-three/drei, @react-three/postprocessing
- Motion: GSAP (ScrollTrigger, SplitText) + Lenis para scroll suave
- Imagens: next/image (AVIF/WebP). Deploy: Vercel

## Arquitetura (não negociável)
- **Um único `<Canvas>` fixo** atrás da página inteira (`components/scene/`). Nunca criar um Canvas por seção.
- Seções são HTML por cima da cena (`components/sections/`). O scroll dirige a câmera por um caminho (CatmullRomCurve3) com ScrollTrigger.
- Estado do scroll compartilhado num store leve (zustand) — a cena lê, as seções escrevem.
- Blocos de terra são **procedurais** (icosaedro + ruído + vertex colors) e renderizados com `InstancedMesh`. Sem baixar pedras prontas.
- A escavadeira é um `.glb` em `public/models/`, comprimido (Draco/Meshopt + texturas KTX2). Modelo genérico: **sem logo da Caterpillar ou de qualquer marca**.

## Design tokens (fonte da verdade: `styles/tokens.css`)
- Cores: solo-fundo #2B1D15 · terra-roxa #6B2E1D · amarelo-maquina #F2B705 · poeira #E7C78F · pasto #5E6B3A · neblina #CBB89A
- Tipografia: Archivo (variável, eixo de largura). Títulos em largura expandida/peso alto; corpo em largura normal.
- Proibido: eyebrow em CAIXA ALTA acima de títulos, destacar uma palavra só no título, "→" em botões, cards idênticos com sombra cinza, numeração 01/02/03 fora de sequências reais.

## Performance (orçamento)
- LCP < 2,5 s no 4G. O texto do hero pinta antes do Canvas (Canvas com dynamic import, ssr:false).
- GLB ≤ 1,5 MB. DPR limitado a [1, 1.5]. `PerformanceMonitor` do drei reduz instâncias e desliga pós-processamento em aparelho fraco.
- Mobile: ~40 blocos (desktop ~150), sem depth of field.
- `prefers-reduced-motion`: cena estática (imagem renderizada) e scroll nativo.

## Padrões de código
- Componentes pequenos, sem `any`. Animações GSAP dentro de `useGSAP` com cleanup.
- Textos em `content/site.ts` (nada de copy hardcoded nos componentes).
- Acessibilidade: foco visível, contraste AA, `aria-hidden` no Canvas, conteúdo legível sem 3D.
- Antes de concluir uma tarefa visual: rodar `npm run build`, checar o console e revisar em 390 px e 1440 px (`npm run shots` faz as capturas e mostra o console).

## Delegação de agentes
- O modelo principal planeja, decide e revisa. Tarefas independentes e delimitadas vão para `.claude/agents/operacional-sonnet.md`; pesquisa de leitura vai para `.claude/agents/explorador-haiku.md`.
- Não delegar tudo. Pedir aos agentes um resumo com evidências, sem colar arquivos inteiros.
