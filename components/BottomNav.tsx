"use client";

import { motion } from "framer-motion";
import { Home, BookOpen, ClipboardList, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore, vibrate } from "@/lib/store";

const TABS = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/learn", label: "Learn", Icon: BookOpen },
  { href: "/tests", label: "Tests", Icon: ClipboardList },
  { href: "/rank", label: "Rank", Icon: Trophy },
];

/* R5 — floating glass pill nav; the frosted active pill slides between tabs
 * via layoutId while the label stretches open (max-width 0 → 100px). */
export default function BottomNav() {
  const pathname = usePathname();
  const { config } = useStore();
  const tabs = TABS.filter((t) => (t.href === "/tests" ? config.features.tests : t.href === "/rank" ? config.features.rank : true));

  return (
    <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glassy-strong rounded-full px-2 py-2 flex items-center gap-1 shadow-glow-primary-soft">
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} onClick={() => vibrate(10)}>
            <motion.div whileTap={{ scale: 0.95 }} className="relative flex items-center gap-2 px-4 py-2.5 rounded-full">
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--glass-fill-strong)", border: "1px solid var(--glass-stroke)" }}
                />
              )}
              <Icon size={20} className={`relative z-10 ${active ? "text-primary" : "text-on-surface/60"}`} />
              <span className={`nav-label relative z-10 font-geist text-label-md ${active ? "open text-primary" : ""}`}>
                {label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
