# Prompts para o Google Flow

Um clipe por parte do site. Os prompts estão em inglês, porque o modelo costuma render melhor assim.

> **27/10: os vídeos saíram com cara de IA, e o Lucas não gostou.** As causas principais estavam nestes prompts: o "detalhe surreal" (torrões que sobem e flutuam, que o modelo desenha como pedras voando) e a luz de pôr do sol cinematográfica. Os blocos STYLE e PHOTO STYLE e as linhas de cada clipe foram reescritos para **filmagem documental**: luz comum de tarde, máquina usada com barro, física de verdade e velocidade normal. Nos clipes que já existiam, o site usa só os trechos sem pedras voando (`npm run clip` com início e fim), alguns em câmera lenta.

## Antes de gerar

- **Duração: 8 s, não 10.** É o tamanho de uma geração no Flow, e é o ideal para o site: o visitante fica de 3 a 6 s em cada seção, o clipe roda em loop e, quanto mais curto, mais leve. Não precisa estender.
- **Comece só pelo hero:** 3 variações, que eu testo com o texto por cima. Com o estilo aprovado, faça os outros 7. Isso economiza crédito.
- **Formato:** 16:9 em todos. Faça também o 9:16 do hero e do contato (dos outros, se sobrar crédito). Para o 9:16, use o mesmo prompt trocando o bloco COMPOSITION pelo da versão vertical.
- **Consistência:** se o seu plano tiver "Ingredients" ou imagem de referência, gere antes **uma imagem da escavadeira amarela genérica** e **uma da paisagem** e use as duas em todos os clipes. Se tiver "Frames to video" com primeiro e último quadro, usar o mesmo quadro nos dois deixa o loop perfeito.
- **Áudio:** tanto faz. O site toca sem som.
- **Confira cada clipe:** logo ou texto escondido, máquina deformada, braço atravessando a cabine, terra "derretendo". Na dúvida, gere de novo.
- **O que já aconteceu (21/10):** o 16:9 do reservatório saiu com **"CAT" legível no braço**, com a pintura amarela e a faixa preta da Caterpillar. O 9:16 do preparo de solo saiu com uma **máquina fantasma** translúcida e o implemento trocando de lado. Os dois foram recusados, e o bloco STYLE agora proíbe isso explicitamente. Ao conferir, olhe de perto o braço e o contrapeso, e o meio do clipe (é onde a IA costuma "transformar" a máquina).
- **Entrega:** MP4 na maior qualidade, com nome `parada-16x9.mp4` / `parada-9x16.mp4` (`hero`, `reservatorio`, `preparo-solo`, `aracao`, `estradas`, `destoca`, `terrenos`, `contato`). Eu comprimo e gero as capas.

## Blocos que vão em todos os prompts

Cole **STYLE** no fim de todos e o **COMPOSITION** do formato que estiver gerando.

**STYLE**
```
STYLE: Real documentary footage from an actual earthmoving job in rural southern Minas Gerais, Brazil, as if filmed by a colleague of the operator with a consumer drone or a phone on a tripod. Ordinary mid-afternoon daylight with a slight haze, natural muted colors, no color grading. Deep red-purple soil (terra roxa), patches of pasture, rows of eucalyptus, soft hills. Real physics only: soil and dust fall down and settle naturally; nothing floats, hovers or flies upward. Normal real-time speed, no slow motion. The machine is a used generic yellow construction machine: worn and faded paint, scratches, dried red mud on the tracks and lower body, plain panels without any logo, brand name, letters, numbers or decals. Exactly one main machine, whose shape and direction stay consistent for the whole shot: it never morphs or duplicates. Simple, slightly imperfect framing; steady camera at constant speed; no cuts, no lens flares, no glowing sunbeams, no dramatic sunset sky. No on-screen text, no watermark, no faces in close-up.
```

**COMPOSITION, 16:9 (horizontal)**
```
COMPOSITION (16:9 website background): the main action happens in the right 60% of the frame; the left third stays calm and uncluttered (soft ground and sky, no strong details) because text will be placed there.
```

**COMPOSITION, 9:16 (vertical)**
```
COMPOSITION (9:16 vertical website background): the main action fills the top 55% of the frame; the bottom 45% is calm, uncluttered ground that naturally continues the same scene in the same focus and light (plain soil and short grass), because text will be placed there. One continuous image: no blurred band, no split, no hard horizontal edge, no frame inside the frame.
```

---

## 1. Hero: "Transformando terrenos em obras prontas para construir."

```
8-second shot. A generic yellow hydraulic excavator works on a freshly cut terrace of deep red earth on a hillside farm, the landscape opening behind it at sunset.
0–3 s: the bucket bites into the red soil and lifts a full, heavy load; fine dust rises and glows in the sunlight.
3–6 s: the arm rises and swings; a few clods drop from the edge of the bucket back to the ground.
6–8 s: the load is dumped on a pile beside the cut; dust drifts away with the wind and settles.
CAMERA: slow lateral drone orbit from left to right at about 15 meters, slightly above the machine, constant speed, the excavator always on the right side of the frame.
```

## 2. Reservatório: "Represas e tanques escavados e compactados para segurar água na seca."

```
8-second shot. A farm water reservoir under construction: a wide basin dug into red earth, surrounded by smooth compacted earthen dam walls; the bottom already holds a calm pool of water reflecting the warm golden sky. A generic yellow excavator stands on the dam crest, shaping and smoothing the inner slope with the back of its bucket.
0–3 s: the bucket slides down the slope, leaving a clean, smooth compacted surface.
3–6 s: the water surface ripples gently and reflects the sky; a little loose soil slides down the slope into the water.
6–8 s: the machine pauses; the reflection settles; dust glows over the dam.
CAMERA: high drone shot looking down at about 30 degrees, slowly pushing forward over the dam toward the water, the reservoir on the right side of the frame.
```

## 3. Preparo de solo: "Descompactação e acerto da terra antes do plantio."

```
8-second shot. A generic yellow crawler tractor pulls a heavy subsoiler (ripper) with deep steel shanks through hard, compacted red-brown soil on a gentle farm slope. Behind the shanks the ground opens into dark, loose, crumbly earth with broken clods, contrasting with the pale compacted ground ahead.
0–3 s: the shanks cut into the soil, lifting and cracking the hard crust.
3–6 s: chunks of broken crust roll aside behind the shanks; a thin trail of dust follows the tractor.
6–8 s: the tractor keeps moving steadily; the loosened strip of dark earth stretches behind it.
CAMERA: low side tracking shot at about 1.5 meters above the ground, moving alongside the tractor at walking speed; the tractor on the right side of the frame, moving from left to right.
```

## 4. Aração e gradagem: "Terra virada e destorroada, no ponto de plantar."

```
8-second shot. A large farm field of deep red soil: a generic yellow tractor pulls a wide disc harrow, leaving perfectly parallel furrows of freshly turned earth that converge toward the horizon. Part of the field is already harrowed in neat lines; the rest is still green pasture, with a clean border between them.
0–3 s: the discs turn the soil, throwing a soft curtain of red dust behind the tractor.
3–6 s: loose soil and small clods tumble off the discs and fall back onto the furrows.
6–8 s: the tractor keeps a steady line; the furrow pattern fills more of the frame.
CAMERA: drone at about 20 meters, slowly moving backward along the direction of the furrows, so the lines point toward the camera and converge to the horizon; the tractor on the right side of the frame.
```

## 5. Estradas: "Estradas rurais abertas e recuperadas, com caimento e saída de água para aguentar a chuva."

```
8-second shot. A generic yellow motor grader shapes a winding red dirt road that curves through green pasture hills. The angled blade leaves a smooth, slightly crowned surface, with neat drainage ditches on both sides and a small water outlet turning into the field.
0–3 s: the blade pushes a long ridge of loose red earth to the side, leaving the road surface clean and even.
3–6 s: a fine curtain of dust rises behind the blade and drifts over the pasture.
6–8 s: the grader continues around the curve; the finished road stretches behind it in an elegant S shape.
CAMERA: drone following the road's S-curve from above and slightly behind the grader, slowly descending; the road crosses the frame diagonally and the grader stays on the right side.
```

## 6. Destoca: "Tocos e raízes arrancados. A área fica limpa para plantar ou construir."

```
8-second shot. A former eucalyptus plantation on red soil: on the left, neat rows of cut eucalyptus stumps; on the right, the area is already cleared, raked and clean. Between them, a long windrow pile of uprooted stumps with tangled roots. A generic yellow excavator with a root rake pulls a large stump out of the ground, its roots full of red earth.
0–3 s: the rake hooks under the stump and lifts it out; roots snap free and soil falls away.
3–6 s: soil falls from the roots in clumps as the stump is shaken.
6–8 s: the machine swings the stump toward the windrow pile; dust drifts over the clean side.
CAMERA: slow drone pull-back and rise, revealing the contrast between the stump rows and the cleared land; the excavator on the right third of the frame.
```

## 7. Terrenos: "Corte, aterro e nivelamento para a obra começar no plano certo."

```
8-second shot. A perfectly level building pad cut into a hillside: a wide, flat surface of compacted light red earth with faint parallel roller marks; behind it, a clean angled cut slope (talude) showing exposed layers of red and ochre soil, with green grass on top of the bank. Thin wooden grade stakes with yellow tips mark the corners of the pad. A generic yellow crawler bulldozer makes a final pass, its blade leaving a flat, smooth surface; a smooth drum roller rests in the background.
0–3 s: the bulldozer moves forward, the blade trimming the last uneven ridge.
3–6 s: the blade rolls a low wave of loose soil forward and spreads it flat.
6–8 s: the machine stops at the edge; the pad lies perfectly level in the warm light.
CAMERA: low wide shot at about 2 meters high, slow lateral slide from left to right; perfectly level horizon; the bulldozer on the right side of the frame.
```

## 8. Contato: "Conte o que o seu terreno precisa."

```
8-second shot. The end of the workday: a finished, leveled plot of compacted red earth, ready for construction, glowing in the last warm light of sunset. A generic yellow excavator is parked at the edge of the plot, its bucket resting on the ground, engine off. The work is done; a little dust still drifts over the flat ground; ordinary late-afternoon sky.
0–8 s: almost static and peaceful; the dust slowly fades.
CAMERA: very slow push-in at about 3 meters high, almost static; the excavator on the right third of the frame, wide open calm space on the left.
```

---

# Para completar o site (23/10)

**Prioridade (27/10): os pares do antes e depois (seção 3).** O slider da caçamba já está pronto no site e só aparece quando chegar o primeiro par. Depois, as fotos da frota e os clipes que faltam.

**Fotos, não vídeos** (exceto os clipes da lista do fim): no Flow, gere como imagem, na maior resolução. Entrega em `media-originais/`, com o nome indicado; eu comprimo (`npm run foto`), recorto e ligo no site.

## Bloco de estilo das fotos

Cole no fim de todos os prompts de foto desta parte (é o mesmo mundo dos vídeos, sem movimento):

**PHOTO STYLE**
```
PHOTO STYLE: An ordinary, unedited photo taken with a phone on a real rural job site in southern Minas Gerais, Brazil. Mid-afternoon natural daylight, slight haze, true-to-life muted colors, no HDR, no cinematic grading, no lens flare. Deep red-purple soil (terra roxa), dry pasture, eucalyptus rows and soft hills, with real everyday details: tire tracks, dust, small stones, dry grass, a wire fence. Machines, if any, are used generic yellow equipment with worn paint, scratches and dried red mud, and no logo, brand, letters, numbers or decals. Nothing floating in the air. No people, no text, no watermark.
```

## 1. Fundo do hero 3D (feito, e não é mais usado)

Gerado em 23/10 (veio como vídeo: `media-originais/hero-3d-fundo-16x9_flow_*.mp4`; o fundo foi o quadro dos 6 s). Em 27/10 o hero ficou com o vídeo, e a retroescavadeira 3D foi para a seção "A máquina certa para cada serviço", sem foto de fundo. O prompt fica aqui caso precise de um terreno vazio.

**16:9** → `hero-3d-fundo-16x9.jpg`
```
A wide, empty construction site on a farm: a large flat terrace of freshly cut and compacted red earth (terra roxa) in the foreground and middle ground, with faint tire tracks, a few small clods and fine dust on the surface. Behind the terrace, a low bank of red soil with green grass on top, then rolling pasture hills, rows of eucalyptus and soft blue hills far away. Late golden hour: the sun is low on the right side of the frame, just above the hills, with warm haze and glowing dust in the light. Completely empty: no machines, no vehicles, no people, no tools.
CAMERA: eye level, about 1.6 meters above the ground, looking straight ahead with the camera level; the horizon line sits in the upper third of the frame; the flat terrace fills the lower half. Wide 16:9 landscape.
```
(+ PHOTO STYLE)

**9:16** → `hero-3d-fundo-9x16.jpg`: o mesmo prompt, trocando a última frase de CAMERA por: `Vertical 9:16: the horizon line sits at about one fifth from the top; the flat terrace starts at the middle of the frame and fills the whole bottom half.`

## 2. Frota (as outras máquinas da seção "A máquina certa para cada serviço")

Um retrato de cada máquina, **de lado** (o site desenha por cima linhas de planta técnica apontando as partes, então o perfil precisa estar limpo). A retroescavadeira não precisa: ela já existe em 3D, com as peças animadas. Gere **só as máquinas que a cliente tem**; enquanto ela não confirmar, estas cinco são as mais comuns numa empresa de terraplanagem do Sul de Minas.

Bloco comum de composição (cole depois da descrição de cada máquina):
```
COMPOSITION: the machine seen exactly from the side (pure side profile, 90 degrees), standing still on a flat pad of compacted red earth, whole machine visible with generous empty space around it, centered, the ground line in the lower third. Clean, calm background: soft out-of-focus hills and a warm hazy sky, nothing in front of the machine. 3:2 landscape.
```
(+ PHOTO STYLE)

| Arquivo | Descrição (início do prompt) |
|---|---|
| `frota-escavadeira.jpg` | `A generic yellow hydraulic crawler excavator, about 20 tons, with steel tracks, a cab on the left side of the upper structure, the boom raised and the arm folded so the bucket rests on the ground in front of the tracks.` |
| `frota-trator-esteira.jpg` | `A generic yellow crawler bulldozer (track-type tractor) with a large straight blade in front, slightly raised, and a single-shank ripper at the rear, steel tracks with a little red mud.` |
| `frota-motoniveladora.jpg` | `A generic yellow motor grader with six large tires, a long front frame, the angled moldboard blade under the middle of the machine and the cab at the rear, a small front push plate.` |
| `frota-pa-carregadeira.jpg` | `A generic yellow wheel loader with four large tires, articulated frame, a wide general-purpose bucket lowered close to the ground, cab in the middle.` |
| `frota-rolo.jpg` | `A generic yellow single-drum vibratory soil compactor with a large smooth steel drum in front, two big tires at the rear and an open cab with a roof.` |

## 3. Antes e depois (o slider da caçamba)

Cada par é **o mesmo lugar, com a mesma câmera**: gere o ANTES; depois, no Flow, **edite a própria imagem do antes** (não gere do zero) pedindo o DEPOIS. Assim o enquadramento bate e o slider funciona. 16:9.

**Destoca** → `antes-destoca.jpg` / `depois-destoca.jpg`
```
ANTES: A former eucalyptus plantation on red soil right after the harvest: rows of cut eucalyptus stumps with tangled roots, dry bark, branches and leaves scattered on the ground, some young sprouts coming out of the stumps. Seen from a slightly raised point, about 3 meters high, looking across the rows toward the hills.
```
```
DEPOIS (editar a imagem do antes): Keep exactly the same place, camera, horizon, hills, light and shadows. Remove every stump, root, branch and sprout: the whole area is now cleared, raked and evenly harrowed red soil with fine parallel lines, ready for planting. Nothing else changes.
```

**Terreno** → `antes-terreno.jpg` / `depois-terreno.jpg`
```
ANTES: A sloping rural lot at the edge of a small town: uneven ground covered with tall dry grass, weeds and a few termite mounds, a gully of red soil cut by rain, a wire fence on one side. Seen from about 2 meters high, looking up the slope.
```
```
DEPOIS (editar a imagem do antes): Keep exactly the same place, camera, horizon, fence, hills and light. The lot is now a perfectly level building pad of compacted red earth with faint roller marks, a clean cut slope (talude) at the back showing red and ochre soil layers with grass on top, and thin wooden grade stakes with yellow tips at the corners. No weeds, no gully. Nothing else changes.
```

**Estrada rural** → `antes-estrada.jpg` / `depois-estrada.jpg`
```
ANTES: A damaged rural dirt road between pastures after the rainy season: deep ruts and potholes full of muddy water, eroded edges, a washed-out side with exposed rocks, grass invading the track. Seen from the middle of the road at about 1.7 meters high, the road curving away toward the hills.
```
```
DEPOIS (editar a imagem do antes): Keep exactly the same place, camera, curve, pastures, hills and light. The road is now freshly graded: a smooth, slightly crowned red dirt surface with neat drainage ditches on both sides and a small water outlet turning into the pasture. No ruts, no puddles. Nothing else changes.
```

## 4. Clipes que ainda faltam (vídeo, prompts acima)

| Clipe | Prompt | Observação |
|---|---|---|
| `preparo-solo-9x16.mp4` | nº 3 com o COMPOSITION 9:16 | o anterior foi recusado (máquina fantasma) |
| `hero-9x16.mp4` | nº 1 com o COMPOSITION 9:16 | não precisa mais: a faixa colada embaixo foi trocada por chão desfocado (27/10, `media-originais/hero-9x16_flow_*_sem-faixa.mp4`) |
| `estradas-16x9.mp4`, `destoca-16x9.mp4`, `terrenos-16x9.mp4` | nº 5, 6 e 7 | opcionais: hoje aparecem numa janela vertical na tela larga |
