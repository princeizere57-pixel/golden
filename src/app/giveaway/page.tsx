import { redirect } from "next/navigation";

// The Golden Giveaway is paused and will come back later (its rules and entry logic stay in
// src/lib/giveaway.ts and src/app/actions/giveaway.ts). Until then this address goes home.
export default function GiveawayPage() {
  redirect("/");
}
