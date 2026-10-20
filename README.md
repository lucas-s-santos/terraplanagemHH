# H e H Terraplanagem — landing page

Landing de alto impacto visual para uma empresa de terraplanagem de Alterosa/MG. Conceito **"Terra suspensa"**: o visitante voa por um céu de fim de tarde onde ilhas de terra flutuam, uma por serviço.

- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind 4 · React Three Fiber, drei, postprocessing · GSAP + Lenis · zustand
- **Cena:** um único Canvas fixo atrás da página; ilhas e blocos de terra 100% procedurais; a câmera percorre o arquipélago guiada pelo scroll

## Rodar

```bash
npm ci
npm run dev            # http://localhost:3000
npm run build          # build de produção
npm run shots          # capturas 1440/390 + console (precisa do Chrome e do site rodando)
npm run check:camera   # confere o caminho da câmera depois de mexer nas ilhas
```

Node 24 LTS recomendado.

## Documentação

- [`CLAUDE.md`](CLAUDE.md): regras do projeto (arquitetura, tokens, performance, padrões)
- [`docs/BRIEFING.md`](docs/BRIEFING.md): cliente, conceito, linha do tempo da página e copy
- [`docs/ESTADO.md`](docs/ESTADO.md): onde paramos, decisões, pendências e próximos passos
