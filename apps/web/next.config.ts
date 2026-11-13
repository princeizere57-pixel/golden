import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @golden/shared is published as raw TS (no build step); Next must transpile it.
  transpilePackages: ["@golden/shared"],
};

export default nextConfig;
