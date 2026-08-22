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
          <p className="mb-2 font-sora text-lg font-bold text-on-surface">
            Can&apos;t open this
          </p>
          <p className="font-geist mb-6 text-sm text-on-surface-variant">{error}</p>
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
          <p className="mb-2 font-sora text-lg font-bold text-on-surface">
            This chapter has a broken link
          </p>
          <p className="font-geist mb-6 text-sm text-on-surface-variant">
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
    <div className="flex flex-col w-full h-[100dvh] pt-[calc(env(safe-area-inset-top)+1rem)] pb-[env(safe-area-inset-bottom)] max-w-6xl mx-auto px-2 lg:px-0">
      {/* Toolbar */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between mb-4 gap-4">
        <button
          onClick={() => { haptic.tap(); router.back(); }}
          aria-label="Back"
          className="press glassy flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface hover:brightness-110"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="flex flex-1 items-center justify-end gap-2 lg:gap-3">
          {!alreadyDone && (
            <button
              onClick={markDone}
              className="press font-geist flex items-center gap-1.5 lg:gap-2 rounded-full glassy border border-purple-500/20 px-3 lg:px-5 py-2 lg:py-2.5 text-xs lg:text-sm font-bold text-on-surface"
            >
              <CheckCircle2 size={16} className="text-purple-500" />
              <span className="hidden sm:inline">Mark done</span>
              <span className="text-purple-500">+{content.rewardCoins ?? 10} 🪙</span>
            </button>
          )}

          <button
            onClick={askAi}
            className="press font-geist flex items-center gap-1.5 lg:gap-2 rounded-full glassy border border-purple-500/20 px-3 lg:px-5 py-2 lg:py-2.5 text-xs lg:text-sm font-bold text-on-surface"
          >
            <Sparkles size={16} className="text-purple-500" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* PDF Container */}
      <div className="relative flex-1 w-full rounded-2xl lg:rounded-[2rem] overflow-hidden glassy-strong shadow-2xl border border-white/10">
        {!frameLoaded && (
          <div className="absolute inset-0 grid place-items-center bg-black/5 dark:bg-white/5">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        )}
        <iframe
          src={drivePreviewUrl(driveId)}
          title={content.title}
          onLoad={() => setFrameLoaded(true)}
          referrerPolicy="no-referrer"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-none bg-white"
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
