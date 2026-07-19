"use client";

import { motion } from "framer-motion";
import { Home, BookOpen, ClipboardList, Trophy, Settings, LifeBuoy, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore, vibrate } from "@/lib/store";

const LINKS = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/learn", label: "Learn Hub", Icon: BookOpen },
  { href: "/tests", label: "Tests", Icon: ClipboardList },
  { href: "/rank", label: "Rank", Icon: Trophy },
];

/* R6 — fixed left glass sidebar for the Student App on lg: screens */
export default function SideNav() {
  const pathname = usePathname();
  const { profile, config } = useStore();
  const stream = profile?.stream ?? "PCM";
  const links = LINKS.filter((l) => (l.href === "/tests" ? config.features.tests : l.href === "/rank" ? config.features.rank : true));
  const grade = profile?.grade ?? "11th";

  return (
    <aside className="hidden lg:flex flex-col fixed left-8 top-8 bottom-8 w-72 rounded-lg glassy-strong shadow-2xl shadow-primary/10 p-6 z-40">
      <div className="flex items-center gap-3 pb-6 border-b" style={{ borderColor: "var(--glass-stroke)" }}>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-container to-red-900 flex items-center justify-center font-sora font-bold text-white text-lg shadow-glow-primary">
          {profile?.name?.charAt(0) ?? "S"}
        </div>
        <div>
          <p className="font-sora font-semibold leading-tight">{profile?.name ?? "Student"}</p>
          <p className="font-geist text-label-sm uppercase text-primary/80">Elite Ranker · {stream} {grade}</p>
        </div>
      </div>

      <nav className="flex-1 mt-6 space-y-1">
        {links.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => vibrate(10)}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-geist text-label-md transition-colors ${
                  active
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface/70 hover:bg-glass/5"
                }`}
                style={!active ? undefined : { boxShadow: "0 0 24px rgba(234,88,12,0.35)" }}
              >
                <Icon size={18} />
                {label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 pt-6 border-t" style={{ borderColor: "var(--glass-stroke)" }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full rounded-full bg-primary-container text-white font-geist text-label-md py-3 flex items-center justify-center gap-2 hover:shadow-glow-primary transition-shadow"
        >
          <Zap size={16} /> Join Elite Batch
        </motion.button>
        <div className="flex items-center justify-between">
          <Link href="/settings" onClick={() => vibrate(10)}>
            <motion.span whileTap={{ scale: 0.95 }} className="flex items-center gap-2 font-geist text-label-sm text-on-surface/60 hover:text-on-surface transition-colors">
              <Settings size={14} /> SETTINGS
            </motion.span>
          </Link>
          <motion.span whileTap={{ scale: 0.95 }} className="flex items-center gap-2 font-geist text-label-sm text-on-surface/60 cursor-pointer hover:text-on-surface transition-colors">
            <LifeBuoy size={14} /> SUPPORT
          </motion.span>
        </div>
      </div>
    </aside>
  );
}
