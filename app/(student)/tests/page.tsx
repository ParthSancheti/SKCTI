"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, query, where } from "firebase/firestore";
import { CheckCircle2, ClipboardList, Clock, PlayCircle, X, ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TestSkeleton } from "@/components/SkeletonLoader";
import { col, snapTo } from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { TestDoc } from "@/lib/types";
import { formEmbedUrl } from "@/lib/types";

export default function Tests() {
  const { profile, config, markAttempted } = useStore();
  const [tests, setTests] = useState<TestDoc[] | null>(null);
  const [tab, setTab] = useState<"All" | "Chapter" | "Mock">("All");
  const [open, setOpen] = useState<TestDoc | null>(null);

  useEffect(() => {
    if (!profile) return;
    const q = query(col.tests(), where("published", "==", true));
    return onSnapshot(q, (s) => {
      const docs = s.docs.map((d) => snapTo<TestDoc>(d)).filter((t) => t.streams.includes(profile.stream));
      docs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      setTests(docs);
    }, () => setTests([]));
  }, [profile?.stream]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => (tests ?? []).filter((t) => tab === "All" || t.kind === tab), [tests, tab]);

  if (!profile) return null;
  if (!config.features.tests)
    return <p className="pt-20 text-center font-hanken text-body-md text-on-surface/50">Tests are switched off right now.</p>;

  return (
    <div className="space-y-6 pb-24">
      <div className="mx-6 mt-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="font-sora text-6xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">Test Arena</h1>
          <p className="font-geist text-body-lg text-neutral-600 dark:text-neutral-400 mt-1">{profile.attempted.length} attempted · +25 coins per test</p>
        </div>
        <div className="flex items-center gap-2">
          {(["All", "Chapter", "Mock"] as const).map((t) => (
            <button key={t} onClick={() => { vibrate(10); setTab(t); }} className={`px-5 py-2 rounded-full font-geist text-label-sm font-semibold transition-all ${
              tab === t 
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg" 
                : "glassy hover:brightness-110 text-black dark:text-white"
            }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 mx-6">
        {tests === null && [0, 1].map((i) => <TestSkeleton key={i} />)}
        {tests !== null && shown.length === 0 && (
          <div className="glassy-strong rounded-3xl p-10 text-center">
            <ClipboardList size={22} className="mx-auto text-purple-500 mb-2" />
            <p className="font-sora font-semibold text-black dark:text-white">No tests yet</p>
            <p className="font-geist text-label-sm text-black dark:text-neutral-400 mt-1">Quizzes published for {profile.stream} land here live.</p>
          </div>
        )}
        {shown.map((t) => {
          const done = profile.attempted.includes(t.id);
          return (
            <motion.div
              key={t.id}
              layout
              className="w-full glassy rounded-[1.5rem] p-6 text-left hover:brightness-110 transition-all flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-sora font-semibold text-lg leading-snug text-black dark:text-white">{t.title}</h3>
                  <p className="font-geist text-label-sm text-black/60 dark:text-white/60 mt-1">{t.subject} · {t.kind} test</p>
                </div>
                {done ? (
                  <span className="shrink-0 rounded-full bg-purple-600/20 text-purple-600 dark:text-purple-400 px-3 py-1 font-geist text-label-sm flex items-center gap-1"><CheckCircle2 size={12} /> Done</span>
                ) : (
                  <span className="shrink-0 glassy rounded-full px-3 py-1 font-geist text-label-sm flex items-center gap-1 text-black dark:text-white"><Clock size={12} /> {t.durationMin}m</span>
                )}
              </div>
              
              <div className="pt-4 border-t border-black/10 dark:border-white/10 flex justify-end">
                <button
                  onClick={() => { vibrate(10); setOpen(t); }}
                  className="glassy-strong px-5 py-2.5 rounded-xl font-geist text-sm font-semibold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all text-black dark:text-white"
                >
                  <PlayCircle size={16} />
                  Start Test
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ————— embedded Google Form ————— */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black lg:relative lg:inset-auto lg:z-auto lg:bg-transparent"
          >
            {/* Floating UI */}
            <div className="absolute inset-0 pointer-events-none z-50">
              {/* Top Left: Back Button */}
              <div className="absolute top-4 left-4 pointer-events-auto">
                <button 
                  onClick={() => { vibrate(10); setOpen(null); }}
                  className="flex items-center justify-center w-12 h-12 rounded-full glassy hover:brightness-110 transition-all text-white lg:text-black lg:dark:text-white"
                >
                  <ChevronLeft size={24} />
                </button>
              </div>

              {/* Bottom Right: Mark Done Button */}
              {!profile.attempted.includes(open.id) && (
                <div className="absolute bottom-6 right-6 pointer-events-auto">
                  <button 
                    onClick={() => { vibrate(20); void markAttempted(open.id, open.rewardCoins ?? 25); setOpen(null); }}
                    className="flex items-center gap-2 px-5 py-3 rounded-full border border-purple-500/50 bg-black/40 backdrop-blur-md text-purple-400 hover:bg-black/60 transition-all font-geist text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                  >
                    <CheckCircle2 size={16} className="text-purple-300" />
                    <span className="text-white drop-shadow-md">Mark done +{open.rewardCoins ?? 25} 🪙</span>
                  </button>
                </div>
              )}
            </div>

            {/* Test Iframe Container */}
            <div className="w-full h-full lg:h-[calc(100vh-80px)] p-0 lg:p-4">
              <iframe 
                src={formEmbedUrl(open.formUrl)} 
                className="w-full h-full border-none rounded-none lg:rounded-2xl bg-white pointer-events-auto"
                allow="autoplay; encrypted-media" 
                allowFullScreen 
                onContextMenu={(e) => e.preventDefault()}
                title={open.title}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


