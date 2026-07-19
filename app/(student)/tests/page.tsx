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
    <div className="pt-6 space-y-6">
      <div>
        <h1 className="font-sora text-headline-xl">Test Arena</h1>
        <p className="font-hanken text-body-md text-on-surface/60 mt-1">{profile.attempted.length} attempted · +25 coins per test</p>
      </div>

      <div className="glassy rounded-full p-1.5 flex">
        {(["All", "Chapter", "Mock"] as const).map((t) => (
          <button key={t} onClick={() => { vibrate(10); setTab(t); }} className="relative flex-1 py-2.5 rounded-full font-geist text-label-md">
            {tab === t && <motion.span layoutId="test-tab" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-full bg-primary-container" />}
            <span className={`relative z-10 ${tab === t ? "text-white" : "text-on-surface/60"}`}>{t}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {tests === null && [0, 1].map((i) => <TestSkeleton key={i} />)}
        {tests !== null && shown.length === 0 && (
          <div className="glassy rounded-glass p-10 text-center">
            <ClipboardList size={22} className="mx-auto text-primary mb-2" />
            <p className="font-sora font-semibold">No tests yet</p>
            <p className="font-hanken text-body-md text-on-surface/50 mt-1">Quizzes published for {profile.stream} land here live.</p>
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
              className="w-full glassy rounded-glass p-6 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-sora font-semibold text-lg leading-snug">{t.title}</h3>
                  <p className="font-geist text-label-sm text-on-surface/50 mt-1">{t.subject} · {t.kind} test</p>
                </div>
                {done ? (
                  <span className="shrink-0 rounded-full bg-primary-container/20 text-primary px-3 py-1 font-geist text-label-sm flex items-center gap-1"><CheckCircle2 size={12} /> Done</span>
                ) : (
                  <span className="shrink-0 glassy rounded-full px-3 py-1 font-geist text-label-sm flex items-center gap-1"><Clock size={12} /> {t.durationMin}m</span>
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
            <div className="glassy-strong flex items-center gap-3 px-4 py-3 m-3 rounded-glass">
              <button onClick={() => { vibrate(10); setOpen(null); }} aria-label="Close" className="w-10 h-10 rounded-full glassy flex items-center justify-center shrink-0"><X size={18} /></button>
              <div className="flex-1 min-w-0">
                <p className="font-sora font-semibold truncate">{open.title}</p>
                <p className="font-geist text-label-sm text-on-surface/50">{open.durationMin} min · submit inside the form</p>
              </div>
              {!profile.attempted.includes(open.id) && (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { vibrate(20); void markAttempted(open.id); }}
                  className="rounded-full bg-primary-container text-white px-4 py-2.5 font-geist text-label-sm shrink-0"
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
