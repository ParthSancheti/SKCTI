"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Atom, Dna, GraduationCap, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MeshBackground from "@/components/MeshBackground";
import { useStore, vibrate } from "@/lib/store";
import type { Grade, Stream } from "@/lib/types";

const spring = { type: "spring", stiffness: 380, damping: 30 } as const;

export default function Onboarding() {
  const { ready, fbUser, profile, profileLoaded, completeOnboarding } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [stream, setStream] = useState<Stream | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!fbUser) router.replace("/");
    else if (profileLoaded && profile) router.replace("/home");
  }, [ready, fbUser, profile, profileLoaded, router]);

  const phoneOk = /^[6-9]\d{9}$/.test(phone.trim());

  const finish = async (s: Stream) => {
    if (!grade) return;
    setBusy(true);
    setErr("");
    try {
      await completeOnboarding({ phone: phone.trim(), grade, stream: s });
      vibrate(30);
      router.replace("/home");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save. Check Firestore rules.");
      setBusy(false);
    }
  };

  const steps = [
    {
      icon: <Phone size={24} className="text-white" />,
      title: "What's your number?",
      sub: "For rank alerts & account recovery.",
      body: (
        <>
          <div className="flex gap-3">
            <span className="bg-white/10 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/20 rounded-2xl h-14 px-6 flex items-center text-xl font-black text-neutral-900 dark:text-white shrink-0 shadow-inner">+91</span>
            <input
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="98765 43210"
              className="w-full bg-white/10 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/20 rounded-2xl px-6 py-4 text-xl font-black tracking-widest text-neutral-900 dark:text-white outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 shadow-inner"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!phoneOk}
            onClick={() => { vibrate(15); setStep(1); }}
            className={`w-full rounded-full py-4 mt-8 font-geist text-label-md font-bold flex items-center justify-center gap-2 transition-all ${phoneOk ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_10px_40px_rgba(168,85,247,0.4)]" : "bg-black/5 dark:bg-white/5 text-neutral-400"}`}
          >
            Next <ArrowRight size={18} strokeWidth={2.5} />
          </motion.button>
        </>
      ),
    },
    {
      icon: <GraduationCap size={24} className="text-white" />,
      title: "Which class are you in?",
      sub: "You can upgrade to 12th later — we'll celebrate it.",
      body: (
        <div className="grid grid-cols-2 gap-4 mt-6">
          {(["11th", "12th"] as Grade[]).map((g) => (
            <motion.button
              key={g}
              whileTap={{ scale: 0.95 }}
              onClick={() => { vibrate(15); setGrade(g); setStep(2); }}
              className="bg-white/20 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-3xl p-8 hover:bg-white/40 dark:hover:bg-white/10 transition-colors text-left"
            >
              <p className="font-sora text-3xl font-black text-neutral-900 dark:text-white">{g}</p>
              <p className="font-geist text-label-sm text-black dark:text-neutral-400 mt-2">Standard</p>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      icon: <Atom size={24} className="text-white" />,
      title: "Pick your stream",
      sub: "You'll only ever see content for your stream.",
      body: (
        <div className="grid grid-cols-2 gap-4 mt-6">
          {([
            { s: "PCM" as Stream, icon: <Atom size={24} />, sub: "Phy · Chem · Math" },
            { s: "PCB" as Stream, icon: <Dna size={24} />, sub: "Phy · Chem · Bio" },
          ]).map(({ s, icon, sub }) => (
            <motion.button
              key={s}
              whileTap={{ scale: 0.95 }}
              disabled={busy}
              onClick={() => { vibrate(15); setStream(s); void finish(s); }}
              className={`bg-white/20 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-3xl p-6 transition-all text-left ${stream === s && busy ? "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]" : "hover:bg-white/40 dark:hover:bg-white/10"}`}
            >
              <span className="text-purple-600 dark:text-purple-400">{icon}</span>
              <p className="font-sora text-2xl font-black text-neutral-900 dark:text-white mt-4 tracking-tight">{s}</p>
              <p className="font-geist text-xs font-semibold text-black dark:text-neutral-400 mt-1">{sub}</p>
            </motion.button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 md:p-12 relative overflow-hidden">
      <MeshBackground />
      
      {/* Bento Glass Card Container */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white/20 dark:bg-white/5 backdrop-blur-3xl border border-white/30 dark:border-white/10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden min-h-[600px]">
        
        {/* Left Side (Top on Mobile): Image Visual */}
        <div className="md:w-5/12 h-56 md:h-auto relative flex flex-col justify-end p-8 md:p-10 bg-gradient-to-br from-purple-900/50 to-blue-900/50">
          <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2400" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" alt="Abstract" />
          <div className="relative z-10">
            <h2 className="font-sora text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">Create your command center.</h2>
            <p className="font-hanken text-neutral-300 mt-2 md:mt-4 text-base md:text-lg">One account. Synced everywhere.</p>
          </div>
        </div>

        {/* Right Side: Setup Wizard Form */}
        <div className="flex-1 p-8 md:p-16 flex flex-col">
          {/* Progress Bar */}
          <div className="flex gap-2 mb-12">
            {steps.map((_, i) => (
              <motion.div 
                key={i} 
                className={`h-2 rounded-full ${i <= step ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-black/10 dark:bg-white/10'}`} 
                animate={{ flex: i === step ? 3 : 1 }} 
                transition={spring} 
              />
            ))}
          </div>

          <div className="flex-1 relative flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mb-6 shadow-[0_10px_40px_rgba(168,85,247,0.4)]">
                  {steps[step].icon}
                </div>
                <h1 className="font-sora text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">{steps[step].title}</h1>
                <p className="font-hanken text-xl text-black dark:text-neutral-400 mt-2 mb-10">{steps[step].sub}</p>
                
                {steps[step].body}
                
                {busy && <p className="font-geist text-sm text-purple-600 dark:text-purple-400 mt-6 animate-pulse font-semibold">Configuring your account…</p>}
                {err && <p className="font-geist text-sm text-red-500 mt-6 font-semibold">{err}</p>}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Back Button */}
          <div className="mt-8 h-10">
            {step > 0 && !busy && (
              <button 
                onClick={() => setStep(step - 1)} 
                className="font-geist text-sm font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-2"
              >
                ← Back
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}


