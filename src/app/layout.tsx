import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Archivo, Geist } from "next/font/google";
import { PageViews } from "@/components/page-views";
import { SiteHeader, TabBar } from "@/components/site-chrome";
import { TimerProvider, TimerTray } from "@/components/timers";
import { JOURNEY_COOKIE } from "@/lib/journey";
import "./globals.css";

const body = Geist({ variable: "--font-body", subsets: ["latin"] });
const display = Archivo({ variable: "--font-display", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: { default: "Golden", template: "%s · Golden" },
  description: "Recipes and techniques adapted to your skill level, a hands-free cook mode, and fixes for when things go wrong.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Before the first-run sequence is done, "/" shows the welcome page, which has no chrome.
  const welcomeAtRoot = (await cookies()).get(JOURNEY_COOKIE)?.value !== "done";
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        <TimerProvider>
          <SiteHeader welcomeAtRoot={welcomeAtRoot} />
          <div className="pb-24">{children}</div>
          <TabBar welcomeAtRoot={welcomeAtRoot} />
          <TimerTray />
          <PageViews />
        </TimerProvider>
      </body>
    </html>
  );
}
