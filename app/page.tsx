"use client";

import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { doc, onSnapshot } from "firebase/firestore";
import {
  ArrowRight, BookOpen, Bot, CheckCircle2, ClipboardList, Flame, Instagram,
  MessageCircle, Phone, PlayCircle, Send, Sparkles, Trophy, Youtube, ChevronRight, X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MeshBackground from "@/components/MeshBackground";
import { createInquiry } from "@/lib/db";
import { fbDb, firebaseReady } from "@/lib/firebase";
import { useStore, vibrate } from "@/lib/store";
import type { AppConfig } from "@/lib/types";
import { DEFAULT_CONFIG } from "@/lib/types";

/* ————— CSS-only phone running a mini SKCTI home ————— */
function PhoneMock({ appName }: { appName: string }) {
  return (
    <div className="glassy-elite liquid-shine w-[290px] rounded-[3rem] p-2.5 md:w-[320px]">
      <div className="relative overflow-hidden rounded-[2.4rem] glassy pb-5">
        {/* notch */}
        <div className="mx-auto mt-2.5 h-6 w-24 rounded-full bg-black/80 dark:bg-black/80" />
        {/* header */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div>
            <p className="font-geist text-[9px] text-black dark:text-neutral-400">Good morning, Arjun</p>
            <p className="font-sora text-sm font-bold text-neutral-900 dark:text-white">{appName}</p>
          </div>
          <div className="flex gap-1.5">
            <span className="glassy rounded-full px-2 py-1 font-geist text-[9px]">🔥 12</span>
            <span className="glassy rounded-full px-2 py-1 font-geist text-[9px]">🪙 340</span>
          </div>
        </div>
        {/* focus card */}
        <div className="glassy mx-4 mt-4 rounded-3xl p-4">
          <p className="font-geist text-[8px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Today&apos;s Focus</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative grid h-12 w-12 shrink-0 place-items-center">
              <svg viewBox="0 0 40 40" className="h-12 w-12 -rotate-90">
                <circle cx="20" cy="20" r="16" fill="none" className="stroke-black/10 dark:stroke-white/10" strokeWidth="4" />
                <circle cx="20" cy="20" r="16" fill="none" stroke="#9333ea" strokeWidth="4" strokeLinecap="round" strokeDasharray="100" strokeDashoffset="35" />
              </svg>
              <span className="absolute font-sora text-[9px] font-bold text-neutral-900 dark:text-white">65%</span>
            </div>
            <div className="flex-1 space-y-1.5">
              {[["Rotational Motion — DPP", true], ["Thermo — revision", true], ["Organic — PYQ set", false]].map(([t, done]) => (
                <div key={t as string} className="flex items-center gap-1.5">
                  <span className={`grid h-3 w-3 place-items-center rounded-full ${done ? "bg-purple-600" : "border border-neutral-300 dark:border-neutral-700"}`}>
                    {done ? <span className="text-[6px] text-white">✓</span> : null}
                  </span>
                  <p className={`font-hanken text-[9px] ${done ? "text-neutral-400 line-through" : "text-neutral-700 dark:text-neutral-300"}`}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* subjects */}
        <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
          {["Physics", "Chemistry", "Maths"].map((s) => (
            <div key={s} className="glassy rounded-2xl p-2.5 text-center">
              <p className="font-geist text-[8px] text-neutral-600 dark:text-neutral-400">{s}</p>
            </div>
          ))}
        </div>
        {/* nav pill */}
        <div className="glassy mx-8 mt-4 flex justify-between rounded-full px-4 py-2">
          {["Home", "Learn", "Tests", "Rank", "AI"].map((t, i) => (
            <span key={t} className={`font-geist text-[8px] ${i === 0 ? "font-bold text-purple-600 dark:text-purple-400" : "text-black dark:text-neutral-400"}`}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { Icon: BookOpen, title: "Every chapter. One tap.", sub: "Physics, Chemistry, Maths & Bio — organised subject-wise, topic-wise. No Drive-link hunting, ever." },
  { Icon: Sparkles, title: "AI plans your day", sub: "Wake up to a plan built from your pending chapters. Follow it, tick it, done by dinner." },
  { Icon: ClipboardList, title: "Tests that talk back", sub: "Chapter tests and full mocks inside the app — know exactly where you stand every week." },
  { Icon: Bot, title: "Doubts die at 11 PM", sub: "Exam tomorrow, stuck now? The AI solver answers instantly, in your syllabus's language." },
  { Icon: Flame, title: "Streaks make it stick", sub: "Show up daily, keep the fire alive, earn coins. Studying that feels like a winning game." },
  { Icon: Trophy, title: "Climb the board", sub: "A live leaderboard of your batch. See the toppers. Then become the reason others check it." },
];

export default function Landing() {
  const router = useRouter();
  const { ready, fbUser, profile, profileLoaded } = useStore();
  const [cfg, setCfg] = useState<AppConfig>(DEFAULT_CONFIG);
  const [form, setForm] = useState({ name: "", phone: "", studentClass: "11th", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [showLogin, setShowLogin] = useState(false);
  const { loginWithGoogle } = useStore();
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginErr, setLoginErr] = useState("");

  const handleLogin = async () => {
    vibrate(20);
    setLoginErr("");
    setLoginBusy(true);
    try {
      await loginWithGoogle();
      // Cookie is now managed globally in store.tsx
    } catch (e) {
      setLoginErr(e instanceof Error ? e.message : "Sign-in failed. Try again.");
      setLoginBusy(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % 3;
        if (carouselRef.current) {
          carouselRef.current.scrollTo({
            left: next * carouselRef.current.clientWidth,
            behavior: "smooth"
          });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (ready && fbUser && profileLoaded) {
      if (profile) router.replace("/home");
      else router.replace("/onboarding");
    }
  }, [ready, fbUser, profile, profileLoaded, router]);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsub = onSnapshot(doc(fbDb(), "config", "app"), (s) => {
      if (!s.exists()) return;
      const d = s.data() as Partial<AppConfig>;
      setCfg({
        ...DEFAULT_CONFIG, ...d,
        features: { ...DEFAULT_CONFIG.features, ...(d.features ?? {}) },
        landing: { ...DEFAULT_CONFIG.landing, ...(d.landing ?? {}) },
      });
    }, () => {});
    return unsub;
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const phoneRotX = useTransform(smooth, [0, 1], [22, -6]);
  const phoneRotY = useTransform(smooth, [0, 1], [-14, 8]);
  const phoneY = useTransform(smooth, [0, 1], [0, 140]);
  const phoneScale = useTransform(smooth, [0, 1], [1, 1.12]);
  const heroTextY = useTransform(smooth, [0, 1], [0, -160]);
  const heroFade = useTransform(smooth, [0, 0.7], [1, 0]);
  const chipL = useTransform(smooth, [0, 1], [0, -220]);
  const chipR = useTransform(smooth, [0, 1], [0, 220]);

  const L = cfg.landing;
  const wa = L.whatsapp.replace(/\D/g, "");

  const submit = async () => {
    setErr("");
    if (form.name.trim().length < 2) return setErr("Please enter your name.");
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) return setErr("Enter a valid 10-digit mobile number.");
    setSending(true);
    try {
      await createInquiry({ name: form.name.trim(), phone: form.phone.trim(), studentClass: form.studentClass, message: form.message.trim() });
      setSent(true);
    } catch {
      setErr("Couldn't send right now — please try WhatsApp or call us.");
    }
    setSending(false);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent">
      {/* Mesh background is pushed to z-[-1] to ensure it never overlaps text */}
      <div className="fixed inset-0 z-[-1]">
        <MeshBackground />
      </div>

      {/* ==================================================== */}
      {/* 1. NATIVE MOBILE ONBOARDING (Only visible on max-md) */}
      {/* ==================================================== */}
      <div className="flex md:hidden h-[100dvh] flex-col relative overflow-hidden z-50">
        
        {/* Top Header */}
        <div className="absolute top-0 inset-x-0 w-full flex items-center gap-3 px-6 pt-12 z-50">
          <img src="/src/logo.png" className="w-8 h-8 rounded-full shadow-lg" alt="SKCTI Logo" />
          <h1 className="font-sora text-3xl font-black text-white drop-shadow-md tracking-tight">SKCTI</h1>
        </div>
        
        {/* Feature Swipe Carousel */}
        <div 
          ref={carouselRef}
          onScroll={(e) => {
            const index = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
            if (index !== activeSlide) setActiveSlide(index);
          }}
          onPointerUp={() => vibrate(50)}
          className="flex-1 w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar absolute inset-0"
        >
            
            {/* Card 1 */}
            <div className="min-w-full snap-center relative overflow-hidden flex flex-col justify-end p-8 pb-32">
              <img src="/image1.png" className="absolute inset-0 w-full h-full object-cover dark:hidden" alt="Onboarding" />
              <img src="/image1_dark.png" className="absolute inset-0 w-full h-full object-cover hidden dark:block" alt="Onboarding" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="relative z-10 flex flex-col justify-end">
                <h3 className="font-sora text-4xl leading-tight font-black text-white mb-3 tracking-tight">Welcome to SKCTI.</h3>
                <p className="font-hanken text-lg text-neutral-200">Crack 11th, 12th & MHT-CET with a system, not stress.</p>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="min-w-full snap-center relative overflow-hidden flex flex-col justify-end p-8 pb-32">
              <img src="/image2.png" className="absolute inset-0 w-full h-full object-cover dark:hidden" alt="Structured Learning" />
              <img src="/image2_dark.png" className="absolute inset-0 w-full h-full object-cover hidden dark:block" alt="Structured Learning" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="relative z-10 flex flex-col justify-end">
                <h3 className="font-sora text-4xl leading-tight font-black text-white mb-3 tracking-tight">Structured Learning.</h3>
                <p className="font-hanken text-lg text-neutral-200">Chapter-wise notes, weekly tests, and a plan for every single day.</p>
              </div>
            </div>
            
            {/* Card 3 */}
            <div className="min-w-full snap-center relative overflow-hidden flex flex-col justify-end p-8 pb-32">
              <img src="/image3.png" className="absolute inset-0 w-full h-full object-cover dark:hidden" alt="AI Doubt Solving" />
              <img src="/image3_dark.png" className="absolute inset-0 w-full h-full object-cover hidden dark:block" alt="AI Doubt Solving" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="relative z-10 flex flex-col justify-end">
                <h3 className="font-sora text-4xl leading-tight font-black text-white mb-3 tracking-tight">AI Doubt Solving.</h3>
                <p className="font-hanken text-lg text-neutral-200">Instant AI-powered doubt resolutions and personalized mock tests.</p>
              </div>
            </div>
            
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+80px)] flex gap-2 justify-center w-full z-10">
          {[0, 1, 2].map((i) => (
            <span 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${activeSlide === i ? "w-6 bg-white" : "w-2 bg-white/30"}`}
            />
          ))}
        </div>

        {/* Absolute Bottom Action Bar */}
        <div className="absolute bottom-6 w-full px-6 z-10">
          <div className="flex justify-between items-center bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 pr-2 pl-6">
            <button 
              onClick={() => router.push('/home')} 
              className="text-sm font-bold text-white/70 hover:text-white transition-colors"
            >
              Skip
            </button>
            
            <motion.button 
              layoutId="auth-container"
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 rounded-full px-7 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:scale-[1.02] shadow-xl active:scale-[0.97] transition-all"
            >
              Get Started <ArrowRight size={20} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>

      </div>


      {/* ==================================================== */}
      {/* 2. DESKTOP SPATIAL VIEW (Visible on md and up)       */}
      {/* ==================================================== */}
      <div className="hidden md:block min-h-screen">
        
        {/* Desktop Nav */}
        <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
          <div className="glassy mx-auto flex max-w-5xl items-center justify-between rounded-full px-3 py-2.5 pl-5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 font-sora text-sm font-bold text-white shadow-lg">
                {cfg.appName[0] ?? "S"}
              </div>
              <span className="font-sora text-base font-bold text-neutral-900 dark:text-white">{cfg.appName}</span>
            </div>
            {/* Start CTA */}
            <div className="flex gap-4">
              <motion.button layoutId="auth-container" onClick={() => setShowLogin(true)} className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2.5 font-geist text-label-sm font-bold text-white hover:scale-[1.02] hover:shadow-xl active:scale-[0.97] transition-all">
                Open App
              </motion.button>
            </div>
          </div>
        </nav>

        {/* Desktop HERO */}
        <section ref={heroRef} className="relative z-10 min-h-[130vh]">
          <div className="sticky top-0 flex min-h-screen flex-col items-center overflow-hidden px-5 pt-28 md:pt-32">
            
            <motion.div 
              style={{ y: heroTextY, opacity: heroFade }} 
              className="text-center relative z-10"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <span className="glassy inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-geist text-label-sm text-neutral-800 dark:text-neutral-200">
                  <Sparkles size={14} className="text-purple-600 dark:text-purple-400" /> MHT CET Spatial Interface
                </span>
                
                <h1 className="mx-auto mt-8 max-w-4xl font-sora text-[2.7rem] font-extrabold leading-[1.05] tracking-tighter text-neutral-900 dark:text-white md:text-[5.5rem]">
                  {L.tagline.split(",")[0]}
                  <span className="block bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent drop-shadow-sm">
                    {L.tagline.split(",").slice(1).join(",") || "not stress."}
                  </span>
                </h1>
                
                <p className="mx-auto mt-6 max-w-xl font-hanken text-body-lg text-neutral-600 dark:text-neutral-400">
                  {L.sub}
                </p>
                
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <button onClick={() => setShowLogin(true)} className="glassy-strong liquid-shine inline-flex items-center gap-2 rounded-full px-8 py-4 font-geist text-label-lg font-bold text-neutral-900 dark:text-white hover:scale-[1.02] hover:shadow-xl active:scale-[0.97] transition-all">
                    Start learning free <ArrowRight size={20} className="text-primary" />
                  </button>
                  {wa && (
                    <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="glassy inline-flex items-center gap-2 rounded-full px-8 py-4 font-geist text-label-lg font-semibold text-neutral-900 dark:text-white hover:scale-[1.02] hover:shadow-xl active:scale-[0.97] transition-all">
                      <MessageCircle size={18} className="text-purple-600 dark:text-purple-400" /> WhatsApp
                    </a>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* 3D phone + floating chips */}
            <div className="persp relative mt-16 flex justify-center pb-24">
              <motion.div
                style={{ rotateX: phoneRotX, rotateY: phoneRotY, y: phoneY, scale: phoneScale }}
                className="preserve-3d"
              >
                <PhoneMock appName={cfg.appName} />
              </motion.div>

              <motion.div style={{ x: chipL, y: useTransform(smooth, [0, 1], [40, -60]) }} className="absolute -left-2 top-16 hidden md:block">
                <div className="glassy flex items-center gap-3 rounded-2xl px-5 py-4">
                  <Flame size={18} className="text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="font-sora text-sm font-bold text-neutral-900 dark:text-white">12-day streak</p>
                    <p className="font-geist text-[10px] text-black dark:text-neutral-400">Keep it burning</p>
                  </div>
                </div>
              </motion.div>
              <motion.div style={{ x: chipR, y: useTransform(smooth, [0, 1], [90, -30]) }} className="absolute -right-4 top-40 hidden md:block">
                <div className="glassy flex items-center gap-3 rounded-2xl px-5 py-4">
                  <Bot size={18} className="text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="font-sora text-sm font-bold text-neutral-900 dark:text-white">Doubt solved ✓</p>
                    <p className="font-geist text-[10px] text-black dark:text-neutral-400">in 4 seconds</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features: Spatial Bento Grid */}
        <section className="persp relative z-10 mx-auto max-w-6xl px-5 py-24">
          <motion.h2
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center font-sora text-3xl font-extrabold text-neutral-900 dark:text-white md:text-5xl tracking-tighter"
          >
            Everything a topper uses.
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Nothing they don&apos;t.</span>
          </motion.h2>
          <div className="mt-16 grid gap-6 grid-cols-1 md:grid-cols-3 md:grid-rows-2">
            {FEATURES.map(({ Icon, title, sub }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: (i % 3) * 0.08, type: "spring", stiffness: 110, damping: 18 }}
                className={`glassy-strong preserve-3d rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between ${i === 0 || i === 5 ? "md:col-span-2" : "md:col-span-1"}`}
              >
                <div>
                  <div className="glassy grid h-14 w-14 place-items-center rounded-3xl text-purple-600 dark:text-purple-400 mb-6">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-sora text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{title}</h3>
                  <p className="mt-3 font-hanken text-body-md leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-md">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="relative z-10 mx-auto max-w-5xl px-5 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["01", "Sign in with Google", "One tap. Tell us your class & stream. That's the whole signup."],
              ["02", "Get today's plan", "AI reads your pending chapters and hands you a 4-task day. Every morning."],
              ["03", "Tick, earn, climb", "Finish tasks, take tests, collect coins, watch your rank rise."],
            ].map(([n, t, sub], i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="relative glassy p-8 rounded-[2.5rem]"
              >
                <span className="bg-gradient-to-b from-purple-500/60 to-transparent bg-clip-text font-sora text-7xl font-extrabold text-transparent">{n}</span>
                <h3 className="-mt-2 font-sora text-title-lg font-bold text-neutral-900 dark:text-white">{t}</h3>
                <p className="mt-3 font-hanken text-body-md text-neutral-600 dark:text-neutral-400">{sub}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Free lectures hook */}
        {(L.youtube || L.instagram) && (
          <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="glassy-elite liquid-shine rounded-[3rem] p-9 text-center md:p-16"
            >
              <PlayCircle size={44} className="mx-auto text-purple-600 dark:text-purple-400" />
              <h2 className="mt-5 font-sora text-3xl font-extrabold text-neutral-900 dark:text-white md:text-4xl tracking-tight">Free lectures, every week</h2>
              <p className="mx-auto mt-4 max-w-xl font-hanken text-body-lg text-neutral-600 dark:text-neutral-400">
                Watch full concept videos free — then open the app for the notes, tests and the daily plan that go with them.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                {L.youtube && (
                  <a href={L.youtube} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#FF0000]/90 backdrop-blur-xl border border-white/20 px-8 py-4 font-geist text-label-md font-bold text-white transition-transform hover:scale-105 duration-300 shadow-xl">
                    <Youtube size={20} /> YouTube
                  </a>
                )}
                {L.instagram && (
                  <a href={L.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] backdrop-blur-xl border border-white/20 px-8 py-4 font-geist text-label-md font-bold text-white transition-transform hover:scale-105 duration-300 shadow-xl">
                    <Instagram size={20} /> Instagram
                  </a>
                )}
              </div>
            </motion.div>
          </section>
        )}

        {/* Counseling */}
        {L.showInquiry && (
          <section className="relative z-10 mx-auto max-w-2xl px-5 py-12 pb-24">
            <motion.div
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="glassy-strong rounded-[3rem] p-8 md:p-12"
            >
              {sent ? (
                <div className="py-8 text-center">
                  <CheckCircle2 size={48} className="mx-auto text-purple-600 dark:text-purple-400" />
                  <h3 className="mt-5 font-sora text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Got it!</h3>
                  <p className="font-geist text-label-md text-neutral-600 dark:text-neutral-400 max-w-sm mt-4 leading-relaxed">
                    Log in with a single tap and <button onClick={() => setShowLogin(true)} className="font-bold text-purple-600 dark:text-purple-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">try the app free</button>.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-5">
                    <div className="glassy grid h-14 w-14 place-items-center rounded-3xl text-purple-600 dark:text-purple-400"><Phone size={24} /></div>
                    <div>
                      <h2 className="font-sora text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Talk to us</h2>
                      <p className="font-hanken text-body-md text-black dark:text-neutral-400 mt-1">Admissions · courses · career counseling — we call you.</p>
                    </div>
                  </div>
                  <div className="mt-8 space-y-4">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name"
                      className="glassy w-full rounded-2xl px-5 py-4 font-hanken text-body-md text-neutral-900 dark:text-white outline-none placeholder:text-neutral-400 dark:placeholder:text-black focus:border-purple-500 transition-colors" />
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="Mobile number" inputMode="numeric"
                      className="glassy w-full rounded-2xl px-5 py-4 font-hanken text-body-md text-neutral-900 dark:text-white outline-none placeholder:text-neutral-400 dark:placeholder:text-black focus:border-purple-500 transition-colors" />
                    <div className="flex gap-3">
                      {["11th", "12th", "Other"].map((c) => (
                        <button key={c} onClick={() => setForm({ ...form, studentClass: c })}
                          className={`flex-1 rounded-2xl py-3.5 font-geist text-label-md transition-all ${form.studentClass === c ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl" : "glassy text-neutral-600 dark:text-neutral-400"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="What do you need help with? (optional)" rows={3}
                      className="glassy w-full resize-none rounded-2xl px-5 py-4 font-hanken text-body-md text-neutral-900 dark:text-white outline-none placeholder:text-neutral-400 dark:placeholder:text-black focus:border-purple-500 transition-colors" />
                    {err && <p className="font-geist text-body-sm text-red-500 dark:text-red-400 pl-1">{err}</p>}
                    <motion.button whileTap={{ scale: 0.98 }} onClick={submit} disabled={sending}
                      className="liquid-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 py-4 font-geist text-label-lg font-bold text-white shadow-2xl disabled:opacity-60 hover:scale-105 transition-transform duration-300">
                      {sending ? "Sending…" : <>Request a callback <Send size={18} /></>}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </section>
        )}

        <footer className="relative z-10 border-t border-black/5 dark:border-white/5 py-10 text-center">
          <p className="font-geist text-body-sm text-black dark:text-neutral-400 mb-4">© {new Date().getFullYear()} {cfg.appName} · Built for MHT CET</p>
          <div className="flex justify-center gap-6 text-neutral-600 dark:text-neutral-400 font-geist text-xs">
            <Link href="/privacy-policy" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Terms of Service</Link>
          </div>
        </footer>

      </div>

      {/* ==================================================== */}
      {/* FULL-SCREEN LOGIN OVERLAY (Hero Morph)                 */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            layoutId="auth-container"
            className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-white/10 dark:bg-white/5 backdrop-blur-3xl border-white/20"
          >
            {/* Top Header */}
            <div className="absolute top-6 left-6 flex items-center gap-2 z-50">
              <img src="/src/logo.png" className="w-10 h-10 rounded-xl bg-white p-1 shadow-lg shrink-0" alt="SKCTI Logo" />
              <span className="font-sora font-black text-2xl tracking-tight text-neutral-900 dark:text-white">SKCTI</span>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-md hover:scale-110 transition-transform"
            >
              <X size={24} className="text-neutral-900 dark:text-white" />
            </button>

            {/* Desktop Left (Visual Bento) */}
            <div className="hidden md:flex flex-1 relative items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2400" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" alt="Abstract" />
              <div className="relative z-10 p-12 max-w-lg text-center">
                <h2 className="font-sora text-5xl font-black text-white tracking-tight mb-4">SKCTI</h2>
                <p className="font-hanken text-xl text-neutral-300">Crack 11th, 12th & MHT-CET with a system, not stress.</p>
              </div>
            </div>

            {/* Right Side / Mobile Center (Action) */}
            <div className="flex-1 flex items-center justify-center p-6 relative">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
                }}
                className="w-full max-w-sm text-center"
              >
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <h2 className="font-sora text-3xl font-black text-neutral-900 dark:text-white mb-2 tracking-tight">Get Started</h2>
                  <p className="font-hanken text-neutral-600 dark:text-neutral-400 mb-10">Continue with Google to access your dashboard.</p>
                </motion.div>
                
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  {firebaseReady ? (
                    <button
                      onClick={handleLogin}
                      disabled={loginBusy}
                      className="w-full rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 flex items-center justify-center gap-3 hover:scale-[1.02] hover:shadow-xl active:scale-[0.97] transition-all disabled:opacity-60"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                        <path fill="#fff" d="M21.35 11.1H12v2.9h5.35c-.5 2.5-2.6 3.9-5.35 3.9a6 6 0 1 1 0-12c1.5 0 2.9.55 3.95 1.55l2.15-2.15A9 9 0 1 0 12 21c5.2 0 8.9-3.65 8.9-8.8 0-.4-.05-.75-.15-1.1Z"/>
                      </svg>
                      {loginBusy ? "Opening Google…" : "Continue with Google"}
                    </button>
                  ) : (
                    <p className="font-geist text-label-md text-red-500 glassy rounded-2xl p-4">
                      Firebase keys missing — fill in <span className="font-semibold">.env.local</span> and restart.
                    </p>
                  )}
                  {loginErr && <p className="font-geist text-sm text-red-500 mt-4">{loginErr}</p>}
                </motion.div>
              </motion.div>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}


