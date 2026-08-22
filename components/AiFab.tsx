"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { haptic } from "@/lib/haptics";

/**
 * FIXES — audit §20 and §31.
 *
 * 1. `bottom-28` was hardcoded. With the status bar overlaying the WebView and
 *    no safe-area compensation, on a gesture-nav Android the FAB drifts into
 *    the system strip. Now anchored to --nav-clearance, which is derived from
 *    the real nav height plus env(safe-area-inset-bottom).
 *
 * 2. `animate-pulse` ran forever on an element carrying
 *    `shadow-[0_0_40px_rgba(168,85,247,0.8)]`. Animating opacity on a large
 *    soft shadow forces a repaint of that whole region every frame, on an
 *    element that is visible on every screen in the app. It is also visually
 *    restless — a permanently throbbing button reads as an alert, not an
 *    affordance. Replaced with a one-shot entrance and a real press state.
 *
 * 3. `router.push` downloaded the /ai chunk on tap. <Link prefetch> pulls it
 *    while the student is still reading, so the AI Lab opens instantly.
 *
 * 4. Was a <button> doing navigation — no right-click, no long-press-to-open,
 *    invisible to a screen reader as a link. Now a real anchor.
 */
export default function AiFab() {
  const pathname = usePathname();
  const { config } = useStore();

  if (!config.features.ai || pathname === "/ai") return null;

  return (
    <Link
      href="/ai"
      prefetch
      onClick={() => haptic.impact()}
      aria-label="Open AI Lab"
      className="press fixed right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full
                 border border-white/20 bg-gradient-to-r from-purple-600 to-blue-600 text-white
                 shadow-[0_8px_32px_rgba(168,85,247,0.45)]
                 lg:right-10 lg:!bottom-6"
      style={{ bottom: "calc(var(--nav-clearance, 7rem) + 2.5rem)" }}
    >
      <Sparkles size={24} />
    </Link>
  );
}
