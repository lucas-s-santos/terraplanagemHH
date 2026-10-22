import { site } from "@/content/site";

/** Endereço público do site: a variável da Vercel quando existe, senão o domínio de content/site.ts. */
export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? site.seo.url);
