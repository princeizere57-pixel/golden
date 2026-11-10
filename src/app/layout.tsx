import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { PageViews } from "@/components/page-views";
import { SiteHeader, TabBar } from "@/components/site-chrome";
import { TimerProvider, TimerTray } from "@/components/timers";
import { journeyComplete } from "@/lib/journey";
import "./globals.css";

// Fonts ship with the app (src/app/fonts, from Google Fonts, SIL Open Font License) so they never
// depend on reaching Google at startup. Both are variable fonts: Geist (weight), Archivo (weight + width).
const body = localFont({ src: "./fonts/Geist-latin-var.woff2", variable: "--font-body", weight: "100 900", display: "swap" });
const display = localFont({ src: "./fonts/Archivo-latin-var.woff2", variable: "--font-display", weight: "100 900", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Golden", template: "%s · Golden" },
  description: "Recipes and techniques adapted to your skill level, a hands-free cook mode, and fixes for when things go wrong.",
};

// A phone app: device width, and drawn under the notch and home indicator (pages pad with
// env(safe-area-inset-*)), the same in the browser and in the Android and iPhone apps.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#ffffff" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Before the first-run sequence is done, "/" shows the welcome page, which has no chrome.
  const welcomeAtRoot = !journeyComplete(await cookies());
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        <TimerProvider>
          {/* Golden is a phone app: every screen renders in one centred, phone-width frame. */}
          <div className="app-frame">
            <SiteHeader welcomeAtRoot={welcomeAtRoot} />
            <div className="pb-24">{children}</div>
            <TabBar welcomeAtRoot={welcomeAtRoot} />
            <TimerTray />
          </div>
          <PageViews />
        </TimerProvider>
      </body>
    </html>
  );
}
