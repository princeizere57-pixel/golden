import type { Metadata } from "next";
import { finishOnboarding } from "@/app/actions/viewer";

export const metadata: Metadata = { title: "Find your level" };

const QUESTIONS = [
  {
    id: "q1",
    text: "How often do you cook from scratch?",
    answers: ["Rarely, I'm just starting", "A few times a week", "Most days, and I improvise"],
  },
  {
    id: "q2",
    text: "A recipe says “deglaze the pan”. You…",
    answers: ["Would need to look it up", "Know it means adding liquid to lift the browned bits", "Already have the wine open"],
  },
  {
    id: "q3",
    text: "How do you tell when chicken is cooked?",
    answers: ["Cut it open and hope", "Juices run clear, or follow the timing", "Probe it: 74 °C, or lower with a longer hold"],
  },
];

export default function OnboardingPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 pb-24">
      <h1 className="text-3xl font-bold tracking-tight">Find your level</h1>
      <p className="mt-2 text-muted">Three quick questions. Every recipe is then written for you, and you can change level on any recipe.</p>
      <form action={finishOnboarding} className="mt-8 space-y-8">
        {QUESTIONS.map((q) => (
          <fieldset key={q.id}>
            <legend className="text-lg font-semibold">{q.text}</legend>
            <div className="mt-3 space-y-2">
              {q.answers.map((a, score) => (
                <label key={a} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface px-4 has-[:checked]:border-accent">
                  <input type="radio" name={q.id} value={score} required className="h-5 w-5 accent-[var(--accent)]" />
                  {a}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button className="min-h-14 w-full rounded-full bg-accent text-lg font-bold text-accent-ink">See my recipes</button>
      </form>
    </main>
  );
}
