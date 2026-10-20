import { Color } from "three";
import { TOKEN_NAMES, type TokenName, type TokenValues, readTokens } from "./tokens";

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
  /** Terra batida: estrada e platô nivelado. */
  soilPacked: Color;
  rock: Color;
  dust: Color;
  root: Color;
  bark: Color;
  /** Madeira do corte fresco do toco. */
  wood: Color;
  /** Fundo do reservatório (o que aparece quando a água não reflete o céu). */
  waterDeep: Color;
}

let cached: ScenePalette | null = null;

/** Os tons da cena, a partir dos tokens de styles/tokens.css (lidos uma vez). */
export function getScenePalette(): ScenePalette {
  cached ??= derivePalette(readTokens());
  return cached;
}

/**
 * Deriva os tons da cena dos tokens. Sem DOM: o worker das ilhas usa a mesma função.
 * As misturas acontecem em espaço linear (o Color do three converte o hex sRGB).
 */
export function derivePalette(values: TokenValues): ScenePalette {
  const t = Object.fromEntries(TOKEN_NAMES.map((name) => [name, new Color(values[name])])) as Record<TokenName, Color>;
  const mix = (a: Color, b: Color, k: number) => a.clone().lerp(b, k);
  const white = new Color(1, 1, 1);

  // As ilhas flutuam sobre um mar de neblina clara: a luz de baixo é quente, não escura.
  const haze = mix(t.neblina, t.poeira, 0.55);
  const soilOchre = mix(t["terra-roxa"], t.poeira, 0.26);
  const rock = mix(mix(t["solo-fundo"], t["terra-roxa"], 0.35), t.neblina, 0.15);

  return {
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
    soilOchre,
    soilPacked: mix(soilOchre, t.poeira, 0.3),
    rock,
    dust: mix(t.poeira, white, 0.25),
    root: mix(t["solo-fundo"], t["terra-roxa"], 0.2),
    bark: mix(rock, t.neblina, 0.25),
    wood: mix(t.poeira, t["terra-roxa"], 0.12),
    waterDeep: mix(t.pasto, t["solo-fundo"], 0.75),
  };
}
