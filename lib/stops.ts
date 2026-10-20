import { type ServiceId, site } from "@/content/site";

/**
 * As paradas do scroll, na ordem da página: o hero, um serviço por seção e o contato.
 * Cada parada tem um marcador [data-stop] na página e um clipe em content/media.ts.
 */
export type StopId = "hero" | ServiceId | "contato";

export const STOP_IDS: readonly StopId[] = ["hero", ...site.servicos.itens.map((servico) => servico.id), "contato"];
