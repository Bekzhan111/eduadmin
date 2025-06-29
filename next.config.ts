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
  images: {
    domains: [
      'wxrqdytayiamnpwjauvi.supabase.co'
    ],
  },
};

export default nextConfig;
