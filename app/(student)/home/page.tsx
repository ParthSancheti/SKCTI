"use client";
import { getCohortId } from "@/lib/examConfig";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, query, where } from "firebase/firestore";
import {
  Atom, Calculator, CheckCircle2, ChevronDown, Circle, Dna, FlaskConical,
  Flame, Megaphone, Moon, PartyPopper, RefreshCw, Search, Settings, Sun, X, LogOut,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { useEffect, useMemo, useRef, useState } from "react";
import { CoinPill, useCompleteTask } from "@/components/CoinSystem";
import GlassCard from "@/components/GlassCard";
import HeroCarousel from "@/components/HeroCarousel";
import ProgressRing from "@/components/ProgressRing";
import SubjectCard from "@/components/SubjectCard";
import ChapterCard from "@/components/ChapterCard";
import TodoWidget from "@/components/TodoWidget";
import ComingSoon from "@/components/ComingSoon";
import { col, snapTo, updateUser } from "@/lib/db";
import { firePortal, useStore, vibrate } from "@/lib/store";
import type { AnnouncementDoc, BannerDoc, ContentDoc, HomeBlockId, PlanTask } from "@/lib/types";
import { todayKey } from "@/lib/types";

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  Physics: <Atom size={22} />,
  Chemistry: <FlaskConical size={22} />,
  Math: <Calculator size={22} />,
  Biology: <Dna size={22} />,
};

export default function Home() {
  const store = useStore();
  const { profile, config, modules, isDark, toggleTheme, dismissUpgrade } = store;
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
    const qq = query(col.announcements(), where("published", "==", true), where("streams", "array-contains", getCohortId((profile as any).exam, profile.stream, (profile as any).variant)));
    return onSnapshot(qq, (s) => {
      const docs = s.docs.map((d) => snapTo<AnnouncementDoc>(d));
      docs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      setNotices(docs.slice(0, 3));
    }, () => {});
  }, [profile?.stream, config.features.notices]);

  /* live banners + chapters for this stream */
  useEffect(() => {
    if (!profile) return;
    const ub = onSnapshot(
      query(col.banners(), where("published", "==", true), where("streams", "array-contains", getCohortId((profile as any).exam, profile.stream, (profile as any).variant))),
      (s) => setBanners(s.docs.map((d) => snapTo<BannerDoc>(d))),
      () => {}
    );
    const uc = onSnapshot(
      query(col.content(), where("published", "==", true), where("streams", "array-contains", getCohortId((profile as any).exam, profile.stream, (profile as any).variant))),
      (s) => setChapters(s.docs.map((d) => snapTo<ContentDoc>(d))),
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

  // AI Plan generation is now triggered explicitly by the user from TodoWidget or AI Lab

  const doneCount = useMemo(
    () => (plan ?? []).filter((t) => profile?.doneTasks.includes(`${today}:${t.id}`)).length,
    [plan, profile?.doneTasks, today]
  );
  const progress = plan && plan.length ? doneCount / plan.length : 0;

  if (!profile) return null;
  const firstName = profile.name.split(" ")[0];

  /* ————— blocks (order comes from admin config) ————— */
  const blocks: Record<string, React.ReactNode> = {
    notice: config.features.notices && notices.length > 0 ? (
      <div key="notice" className="space-y-2">
        {notices.map((n, i) => (
          <GlassCard
            key={n.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-start gap-3 !border-l-4 !border-l-purple-600 px-4 py-3.5"
          >
            <Megaphone size={16} className="mt-0.5 shrink-0 text-purple-600 dark:text-purple-400" />
            <p className="font-hanken text-body-md leading-snug">{n.text}</p>
          </GlassCard>
        ))}
      </div>
    ) : null,

    carousel: banners.length > 0 ? <HeroCarousel key="carousel" banners={banners} /> : null,
    subjects: (
      <div key="subjects" className="flex flex-col gap-8">
        {/* Today's Focus Widget */}
        <TodoWidget />

        {/* Continue Learning Section */}
        {profile.attempted && profile.attempted.length > 0 && (
          <div>
            <h2 className="font-sora text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Continue Learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const recentId = profile.attempted[profile.attempted.length - 1];
                const recentChapter = chapters.find(c => c.id === recentId);
                if (!recentChapter) return null;
                return <ChapterCard key={recentChapter.id} chapter={recentChapter} onOpen={() => {}} />;
              })()}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-sora text-headline-lg mb-4 text-on-surface">Your subjects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(modules.filter(m => m.streams.includes(profile.stream)).length > 0 ? modules.filter(m => m.streams.includes(profile.stream)) : modules).map((m) => {
              const subjectChapters = chapters.filter((c) => c.subject === m.name);
              const completedCount = profile.attempted ? subjectChapters.filter(c => profile.attempted!.includes(c.id)).length : 0;
              return (
                <SubjectCard key={m.id} subject={m.name} imageUrl={m.imageUrl} count={subjectChapters.length} completedCount={completedCount} />
              );
            })}
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="pt-2 lg:pt-0 space-y-8">
      {/* ————— home content starts here ————— */}

      <div className="lg:hidden mb-6 pt-6">
        <h2 className="font-sora text-3xl font-extrabold text-on-surface tracking-tight mt-1 leading-tight">
          Welcome back,<br />
          <span className="text-purple-600 dark:text-purple-400">{firstName}</span>
        </h2>
      </div>

      {/* ————— grade upgrade celebration ————— */}
      <AnimatePresence>
        {profile.justUpgraded && (
          <GlassCard
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 flex items-center gap-4"
          >
            <PartyPopper size={26} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <div className="flex-1">
              <p className="font-sora font-semibold text-on-surface">Welcome to 12th standard! 🎉</p>
              <p className="font-hanken text-body-md text-on-surface-variant">Your content library just leveled up.</p>
            </div>
            <button onClick={() => { vibrate(50); void dismissUpgrade(); }} aria-label="Dismiss" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 text-on-surface transition-colors">
              <X size={15} />
            </button>
          </GlassCard>
        )}
      </AnimatePresence>

      {/* Search Bar Removed based on audit (P1) */}

      {/* ————— admin-ordered blocks ————— */}
      {config.homeBlocks
        .filter((id) => !config.hiddenBlocks?.includes(id))
        .map((id) => {
          if (blocks[id]) return blocks[id];
          if (config.customBlocks?.[id]) return <div key={id} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(config.customBlocks[id]) }} />;
          return null;
        })
        .filter(Boolean)}

      {chapters.length === 0 && (
        <div>
          <GlassCard className="p-8 text-center">
            <ChevronDown size={20} className="mx-auto text-purple-600 dark:text-purple-400 mb-2 animate-bounce" />
            <p className="font-sora font-semibold">Library incoming</p>
            <p className="font-hanken text-body-md text-on-surface/50 mt-1">Your {profile.stream} content appears here the moment it&apos;s published.</p>
          </GlassCard>
        </div>
      )}

      <ComingSoon open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} title={comingSoonTitle} />
    </div>
  );
}
