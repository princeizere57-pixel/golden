"use client";

// Make Mini You from a photo. We explain and recommend first, and only ask the browser for the
// camera when the user chooses it. Upload is always available; the photo stays on the device.

import { useEffect, useRef, useState } from "react";
import { makeCartoon } from "@/app/actions/cartoon";
import { MiniYouFigure } from "@/components/mini-you";
import { track } from "@/lib/analytics";
import { processFile, processImage, shrinkImage, type PhotoResult } from "@/lib/photo";
import { DEFAULT_AVATAR, readProgress, updateAvatar } from "@/lib/progress-store";

type Stage = "intro" | "camera" | "preview" | "denied";

const TIPS = ["Face the camera, chin level", "Good light on your face (a window works great)", "Take off hats and sunglasses", "Just your face in the circle"];

export function PhotoCapture({ onDone, onSkip, compact = false }: { onDone?: () => void; onSkip?: () => void; compact?: boolean }) {
  const [stage, setStage] = useState<Stage>("intro");
  const [result, setResult] = useState<PhotoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cartoon, setCartoon] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => stop, []);

  async function useCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't open the camera here. Camera access needs HTTPS or localhost; you can upload a photo instead.");
      setStage("denied");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } }, audio: false });
      setStage("camera");
      requestAnimationFrame(() => {
        if (video.current && stream.current) {
          video.current.srcObject = stream.current;
          video.current.play().catch(() => {});
        }
      });
    } catch (err) {
      const name = (err as DOMException).name;
      setError(name === "NotAllowedError" ? "Camera access was blocked. You can allow it in your browser's site settings, or upload a photo instead." : "We couldn't start the camera. You can upload a photo instead.");
      setStage("denied");
    }
  }

  function snap() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    setResult(processImage(v, v.videoWidth, v.videoHeight, true));
    stop();
    setStage("preview");
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    setError(null);
    try {
      setResult(await processFile(f));
      stop();
      setStage("preview");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function keep() {
    if (!result) return;
    const { large: _large, ...saved } = result;
    void _large;
    updateAvatar({ ...saved, photoFace: true, cartoon: cartoon ?? undefined, useCartoon: Boolean(cartoon) });
    track("mini_you_created", { cartoon: Boolean(cartoon) });
    onDone?.();
  }

  async function drawCartoon() {
    if (!result) return;
    setDrawing(true);
    setError(null);
    const out = await makeCartoon(result.large ?? result.photo);
    setDrawing(false);
    if (out.ok) setCartoon(await shrinkImage(out.image));
    else
      setError(
        out.reason === "not-configured"
          ? "3D cartoons need a Gemini API key on the server (GEMINI_API_KEY). Your photo Mini You works without it."
          : out.reason === "blocked"
            ? "The image model couldn't draw that photo. Try a clearer, front-facing selfie."
            : "Couldn't draw the cartoon right now. Please try again.",
      );
  }

  const avatar = result
    ? { ...(typeof window === "undefined" ? DEFAULT_AVATAR : readProgress().avatar), ...result, photoFace: true, cartoon: cartoon ?? undefined, useCartoon: Boolean(cartoon) }
    : DEFAULT_AVATAR;
  const uploadInput = <input ref={file} type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Upload a photo" />;

  return (
    <div className={compact ? "" : "flex flex-1 flex-col"}>
      {uploadInput}
      {stage === "intro" && (
        <div className="step-in flex flex-1 flex-col">
          <div className="flex justify-center"><MiniYouFigure mood="happy" size={compact ? 110 : 140} /></div>
          <p className="mt-4 font-semibold">For a Mini You that looks like you, we recommend a quick selfie:</p>
          <ul className="mt-3 space-y-2 text-[15px]">
            {TIPS.map((t) => <li key={t} className="flex gap-2"><span aria-hidden>✓</span>{t}</li>)}
          </ul>
          <p className="mt-4 rounded-2xl bg-surface p-3 text-sm text-muted">
            We&apos;ll ask your browser for camera access only when you tap the button. Your photo is processed and stored on this device. Only if you choose the 3D cartoon is it sent to Google&apos;s Gemini to draw it.
          </p>
          <div className={compact ? "mt-5 space-y-2" : "mt-auto space-y-2 pt-6"}>
            <button onClick={useCamera} className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink">Allow camera &amp; take a selfie</button>
            <button onClick={() => file.current?.click()} className="min-h-12 w-full rounded-full border-2 border-line font-semibold">Upload a photo instead</button>
            {onSkip && <button onClick={onSkip} className="min-h-11 w-full font-medium text-muted">Skip for now</button>}
          </div>
        </div>
      )}

      {stage === "camera" && (
        <div className="step-in flex flex-1 flex-col items-center">
          <div className="relative mt-2 aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-black">
            <video ref={video} playsInline muted className="h-full w-full -scale-x-100 object-cover" aria-label="Camera preview" />
            <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="aspect-square w-[62%] rounded-full border-4 border-dashed border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">Line your face up inside the circle.</p>
          <div className="mt-auto w-full space-y-2 pt-6">
            <button onClick={snap} className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink">Take photo</button>
            <button onClick={() => { stop(); setStage("intro"); }} className="min-h-12 w-full font-medium">Cancel</button>
          </div>
        </div>
      )}

      {stage === "preview" && result && (
        <div className="step-in flex flex-1 flex-col items-center text-center">
          <MiniYouFigure avatar={avatar} mood="happy" size={compact ? 140 : 180} />
          <p className="mt-2 font-semibold">{cartoon ? "Meet 3D you, chef!" : "Meet your Mini You!"}</p>
          <p className="text-sm text-muted">It cheers when you finish a dish and frowns when things go wrong.</p>
          {!cartoon && (
            <div className="mt-4 w-full rounded-2xl bg-accent-soft p-4 text-left">
              <p className="font-semibold">Want a 3D cartoon version of you?</p>
              <p className="mt-1 text-sm text-muted">We send this one photo to Google&apos;s Gemini image model to draw you as a 3D cartoon chef. It isn&apos;t stored on our servers.</p>
              <button onClick={drawCartoon} disabled={drawing} className="mt-3 min-h-12 w-full rounded-full border-2 border-button bg-white font-semibold disabled:opacity-60">
                {drawing ? "Drawing your 3D chef… (up to a minute)" : "Make my 3D cartoon"}
              </button>
            </div>
          )}
          <div className="mt-auto w-full space-y-2 pt-6">
            <button onClick={keep} disabled={drawing} className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink disabled:opacity-60">Looks good</button>
            <button onClick={() => { setResult(null); setCartoon(null); setStage("intro"); }} className="min-h-12 w-full font-medium">Try another photo</button>
          </div>
        </div>
      )}

      {stage === "denied" && (
        <div className="step-in flex flex-1 flex-col">
          <p role="alert" className="rounded-2xl bg-surface p-4">{error}</p>
          <div className="mt-auto space-y-2 pt-6">
            <button onClick={() => file.current?.click()} className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink">Upload a photo</button>
            <button onClick={useCamera} className="min-h-12 w-full rounded-full border-2 border-line font-semibold">Try the camera again</button>
            {onSkip && <button onClick={onSkip} className="min-h-11 w-full font-medium text-muted">Skip for now</button>}
          </div>
        </div>
      )}
      {error && stage !== "denied" && <p role="alert" className="mt-3 text-sm text-tomato">{error}</p>}
    </div>
  );
}
