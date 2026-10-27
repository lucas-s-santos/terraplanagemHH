/**
 * Prepara um clipe do Flow para o site: loop sem pulo, compressão até o orçamento e capa.
 *
 *   npm run clip -- <original.mp4> <parada> <16x9|9x16>
 *   npm run clip -- media-originais/hero-16x9.mp4 hero 16x9
 *
 * - Loop: o fim se funde com o começo (o clipe fica 0,9 s mais curto e repete sem corte). A câmera do Flow
 *   anda o clipe todo, então começo e fim nunca batem: uma fusão simples mostra a máquina em dois lugares.
 *   Por isso a emenda passa por uma lufada de poeira (véu da cor `poeira` que sobe e desce) e a troca de
 *   imagem acontece no terço do meio, quando a poeira está mais densa.
 * - Compressão: H.264 sem áudio, com faststart. Tenta a maior largura com a melhor qualidade
 *   e desce até caber no orçamento (CLAUDE.md): 16:9 ≤ 2,5 MB, 9:16 ≤ 1,5 MB.
 * - Capa: o primeiro quadro do resultado, em JPEG, até 120 KB.
 * Saída: public/media/<parada>-<formato>.mp4 e .jpg. Precisa do ffmpeg no PATH (ou em FFMPEG/FFPROBE).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";

const [input, stop, shape] = process.argv.slice(2);
if (!input || !stop || !["16x9", "9x16"].includes(shape)) {
  console.error("uso: npm run clip -- <original.mp4> <parada> <16x9|9x16>");
  process.exit(1);
}

const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE ?? "ffprobe";
const OVERLAP = 0.9;
/** Densidade máxima da poeira no meio da emenda (0 a 1). */
const HAZE = 0.7;
/** A cor `poeira` (#E7C78F) em YUV, um pouco mais clara: luz atravessando o pó. */
const DUST_YUV = [196, 104, 146];
const MB = 1024 * 1024;
const SPEC = {
  "16x9": { budget: 2.5 * MB, sizes: [[1920, 1080], [1600, 900], [1280, 720]] },
  "9x16": { budget: 1.5 * MB, sizes: [[720, 1280], [540, 960]] },
}[shape];
const CRFS = [23, 25, 27, 29];
const POSTER_BUDGET = 120 * 1024;

const outDir = path.resolve("public", "media");
mkdirSync(outDir, { recursive: true });
const video = path.join(outDir, `${stop}-${shape}.mp4`);
const poster = path.join(outDir, `${stop}-${shape}.jpg`);
const trial = path.join(outDir, `_${stop}-${shape}.tmp.mp4`);

const run = (bin, args) => execFileSync(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
const duration = Number(
  execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", input]).toString(),
);
const body = duration - OVERLAP;

// Na emenda (P vai de 1 a 0): a mistura A→B acontece no terço do meio, sob o véu de poeira (seno, pico no meio).
const mix = "clip((P-0.5)*3+0.5\\,0\\,1)";
const haze = `${HAZE}*sin(PI*P)`;
const dust = `if(eq(PLANE\\,0)\\,${DUST_YUV[0]}\\,if(eq(PLANE\\,1)\\,${DUST_YUV[1]}\\,${DUST_YUV[2]}))`;
const seam = `(A*${mix}+B*(1-${mix}))*(1-${haze})+${dust}*${haze}`;

const encode = ([w, h], crf) => {
  // corpo = original a partir de OVERLAP; cabeça = o começo do original, fundido no fim do corpo.
  const filter =
    `[0:v]split[a][b];` +
    `[a]trim=start=${OVERLAP},setpts=PTS-STARTPTS[corpo];` +
    `[b]trim=end=${OVERLAP},setpts=PTS-STARTPTS[cabeca];` +
    `[corpo][cabeca]xfade=transition=custom:expr='${seam}':duration=${OVERLAP}:offset=${body - OVERLAP},` +
    `scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h},format=yuv420p[v]`;
  run(FFMPEG, [
    "-y", "-v", "error", "-i", input,
    "-filter_complex", filter, "-map", "[v]", "-an",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-profile:v", "high",
    "-movflags", "+faststart", trial,
  ]);
  return statSync(trial).size;
};

let chosen = null;
search: for (const size of SPEC.sizes) {
  for (const crf of CRFS) {
    const bytes = encode(size, crf);
    console.log(`  ${size[0]}x${size[1]} crf ${crf}: ${(bytes / MB).toFixed(2)} MB`);
    if (bytes <= SPEC.budget) {
      chosen = { size, crf, bytes };
      break search;
    }
  }
}
if (!chosen) {
  unlinkSync(trial);
  console.error(`não coube em ${(SPEC.budget / MB).toFixed(1)} MB nem na menor largura com crf ${CRFS.at(-1)}`);
  process.exit(1);
}
renameSync(trial, video);

// Capa: primeiro quadro, no tamanho de capa (16:9 → 1280 px; 9:16 → 720 px), baixando a qualidade até caber.
const posterWidth = shape === "16x9" ? 1280 : 720;
let posterBytes = Infinity;
for (let q = 3; q <= 10 && posterBytes > POSTER_BUDGET; q++) {
  run(FFMPEG, ["-y", "-v", "error", "-i", video, "-frames:v", "1", "-vf", `scale=${posterWidth}:-2:flags=lanczos`, "-q:v", String(q), poster]);
  posterBytes = statSync(poster).size;
}

console.log(
  `${path.basename(video)}: ${chosen.size[0]}x${chosen.size[1]}, crf ${chosen.crf}, ${body.toFixed(1)} s, ${(chosen.bytes / MB).toFixed(2)} MB` +
    ` · capa ${Math.round(posterBytes / 1024)} KB`,
);
