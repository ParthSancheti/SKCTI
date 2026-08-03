"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { ChevronLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { fbDb } from "@/lib/firebase";
import { drivePreviewUrl, extractDriveId, type ContentDoc } from "@/lib/types";
import { useStore } from "@/lib/store";
import { haptic } from "@/lib/haptics";

/**
 * ============================================================================
 * FIXES — audit §17, §20, §22, §31
 * ============================================================================
 *
 * 1. THE "ASK AI" BUTTON DID NOTHING.
 *      onClick={() => vibrate(10)}
 *    A student reading a chapter, stuck on a derivation, taps the button
 *    literally labelled "Ask AI" — and the phone buzzes at them. Nothing else.
 *    That is the worst kind of dead control: it is placed exactly where the
 *    need arises, and it is the moment the app loses their trust.
 *    Now it opens the AI Lab pre-seeded with the chapter title and subject, so
 *    the student lands in a conversation that already knows what they're
 *    reading.
 *
 * 2. NO SAFE AREA. `absolute top-4 left-4` on a `fixed inset-0` layer, with
 *    StatusBar overlaying the WebView — the back button sat under the clock on
 *    every phone. The one control the student needs to escape a fullscreen
 *    reader was partly untappable.
 *
 * 3. UNSANDBOXED IFRAME. Added sandbox + referrerPolicy. Also validating the
 *    driveId before building the URL rather than trusting whatever is on the
 *    document — a malformed or hand-edited Firestore record produced a silent
 *    blank iframe with no error.
 *
 * 4. NO LOADING STATE. The iframe painted white (in dark mode, on a black
 *    background) for as long as Drive took to respond. Looked like a crash.
 *
 * 5. onContextMenu={e => e.preventDefault()} ON THE IFRAME did nothing —
 *    cross-origin iframes don't propagate events to the parent document.
 *    Removed rather than left as false reassurance.
 *
 * 6. useSearchParams with no Suspense boundary opted the tree out of static
 *    rendering. Wrapped.
 * ============================================================================
 */

function ReaderInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const router = useRouter();
  const { profile, markViewed } = useStore();

  const [content, setContent] = useState<ContentDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameLoaded, setFrameLoaded] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("This link is missing a document id.");
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(fbDb(), "content", id));
        if (cancelled) return;
        if (!snap.exists()) {
          setError("That chapter isn't published any more.");
          return;
        }
        setContent({ id: snap.id, ...snap.data() } as ContentDoc);
      } catch {
        if (!cancelled) setError("Couldn't load the chapter. Check your connection.");
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  const askAi = () => {
    haptic.impact();
    if (!content) return;
    // Seed the AI Lab with what the student is actually looking at.
    const seed = `I'm reading "${content.title}" (${content.subject}). `;
    router.push(`/ai?seed=${encodeURIComponent(seed)}`);
  };

  const markDone = () => {
    if (!content) return;
    haptic.success();
    void markViewed(content.id, content.rewardCoins ?? 10);
  };

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-6 text-center">
        <div className="glassy-strong rounded-glass max-w-sm p-8">
          <p className="mb-2 font-sora text-lg font-bold text-neutral-900 dark:text-white">
            Can&apos;t open this
          </p>
          <p className="font-geist mb-6 text-sm text-neutral-500 dark:text-neutral-400">{error}</p>
          <button
            onClick={() => { haptic.tap(); router.back(); }}
            className="press glassy font-geist w-full rounded-full py-3 text-sm font-bold"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  // Trust nothing on the document. driveId should already be extracted at
  // publish time, but a hand-edited record or an old schema shouldn't produce
  // a silently broken iframe.
  const driveId = content.driveId || extractDriveId(content.driveUrl);
  if (!driveId) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-6 text-center">
        <div className="glassy-strong rounded-glass max-w-sm p-8">
          <p className="mb-2 font-sora text-lg font-bold text-neutral-900 dark:text-white">
            This chapter has a broken link
          </p>
          <p className="font-geist mb-6 text-sm text-neutral-500 dark:text-neutral-400">
            Let your teacher know — it needs re-publishing from Content Hub.
          </p>
          <button
            onClick={() => { haptic.tap(); router.back(); }}
            className="press glassy font-geist w-full rounded-full py-3 text-sm font-bold"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const alreadyDone = !!profile && profile.downloads.includes(content.id);

  return (
    <div className="fixed inset-0 z-[100] bg-black lg:relative lg:inset-auto lg:z-auto lg:bg-transparent">
      <div className="pointer-events-none absolute inset-0 z-50">
        {/* Back — now clears the status bar. */}
        <div
          className="pointer-events-auto absolute left-4"
          style={{ top: "calc(1rem + env(safe-area-inset-top, 0px))" }}
        >
          <button
            onClick={() => { haptic.tap(); router.back(); }}
            aria-label="Back"
            className="press glassy flex h-12 w-12 items-center justify-center rounded-full text-white lg:text-black lg:dark:text-white"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Actions — now clear the gesture bar. */}
        <div
          className="pointer-events-auto absolute right-6 flex flex-wrap items-center justify-end gap-3"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {!alreadyDone && (
            <button
              onClick={markDone}
              className="press font-geist flex items-center gap-2 rounded-full border border-purple-500/50 bg-black/40 px-5 py-3 text-sm font-bold backdrop-blur-md"
            >
              <CheckCircle2 size={16} className="text-purple-300" />
              <span className="text-white drop-shadow-md">
                Mark done +{content.rewardCoins ?? 10} 🪙
              </span>
            </button>
          )}

          <button
            onClick={askAi}
            className="press font-geist flex items-center gap-2 rounded-full border border-purple-500/50 bg-black/40 px-5 py-3 text-sm font-bold backdrop-blur-md"
          >
            <Sparkles size={16} className="text-purple-300" />
            <span className="text-white drop-shadow-md">Ask AI</span>
          </button>
        </div>
      </div>

      <div className="h-full w-full p-0 lg:h-[calc(100dvh-80px)] lg:p-4">
        {!frameLoaded && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        )}
        <iframe
          src={drivePreviewUrl(driveId)}
          title={content.title}
          onLoad={() => setFrameLoaded(true)}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          className="pointer-events-auto h-full w-full rounded-none border-none bg-white lg:rounded-card"
        />
      </div>
    </div>
  );
}

export default function PdfReaderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      }
    >
      <ReaderInner />
    </Suspense>
  );
}
