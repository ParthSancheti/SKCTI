"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, query, where } from "firebase/firestore";
import { CheckCircle2, ClipboardList, Clock, X } from "lucide-react";
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
                : "bg-white/10 text-neutral-700 dark:text-white hover:bg-white/20"
            }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 mx-6">
        {tests === null && [0, 1].map((i) => <TestSkeleton key={i} />)}
        {tests !== null && shown.length === 0 && (
          <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-xl">
            <ClipboardList size={22} className="mx-auto text-purple-500 mb-2" />
            <p className="font-sora font-semibold text-neutral-900 dark:text-white">No tests yet</p>
            <p className="font-geist text-label-sm text-black dark:text-neutral-400 mt-1">Quizzes published for {profile.stream} land here live.</p>
          </div>
        )}
        {shown.map((t) => {
          const done = profile.attempted.includes(t.id);
          return (
            <motion.button
              key={t.id}
              layout
              whileTap={{ scale: 0.985 }}
              onClick={() => { vibrate(10); setOpen(t); }}
              className="w-full bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left hover:bg-white/10 transition-all shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-sora font-semibold text-lg leading-snug text-neutral-900 dark:text-white">{t.title}</h3>
                  <p className="font-geist text-label-sm text-black dark:text-neutral-400 mt-1">{t.subject} · {t.kind} test</p>
                </div>
                {done ? (
                  <span className="shrink-0 rounded-full bg-purple-600/20 text-purple-600 dark:text-purple-400 px-3 py-1 font-geist text-label-sm flex items-center gap-1"><CheckCircle2 size={12} /> Done</span>
                ) : (
                  <span className="shrink-0 bg-white/10 rounded-full px-3 py-1 font-geist text-label-sm flex items-center gap-1 text-neutral-700 dark:text-white"><Clock size={12} /> {t.durationMin}m</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ————— embedded Google Form ————— */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex flex-col" style={{ background: "rgb(var(--surface))" }}>
            <div className="bg-white/5 dark:bg-white/5 backdrop-blur-3xl border-b border-white/10 flex items-center gap-3 px-4 py-3 m-3 rounded-2xl shadow-xl">
              <button onClick={() => { vibrate(10); setOpen(null); }} aria-label="Close" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center shrink-0 text-neutral-900 dark:text-white"><X size={18} /></button>
              <div className="flex-1 min-w-0">
                <p className="font-sora font-semibold truncate text-neutral-900 dark:text-white">{open.title}</p>
                <p className="font-geist text-label-sm text-black dark:text-neutral-400">{open.durationMin} min · submit inside the form</p>
              </div>
              {!profile.attempted.includes(open.id) && (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { vibrate(20); void markAttempted(open.id); }}
                  className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 font-geist font-bold text-label-sm shrink-0 shadow-lg hover:scale-[1.02] active:scale-[0.97] transition-all"
                >
                  Mark done +25 🪙
                </motion.button>
              )}
            </div>
            <iframe src={formEmbedUrl(open.formUrl)} className="flex-1 w-full" style={{ border: 0 }} title={open.title} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


