"use client";

import { Home, BookOpen, ClipboardList, Trophy, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useStore, vibrate } from "@/lib/store";
import { useHapticRouter } from "@/components/HapticRouter";

const LINKS = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/learn", label: "Learn Hub", Icon: BookOpen },
  { href: "/tests", label: "Tests", Icon: ClipboardList },
  { href: "/rank", label: "Rank", Icon: Trophy },
  { href: "/ai", label: "AI Assistant", Icon: Sparkles },
];

export default function SideNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profile, config, fbUser } = useStore();
  const { navigate } = useHapticRouter();
  
  const stream = profile?.stream ?? "PCM";
  const links = LINKS.filter((l) => {
    if (l.href === "/tests") return config.features.tests;
    if (l.href === "/rank") return config.features.rank;
    if (l.href === "/ai") return config.features.ai;
    return true;
  });
  const grade = profile?.grade ?? "11th";

  return (
    <aside className="hidden lg:flex flex-col fixed left-6 top-6 bottom-6 w-[280px] rounded-[2.5rem] bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl p-6 z-40">
      <div className="flex items-center justify-center gap-4 py-2 pb-8 border-b border-black/10 dark:border-white/10">
        <img src="/src/logo.png" className="w-14 h-14 rounded-xl bg-white p-1.5 shadow-lg" alt="SKCTI Logo" />
        <span className="font-sora font-black text-3xl tracking-tight text-neutral-900 dark:text-white">SKCTI</span>
      </div>

      <nav className="flex-1 mt-6 space-y-2 relative">
        {links.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <button
              key={href}
              onClick={(e) => navigate(href, e)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-geist text-body-md font-semibold transition-all relative ${
                active 
                  ? "bg-white/30 dark:bg-white/20 text-black dark:text-white shadow-md border border-white/20" 
                  : "text-black dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Icon size={20} className={active ? "text-purple-600 dark:text-purple-400" : ""} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-black/10 dark:border-white/10 mt-auto">
        <Link href="/settings" className="block">
          <div
            className="w-full flex items-center gap-3 p-3 pl-4 bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-full hover:bg-white/10 transition-all shadow-md cursor-pointer group"
          >
            {fbUser?.photoURL ? (
              <img src={fbUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-inner shrink-0 border border-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-sora font-bold text-white shadow-inner shrink-0">
                {profile?.name?.charAt(0) ?? "S"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-sora font-semibold text-sm truncate text-neutral-900 dark:text-white group-hover:text-purple-600 transition-colors">{profile?.name ?? "Student"}</p>
              <p className="font-geist text-xs text-black dark:text-neutral-400 truncate">{stream} · {grade}</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                vibrate(50);
                window.location.href = "/login";
                document.cookie = "skcti_session=; path=/; max-age=0";
              }}
              className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center shrink-0 transition-all z-10 relative"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </Link>
      </div>
    </aside>
  );
}

