"use client";

import { Flame, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CoinPill } from "@/components/CoinSystem";
import ComingSoon from "@/components/ComingSoon";
import { useStore, vibrate, firePortal } from "@/lib/store";
import { useHapticRouter } from "@/components/HapticRouter";

export default function TitleBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate } = useHapticRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState("");
  
  const store = useStore();
  const { profile, config, isDark, toggleTheme } = store;

  // Directive 4: Immersive Subject View & Gemini UI Clone
  if (pathname === "/ai" || (pathname === "/learn" && searchParams.get("subject"))) {
    return null;
  }

  if (!profile) return null;
  const firstName = profile.name.split(" ")[0];

  let title = "Welcome";
  if (pathname.startsWith("/learn")) title = "Learn OS";
  else if (pathname.startsWith("/tests")) title = "Test Arena";
  else if (pathname.startsWith("/rank")) title = "Global Rank";
  else if (pathname.startsWith("/ai")) title = "AI Assistant";

  return (
    <>
      <header className="sticky top-4 lg:top-6 z-40 mx-4 lg:mx-0 mb-4 px-4 py-2 lg:px-6 lg:py-3 bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] lg:rounded-full shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3 w-full">
          {/* PC Left Side */}
          <div className="flex-1 min-w-0 hidden lg:block">
            <h1 className="font-sora text-xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">{title}</h1>
          </div>
          
          {/* Mobile Left Side */}
          <div className="flex-1 min-w-0 flex lg:hidden items-center gap-3">
             <img src="/src/logo.png" className="w-10 h-10 rounded-xl bg-white p-1 shadow-lg shrink-0" alt="SKCTI Logo" />
             <span className="font-sora font-black text-2xl tracking-tight text-neutral-900 dark:text-white">SKCTI</span>
          </div>

          {config.features.streak && (
            <div className="glassy rounded-full px-3 py-1.5 flex items-center gap-1.5 cursor-pointer" onClick={() => { vibrate(50); setComingSoonTitle("Streak Rewards"); setComingSoonOpen(true); }}>
              <Flame size={15} className="text-purple-600 dark:text-purple-400" />
              <span className="font-geist text-label-md tabular-nums text-neutral-900 dark:text-white">{profile.streak}</span>
            </div>
          )}
          
          <div onClick={() => { vibrate(50); setComingSoonTitle("Coin Shop"); setComingSoonOpen(true); }} className="cursor-pointer">
            <CoinPill />
          </div>

          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={(e) => { vibrate(50); firePortal(e.clientX, e.clientY); setMenuOpen(!menuOpen); }}
              className="w-10 h-10 lg:w-11 lg:h-11 rounded-full overflow-hidden glassy flex items-center justify-center border border-white/10"
              aria-label="Profile menu"
            >
              {profile.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="font-sora font-bold text-purple-600 dark:text-purple-400">{firstName.charAt(0)}</span>
              )}
            </motion.button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { vibrate(10); setMenuOpen(false); }} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -6 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    className="absolute right-0 top-full mt-4 w-64 bg-white/40 dark:bg-[#0a0a0f]/70 backdrop-blur-[40px] border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl p-2 origin-top-right z-50"
                  >
                  {[
                    { icon: "🌓", label: isDark ? "Light mode" : "Dark mode", act: () => toggleTheme() },
                    ...(config.features.streak ? [{ icon: "🔥", label: `${profile.streak}-day streak`, act: () => { setComingSoonTitle("Streak Rewards"); setComingSoonOpen(true); } }] : []),
                    ...(config.features.coins ? [{ icon: "🪙", label: `${profile.coins} coins`, act: () => { setComingSoonTitle("Coin Shop"); setComingSoonOpen(true); } }] : []),
                    { icon: "⚙️", label: "Settings", act: (e: React.MouseEvent) => navigate("/settings", e) },
                  ].map(({ icon, label, act }) => (
                    <button
                      key={label}
                      onClick={(e) => { vibrate(50); firePortal(e.clientX, e.clientY); setMenuOpen(false); act(e); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 font-geist text-label-md text-left transition-all text-neutral-900 dark:text-white"
                    >
                      <span className="text-lg leading-none">{icon}</span> {label}
                    </button>
                  ))}
                  
                  <div className="my-2 border-t border-white/10" />
                  
                  <button
                    onClick={() => { vibrate(50); setMenuOpen(false); window.location.href = "/login"; document.cookie = "skcti_session=; path=/; max-age=0"; }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 font-geist text-label-md text-left transition-all text-red-600 dark:text-red-500"
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
      <ComingSoon open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} title={comingSoonTitle} />
    </>
  );
}
