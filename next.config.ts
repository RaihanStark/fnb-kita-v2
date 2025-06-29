import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript errors during production builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
