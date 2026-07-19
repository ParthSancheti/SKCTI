"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, query, where } from "firebase/firestore";
import {
  Atom, Calculator, CheckCircle2, ChevronDown, Circle, Dna, FlaskConical,
  Flame, Megaphone, Moon, PartyPopper, RefreshCw, Search, Settings, Sun, X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CoinPill, CoinShopModal, useCompleteTask } from "@/components/CoinSystem";
import GlassCard from "@/components/GlassCard";
import HeroCarousel from "@/components/HeroCarousel";
import ProgressRing from "@/components/ProgressRing";
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
  const [shopOpen, setShopOpen] = useState(false);
  const [banners, setBanners] = useState<BannerDoc[]>([]);
  const [notices, setNotices] = useState<AnnouncementDoc[]>([]);
  const [chapters, setChapters] = useState<ContentDoc[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planErr, setPlanErr] = useState("");
  const planRequested = useRef(false);

  useEffect(() => {
    const open = () => setShopOpen(true);
    window.addEventListener("skcti:openshop", open);
    return () => window.removeEventListener("skcti:openshop", open);
  }, []);

  /* live announcements for this stream */
  useEffect(() => {
    if (!profile || !config.features.notices) return;
    const qq = query(col.announcements(), where("published", "==", true));
    return onSnapshot(qq, (s) => {
      const docs = s.docs.map((d) => snapTo<AnnouncementDoc>(d)).filter((n) => n.streams.includes(profile.stream));
      docs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      setNotices(docs.slice(0, 3));
    }, () => {});
  }, [profile?.stream, config.features.notices]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [profile?.stream, profile?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [profile?.uid, plan, config.features.planner]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const blocks: Record<HomeBlockId, React.ReactNode> = {
    notice: config.features.notices && notices.length > 0 ? (
      <div key="notice" className="space-y-2">
        {notices.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glassy flex items-start gap-3 rounded-2xl border-l-4 border-primary px-4 py-3.5"
          >
            <Megaphone size={16} className="mt-0.5 shrink-0 text-primary" />
            <p className="font-hanken text-body-md leading-snug">{n.text}</p>
          </motion.div>
        ))}
      </div>
    ) : null,
    focus: config.features.planner ? (
      <GlassCard key="focus" className="p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-sora text-headline-lg">Today&apos;s Focus</h2>
            <p className="font-geist text-label-sm text-on-surface/50 mt-0.5">Planned by AI for {profile.stream} · {profile.grade}</p>
          </div>
          <button
            aria-label="Regenerate plan"
            onClick={() => { vibrate(10); void generatePlan(true); }}
            className="w-10 h-10 rounded-full glassy flex items-center justify-center"
          >
            <RefreshCw size={15} className={planLoading ? "animate-spin text-primary" : "text-on-surface/60"} />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <ProgressRing progress={progress} label={`${doneCount}/${plan?.length ?? 0}`} sub="tasks" />
          <div className="flex-1 w-full space-y-2.5">
            {planLoading && !plan && (
              <div className="space-y-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-12 rounded-input" />
                ))}
              </div>
            )}
            {planErr && !plan && (
              <p className="font-geist text-label-sm text-error">{planErr} <button className="underline" onClick={() => void generatePlan(true)}>Retry</button></p>
            )}
            {(plan ?? []).map((t) => {
              const done = profile.doneTasks.includes(`${today}:${t.id}`);
              return (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={(e) => !done && completeTask(t.id, e)}
                  className={`w-full glassy rounded-input px-4 py-3 flex items-center gap-3 text-left transition-opacity ${done ? "opacity-50" : ""}`}
                >
                  {done ? <CheckCircle2 size={18} className="text-primary shrink-0" /> : <Circle size={18} className="text-on-surface/30 shrink-0" />}
                  <span className={`font-hanken text-body-md flex-1 ${done ? "line-through" : ""}`}>{t.title}</span>
                  <span className="font-geist text-label-sm text-on-surface/40 shrink-0">{t.subject} · {t.minutes}m</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </GlassCard>
    ) : null,
    carousel: banners.length > 0 ? <HeroCarousel key="carousel" banners={banners} /> : null,
    subjects: (
      <div key="subjects">
        <h2 className="font-sora text-headline-lg mb-4">Your subjects</h2>
        <div className="grid grid-cols-3 gap-3">
          {subjectsFor(profile.stream).map((s) => (
            <Link key={s} href={`/learn?subject=${s}`} onClick={() => vibrate(10)}>
              <motion.div whileTap={{ scale: 0.95 }} className="glassy rounded-glass p-5 flex flex-col items-center gap-2 hover:shadow-glow-primary-soft transition-shadow">
                <span className="text-primary">{SUBJECT_ICONS[s]}</span>
                <span className="font-geist text-label-sm">{s}</span>
                <span className="font-geist text-[10px] text-on-surface/40">{chapters.filter((c) => c.subject === s).length} items</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div className="pt-6 space-y-8">
      {/* ————— header ————— */}
      <header className="sticky top-0 z-40 -mx-margin-mobile px-margin-mobile lg:mx-0 lg:px-0 py-3 header-blur-mask">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-geist text-label-sm text-on-surface/50">{greeting}</p>
            <h1 className="font-sora text-headline-lg truncate">{firstName} ✨</h1>
          </div>
          {config.features.streak && (
            <div className="glassy rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <Flame size={15} className="text-primary" />
              <span className="font-geist text-label-md tabular-nums">{profile.streak}</span>
            </div>
          )}
          <CoinPill />
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={(e) => { vibrate(10); firePortal(e.clientX, e.clientY); setMenuOpen(!menuOpen); }}
              className="w-11 h-11 rounded-full overflow-hidden glassy flex items-center justify-center"
              aria-label="Profile menu"
            >
              {profile.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="font-sora font-bold text-primary">{firstName.charAt(0)}</span>
              )}
            </motion.button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -6 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  className="absolute right-0 top-14 w-60 glassy-elite rounded-glass p-2 origin-top-right z-50"
                >
                  {[
                    { icon: isDark ? <Sun size={16} /> : <Moon size={16} />, label: isDark ? "Light mode" : "Dark mode", act: () => toggleTheme() },
                    ...(config.features.streak ? [{ icon: <Flame size={16} />, label: `${profile.streak}-day streak`, act: () => {} }] : []),
                    ...(config.features.coins ? [{ icon: <span className="text-sm">🪙</span>, label: `${profile.coins} coins`, act: () => setShopOpen(true) }] : []),
                    { icon: <Settings size={16} />, label: "Settings", act: () => router.push("/settings") },
                  ].map(({ icon, label, act }) => (
                    <button
                      key={label}
                      onClick={(e) => { vibrate(10); firePortal(e.clientX, e.clientY); setMenuOpen(false); act(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-glass/5 font-geist text-label-md text-left"
                    >
                      <span className="text-primary">{icon}</span> {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ————— grade upgrade celebration ————— */}
      <AnimatePresence>
        {profile.justUpgraded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="glassy-elite rounded-glass p-6 flex items-center gap-4 border border-primary/30"
          >
            <PartyPopper size={26} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-sora font-semibold">Welcome to 12th standard! 🎉</p>
              <p className="font-hanken text-body-md text-on-surface/60">Your content library just leveled up.</p>
            </div>
            <button onClick={() => { vibrate(10); void dismissUpgrade(); }} aria-label="Dismiss" className="w-9 h-9 rounded-full glassy flex items-center justify-center shrink-0">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ————— Blinkit search ————— */}
      <button onClick={() => { vibrate(10); router.push("/learn"); }} className="w-full glassy rounded-full px-5 py-4 flex items-center gap-3 text-left">
        <Search size={18} className="text-primary" />
        <span className="font-hanken text-body-md text-on-surface/40">Search chapters, notes, DPPs…</span>
      </button>

      {/* ————— admin-ordered blocks ————— */}
      {config.homeBlocks.map((id) => blocks[id]).filter(Boolean)}

      {chapters.length === 0 && (
        <GlassCard className="p-8 text-center">
          <ChevronDown size={20} className="mx-auto text-primary mb-2 animate-bounce" />
          <p className="font-sora font-semibold">Library incoming</p>
          <p className="font-hanken text-body-md text-on-surface/50 mt-1">Your {profile.stream} content appears here the moment it&apos;s published.</p>
        </GlassCard>
      )}

      <CoinShopModal open={shopOpen} onClose={() => setShopOpen(false)} />
    </div>
  );
}
