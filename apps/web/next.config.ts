import type { NextConfig } from "next";
import { apiOrigin } from "./src/lib/api-origin";

const api = apiOrigin();

const nextConfig: NextConfig = {
  // @golden/shared is published as raw TS (no build step); Next must transpile it.
  transpilePackages: ["@golden/shared"],
  // Array form = afterFiles: existing /api/billing/* route handlers win; only unmatched /api/*
  // paths proxy to the backend. As endpoints move to the API, they fall through here (strangler).
  // First match wins, so the Better Auth rule (which keeps its /api/auth prefix) comes first.
  async rewrites() {
    return [
      { source: "/api/auth/:path*", destination: `${api}/api/auth/:path*` },
      { source: "/api/:path*", destination: `${api}/:path*` },
    ];
  },
};

export default nextConfig;
