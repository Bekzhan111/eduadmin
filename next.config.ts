import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Игнорировать ESLint ошибки при сборке
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Игнорировать TypeScript ошибки при сборке
    ignoreBuildErrors: true,
  },
  experimental: {
    // Отключаем строгий режим для совместимости
    esmExternals: false,
  },
};

export default nextConfig;
