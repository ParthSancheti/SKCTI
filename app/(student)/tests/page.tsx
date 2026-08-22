"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, query, where } from "firebase/firestore";
import { CheckCircle2, ClipboardList, Clock, PlayCircle, X, ChevronLeft, ExternalLink } from "lucide-react";
import { Browser } from "@capacitor/browser";
import { useEffect, useMemo, useState } from "react";
import { TestSkeleton } from "@/components/SkeletonLoader";
import { col, snapTo } from "@/lib/db";
import { getCohortId } from "@/lib/examConfig";
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
    const q = query(col.tests(), where("published", "==", true), where("streams", "array-contains", getCohortId((profile as any).exam, profile.stream, (profile as any).variant)));
    return onSnapshot(q, (s) => {
      const docs = s.docs.map((d) => snapTo<TestDoc>(d));
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
      <div className="mt-2 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8 lg:pt-0">
        <div>
          <h1 className="font-sora text-3xl font-extrabold tracking-tight text-on-surface mb-1">Test Arena</h1>
          <p className="font-geist text-body-lg text-on-surface-variant mt-1">{profile.attempted.length} attempted · +25 coins per test</p>
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
            <p className="font-sora font-semibold text-on-surface">No tests yet</p>
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
                  <h3 className="font-sora font-semibold text-lg leading-snug text-on-surface">{t.title}</h3>
                  <p className="font-geist text-label-sm text-on-surface-variant mt-1">{t.subject} · {t.kind} test</p>
                </div>
                {done ? (
                  <span className="shrink-0 rounded-full bg-purple-600/20 text-purple-600 dark:text-purple-400 px-3 py-1 font-geist text-label-sm flex items-center gap-1"><CheckCircle2 size={12} /> Done</span>
                ) : (
                  <span className="shrink-0 glassy rounded-full px-3 py-1 font-geist text-label-sm flex items-center gap-1 text-on-surface"><Clock size={12} /> {t.durationMin}m</span>
                )}
              </div>
              
              <div className="pt-4 border-t border-outline-variant flex flex-col sm:flex-row-reverse items-center justify-between gap-3">
                <button
                  onClick={async () => { 
                    vibrate(10); 
                    try {
                      await Browser.open({ url: t.formUrl, windowName: "_system" });
                    } catch {
                      window.open(t.formUrl, "_system");
                    }
                  }}
                  className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-bold"
                >
                  <PlayCircle size={16} />
                  Start Test
                </button>
                
                {!done ? (
                  <button
                    onClick={() => { vibrate(20); void markAttempted(t.id, t.rewardCoins ?? 25); }}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 text-purple-600 dark:text-purple-400 font-geist text-sm font-bold hover:bg-purple-500/10 px-4 py-2.5 rounded-full transition-colors border border-purple-500/20"
                  >
                    <CheckCircle2 size={16} />
                    Mark Done & Claim {t.rewardCoins ?? 25} Coins
                  </button>
                ) : (
                  <span className="flex w-full sm:w-auto items-center justify-center gap-2 text-green-600 dark:text-green-400 font-geist text-sm font-bold px-4 py-2.5">
                    <CheckCircle2 size={16} />
                    Completed (+{t.rewardCoins ?? 25} Coins)
                  </span>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>


    </div>
  );
}


