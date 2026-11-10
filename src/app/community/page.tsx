import type { Metadata } from "next";
import { createPost, createReply } from "@/app/actions/community";
import { HatIcon, LifebuoyIcon } from "@/components/icons-3d";
import { LockedPage } from "@/components/plan-lock";
import { can } from "@/lib/billing/entitlements";
import { getViewer } from "@/lib/viewer";
import { listPosts } from "@/lib/community";
import type { SkillLevel } from "@/lib/types";

export const metadata: Metadata = { title: "Apprentice Meets Master" };

const LEVEL: Record<SkillLevel, { label: string; className: string }> = {
  beginner: { label: "Apprentice", className: "bg-basil" },
  intermediate: { label: "Cook", className: "bg-saffron" },
  chef: { label: "Master", className: "bg-aubergine" },
};

const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} hr ago` : `${Math.round(h / 24)} d ago`;
};

export default async function CommunityPage() {
  const { tier } = await getViewer();
  if (!can(tier, "community")) return <LockedPage feature="community" heading="Apprentice Meets Master" back={{ href: "/for-you", label: "Back to For you" }} />;
  const posts = await listPosts();

  return (
    <main className="mx-auto px-4 pb-10 pt-6">
      <h1 className="font-display text-[2.2rem]">Apprentice Meets Master</h1>
      <p className="mt-2 text-muted">Share what you cooked, ask for help when it goes sideways, and learn from cooks a level above you.</p>

      {posts === null ? (
        <p className="mt-6 rounded-2xl bg-surface p-4 text-sm">The community opens once the database is ready: run <code>supabase/migrations/0004_growth.sql</code> in your Supabase SQL Editor.</p>
      ) : (
        <>
          <form action={createPost} className="mt-6 space-y-3 rounded-3xl border border-line p-4">
            <label className="block text-sm font-semibold">
              What did you cook?
              <input name="dish" required minLength={2} maxLength={80} placeholder="e.g. Pan-seared salmon" className="mt-1 min-h-12 w-full rounded-xl border border-line px-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold">
              How did it go?
              <textarea name="note" required minLength={2} maxLength={500} rows={3} placeholder="The skin crisped up! But the centre was a bit dry…" className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-normal" />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="help" className="h-5 w-5 accent-[var(--accent)]" /> I&apos;d like tips from a Master
            </label>
            <button className="min-h-12 w-full rounded-full bg-button font-semibold text-button-ink">Share with the community</button>
          </form>

          {posts.length === 0 && <p className="mt-6 text-muted">No posts yet. Be the first to share a dish!</p>}
          <ul className="mt-6 space-y-4">
            {posts.map((p) => (
              <li key={p.id} className="rounded-3xl bg-surface p-4">
                <div className="flex items-center gap-2">
                  {p.asks_for_help ? <LifebuoyIcon size={28} /> : <HatIcon size={28} />}
                  <p className="flex-1 font-semibold">{p.name}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${LEVEL[p.level].className}`}>{LEVEL[p.level].label}</span>
                </div>
                <p className="mt-2"><strong>{p.dish}</strong> <span className="text-muted">· {ago(p.created_at)}</span></p>
                <p className="mt-1">{p.note}</p>
                {p.asks_for_help && <p className="mt-2 text-sm font-semibold text-accent">Asking for tips</p>}
                {p.community_replies.length > 0 && (
                  <ul className="mt-3 space-y-2 border-l-2 border-line pl-3">
                    {p.community_replies.map((r) => (
                      <li key={r.id} className="text-sm">
                        <strong>{r.name}</strong> <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${LEVEL[r.level].className}`}>{LEVEL[r.level].label}</span>
                        <span className="block">{r.body}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <form action={createReply.bind(null, p.id)} className="mt-3 flex gap-2">
                  <label htmlFor={`reply-${p.id}`} className="sr-only">Reply</label>
                  <input id={`reply-${p.id}`} name="body" required minLength={2} maxLength={500} placeholder="Add a tip or a cheer" className="min-h-11 flex-1 rounded-xl border border-line bg-bg px-3 text-sm" />
                  <button className="min-h-11 rounded-xl bg-button px-4 text-sm font-semibold text-button-ink">Reply</button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
