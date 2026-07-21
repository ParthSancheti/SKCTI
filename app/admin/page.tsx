"use client";

import { motion } from "framer-motion";
import { onSnapshot } from "firebase/firestore";
import { CheckCircle2, ClipboardList, FileText, Megaphone, Rocket, Stethoscope, Users, XCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import AuditLog from "@/components/AuditLog";
import GlassCard from "@/components/GlassCard";
import { col, configRef, ensureConfig, logAudit, snapTo } from "@/lib/db";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { firebaseReady, fbDb } from "@/lib/firebase";
import { useStore, vibrate, triggerHaptic } from "@/lib/store";
import type { UserDoc } from "@/lib/types";

function SystemCheck() {
  const { fbUser, config, configLoaded, isAdmin } = useStore();
  const [writeState, setWriteState] = useState<"idle" | "testing" | "ok" | string>("idle");

  const testWrite = async () => {
    setWriteState("testing");
    try {
      await setDoc(configRef(), { lastDiagAt: serverTimestamp() } as never, { merge: true });
      setWriteState("ok");
    } catch (e) {
      setWriteState(e instanceof Error ? e.message : "Write failed");
    }
  };

  const rows: [string, boolean | null, string][] = [
    ["Firebase keys in .env.local", firebaseReady, "Copy .env.example → .env.local and fill the NEXT_PUBLIC_FIREBASE_* values, then restart npm run dev."],
    ["Signed in with Google", !!fbUser, "Log in from /login first."],
    ["App initialized (config exists)", configLoaded ? config.adminEmails.length > 0 : null, "Click the Initialize button above — this writes the default config and claims you as admin #1."],
    ["Your account is admin", isAdmin, "Your email must be in NEXT_PUBLIC_ADMIN_EMAILS (env) or the adminEmails list (Mission Control)."],
    ["Firestore rules allow writes", writeState === "ok" ? true : writeState === "idle" || writeState === "testing" ? null : false, "Firestore Console → Rules → paste firestore.rules from the repo → Publish. Error: " + (typeof writeState === "string" && writeState !== "idle" && writeState !== "testing" && writeState !== "ok" ? writeState : "")],
  ];

  useEffect(() => {
    testWrite();
  }, []);

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope size={17} className="text-purple-600 dark:text-purple-400" />
          <h2 className="font-sora text-headline-lg">System check</h2>
        </div>
        <button onClick={() => { triggerHaptic(); void testWrite(); }} className="glassy rounded-full px-4 py-2 font-geist text-label-sm text-on-surface/80">
          {writeState === "testing" ? "Testing…" : writeState === "ok" ? "Re-Run Diagnostics" : "Test write"}
        </button>
      </div>
      <div className="space-y-2.5">
        {rows.map(([label, ok, fix]) => (
          <div key={label} className="flex items-start gap-3">
            {ok === true ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-purple-600 dark:text-purple-400" />
              : ok === false ? <XCircle size={17} className="mt-0.5 shrink-0 text-error" />
              : <span className="mt-1 block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-on-surface/25" />}
            <div className="min-w-0">
              <p className="font-hanken text-body-md">{label}</p>
              {ok === false && <p className="mt-0.5 font-geist text-label-sm text-on-surface/50">{fix}</p>}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 font-geist text-label-sm text-on-surface/40">
        If publishing does nothing, this panel tells you exactly which step is broken — 90% of the time it&apos;s the rules or Initialize.
      </p>
    </GlassCard>
  );
}

export default function AdminDashboard() {
  const { fbUser, config, profile, isAdmin, configLoaded } = useStore();
  const router = useRouter();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [counts, setCounts] = useState({ content: 0, tests: 0, banners: 0 });
  const [seeding, setSeeding] = useState(false);
  const [expandingCard, setExpandingCard] = useState<string | null>(null);

  const expandNavigate = (id: string, path: string) => {
    triggerHaptic();
    setExpandingCard(id);
    setTimeout(() => {
      router.push(path);
    }, 300);
  };

  useEffect(() => {
    if (!configLoaded || !isAdmin) return;
    const u1 = onSnapshot(col.users(), (s) => setUsers(s.docs.map((d) => snapTo<UserDoc>(d))), (e) => console.warn("Users access denied", e));
    const u2 = onSnapshot(col.content(), (s) => setCounts((c) => ({ ...c, content: s.size })), (e) => console.warn("Content access denied", e));
    const u3 = onSnapshot(col.tests(), (s) => setCounts((c) => ({ ...c, tests: s.size })), (e) => console.warn("Tests access denied", e));
    const u4 = onSnapshot(col.banners(), (s) => setCounts((c) => ({ ...c, banners: s.size })), (e) => console.warn("Banners access denied", e));
    return () => { u1(); u2(); u3(); u4(); };
  }, [isAdmin, configLoaded]);

  const needsInit = configLoaded && config.adminEmails.length === 0;
  const active = users.filter((u) => u.lastActiveDate === new Date().toISOString().slice(0, 10)).length;

  const initialize = async () => {
    if (!fbUser?.email) return;
    setSeeding(true);
    try {
      const snap = await getDoc(doc(fbDb(), "config", "app"));
      if (snap.exists()) {
        alert("System is already initialized.");
        setSeeding(false);
        return;
      }
      await setDoc(doc(fbDb(), "config", "app"), {
        adminEmails: [fbUser.email],
        setupComplete: true,
        createdAt: new Date().toISOString()
      });
      alert("🚀 SKCTI OS Initialized successfully!");
      await logAudit(fbUser.email, "Initialized app config & claimed admin");
    } catch (error) {
      console.error("Initialization failed:", error);
      alert("Error: Check Firestore Rules and your connection.");
    }
    setSeeding(false);
  };

  const kpis = [
    { id: "card-users", Icon: Users, label: "Students", val: users.length, sub: `${active} active today`, route: "/admin/users" },
    { id: "card-content", Icon: FileText, label: "PDFs live", val: counts.content, sub: "from your Drive", route: "/admin/content" },
    { id: "card-tests", Icon: ClipboardList, label: "Tests live", val: counts.tests, sub: "Google Forms", route: "/admin/tests" },
    { id: "card-builder", Icon: Megaphone, label: "Banners", val: counts.banners, sub: "home carousel", route: "/admin/builder" },
  ];

  const top = [...users].sort((a, b) => b.coins - a.coins).slice(0, 3);

  return (
    <div className="space-y-8 max-w-container">
      <AnimatePresence>
        {expandingCard && (
          <motion.div
            layoutId={expandingCard}
            initial={{ borderRadius: 24, opacity: 1 }}
            animate={{ borderRadius: 0, scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white/5 backdrop-blur-3xl border border-white/10"
          />
        )}
      </AnimatePresence>

      <div>
        <h1 className="font-sora text-headline-xl">Dashboard</h1>
        <p className="font-hanken text-body-md text-on-surface/60 mt-1">Everything students see flows from here — live.</p>
      </div>

      {needsInit && (
        <GlassCard className="p-8 border border-purple-600/30 dark:border-purple-400/30 flex items-center gap-4">
          <Rocket size={22} className="text-purple-600 dark:text-purple-400 shrink-0" />
          <div className="flex-1">
            <p className="font-sora font-semibold">One-time setup</p>
            <p className="font-hanken text-body-md text-on-surface/60">Write the default config to Firestore and lock in {fbUser?.email} as admin.</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { vibrate(20); void initialize(); }} disabled={seeding} className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-geist text-sm px-6 py-3 font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all disabled:opacity-50">
            {seeding ? "Setting up…" : "Initialize"}
          </motion.button>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ id, Icon, label, val, sub }, i) => (
          <motion.div key={label} layoutId={id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <motion.div whileTap={{ scale: 0.95 }}>
              <GlassCard onClick={() => expandNavigate(id, kpis[i].route)} className="p-6 cursor-pointer bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-all">
                <Icon size={18} className="text-purple-600 dark:text-purple-400 mb-3" />
                <p className="font-sora font-bold text-3xl text-neutral-900 dark:bg-gradient-to-br dark:from-white dark:to-white/50 dark:bg-clip-text dark:text-transparent dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{val}</p>
                <p className="font-sora font-semibold text-sm mt-1 text-neutral-900 dark:text-white">{label}</p>
                <p className="font-geist text-label-sm text-neutral-500 dark:text-neutral-400">{sub}</p>
              </GlassCard>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div layoutId="card-leaderboard">
          <GlassCard className="p-8 h-full">
            <h2 className="font-sora text-headline-lg mb-6">Top by coins</h2>
            {top.length === 0 ? (
              <p className="font-hanken text-body-md text-on-surface/40">No signups yet — share the app link.</p>
            ) : (
              <div className="space-y-4">
                {top.map((u, i) => (
                  <div key={u.uid || (u as any).id || i} className="flex items-center gap-3">
                    <span className="font-geist text-label-sm text-on-surface/40 w-5">#{i + 1}</span>
                    <p className="font-sora font-semibold flex-1 truncate">{u.name}</p>
                    <span className="font-geist text-label-sm glassy rounded-full px-2.5 py-1 text-purple-600 dark:text-purple-400">{u.stream}</span>
                    <span className="font-geist text-label-md text-purple-600 dark:text-purple-400 tabular-nums">{u.coins} 🪙</span>
                  </div>
                ))}
              </div>
            )}
            {top.length > 0 && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => expandNavigate("card-leaderboard", "/admin/users")} className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl transition-colors font-geist text-sm text-neutral-900 dark:text-white">
                Expand List <Sparkles size={14} />
              </motion.button>
            )}
          </GlassCard>
        </motion.div>

        {/* AI Fleet Command Module */}
        <motion.div layoutId="card-ai">
          <motion.div whileTap={{ scale: 0.95 }}>
            <GlassCard className="p-8 cursor-pointer bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-all" onClick={() => expandNavigate("card-ai", "/admin/settings?tab=ai")}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-400/10 flex items-center justify-center border border-purple-600/20 shadow-inner">
                <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="font-sora text-headline-lg text-neutral-900 dark:text-white">AI Fleet Command</h2>
            </div>
            
            <div className="mb-6">
              <p className="font-geist text-label-sm text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Global API Calls Today</p>
              <div className="flex items-end gap-3">
                <span className="font-sora font-bold text-4xl text-purple-600 dark:text-purple-400">142</span>
                <span className="font-geist text-lg text-neutral-400 dark:text-neutral-500 mb-1">/ 1000</span>
              </div>
              <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full mt-3 overflow-hidden border border-black/5 dark:border-white/5">
                <div className="h-full bg-purple-600 dark:bg-purple-400 rounded-full shadow-glow-primary" style={{ width: '14.2%' }} />
              </div>
            </div>

          <div className="space-y-4">
            <div onClick={(e) => e.stopPropagation()}>
              <label className="font-geist text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Set Global Daily Limit</label>
              <div className="flex items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden focus-within:border-purple-500 transition-colors">
                <button className="px-4 py-2 text-neutral-500 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-sora font-bold text-lg leading-none">-</button>
                <input type="number" placeholder="" className="w-full bg-transparent px-2 py-2 font-geist text-sm text-center text-neutral-900 dark:text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
                <button className="px-4 py-2 text-neutral-500 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-sora font-bold text-lg leading-none">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 p-4 rounded-xl" onClick={(e) => e.stopPropagation()}>
              <div>
                <p className="font-sora font-semibold text-red-600 dark:text-red-500 text-sm">Emergency AI Killswitch</p>
                <p className="font-geist text-[10px] text-red-500/80">Pause all AI generation globally</p>
              </div>
              <button className="w-12 h-6 rounded-full bg-white/10 border border-white/20 p-1 flex items-center transition-colors hover:bg-white/20">
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>
          </div>
          </GlassCard>
          </motion.div>
        </motion.div>
        
        <SystemCheck />
        <AuditLog />
      </div>
    </div>
  );
}
