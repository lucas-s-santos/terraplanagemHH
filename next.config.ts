import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Há outro package-lock.json na pasta PROJETOS; fixa a raiz neste projeto.
  turbopack: { root: __dirname },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
