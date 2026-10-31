"use server";

import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { REF_COOKIE, getEntry, isValidCode, referralCode, saveEntry } from "@/lib/giveaway";

export type EntryResult = { ok: true; code: string; referrals: number } | { ok: false; error: string };

/** Enters the signed-in user once and returns their referral code. */
export async function enterGiveaway(): Promise<EntryResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  const code = referralCode(user.id);
  const ref = (await cookies()).get(REF_COOKIE)?.value;
  const referredBy = isValidCode(ref) && ref !== code ? ref : null;
  const saved = await saveEntry({ user_id: user.id, name: user.name, email: user.email, code, referred_by: referredBy });
  if (!saved) return { ok: false, error: "The giveaway opens once the database is connected (run supabase/migrations/0004_growth.sql)." };
  const entry = await getEntry(user.id);
  return { ok: true, code, referrals: entry?.referrals ?? 0 };
}
