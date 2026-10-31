import type { Metadata, Viewport } from "next";
import { Archivo, Geist } from "next/font/google";
import { PageViews } from "@/components/page-views";
import { SiteHeader, TabBar } from "@/components/site-chrome";
import { TimerProvider, TimerTray } from "@/components/timers";
import "./globals.css";

const body = Geist({ variable: "--font-body", subsets: ["latin"] });
const display = Archivo({ variable: "--font-display", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: { default: "The Chef's Golden", template: "%s · The Chef's Golden" },
  description: "Recipes and techniques adapted to your skill level, a hands-free cook mode, and fixes for when things go wrong.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        <TimerProvider>
          <SiteHeader />
          <div className="pb-24">{children}</div>
          <TabBar />
          <TimerTray />
          <PageViews />
        </TimerProvider>
      </body>
    </html>
  );
}
