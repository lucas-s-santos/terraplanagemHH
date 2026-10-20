/**
 * Os tokens de cor que a cena usa, lidos de styles/tokens.css.
 * Sem three: entra no bundle inicial (o worker das ilhas recebe estes valores prontos).
 */
export const TOKEN_NAMES = ["solo-fundo", "terra-roxa", "amarelo-maquina", "poeira", "pasto", "neblina"] as const;
export type TokenName = (typeof TOKEN_NAMES)[number];
export type TokenValues = Record<TokenName, string>;

export function readTokens(): TokenValues {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: TokenName) => {
    const value = styles.getPropertyValue(`--${name}`).trim();
    if (!value && process.env.NODE_ENV !== "production") {
      console.warn(`[cena] token --${name} não encontrado em styles/tokens.css`);
    }
    return value || "#ff00ff";
  };
  return Object.fromEntries(TOKEN_NAMES.map((name) => [name, read(name)])) as TokenValues;
}
