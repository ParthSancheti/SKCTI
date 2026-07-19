"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { doc, onSnapshot } from "firebase/firestore";
import {
  ArrowRight, BookOpen, Bot, CheckCircle2, ClipboardList, Flame, Instagram,
  MessageCircle, Phone, PlayCircle, Send, Sparkles, Trophy, Youtube,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MeshBackground from "@/components/MeshBackground";
import { createInquiry } from "@/lib/db";
import { fbDb, firebaseReady } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import type { AppConfig } from "@/lib/types";
import { DEFAULT_CONFIG } from "@/lib/types";

/* ————— CSS-only phone running a mini SKCTI home ————— */
function PhoneMock({ appName }: { appName: string }) {
  return (
    <div className="glassy-elite liquid-shine w-[290px] rounded-[3rem] p-2.5 md:w-[320px]">
      <div className="relative overflow-hidden rounded-[2.4rem] glassy pb-5">
        {/* notch */}
        <div className="mx-auto mt-2.5 h-6 w-24 rounded-full bg-black/80" />
        {/* header */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div>
            <p className="font-geist text-[9px] text-on-surface/50">Good morning, Arjun</p>
            <p className="font-sora text-sm font-bold text-on-surface">{appName}</p>
          </div>
          <div className="flex gap-1.5">
            <span className="glassy rounded-full px-2 py-1 font-geist text-[9px]">🔥 12</span>
            <span className="glassy rounded-full px-2 py-1 font-geist text-[9px]">🪙 340</span>
          </div>
        </div>
        {/* focus card */}
        <div className="glassy mx-4 mt-4 rounded-3xl p-4">
          <p className="font-geist text-[8px] font-bold uppercase tracking-widest text-primary">Today&apos;s Focus</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative grid h-12 w-12 shrink-0 place-items-center">
              <svg viewBox="0 0 40 40" className="h-12 w-12 -rotate-90">
                <circle cx="20" cy="20" r="16" fill="none" stroke="var(--glass-stroke-strong)" strokeWidth="4" />
                <circle cx="20" cy="20" r="16" fill="none" stroke="rgb(234 88 12)" strokeWidth="4" strokeLinecap="round" strokeDasharray="100" strokeDashoffset="35" />
              </svg>
              <span className="absolute font-sora text-[9px] font-bold">65%</span>
            </div>
            <div className="flex-1 space-y-1.5">
              {[["Rotational Motion — DPP", true], ["Thermo — revision", true], ["Organic — PYQ set", false]].map(([t, done]) => (
                <div key={t as string} className="flex items-center gap-1.5">
                  <span className={`grid h-3 w-3 place-items-center rounded-full ${done ? "bg-primary" : "border border-on-surface/30"}`}>
                    {done ? <span className="text-[6px] text-white">✓</span> : null}
                  </span>
                  <p className={`font-hanken text-[9px] ${done ? "text-on-surface/40 line-through" : "text-on-surface/80"}`}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* subjects */}
        <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
          {["Physics", "Chemistry", "Maths"].map((s) => (
            <div key={s} className="glassy rounded-2xl p-2.5 text-center">
              <p className="font-geist text-[8px] text-on-surface/70">{s}</p>
            </div>
          ))}
        </div>
        {/* nav pill */}
        <div className="glassy mx-8 mt-4 flex justify-between rounded-full px-4 py-2">
          {["Home", "Learn", "Tests", "Rank", "AI"].map((t, i) => (
            <span key={t} className={`font-geist text-[8px] ${i === 0 ? "font-bold text-primary" : "text-on-surface/40"}`}>{t}</span>
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
  const { ready, fbUser } = useStore();
  const [cfg, setCfg] = useState<AppConfig>(DEFAULT_CONFIG);
  const [form, setForm] = useState({ name: "", phone: "", studentClass: "11th", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  /* logged-in? straight to home */
  useEffect(() => {
    if (ready && fbUser) router.replace("/home");
  }, [ready, fbUser, router]);

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

  /* ————— scroll choreography ————— */
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
    <div className="relative min-h-screen overflow-x-hidden">
      <MeshBackground />

      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
        <div className="glassy mx-auto flex max-w-5xl items-center justify-between rounded-full px-3 py-2.5 pl-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary-container font-sora text-sm font-bold text-white shadow-glow-primary">
              {cfg.appName[0] ?? "S"}
            </div>
            <span className="font-sora text-base font-bold text-on-surface">{cfg.appName}</span>
          </div>
          <Link href="/login" className="rounded-full bg-primary-container px-5 py-2.5 font-geist text-label-sm font-bold text-white shadow-glow-primary">
            Open App
          </Link>
        </div>
      </nav>

      {/* ————— HERO: 3D scroll scene ————— */}
      <section ref={heroRef} className="relative z-10 min-h-[130vh]">
        <div className="sticky top-0 flex min-h-screen flex-col items-center overflow-hidden px-5 pt-28 md:pt-32">
          <motion.div style={{ y: heroTextY, opacity: heroFade }} className="text-center">
            <span className="glassy inline-flex items-center gap-2 rounded-full px-4 py-2 font-geist text-label-sm text-on-surface/80">
              <Sparkles size={13} className="text-primary" /> 11th & 12th · PCM · PCB
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-sora text-[2.7rem] font-extrabold leading-[1.05] tracking-tight text-on-surface md:text-7xl">
              {L.tagline.split(",")[0]}
              <span className="block bg-gradient-to-r from-orange-400 via-primary to-red-500 bg-clip-text text-transparent">
                {L.tagline.split(",").slice(1).join(",") || "not stress."}
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl font-hanken text-body-lg text-on-surface/60">{L.sub}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login" className="liquid-shine inline-flex items-center gap-2 rounded-full bg-primary-container px-8 py-4 font-geist text-label-lg font-bold text-white shadow-glow-primary transition-transform hover:scale-[1.04]">
                Start learning free <ArrowRight size={18} />
              </Link>
              {wa && (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="glassy inline-flex items-center gap-2 rounded-full px-7 py-4 font-geist text-label-lg font-semibold text-on-surface">
                  <MessageCircle size={18} className="text-primary" /> WhatsApp
                </a>
              )}
            </div>
          </motion.div>

          {/* 3D phone + floating chips */}
          <div className="persp relative mt-14 flex justify-center pb-24">
            <motion.div
              style={{ rotateX: phoneRotX, rotateY: phoneRotY, y: phoneY, scale: phoneScale }}
              className="preserve-3d"
            >
              <PhoneMock appName={cfg.appName} />
            </motion.div>

            <motion.div style={{ x: chipL, y: useTransform(smooth, [0, 1], [40, -60]) }} className="absolute -left-2 top-16 hidden md:block">
              <div className="glassy flex items-center gap-2 rounded-2xl px-4 py-3">
                <Flame size={16} className="text-primary" />
                <div>
                  <p className="font-sora text-xs font-bold">12-day streak</p>
                  <p className="font-geist text-[9px] text-on-surface/50">Keep it burning</p>
                </div>
              </div>
            </motion.div>
            <motion.div style={{ x: chipR, y: useTransform(smooth, [0, 1], [90, -30]) }} className="absolute -right-4 top-40 hidden md:block">
              <div className="glassy flex items-center gap-2 rounded-2xl px-4 py-3">
                <Bot size={16} className="text-primary" />
                <div>
                  <p className="font-sora text-xs font-bold">Doubt solved ✓</p>
                  <p className="font-geist text-[9px] text-on-surface/50">in 4 seconds</p>
                </div>
              </div>
            </motion.div>
            <motion.div style={{ x: chipR, y: useTransform(smooth, [0, 1], [160, 60]) }} className="absolute -left-8 bottom-24 hidden md:block">
              <div className="glassy flex items-center gap-2 rounded-2xl px-4 py-3">
                <span className="text-base">🪙</span>
                <div>
                  <p className="font-sora text-xs font-bold">+25 coins</p>
                  <p className="font-geist text-[9px] text-on-surface/50">Mock test done</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ————— marquee ————— */}
      <section className="relative z-10 overflow-hidden py-6">
        <div className="flex animate-[marquee_28s_linear_infinite] gap-3 whitespace-nowrap">
          {[...Array(2)].flatMap((_, k) =>
            ["Rotational Motion", "Electrostatics", "Organic Chemistry", "Calculus", "Thermodynamics", "Genetics", "Optics", "Probability", "Human Physiology", "Chemical Bonding", "Waves", "Vectors"].map((t) => (
              <span key={`${k}-${t}`} className="glassy shrink-0 rounded-full px-5 py-2.5 font-geist text-label-sm text-on-surface/70">{t}</span>
            ))
          )}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </section>

      {/* ————— features: 3D tilt-in cards ————— */}
      <section className="persp relative z-10 mx-auto max-w-6xl px-5 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center font-sora text-3xl font-extrabold text-on-surface md:text-5xl"
        >
          Everything a topper uses.
          <span className="block bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Nothing they don&apos;t.</span>
        </motion.h2>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, sub }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 60, rotateX: 28 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 3) * 0.08, type: "spring", stiffness: 110, damping: 18 }}
              whileHover={{ y: -8, rotateX: 4, rotateY: -4 }}
              className="glassy preserve-3d rounded-[2rem] p-7"
            >
              <div className="glassy grid h-12 w-12 place-items-center rounded-2xl text-primary">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 font-sora text-title-lg font-bold text-on-surface">{title}</h3>
              <p className="mt-2 font-hanken text-body-md leading-relaxed text-on-surface/60">{sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ————— how it works ————— */}
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
              className="relative"
            >
              <span className="bg-gradient-to-b from-primary/60 to-transparent bg-clip-text font-sora text-7xl font-extrabold text-transparent">{n}</span>
              <h3 className="-mt-3 font-sora text-title-lg font-bold text-on-surface">{t}</h3>
              <p className="mt-2 font-hanken text-body-md text-on-surface/60">{sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ————— free lectures hook ————— */}
      {(L.youtube || L.instagram) && (
        <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="glassy-elite liquid-shine rounded-[2.5rem] p-9 text-center md:p-14"
          >
            <PlayCircle size={44} className="mx-auto text-primary" />
            <h2 className="mt-4 font-sora text-3xl font-extrabold text-on-surface md:text-4xl">Free lectures, every week</h2>
            <p className="mx-auto mt-3 max-w-xl font-hanken text-body-md text-on-surface/60">
              Watch full concept videos free — then open the app for the notes, tests and the daily plan that go with them.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {L.youtube && (
                <a href={L.youtube} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#FF0000] px-7 py-3.5 font-geist text-label-md font-bold text-white transition-transform hover:scale-105">
                  <Youtube size={18} /> YouTube
                </a>
              )}
              {L.instagram && (
                <a href={L.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] px-7 py-3.5 font-geist text-label-md font-bold text-white transition-transform hover:scale-105">
                  <Instagram size={18} /> Instagram
                </a>
              )}
            </div>
          </motion.div>
        </section>
      )}

      {/* ————— counseling ————— */}
      {L.showInquiry && (
        <section className="relative z-10 mx-auto max-w-2xl px-5 py-12 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="glassy-strong rounded-[2.5rem] p-8 md:p-11"
          >
            {sent ? (
              <div className="py-8 text-center">
                <CheckCircle2 size={48} className="mx-auto text-primary" />
                <h3 className="mt-4 font-sora text-2xl font-extrabold text-on-surface">Got it!</h3>
                <p className="mt-2 font-hanken text-body-md text-on-surface/60">
                  We&apos;ll call you back within a day. Meanwhile,{" "}
                  <Link href="/login" className="font-semibold text-primary">try the app free</Link>.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="glassy grid h-12 w-12 place-items-center rounded-2xl text-primary"><Phone size={20} /></div>
                  <div>
                    <h2 className="font-sora text-2xl font-extrabold text-on-surface">Talk to us</h2>
                    <p className="font-hanken text-body-sm text-on-surface/50">Admissions · courses · career counseling — we call you.</p>
                  </div>
                </div>
                <div className="mt-7 space-y-3">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name"
                    className="glassy w-full rounded-2xl px-4 py-3.5 font-hanken text-body-md text-on-surface outline-none placeholder:text-on-surface/35 focus:border-primary" />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="Mobile number" inputMode="numeric"
                    className="glassy w-full rounded-2xl px-4 py-3.5 font-hanken text-body-md text-on-surface outline-none placeholder:text-on-surface/35 focus:border-primary" />
                  <div className="flex gap-2">
                    {["11th", "12th", "Other"].map((c) => (
                      <button key={c} onClick={() => setForm({ ...form, studentClass: c })}
                        className={`flex-1 rounded-2xl py-3 font-geist text-label-md transition-all ${form.studentClass === c ? "bg-primary-container text-white shadow-glow-primary" : "glassy text-on-surface/60"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="What do you need help with? (optional)" rows={3}
                    className="glassy w-full resize-none rounded-2xl px-4 py-3.5 font-hanken text-body-md text-on-surface outline-none placeholder:text-on-surface/35 focus:border-primary" />
                  {err && <p className="font-geist text-body-sm text-error">{err}</p>}
                  <motion.button whileTap={{ scale: 0.98 }} onClick={submit} disabled={sending}
                    className="liquid-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-container py-4 font-geist text-label-lg font-bold text-white shadow-glow-primary disabled:opacity-60">
                    {sending ? "Sending…" : <>Request a callback <Send size={17} /></>}
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </section>
      )}

      <footer className="relative z-10 border-t border-outline/15 py-8 text-center">
        <p className="font-geist text-body-sm text-on-surface/40">© {new Date().getFullYear()} {cfg.appName} · Built for serious students</p>
      </footer>
    </div>
  );
}
