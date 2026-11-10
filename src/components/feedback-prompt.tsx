"use client";

// Feedback, once it means something: after the third finished meal. One quick sheet: tap a
// rating, optionally type a note (the box opens ready to type), send. Thanks appears at once and
// the sheet closes itself; saving happens in the background.

import { useEffect, useRef, useState } from "react";
import { sendFeedback } from "@/app/actions/feedback";
import { MiniYou } from "@/components/mini-you";
import { track } from "@/lib/analytics";
import { FEEDBACK_MAX_LENGTH, feedbackQuestion, shouldAskFeedback, type FeedbackMemory } from "@/lib/feedback";
import { readProgress } from "@/lib/progress-store";

const KEY = "bac-feedback";

function readMemory(): FeedbackMemory {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<FeedbackMemory> | null;
    return { sent: Boolean(m?.sent), skippedAt: typeof m?.skippedAt === "number" ? m.skippedAt : null };
  } catch {
    return { sent: false, skippedAt: null };
  }
}

function remember(m: FeedbackMemory) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {}
}

const FACES = ["😣", "🙁", "😐", "🙂", "😍"];

export function FeedbackPrompt() {
  const [open, setOpen] = useState(false);
  const [meals, setMeals] = useState(0);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [thanks, setThanks] = useState(false);
  const text = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const finished = readProgress().dishes;
    if (!shouldAskFeedback(finished, readMemory())) return;
    setMeals(finished);
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function rate(n: number) {
    setRating(n);
    // Open the note box ready to type, without making it compulsory.
    requestAnimationFrame(() => text.current?.focus({ preventScroll: true }));
  }

  function skip() {
    remember({ sent: false, skippedAt: meals });
    setOpen(false);
  }

  function send() {
    if (!rating) return;
    remember({ sent: true, skippedAt: null });
    track("feedback_sent", { rating, with_note: Boolean(message.trim()) });
    setThanks(true);
    void sendFeedback(rating, message, meals);
    setTimeout(() => setOpen(false), 1600);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={skip}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="step-in mx-auto w-full max-w-lg rounded-t-3xl bg-bg px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        {thanks ? (
          <div className="flex flex-col items-center py-4 text-center" role="status">
            <MiniYou headOnly size={64} mood="happy" />
            <h2 id="feedback-title" className="mt-3 text-2xl font-semibold">Thank you!</h2>
            <p className="mt-1 text-muted">Every note is read. It shapes what we build next.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <div className="flex items-center gap-3">
              <MiniYou headOnly size={48} mood="proud" />
              <div>
                <h2 id="feedback-title" className="text-xl font-semibold leading-tight">{meals} meals cooked! How is Golden doing?</h2>
                <p className="text-sm text-muted">Takes ten seconds. A note is optional.</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Your rating">
              {FACES.map((face, i) => {
                const n = i + 1;
                const on = rating === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={`${n} out of 5`}
                    onClick={() => rate(n)}
                    className={`flex h-14 items-center justify-center rounded-2xl border-2 text-3xl transition ${on ? "border-accent bg-accent-soft" : "border-line"} ${rating && !on ? "opacity-50" : ""}`}
                  >
                    {face}
                  </button>
                );
              })}
            </div>

            <label htmlFor="feedback-note" className="mt-5 block text-sm font-semibold">{rating ? feedbackQuestion(rating) : "Anything you'd like to tell us?"}</label>
            <textarea
              id="feedback-note"
              ref={text}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
              }}
              rows={3}
              maxLength={FEEDBACK_MAX_LENGTH}
              placeholder="e.g. the timer saved my pasta, but I'd love more vegetarian dinners"
              className="mt-2 w-full resize-none rounded-2xl border border-line bg-surface p-3 text-[16px]"
            />
            {message.length > FEEDBACK_MAX_LENGTH - 100 && <p className="mt-1 text-right text-xs text-muted">{FEEDBACK_MAX_LENGTH - message.length} characters left</p>}

            <button type="submit" disabled={!rating} className="mt-4 min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink disabled:bg-line disabled:text-muted">
              {rating ? "Send" : "Tap a face to rate"}
            </button>
            <button type="button" onClick={skip} className="mt-1 min-h-11 w-full text-sm font-medium text-muted">Not now</button>
          </form>
        )}
      </div>
    </div>
  );
}
