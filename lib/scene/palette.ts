import { Color } from "three";

const TOKENS = ["solo-fundo", "terra-roxa", "amarelo-maquina", "poeira", "pasto", "neblina"] as const;
type TokenName = (typeof TOKENS)[number];

export interface ScenePalette {
  tokens: Readonly<Record<TokenName, Color>>;
  skyZenith: Color;
  skyHorizon: Color;
  skyBelow: Color;
  sun: Color;
  fog: Color;
  hemiSky: Color;
  hemiGround: Color;
  grass: Color;
  grassDark: Color;
  grassDry: Color;
  soil: Color;
  soilDark: Color;
  soilOchre: Color;
  rock: Color;
  dust: Color;
}

let cached: ScenePalette | null = null;

/**
 * Lê os tokens de styles/tokens.css e deriva os tons da cena a partir deles.
 * As misturas acontecem em espaço linear (o Color do three converte o hex sRGB).
 */
export function getScenePalette(): ScenePalette {
  if (cached) return cached;

  const styles = getComputedStyle(document.documentElement);
  const read = (name: TokenName) => {
    const value = styles.getPropertyValue(`--${name}`).trim();
    if (!value && process.env.NODE_ENV !== "production") {
      console.warn(`[cena] token --${name} não encontrado em styles/tokens.css`);
    }
    return new Color(value || "#ff00ff");
  };

  const t = Object.fromEntries(TOKENS.map((name) => [name, read(name)])) as Record<TokenName, Color>;
  const mix = (a: Color, b: Color, k: number) => a.clone().lerp(b, k);
  const white = new Color(1, 1, 1);

  // As ilhas flutuam sobre um mar de neblina clara: a luz de baixo é quente, não escura.
  const haze = mix(t.neblina, t.poeira, 0.55);

  cached = {
    tokens: t,
    skyZenith: mix(t.neblina, t["terra-roxa"], 0.3),
    skyHorizon: mix(t.poeira, white, 0.1),
    skyBelow: mix(t.neblina, t.poeira, 0.3),
    sun: mix(t.poeira, white, 0.55),
    fog: haze,
    hemiSky: mix(t.poeira, white, 0.3),
    hemiGround: mix(t["terra-roxa"], t.poeira, 0.3),
    grass: mix(t.pasto, t.poeira, 0.1),
    grassDark: mix(t.pasto, t["solo-fundo"], 0.3),
    grassDry: mix(t.pasto, t.poeira, 0.45),
    soil: t["terra-roxa"].clone(),
    soilDark: mix(t["terra-roxa"], t["solo-fundo"], 0.6),
    soilOchre: mix(t["terra-roxa"], t.poeira, 0.26),
    rock: mix(mix(t["solo-fundo"], t["terra-roxa"], 0.35), t.neblina, 0.15),
    dust: mix(t.poeira, white, 0.25),
  };
  return cached;
}
