"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, query, where } from "firebase/firestore";
import { CheckCircle2, ClipboardList, Clock, PlayCircle, X, ChevronLeft, ExternalLink } from "lucide-react";
import { Browser } from "@capacitor/browser";
import { useEffect, useMemo, useState } from "react";
import { TestSkeleton } from "@/components/SkeletonLoader";
import { col, snapTo } from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { TestDoc } from "@/lib/types";
import { formEmbedUrl } from "@/lib/types";
import GlassCard from "@/components/GlassCard";

export default function Tests() {
  const { profile, config, markAttempted } = useStore();
  const [tests, setTests] = useState<TestDoc[] | null>(null);
  const [tab, setTab] = useState<"All" | "Chapter" | "Mock">("All");

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
      <div className="mt-2 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="font-sora text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-1">Test Arena</h1>
          <p className="font-geist text-body-lg text-neutral-600 dark:text-neutral-400 mt-1">{profile.attempted.length} attempted · +25 coins per test</p>
        </div>
        <div className="flex items-center gap-2">
          {(["All", "Chapter", "Mock"] as const).map((t) => (
            <button key={t} onClick={() => { vibrate(10); setTab(t); }} className={`px-5 py-2 rounded-full font-geist text-label-sm ${
              tab === t ? "btn-primary" : "btn-glass"
            }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {tests === null && [0, 1].map((i) => <TestSkeleton key={i} />)}
        {tests !== null && shown.length === 0 && (
          <div className="glassy-strong rounded-[2rem] p-10 text-center">
            <ClipboardList size={22} className="mx-auto text-purple-500 mb-2" />
            <p className="font-sora font-semibold text-black dark:text-white">No tests yet</p>
            <p className="font-geist text-label-sm text-black dark:text-neutral-400 mt-1">Quizzes published for {profile.stream} land here live.</p>
          </div>
        )}
        {shown.map((t) => {
          const done = profile.attempted.includes(t.id);
          return (
            <GlassCard
              key={t.id}
              interactive
              className="w-full p-6 text-left flex flex-col gap-4"
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
              
              <div className="pt-4 border-t border-black/10 dark:border-white/10 flex justify-end gap-3">
                {!done && (
                  <button
                    onClick={() => { vibrate(20); void markAttempted(t.id, t.rewardCoins ?? 25); }}
                    className="btn-secondary px-4 py-2.5 rounded-full text-sm"
                  >
                    <CheckCircle2 size={16} />
                    Done +{t.rewardCoins ?? 25}
                  </button>
                )}
                <button
                  onClick={async () => { 
                    vibrate(10); 
                    try {
                      await Browser.open({ url: t.formUrl });
                    } catch {
                      window.open(t.formUrl, "_blank");
                    }
                  }}
                  className="btn-glass px-5 py-2.5 rounded-full text-sm"
                >
                  <PlayCircle size={16} />
                  Start Test
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>


    </div>
  );
}


