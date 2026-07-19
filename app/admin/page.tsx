"use client";

import { motion } from "framer-motion";
import { onSnapshot } from "firebase/firestore";
import { CheckCircle2, ClipboardList, FileText, Megaphone, Rocket, Stethoscope, Users, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import AuditLog from "@/components/AuditLog";
import GlassCard from "@/components/GlassCard";
import { col, configRef, ensureConfig, logAudit, snapTo } from "@/lib/db";
import { serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseReady } from "@/lib/firebase";
import { useStore, vibrate } from "@/lib/store";
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

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope size={17} className="text-primary" />
          <h2 className="font-sora text-headline-lg">System check</h2>
        </div>
        <button onClick={() => void testWrite()} className="glassy rounded-full px-4 py-2 font-geist text-label-sm text-on-surface/80">
          {writeState === "testing" ? "Testing…" : "Test write"}
        </button>
      </div>
      <div className="space-y-2.5">
        {rows.map(([label, ok, fix]) => (
          <div key={label} className="flex items-start gap-3">
            {ok === true ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" />
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
  const { fbUser, config, profile } = useStore();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [counts, setCounts] = useState({ content: 0, tests: 0, banners: 0 });
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(col.users(), (s) => setUsers(s.docs.map((d) => snapTo<UserDoc>(d))), () => {});
    const u2 = onSnapshot(col.content(), (s) => setCounts((c) => ({ ...c, content: s.size })), () => {});
    const u3 = onSnapshot(col.tests(), (s) => setCounts((c) => ({ ...c, tests: s.size })), () => {});
    const u4 = onSnapshot(col.banners(), (s) => setCounts((c) => ({ ...c, banners: s.size })), () => {});
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const needsInit = config.adminEmails.length === 0;
  const active = users.filter((u) => u.lastActiveDate === new Date().toISOString().slice(0, 10)).length;

  const initialize = async () => {
    if (!fbUser?.email) return;
    setSeeding(true);
    await ensureConfig(fbUser.email);
    await logAudit(fbUser.email, "Initialized app config & claimed admin");
    setSeeding(false);
  };

  const kpis = [
    { Icon: Users, label: "Students", val: users.length, sub: `${active} active today` },
    { Icon: FileText, label: "PDFs live", val: counts.content, sub: "from your Drive" },
    { Icon: ClipboardList, label: "Tests live", val: counts.tests, sub: "Google Forms" },
    { Icon: Megaphone, label: "Banners", val: counts.banners, sub: "home carousel" },
  ];

  const top = [...users].sort((a, b) => b.coins - a.coins).slice(0, 5);

  return (
    <div className="space-y-8 max-w-container">
      <div>
        <h1 className="font-sora text-headline-xl">Dashboard</h1>
        <p className="font-hanken text-body-md text-on-surface/60 mt-1">Everything students see flows from here — live.</p>
      </div>

      {needsInit && (
        <GlassCard className="p-8 border border-primary/30 flex items-center gap-4">
          <Rocket size={22} className="text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-sora font-semibold">One-time setup</p>
            <p className="font-hanken text-body-md text-on-surface/60">Write the default config to Firestore and lock in {fbUser?.email} as admin.</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { vibrate(20); void initialize(); }} disabled={seeding} className="rounded-full bg-primary-container text-white font-geist text-label-md px-6 py-3 disabled:opacity-50">
            {seeding ? "Setting up…" : "Initialize"}
          </motion.button>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ Icon, label, val, sub }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <GlassCard className="p-6">
              <Icon size={18} className="text-primary mb-3" />
              <p className="font-sora font-bold text-3xl">{val}</p>
              <p className="font-sora font-semibold text-sm mt-1">{label}</p>
              <p className="font-geist text-label-sm text-on-surface/40">{sub}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard className="p-8">
          <h2 className="font-sora text-headline-lg mb-6">Top by coins</h2>
          {top.length === 0 ? (
            <p className="font-hanken text-body-md text-on-surface/40">No signups yet — share the app link.</p>
          ) : (
            <div className="space-y-4">
              {top.map((u, i) => (
                <div key={u.uid} className="flex items-center gap-3">
                  <span className="font-geist text-label-sm text-on-surface/40 w-5">#{i + 1}</span>
                  <p className="font-sora font-semibold flex-1 truncate">{u.name}</p>
                  <span className="font-geist text-label-sm glassy rounded-full px-2.5 py-1 text-primary">{u.stream}</span>
                  <span className="font-geist text-label-md text-primary tabular-nums">{u.coins} 🪙</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
        <SystemCheck />
        <AuditLog />
      </div>
    </div>
  );
}
