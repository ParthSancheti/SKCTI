"use client";

import { Home, BookOpen, ClipboardList, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";

const TABS = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/learn", label: "Learn", Icon: BookOpen },
  { href: "/tests", label: "Tests", Icon: ClipboardList },
  { href: "/rank", label: "Rank", Icon: Trophy },
];

import { useHapticRouter } from "@/components/HapticRouter";

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { config } = useStore();
  const { navigate } = useHapticRouter();
  const tabs = TABS.filter((t) => (t.href === "/tests" ? config.features.tests : t.href === "/rank" ? config.features.rank : true));

  // Directive 4: Immersive Subject View & Gemini UI Clone
  if (pathname === "/ai" || (pathname === "/learn" && searchParams.get("subject"))) {
    return null;
  }

  return (
    <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] h-16 rounded-full bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 z-[60] flex items-center justify-around px-2 shadow-2xl">
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <button key={href} onClick={(e) => navigate(href, e)} className="h-full flex items-center justify-center cursor-pointer">
            {active ? (
              <div
                className="bg-white/30 dark:bg-white/20 backdrop-blur-[60px] border border-black/10 dark:border-white/20 text-black dark:text-white rounded-full px-6 py-2.5 flex items-center gap-2 shadow-lg scale-105 transition-all"
              >
                <Icon size={20} />
                <span className="font-geist text-sm font-semibold">
                  {label}
                </span>
              </div>
            ) : (
              <div className="text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white p-2 transition-all flex items-center justify-center">
                <Icon size={22} />
              </div>
            )}
          </button>
        );
      })}
    </nav>
  );
}
