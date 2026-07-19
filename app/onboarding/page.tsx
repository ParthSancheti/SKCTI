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
    if (!fbUser) router.replace("/login");
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
      icon: <Phone size={24} className="text-primary" />,
      title: "Your phone number",
      sub: "For rank alerts & account recovery.",
      body: (
        <>
          <div className="flex gap-3">
            <span className="skcti-input h-14 px-4 flex items-center font-geist text-label-md shrink-0">+91</span>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="98765 43210"
              className="skcti-input w-full h-14 px-4 font-geist tracking-widest"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!phoneOk}
            onClick={() => { vibrate(15); setStep(1); }}
            className={`w-full rounded-full py-4 mt-6 font-geist text-label-md flex items-center justify-center gap-2 transition-all ${phoneOk ? "bg-primary-container text-white hover:shadow-glow-primary" : "glassy text-on-surface/30"}`}
          >
            Next <ArrowRight size={16} />
          </motion.button>
        </>
      ),
    },
    {
      icon: <GraduationCap size={24} className="text-primary" />,
      title: "Which class are you in?",
      sub: "You can upgrade to 12th later — we'll celebrate it.",
      body: (
        <div className="grid grid-cols-2 gap-4">
          {(["11th", "12th"] as Grade[]).map((g) => (
            <motion.button
              key={g}
              whileTap={{ scale: 0.95 }}
              onClick={() => { vibrate(15); setGrade(g); setStep(2); }}
              className="glassy rounded-glass p-8 hover:shadow-glow-primary-soft transition-shadow"
            >
              <p className="font-sora text-headline-lg">{g}</p>
              <p className="font-geist text-label-sm text-on-surface/50 mt-1">Standard</p>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      icon: <Atom size={24} className="text-primary" />,
      title: "Pick your stream",
      sub: "You'll only ever see content for your stream.",
      body: (
        <div className="grid grid-cols-2 gap-4">
          {([
            { s: "PCM" as Stream, icon: <Atom size={22} />, sub: "Phy · Chem · Math" },
            { s: "PCB" as Stream, icon: <Dna size={22} />, sub: "Phy · Chem · Bio" },
          ]).map(({ s, icon, sub }) => (
            <motion.button
              key={s}
              whileTap={{ scale: 0.95 }}
              disabled={busy}
              onClick={() => { vibrate(15); setStream(s); void finish(s); }}
              className={`glassy rounded-glass p-8 transition-shadow hover:shadow-glow-primary-soft ${stream === s && busy ? "shadow-glow-primary" : ""}`}
            >
              <span className="text-primary">{icon}</span>
              <p className="font-sora text-headline-lg mt-2">{s}</p>
              <p className="font-geist text-label-sm text-on-surface/50 mt-1">{sub}</p>
            </motion.button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <MeshBackground />
      <div className="w-full max-w-md">
        <div className="flex gap-2 mb-6 px-2">
          {steps.map((_, i) => (
            <motion.div key={i} className="h-1.5 rounded-full bg-primary" animate={{ opacity: i <= step ? 1 : 0.15, flex: i === step ? 2 : 1 }} transition={spring} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="glassy-elite rounded-glass p-10"
          >
            <div className="w-12 h-12 rounded-input bg-primary-container/15 flex items-center justify-center mb-4">{steps[step].icon}</div>
            <h1 className="font-sora text-headline-lg">{steps[step].title}</h1>
            <p className="font-hanken text-body-md text-on-surface/60 mt-1 mb-8">{steps[step].sub}</p>
            {steps[step].body}
            {busy && <p className="font-geist text-label-sm text-primary mt-4 animate-pulse">Creating your command center…</p>}
            {err && <p className="font-geist text-label-sm text-error mt-4">{err}</p>}
          </motion.div>
        </AnimatePresence>
        {step > 0 && !busy && (
          <button onClick={() => setStep(step - 1)} className="font-geist text-label-sm text-on-surface/40 mt-4 px-2">← Back</button>
        )}
      </div>
    </div>
  );
}
