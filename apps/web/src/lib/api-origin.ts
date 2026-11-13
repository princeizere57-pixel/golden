// The Hono backend (apps/api). Override per environment with API_ORIGIN (e.g. http://localhost:8787).
// Shared by next.config.ts (the /api/* proxy) and server code that calls the API directly.
export const apiOrigin = () => process.env.API_ORIGIN ?? "https://golden-api-rho.vercel.app";
