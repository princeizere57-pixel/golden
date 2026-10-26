import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { TimerProvider, TimerTray } from "@/components/timers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Be a Chef", template: "%s · Be a Chef" },
  description: "Recipes that adapt to your skill level, a hands-free cook mode, and fixes for when things go wrong.",
};

export const viewport: Viewport = { themeColor: "#d9480f" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <TimerProvider>
          <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3" aria-label="Main">
              <Link href="/" className="text-lg font-bold tracking-tight">
                Be a <span className="text-accent">Chef</span>
              </Link>
              <div className="ml-auto flex items-center gap-1 text-sm">
                <Link href="/plan" className="rounded-full px-3 py-2.5 hover:bg-surface">Plan a meal</Link>
                <Link href="/onboarding"className="rounded-full px-3 py-2.5 hover:bg-surface">Skill quiz</Link>
                <Link href="/account" className="rounded-full px-3 py-2.5 hover:bg-surface">Account</Link>
                <Link href="/premium" className="rounded-full bg-accent px-4 py-2.5 font-semibold text-accent-ink">Try free</Link>
              </div>
            </nav>
          </header>
          {children}
          <TimerTray />
        </TimerProvider>
      </body>
    </html>
  );
}
