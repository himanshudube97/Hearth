import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverExternalPackages: ['jose'],
  },
};

export default nextConfig;
