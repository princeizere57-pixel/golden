import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Browser-side Better Auth. No baseURL: calls go to this site's /api/auth/*, which the web app
// proxies to the API, so the session cookie stays first-party.
export const authClient = createAuthClient({ plugins: [magicLinkClient()] });
