/**
 * Capturas de revisão em 1440 px e 390 px, com o console do navegador.
 * Usa o Chrome instalado na máquina (playwright-core não baixa navegador).
 *
 * Uso (com o site rodando: npm run dev ou npm run build && npm start):
 *   npm run shots
 *   npm run shots -- --url http://localhost:3000 --stops hero,reservatorio~preparo-solo,terrenos --only mobile
 *   npm run shots -- --reduced          (simula prefers-reduced-motion)
 *
 * Paradas: ids de data-stop. "a~b" fotografa o meio do caminho entre duas paradas; "fim" é o rodapé;
 * "[seletor]@0.4" fotografa 40% do trecho em que um bloco alto (palco preso) atravessa a tela.
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

// Os clipes são H.264: o Chrome instalado (channel "chrome") decodifica; o Chromium puro do Playwright, não.
const browser = await chromium.launch({ channel: values.channel, headless: true });

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
  // O preloader sai (visibility: hidden) quando o primeiro clipe carregou.
  await page
    .waitForSelector(".nivelamento", { state: "hidden", timeout: 20000 })
    .catch(() => logs.push("[shots] o preloader não saiu em 20 s"));
  await page.waitForTimeout(1500);

  for (const stop of values.stops.split(",")) {
    await page.evaluate((spec) => {
      const center = (id) => {
        const el = document.querySelector(`[data-stop="${id}"]`);
        if (!el) throw new Error(`data-stop="${id}" não existe`);
        const r = el.getBoundingClientRect();
        return Math.max(0, r.top + window.scrollY + r.height / 2 - window.innerHeight / 2);
      };
      // "[seletor]@0.4": 40% do trecho em que um bloco alto (com palco preso) atravessa a tela.
      const within = (sel, fraction) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`${sel} não existe`);
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY + Number(fraction) * Math.max(0, r.height - window.innerHeight);
      };
      const [a, b] = spec.split("~");
      const top = spec === "fim"
        ? document.documentElement.scrollHeight
        : spec.includes("@") ? within(...spec.split("@")) : b ? (center(a) + center(b)) / 2 : center(a);
      window.scrollTo({ top, behavior: "instant" });
    }, stop);
    await page.waitForTimeout(Number(values.wait));
    // Dois quadros antes da captura: sem isso, os canvas 3D às vezes saíam com um quadro velho, meio apagado.
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    const file = path.join(outDir, `${vp.name}-${stop.replace("~", "--").replace(/[^\w.-]+/g, "_")}${values.reduced ? "-reduzido" : ""}.png`);
    await page.screenshot({ path: file });
    console.log("captura:", file);
  }

  console.log(`--- console (${vp.name}) ---\n${logs.join("\n")}`);
  await context.close();
}

await browser.close();
