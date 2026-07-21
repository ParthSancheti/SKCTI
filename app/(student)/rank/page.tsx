"use client";

import { motion } from "framer-motion";
import { limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { Crown, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { RowSkeleton } from "@/components/SkeletonLoader";
import { col, snapTo } from "@/lib/db";
import { useStore } from "@/lib/store";
import type { UserDoc } from "@/lib/types";

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
      <div className="mx-6 mt-6 mb-8 flex flex-col gap-2">
        <h1 className="font-sora text-6xl font-black tracking-tight text-neutral-900 dark:text-white">Rank Board</h1>
        <p className="font-geist text-body-lg text-neutral-600 dark:text-neutral-400">Live · earn coins from tasks & tests to climb</p>
      </div>

      {rows === null && <div className="space-y-3">{[0, 1, 2, 3].map((i) => <RowSkeleton key={i} />)}</div>}

      {rows !== null && rows.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3 items-end mx-6">
            {[top3[1], top3[0], top3[2]].map((s, i) =>
              s ? (
                <motion.div
                  key={s.uid}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, type: "spring", stiffness: 300, damping: 24 }}
                  className={`bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 text-center shadow-xl ${i === 1 ? "pb-9 shadow-purple-500/20" : "opacity-90"}`}
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
                  <p className="font-geist text-label-sm text-purple-600 dark:text-purple-400 mt-0.5">{s.coins} 🪙</p>
                </motion.div>
              ) : (
                <div key={i} />
              )
            )}
          </div>

          <div className="space-y-2.5">
            {rest.map((s, i) => {
              const me = s.uid === profile.uid;
              return (
                <motion.div
                  key={s.uid}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className={`mx-6 rounded-2xl px-5 py-4 flex items-center gap-4 transition-all ${me ? "bg-white/10 dark:bg-white/10 backdrop-blur-2xl border border-purple-500/40 sticky bottom-28 lg:bottom-6 z-30 shadow-lg" : "bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 shadow-md hover:bg-white/10"}`}
                >
                  <span className="font-geist text-label-md text-black dark:text-neutral-400 w-7 tabular-nums">#{i + 4}</span>
                  <p className="font-sora font-semibold flex-1 truncate text-neutral-900 dark:text-white">{me ? "You" : s.name}</p>
                  <span className="font-geist text-label-sm text-black dark:text-neutral-400 flex items-center gap-1"><Flame size={12} className="text-purple-500" /> {s.streak}</span>
                  <span className="font-geist text-label-md text-purple-600 dark:text-purple-400 tabular-nums font-bold">{s.coins} 🪙</span>
                </motion.div>
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


