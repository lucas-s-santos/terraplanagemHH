/**
 * Prepara uma foto do Flow para o site: WebP na largura certa, baixando a qualidade até caber no orçamento.
 *
 *   npm run foto -- <original> <nome> [largura]
 *   npm run foto -- media-originais/antes-destoca.jpg antes-destoca
 *
 * - Largura padrão: 1600 px (fotos 16:9 do antes e depois). A altura acompanha a proporção do original.
 * - Orçamento: 180 KB por foto (as duas do par baixam juntas quando a seção se aproxima).
 * Saída: public/media/<nome>.webp. Precisa do ffmpeg no PATH (ou em FFMPEG).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";

const [input, name, widthArg = "1600"] = process.argv.slice(2);
if (!input || !name) {
  console.error("uso: npm run foto -- <original> <nome> [largura]");
  process.exit(1);
}

const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const BUDGET = 180 * 1024;
const QUALITIES = [82, 78, 74, 70, 66, 62];

const outDir = path.resolve("public", "media");
mkdirSync(outDir, { recursive: true });
const output = path.join(outDir, `${name}.webp`);

let bytes = Infinity;
let quality = QUALITIES[0];
for (quality of QUALITIES) {
  execFileSync(
    FFMPEG,
    ["-y", "-v", "error", "-i", input, "-vf", `scale='min(${widthArg},iw)':-2:flags=lanczos`, "-c:v", "libwebp", "-quality", String(quality), output],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  bytes = statSync(output).size;
  if (bytes <= BUDGET) break;
}
if (bytes > BUDGET) console.warn(`aviso: ficou com ${Math.round(bytes / 1024)} KB, acima de ${BUDGET / 1024} KB mesmo com qualidade ${quality}`);
console.log(`${path.basename(output)}: qualidade ${quality}, ${Math.round(bytes / 1024)} KB`);
