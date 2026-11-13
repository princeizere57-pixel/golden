import type { NextConfig } from "next";

// New Hono backend (apps/api). Override per environment with API_ORIGIN (e.g. http://localhost:8787).
const apiOrigin = process.env.API_ORIGIN ?? "https://golden-api-rho.vercel.app";

const nextConfig: NextConfig = {
  // @golden/shared is published as raw TS (no build step); Next must transpile it.
  transpilePackages: ["@golden/shared"],
  // Array form = afterFiles: existing /api/billing/* route handlers win; only unmatched /api/*
  // paths proxy to the backend. As endpoints move to the API, they fall through here (strangler).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/:path*` }];
  },
};

export default nextConfig;
