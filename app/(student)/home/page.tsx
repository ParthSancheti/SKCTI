"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, query, where } from "firebase/firestore";
import {
  Atom, Calculator, CheckCircle2, ChevronDown, Circle, Dna, FlaskConical,
  Flame, Megaphone, Moon, PartyPopper, RefreshCw, Search, Settings, Sun, X, LogOut,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CoinPill, useCompleteTask } from "@/components/CoinSystem";
import GlassCard from "@/components/GlassCard";
import HeroCarousel from "@/components/HeroCarousel";
import ProgressRing from "@/components/ProgressRing";
import SubjectCard from "@/components/SubjectCard";
import TodoWidget from "@/components/TodoWidget";
import ComingSoon from "@/components/ComingSoon";
import { col, snapTo, updateUser } from "@/lib/db";
import { firePortal, useStore, vibrate } from "@/lib/store";
import type { AnnouncementDoc, BannerDoc, ContentDoc, HomeBlockId, PlanTask } from "@/lib/types";
import { subjectsFor, todayKey } from "@/lib/types";

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  Physics: <Atom size={22} />,
  Chemistry: <FlaskConical size={22} />,
  Math: <Calculator size={22} />,
  Biology: <Dna size={22} />,
};

export default function Home() {
  const store = useStore();
  const { profile, config, isDark, toggleTheme, dismissUpgrade } = store;
  const router = useRouter();
  const completeTask = useCompleteTask();

  const [menuOpen, setMenuOpen] = useState(false);

  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState("");
  const [banners, setBanners] = useState<BannerDoc[]>([]);
  const [notices, setNotices] = useState<AnnouncementDoc[]>([]);
  const [chapters, setChapters] = useState<ContentDoc[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planErr, setPlanErr] = useState("");
  const planRequested = useRef(false);

  /* live announcements for this stream */
  useEffect(() => {
    if (!profile || !config.features.notices) return;
    const qq = query(col.announcements(), where("published", "==", true));
    return onSnapshot(qq, (s) => {
      const docs = s.docs.map((d) => snapTo<AnnouncementDoc>(d)).filter((n) => n.streams.includes(profile.stream));
      docs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      setNotices(docs.slice(0, 3));
    }, () => {});
  }, [profile?.stream, config.features.notices]);

  /* live banners + chapters for this stream */
  useEffect(() => {
    if (!profile) return;
    const ub = onSnapshot(
      query(col.banners(), where("published", "==", true)),
      (s) => setBanners(s.docs.map((d) => snapTo<BannerDoc>(d)).filter((b) => b.streams.includes(profile.stream))),
      () => {}
    );
    const uc = onSnapshot(
      query(col.content(), where("published", "==", true)),
      (s) => setChapters(s.docs.map((d) => snapTo<ContentDoc>(d)).filter((c) => c.streams.includes(profile.stream))),
      () => {}
    );
    return () => { ub(); uc(); };
  }, [profile?.stream, profile?.uid]);

  /* Gemini plan — generate once per day, cached on the user doc */
  const today = todayKey();
  const plan = profile?.todayPlan?.date === today ? profile.todayPlan.tasks : null;

  const generatePlan = async (force = false) => {
    if (!profile || planLoading) return;
    if (!force && (plan || planRequested.current)) return;
    planRequested.current = true;
    setPlanLoading(true);
    setPlanErr("");
    try {
      const r = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: profile.stream,
          grade: profile.grade,
          chapters: chapters.slice(0, 30).map((c) => `${c.subject}: ${c.title}`),
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.tasks) throw new Error(data.error ?? "Plan failed");
      await updateUser(profile.uid, {
        todayPlan: { date: today, tasks: data.tasks as PlanTask[] },
        ...(force ? { doneTasks: [] } : {}),
      });
    } catch (e) {
      setPlanErr(e instanceof Error ? e.message : "Could not reach the planner.");
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    if (profile && config.features.planner && !plan) void generatePlan();
  }, [profile?.uid, plan, config.features.planner]);

  const doneCount = useMemo(
    () => (plan ?? []).filter((t) => profile?.doneTasks.includes(`${today}:${t.id}`)).length,
    [plan, profile?.doneTasks, today]
  );
  const progress = plan && plan.length ? doneCount / plan.length : 0;

  if (!profile) return null;
  const firstName = profile.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* ————— blocks (order comes from admin config) ————— */
  const blocks: Record<string, React.ReactNode> = {
    notice: config.features.notices && notices.length > 0 ? (
      <div key="notice" className="space-y-2 px-6 lg:px-0">
        {notices.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white/5 dark:bg-white/5 backdrop-blur-md flex items-start gap-3 rounded-2xl border-l-4 border-purple-600 dark:border-purple-400 px-4 py-3.5 shadow-sm"
          >
            <Megaphone size={16} className="mt-0.5 shrink-0 text-purple-600 dark:text-purple-400" />
            <p className="font-hanken text-body-md leading-snug">{n.text}</p>
          </motion.div>
        ))}
      </div>
    ) : null,

    carousel: banners.length > 0 ? <HeroCarousel key="carousel" banners={banners} /> : null,
    subjects: (
      <div key="subjects" className="px-6 lg:px-0 flex flex-col gap-8">
        {/* Today's Focus Widget */}
        <TodoWidget />

        <div>
          <h2 className="font-sora text-headline-lg mb-4 text-neutral-900 dark:text-white">Your subjects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectsFor(profile.stream).map((s) => (
              <SubjectCard key={s} subject={s} count={chapters.filter((c) => c.subject === s).length} />
            ))}
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="pt-2 lg:pt-0 space-y-8">
      {/* ————— home content starts here ————— */}

      {/* ————— mobile welcome text (outside header) ————— */}
      <div className="mx-6 lg:hidden mb-6">
        <p className="font-geist text-label-md text-black dark:text-neutral-400">{greeting}</p>
        <h2 className="font-sora text-3xl font-black text-neutral-900 dark:text-white tracking-tight mt-1">Welcome back, {firstName}</h2>
      </div>

      {/* ————— grade upgrade celebration ————— */}
      <AnimatePresence>
        {profile.justUpgraded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-6 lg:mx-0 bg-white/5 dark:bg-white/5 backdrop-blur-3xl rounded-[2rem] p-6 flex items-center gap-4 border border-white/10 shadow-xl"
          >
            <PartyPopper size={26} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <div className="flex-1">
              <p className="font-sora font-semibold text-neutral-900 dark:text-white">Welcome to 12th standard! 🎉</p>
              <p className="font-hanken text-body-md text-neutral-600 dark:text-neutral-400">Your content library just leveled up.</p>
            </div>
            <button onClick={() => { vibrate(50); void dismissUpgrade(); }} aria-label="Dismiss" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 text-neutral-900 dark:text-white">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ————— Blinkit search ————— */}
      <motion.div layoutId="search-bar" className="mx-6 lg:mx-0">
        <button onClick={() => { vibrate(50); router.push("/learn"); }} className="w-full bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 shadow-lg rounded-full px-6 py-4 flex items-center gap-4 text-left transition-transform hover:scale-[0.99] active:scale-[0.97]">
          <Search size={20} className="text-purple-600 dark:text-purple-400" />
          <span className="font-hanken text-body-md text-black dark:text-neutral-400">Search chapters, notes, DPPs…</span>
        </button>
      </motion.div>

      {/* ————— admin-ordered blocks ————— */}
      {config.homeBlocks
        .filter((id) => !config.hiddenBlocks?.includes(id))
        .map((id) => {
          if (blocks[id]) return blocks[id];
          if (config.customBlocks?.[id]) return <div key={id} className="px-6 lg:px-0" dangerouslySetInnerHTML={{ __html: config.customBlocks[id] }} />;
          return null;
        })
        .filter(Boolean)}

      {chapters.length === 0 && (
        <div className="px-6 lg:px-0">
          <div className="bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl p-8 text-center">
            <ChevronDown size={20} className="mx-auto text-purple-600 dark:text-purple-400 mb-2 animate-bounce" />
            <p className="font-sora font-semibold">Library incoming</p>
            <p className="font-hanken text-body-md text-on-surface/50 mt-1">Your {profile.stream} content appears here the moment it&apos;s published.</p>
          </div>
        </div>
      )}

      <ComingSoon open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} title={comingSoonTitle} />
    </div>
  );
}
