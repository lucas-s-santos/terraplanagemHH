# Prompts para o Google Flow

Um clipe por parte do site. Os prompts estão em inglês, porque o modelo costuma render melhor assim.

## Antes de gerar

- **Duração: 8 s, não 10.** É o tamanho de uma geração no Flow, e é o ideal para o site: o visitante fica de 3 a 6 s em cada seção, o clipe roda em loop e, quanto mais curto, mais leve. Não precisa estender.
- **Comece só pelo hero:** 3 variações, que eu testo com o texto por cima. Com o estilo aprovado, faça os outros 7. Isso economiza crédito.
- **Formato:** 16:9 em todos. Faça também o 9:16 do hero e do contato (dos outros, se sobrar crédito). Para o 9:16, use o mesmo prompt trocando o bloco COMPOSITION pelo da versão vertical.
- **Consistência:** se o seu plano tiver "Ingredients" ou imagem de referência, gere antes **uma imagem da escavadeira amarela genérica** e **uma da paisagem** e use as duas em todos os clipes. Se tiver "Frames to video" com primeiro e último quadro, usar o mesmo quadro nos dois deixa o loop perfeito.
- **Áudio:** tanto faz. O site toca sem som.
- **Confira cada clipe:** logo ou texto escondido, máquina deformada, braço atravessando a cabine, terra "derretendo". Na dúvida, gere de novo.
- **Entrega:** MP4 na maior qualidade, com nome `parada-16x9.mp4` / `parada-9x16.mp4` (`hero`, `reservatorio`, `preparo-solo`, `aracao`, `estradas`, `destoca`, `terrenos`, `contato`). Eu comprimo e gero as capas.

## Blocos que vão em todos os prompts

Cole **STYLE** no fim de todos e o **COMPOSITION** do formato que estiver gerando.

**STYLE**
```
STYLE: Photorealistic cinematic footage, shot on a full-frame cinema camera with a 35mm lens look, natural depth of field. Late afternoon golden hour in the rolling hills of southern Minas Gerais, Brazil: deep red-purple latosol soil (terra roxa), patches of green pasture, distant rows of eucalyptus, soft hills on the horizon. Warm amber sunlight coming from the right, long soft shadows, light haze and glowing dust floating in the sunbeams. Color palette: dark brown earth, red-brown soil, machine yellow, warm sand and dusty beige highlights, muted olive green grass; gentle film contrast, no oversaturation. One subtle impossible detail that defines the whole series: a few clods of red earth drift slowly upward and hang suspended in the air, catching the light, calm and elegant, never chaotic. Slow, smooth, perfectly stable camera movement at constant speed; no cuts, no shake, no sudden zoom. Machines are generic modern construction equipment painted yellow with dark grey details, with absolutely no logos, no brand names, no letters, no numbers and no decals anywhere. No people in close-up, no faces. No on-screen text, no captions, no watermarks, no UI. Keep the horizon line in the upper third of the frame.
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
3–6 s: as the arm rises, several clods of earth detach from the bucket and, instead of falling, float upward and hang weightless in the golden light, rotating very slowly.
6–8 s: the arm holds still at the top; the suspended clods keep drifting gently; dust settles; the scene feels calm and powerful.
CAMERA: slow lateral drone orbit from left to right at about 15 meters, slightly above the machine, constant speed, the excavator always on the right side of the frame.
```

## 2. Reservatório: "Represas e tanques escavados e compactados para segurar água na seca."

```
8-second shot. A farm water reservoir under construction: a wide basin dug into red earth, surrounded by smooth compacted earthen dam walls; the bottom already holds a calm pool of water reflecting the warm golden sky. A generic yellow excavator stands on the dam crest, shaping and smoothing the inner slope with the back of its bucket.
0–3 s: the bucket slides down the slope, leaving a clean, smooth compacted surface.
3–6 s: the water surface ripples gently and mirrors the sunset; a few clods of red earth float just above the water, reflected on it.
6–8 s: the machine pauses; the reflection settles; dust glows over the dam.
CAMERA: high drone shot looking down at about 30 degrees, slowly pushing forward over the dam toward the water, the reservoir on the right side of the frame.
```

## 3. Preparo de solo: "Descompactação e acerto da terra antes do plantio."

```
8-second shot. A generic yellow crawler tractor pulls a heavy subsoiler (ripper) with deep steel shanks through hard, compacted red-brown soil on a gentle farm slope. Behind the shanks the ground opens into dark, loose, crumbly earth with broken clods, contrasting with the pale compacted ground ahead.
0–3 s: the shanks cut into the soil, lifting and cracking the hard crust.
3–6 s: small clods kicked up by the ripper float upward and hang in the air behind the tractor, catching the low sun.
6–8 s: the tractor keeps moving steadily; the loosened strip of dark earth stretches behind it.
CAMERA: low side tracking shot at about 1.5 meters above the ground, moving alongside the tractor at walking speed; the tractor on the right side of the frame, moving from left to right.
```

## 4. Aração e gradagem: "Terra virada e destorroada, no ponto de plantar."

```
8-second shot. A large farm field of deep red soil: a generic yellow tractor pulls a wide disc harrow, leaving perfectly parallel furrows of freshly turned earth that converge toward the horizon. Part of the field is already harrowed in neat lines; the rest is still green pasture, with a clean border between them.
0–3 s: the discs turn the soil, throwing a soft curtain of red dust behind the tractor.
3–6 s: a few clods rise from the furrows and float above the lines of earth, glowing in the sunlight.
6–8 s: the tractor keeps a steady line; the furrow pattern fills more of the frame.
CAMERA: drone at about 20 meters, slowly moving backward along the direction of the furrows, so the lines point toward the camera and converge to the horizon; the tractor on the right side of the frame.
```

## 5. Estradas: "Estradas rurais abertas e recuperadas, com caimento e saída de água para aguentar a chuva."

```
8-second shot. A generic yellow motor grader shapes a winding red dirt road that curves through green pasture hills. The angled blade leaves a smooth, slightly crowned surface, with neat drainage ditches on both sides and a small water outlet turning into the field.
0–3 s: the blade pushes a long ridge of loose red earth to the side, leaving the road surface clean and even.
3–6 s: a fine curtain of dust rises behind the blade; a few clods lift off and hang in the air above the road.
6–8 s: the grader continues around the curve; the finished road stretches behind it in an elegant S shape.
CAMERA: drone following the road's S-curve from above and slightly behind the grader, slowly descending; the road crosses the frame diagonally and the grader stays on the right side.
```

## 6. Destoca: "Tocos e raízes arrancados. A área fica limpa para plantar ou construir."

```
8-second shot. A former eucalyptus plantation on red soil: on the left, neat rows of cut eucalyptus stumps; on the right, the area is already cleared, raked and clean. Between them, a long windrow pile of uprooted stumps with tangled roots. A generic yellow excavator with a root rake pulls a large stump out of the ground, its roots full of red earth.
0–3 s: the rake hooks under the stump and lifts it out; roots snap free and soil falls away.
3–6 s: crumbs of earth falling from the roots slow down and float in the air around the stump, glowing in the sunlight.
6–8 s: the machine swings the stump toward the windrow pile; dust drifts over the clean side.
CAMERA: slow drone pull-back and rise, revealing the contrast between the stump rows and the cleared land; the excavator on the right third of the frame.
```

## 7. Terrenos: "Corte, aterro e nivelamento para a obra começar no plano certo."

```
8-second shot. A perfectly level building pad cut into a hillside: a wide, flat surface of compacted light red earth with faint parallel roller marks; behind it, a clean angled cut slope (talude) showing exposed layers of red and ochre soil, with green grass on top of the bank. Thin wooden grade stakes with yellow tips mark the corners of the pad. A generic yellow crawler bulldozer makes a final pass, its blade leaving a flat, smooth surface; a smooth drum roller rests in the background.
0–3 s: the bulldozer moves forward, the blade trimming the last uneven ridge.
3–6 s: a few clods lifted by the blade float upward and hang above the flat ground.
6–8 s: the machine stops at the edge; the pad lies perfectly level in the warm light.
CAMERA: low wide shot at about 2 meters high, slow lateral slide from left to right; perfectly level horizon; the bulldozer on the right side of the frame.
```

## 8. Contato: "Conte o que o seu terreno precisa."

```
8-second shot. The end of the workday: a finished, leveled plot of compacted red earth, ready for construction, glowing in the last warm light of sunset. A generic yellow excavator is parked at the edge of the plot, its bucket resting on the ground, engine off. The few clods of earth that were floating in the air slowly descend and settle softly on the flat ground: the work is done. Light dust hangs in the sunbeams; soft clouds in a warm amber sky.
0–8 s: almost static and peaceful; the clods settle one by one; the dust slowly fades.
CAMERA: very slow push-in at about 3 meters high, almost static; the excavator on the right third of the frame, wide open calm space on the left.
```
