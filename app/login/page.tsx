"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MeshBackground from "@/components/MeshBackground";
import { useStore, vibrate } from "@/lib/store";
import { firebaseReady } from "@/lib/firebase";

export default function Login() {
  const { ready, fbUser, profile, profileLoaded, loginWithGoogle, config } = useStore();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (ready && fbUser && profileLoaded) router.replace(profile ? "/home" : "/onboarding");
  }, [ready, fbUser, profile, profileLoaded, router]);

  const go = async () => {
    vibrate(20);
    setErr("");
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <MeshBackground />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.2, 0.64, 1] }}
        className="glassy-elite rounded-glass p-10 w-full max-w-md text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-glass bg-primary-container/20 flex items-center justify-center mb-6">
          <Sparkles size={28} className="text-primary" />
        </div>
        <h1 className="font-sora text-headline-xl">{config.appName}</h1>
        <p className="font-hanken text-body-md text-on-surface/60 mt-2 mb-10">
          Your PDFs, tests and rank — one elite command center.
        </p>

        {!firebaseReady ? (
          <p className="font-geist text-label-md text-error glassy rounded-input p-4">
            Firebase keys missing — fill in <span className="font-semibold">.env.local</span> (see README) and restart.
          </p>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={go}
            disabled={busy}
            className="w-full rounded-full bg-primary-container text-white font-geist text-label-md py-4 flex items-center justify-center gap-3 hover:shadow-glow-primary transition-shadow disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path fill="#fff" d="M21.35 11.1H12v2.9h5.35c-.5 2.5-2.6 3.9-5.35 3.9a6 6 0 1 1 0-12c1.5 0 2.9.55 3.95 1.55l2.15-2.15A9 9 0 1 0 12 21c5.2 0 8.9-3.65 8.9-8.8 0-.4-.05-.75-.15-1.1Z"/>
            </svg>
            {busy ? "Opening Google…" : "Continue with Google"}
          </motion.button>
        )}
        {err && <p className="font-geist text-label-sm text-error mt-4">{err}</p>}
        <p className="font-geist text-label-sm text-on-surface/40 mt-8">
          One account. Synced everywhere. No passwords.
        </p>
      </motion.div>
    </div>
  );
}
