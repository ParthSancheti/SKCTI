"use client";

import { Home, BookOpen, ClipboardList, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { useStore } from "@/lib/store";
import { haptic } from "@/lib/haptics";

const TABS = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/learn", label: "Learn", Icon: BookOpen },
  { href: "/tests", label: "Tests", Icon: ClipboardList },
  { href: "/rank", label: "Rank", Icon: Trophy },
];

/**
 * FIXES vs the original:
 *
 * 1. SAFE AREA. Was `bottom-6` hardcoded. On any iPhone with a home indicator
 *    and on Android gesture nav the pill sat inside the system gesture strip —
 *    swipe-up-to-go-home was eating taps on the Rank tab. Now
 *    `bottom: calc(1.5rem + env(safe-area-inset-bottom))`.
 *
 * 2. NESTED BACKDROP-FILTER. The nav had `backdrop-blur-3xl` and the active
 *    pill inside it had `backdrop-blur-[60px]`. A nested backdrop-filter
 *    samples the already-blurred parent — visually muddy and roughly double
 *    the compositing cost, on the one element that's on screen 100% of the
 *    time. The pill is now a plain translucent fill.
 *
 * 3. THE PILL NOW SLIDES. Before, the active pill was a different DOM node per
 *    tab, so it teleported. `layoutId` makes Framer morph it between tabs —
 *    this is the single change that makes the nav read as native.
 *
 * 4. PREFETCH. `router.push` on a code-split route downloads the chunk on tap,
 *    so the first visit to each tab had a visible stall. `<Link>` prefetches
 *    on viewport entry, so tab switches are instant.
 *
 * 5. ACCESSIBILITY. Inactive tabs were icon-only with no label of any kind —
 *    unusable with a screen reader. Added aria-label + aria-current.
 *
 * 6. useSearchParams needs a Suspense boundary or it opts the whole tree out
 *    of static rendering. Wrapped.
 */
function BottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { config } = useStore();

  const tabs = TABS.filter((t) =>
    t.href === "/tests" ? config.features.tests : t.href === "/rank" ? config.features.rank : true
  );

  if (pathname === "/ai" || (pathname === "/learn" && searchParams.get("subject"))) {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: 20, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      aria-label="Main"
      className="lg:hidden fixed left-1/2 w-[90%] max-w-[400px] h-14 rounded-full glassy z-[60] flex items-center justify-around px-4"
      style={{ bottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            prefetch
            aria-label={label}
            aria-current={active ? "page" : undefined}
            onClick={() => haptic.tap()}
            className="press relative h-full flex items-center justify-center min-w-[44px]"
          >
            {active && (
              <motion.div
                layoutId="nav-pill"
                transition={{ type: "spring", stiffness: 480, damping: 38, mass: 0.7 }}
                className="absolute inset-y-1.5 -inset-x-1 rounded-full bg-white/30 dark:bg-white/20 border border-outline-variant shadow-lg"
              />
            )}
            <span
              className={`relative z-10 flex items-center gap-2 px-3 transition-colors duration-200 ${
                active
                  ? "text-on-surface"
                  : "text-on-surface-variant"
              }`}
            >
              <Icon size={active ? 20 : 22} />
              {active && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  transition={{ duration: 0.18, delay: 0.06 }}
                  className="font-sora text-sm font-bold whitespace-nowrap overflow-hidden"
                >
                  {label}
                </motion.span>
              )}
            </span>
          </Link>
        );
      })}
    </motion.nav>
  );
}

export default function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavInner />
    </Suspense>
  );
}
