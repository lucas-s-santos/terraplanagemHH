/**
 * Capturas de revisão em 1440 px e 390 px, com o console do navegador.
 * Usa o Chrome instalado na máquina (playwright-core não baixa navegador).
 *
 * Uso (com o site rodando: npm run dev ou npm run build && npm start):
 *   npm run shots
 *   npm run shots -- --url http://localhost:3000 --stops hero,reservatorio~preparo-solo,terrenos --only mobile
 *   npm run shots -- --reduced          (simula prefers-reduced-motion)
 *
 * Paradas: ids de data-stop. "a~b" fotografa o meio do caminho entre duas paradas; "fim" é o rodapé.
 * Saída: .shots/ (ignorada pelo git).
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://localhost:3000" },
    stops: { type: "string", default: "hero,reservatorio,hero~reservatorio,estradas,terrenos" },
    only: { type: "string" },
    out: { type: "string", default: ".shots" },
    reduced: { type: "boolean", default: false },
    channel: { type: "string", default: process.env.SHOTS_BROWSER ?? "chrome" },
    wait: { type: "string", default: "2600" },
  },
});

const outDir = path.resolve(values.out);
mkdirSync(outDir, { recursive: true });

// No Windows, força a GPU real via Direct3D (sem isso o WebGL pode cair no renderizador de software).
const gpuArgs = process.platform === "win32" ? ["--use-angle=d3d11", "--ignore-gpu-blocklist"] : ["--ignore-gpu-blocklist"];
const browser = await chromium.launch({ channel: values.channel, headless: true, args: gpuArgs });

const viewports = [
  { name: "desktop", width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
].filter((v) => !values.only || v.name === values.only);

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    deviceScaleFactor: vp.deviceScaleFactor,
    reducedMotion: values.reduced ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  const logs = [];
  page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

  await page.goto(values.url, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 15000 }).catch(() => logs.push("[shots] o canvas não apareceu"));
  await page.waitForTimeout(3500);
  logs.push(
    `[shots] GPU: ${await page.evaluate(() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      const info = gl?.getExtension("WEBGL_debug_renderer_info");
      return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "sem WebGL2";
    })}`,
  );

  for (const stop of values.stops.split(",")) {
    await page.evaluate((spec) => {
      const center = (id) => {
        const el = document.querySelector(`[data-stop="${id}"]`);
        if (!el) throw new Error(`data-stop="${id}" não existe`);
        const r = el.getBoundingClientRect();
        return Math.max(0, r.top + window.scrollY + r.height / 2 - window.innerHeight / 2);
      };
      const [a, b] = spec.split("~");
      const top = spec === "fim" ? document.documentElement.scrollHeight : b ? (center(a) + center(b)) / 2 : center(a);
      window.scrollTo({ top, behavior: "instant" });
    }, stop);
    await page.waitForTimeout(Number(values.wait));
    const file = path.join(outDir, `${vp.name}-${stop.replace("~", "--")}${values.reduced ? "-reduzido" : ""}.png`);
    await page.screenshot({ path: file });
    console.log("captura:", file);
  }

  console.log(`--- console (${vp.name}) ---\n${logs.join("\n")}`);
  await context.close();
}

await browser.close();
