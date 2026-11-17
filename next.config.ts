import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Standalone output — smaller deploy, faster cold starts on Hostinger shared hosting
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Allow Hostinger's assigned port
  // (Next.js already respects PORT env; nothing to configure)
};

export default config;
