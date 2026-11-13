import type { Metadata } from "next";
import Link from "next/link";
import { KitchenLog } from "@/components/kitchen-log";
import { ProfileStudio } from "@/components/profile-studio";

export const metadata: Metadata = { title: "Mini You" };

export default function YouPage() {
  return (
    <main className="mx-auto px-4 pb-10 pt-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[2.3rem]">Mini You</h1>
        <Link href="/account" className="text-sm font-medium underline">Plan &amp; billing</Link>
      </div>
      <p className="mt-2 text-muted">Cook dishes to earn XP and rank up. Mini You cheers when you finish, and keeps you going when things go wrong.</p>
      <div className="mt-6"><ProfileStudio /></div>
      <h2 className="mt-12 text-xl font-semibold">Kitchen log</h2>
      <div className="mt-4"><KitchenLog limit={30} /></div>
    </main>
  );
}
