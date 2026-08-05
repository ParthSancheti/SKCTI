"use client";

import { motion } from "framer-motion";
import { limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { Crown, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { RowSkeleton } from "@/components/SkeletonLoader";
import { col, snapTo } from "@/lib/db";
import { useStore } from "@/lib/store";
import type { UserDoc } from "@/lib/types";
import GlassCard from "@/components/GlassCard";

export default function Rank() {
  const { profile, config } = useStore();
  const [rows, setRows] = useState<UserDoc[] | null>(null);

  useEffect(() => {
    const q = query(col.users(), orderBy("coins", "desc"), limit(50));
    return onSnapshot(q, (s) => setRows(s.docs.map((d) => snapTo<UserDoc>(d))), () => setRows([]));
  }, []);

  if (!profile) return null;
  if (!config.features.rank)
    return <p className="pt-20 text-center font-hanken text-body-md text-on-surface/50">Ranks are switched off right now.</p>;

  const myIndex = rows?.findIndex((r) => r.uid === profile.uid) ?? -1;
  const top3 = (rows ?? []).slice(0, 3);
  const rest = (rows ?? []).slice(3);

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-4 lg:px-0 mt-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { vibrate(10); window.history.back(); }} 
            className="hidden lg:flex w-10 h-10 items-center justify-center rounded-full glassy text-black dark:text-white pointer-events-auto shrink-0 hover:brightness-110 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white mb-2 font-sora tracking-tight">
              Rank Board
            </h1>
            <p className="font-geist text-body-lg text-neutral-600 dark:text-neutral-400">Live · earn coins from tasks & tests to climb</p>
          </div>
        </div>
      </div>

      {rows === null && <div className="space-y-3">{[0, 1, 2, 3].map((i) => <RowSkeleton key={i} />)}</div>}

      {rows !== null && rows.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 lg:gap-3 items-end mx-2 lg:mx-6">
            {[top3[1], top3[0], top3[2]].map((s, i) =>
              s ? (
                <GlassCard
                  key={s.uid}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, type: "spring", stiffness: 300, damping: 24 }}
                  className={`p-5 text-center shadow-xl ${i === 1 ? "pb-9 !shadow-purple-500/20" : "opacity-90"}`}
                >
                  {i === 1 && <Crown size={18} className="mx-auto text-primary mb-1" />}
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary-container/20 flex items-center justify-center font-sora font-bold text-primary mb-2 overflow-hidden">
                    {s.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      s.name.charAt(0)
                    )}
                  </div>
                  <p className="font-sora font-semibold text-sm truncate text-neutral-900 dark:text-white">{s.name.split(" ")[0]}</p>
                </GlassCard>
              ) : (
                <div key={i} />
              )
            )}
          </div>

          <div className="space-y-2.5">
            {rest.map((s, i) => {
              const me = s.uid === profile.uid;
              return (
                <GlassCard
                  key={s.uid}
                  strong={me}
                  interactive={!me}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className={`mx-2 lg:mx-6 px-5 py-4 flex items-center gap-4 transition-all ${me ? "!border-purple-500/40 sticky bottom-28 lg:bottom-6 z-30 shadow-lg" : "shadow-md hover:brightness-105"}`}
                >
                  <span className="font-geist text-label-md text-black dark:text-neutral-400 w-7 tabular-nums">#{i + 4}</span>
                  <p className="font-sora font-semibold flex-1 truncate text-neutral-900 dark:text-white">{me ? "You" : s.name}</p>
                  <span className="font-geist text-label-sm text-black dark:text-neutral-400 flex items-center gap-1"><Flame size={12} className="text-purple-500" /> {s.streak}</span>
                  <span className="font-geist text-label-md text-purple-600 dark:text-purple-400 tabular-nums font-bold">{s.coins} 🪙</span>
                </GlassCard>
              );
            })}
          </div>
          {myIndex >= 0 && myIndex < 3 && (
            <p className="font-geist text-label-sm text-primary text-center">You&apos;re on the podium — #{myIndex + 1} 👑</p>
          )}
        </>
      )}
    </div>
  );
}
