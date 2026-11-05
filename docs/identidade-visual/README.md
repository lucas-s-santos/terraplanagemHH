# Identidade visual H e H Terraplanagem

Nova logo da landing, baixada do design no Claude
(https://claude.ai/artifact/JjgWWDSJWKm6G6gPHrd9e8) em 05/11/2026. São 7 pranchas de 1080×1350 (formato de carrossel do Instagram).

**No site**, a fonte da verdade é `lib/logo/marca.ts` (os mesmos números destas pranchas), desenhada por `components/brand/` (`Simbolo`, `Icone`, `Logo`) e pelo 3D do hero (`lib/logo/scene.ts`). Os arquivos desta pasta são para uso fora do site (redes, gráfica, cartão).

## Conceito
O símbolo é uma retroescavadeira de perfil, desenhada em traço chapado.
- **Curva:** a caçamba cava o terreno irregular, do jeito que ele chega.
- **Platô:** as rodas seguem sobre o terreno nivelado, do jeito que a H e H entrega.

Nos tamanhos pequenos entra o **ícone reduzido**: um H com a curva por cima (o terreno bruto) e a barra reta por baixo (o platô).

## Pastas
| Pasta | O que tem |
|---|---|
| `logo/` | Arquivos para usar: SVGs do símbolo e do ícone em cada cor, ícone de app, foto de perfil, favicon e PNGs da logo horizontal |
| `pranchas/` | As 7 pranchas em HTML (abrem direto no navegador) e em PNG |
| `original/` | Os arquivos do design como vieram (`.dc.html` + `canvas.json`). Só abrem dentro do editor de design do Claude |

### Arquivos de `logo/`
- `simbolo-{amarelo,solo,poeira,terra-roxa}.svg`: a retroescavadeira com fundo transparente (viewBox 164×120).
- `icone-{amarelo,solo,poeira,terra-roxa}.svg`: o H reduzido com fundo transparente (viewBox 120×120).
- `app-icone-fundo-{solo,amarelo,poeira}.svg` e os PNGs de 512 px: as três combinações da prancha Digital.
- `perfil-redes.svg` (versão em círculo) e `perfil-redes-1080.png` (quadrado amarelo para enviar ao Instagram ou ao WhatsApp, que cortam em círculo).
- `favicon.svg`: o H amarelo sobre fundo solo, legível até 16 px.
- `logo-horizontal-*.png` (2×): o símbolo + "H e H" + "TERRAPLANAGEM". Há versões transparentes para fundo escuro e para fundo claro, e versões com fundo solo e com fundo amarelo. No site, o nome deve ser texto em HTML (Archivo), com o símbolo em SVG ao lado, e não uma imagem.

## Cores
As mesmas de `styles/tokens.css`.

| Nome | HEX | RGB | Papel |
|---|---|---|---|
| Amarelo-máquina | `#F2B705` | 242, 183, 5 | Primária: símbolo e destaques |
| Solo | `#2B1D15` | 43, 29, 21 | Base: fundo principal |
| Terra roxa | `#6B2E1D` | 107, 46, 29 | Complementar |
| Poeira | `#E7C78F` | 231, 199, 143 | Apoio: texto sobre fundo escuro |
| Neblina | `#CBB89A` | — | Só como fundo da placa de obra |

Combinações usadas: amarelo + poeira sobre solo (principal), solo sobre amarelo, terra roxa sobre poeira e solo sobre poeira ou neblina.

## Tipografia
Archivo, uma família em duas larguras:
- **Expanded (125%) · ExtraBold 800:** títulos e o "H e H" da marca.
- **Normal · Regular 400:** textos corridos.
- "TERRAPLANAGEM" embaixo do "H e H": Medium 500, em caixa alta, com espaçamento de 0,34em e tamanho de cerca de 22% do "H e H".

## Pranchas
1. Capa · 2. Conceito (símbolo com as linhas-guia) · 3. Paleta · 4. Tipografia · 5. Digital (foto de perfil, ícones e favicon) · 6. Placa de obra · 7. Cartão de visita (o campo `[Nome do responsável]` ainda está vazio).

Os telefones, o e-mail e o endereço do cartão e da placa são os mesmos de `content/site.ts`.
