import type { MetadataRoute } from "next";

/** Home-screen install: the same claw mark as the app stores and the browser tab. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Golden",
    short_name: "Golden",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f1d1b",
    icons: [
      { src: "/brand/claw-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/claw-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/claw-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
