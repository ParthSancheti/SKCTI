"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot, Brain, CircleDollarSign, CreditCard, Flame, Globe, ListChecks, Lock, Mail,
  Megaphone, Moon, PlayCircle, Plus, Sun, Trash2, Trophy, Type,
} from "lucide-react";
import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import PhonePreviewFrame from "@/components/PhonePreviewFrame";
import { logAudit, saveConfig } from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { FeatureFlags } from "@/lib/types";
import { DEFAULT_CONFIG } from "@/lib/types";

const FEATURES: { key: keyof FeatureFlags; Icon: typeof Flame; title: string; sub: string }[] = [
  { key: "planner", Icon: Brain, title: "AI day planner", sub: "Gemini builds Today's Focus every morning" },
  { key: "streak", Icon: Flame, title: "Streaks", sub: "Daily fire counter in the home header" },
  { key: "coins", Icon: CircleDollarSign, title: "Coins & shop", sub: "Earn on tasks + tests, spend in the shop" },
  { key: "ai", Icon: Bot, title: "AI doubt solver", sub: "The floating AI tab & chat" },
  { key: "rank", Icon: Trophy, title: "Leaderboard", sub: "Rank tab with podium + list" },
  { key: "tests", Icon: ListChecks, title: "Tests tab", sub: "Your Google Form quizzes" },
  { key: "videos", Icon: PlayCircle, title: "Video lectures", sub: "YouTube lectures inside the Learn tab" },
  { key: "notices", Icon: Megaphone, title: "Notice board", sub: "Announcements block on home" },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={() => { vibrate(12); onClick(); }}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-primary-container" : "bg-on-surface/15"}`}
      aria-pressed={on}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md ${on ? "left-7" : "left-1"}`}
      />
    </button>
  );
}

export default function MissionControl() {
  const { config, isDark, toggleTheme, fbUser } = useStore();
  const [name, setName] = useState("");
  const [nameDirty, setNameDirty] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [land, setLand] = useState(DEFAULT_CONFIG.landing);
  const [landDirty, setLandDirty] = useState(false);
  const [landSaving, setLandSaving] = useState(false);

  useEffect(() => {
    if (!nameDirty) setName(config.appName);
  }, [config.appName, nameDirty]);

  useEffect(() => {
    if (!landDirty) setLand(config.landing);
  }, [config.landing, landDirty]);

  const saveLanding = async () => {
    setLandSaving(true);
    await saveConfig({ landing: { ...land, whatsapp: land.whatsapp.replace(/\D/g, "") } });
    logAudit(fbUser?.email ?? "admin", "Updated public site");
    setLandSaving(false);
    setLandDirty(false);
  };

  const setL = (patch: Partial<typeof land>) => { setLand({ ...land, ...patch }); setLandDirty(true); };

  const flipFeature = async (key: keyof FeatureFlags) => {
    const next = { ...config.features, [key]: !config.features[key] };
    await saveConfig({ features: next });
    logAudit(fbUser?.email ?? "admin", `${next[key] ? "Enabled" : "Disabled"} feature: ${key}`);
  };

  const saveName = async () => {
    const clean = name.trim();
    if (!clean || clean === config.appName) { setNameDirty(false); return; }
    setSaving(true);
    await saveConfig({ appName: clean });
    logAudit(fbUser?.email ?? "admin", `Renamed app to “${clean}”`);
    setSaving(false);
    setNameDirty(false);
  };

  const addAdmin = async () => {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return;
    if (config.adminEmails.includes(clean)) { setEmail(""); return; }
    await saveConfig({ adminEmails: [...config.adminEmails, clean] });
    logAudit(fbUser?.email ?? "admin", `Granted admin: ${clean}`);
    setEmail("");
    vibrate(15);
  };

  const removeAdmin = async (target: string) => {
    if (config.adminEmails.length <= 1) return; // never lock yourself out
    await saveConfig({ adminEmails: config.adminEmails.filter((e) => e !== target) });
    logAudit(fbUser?.email ?? "admin", `Revoked admin: ${target}`);
  };

  const offCount = FEATURES.filter((f) => !config.features[f.key]).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div>
          <h1 className="font-space text-headline-lg text-on-surface">Mission Control</h1>
          <p className="mt-1 font-geist text-body-md text-on-surface/60">
            Every switch here writes live to Firestore — students see it instantly.
          </p>
        </div>

        {/* App identity */}
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Type size={18} className="text-primary" />
            <h2 className="font-space text-title-md text-on-surface">App identity</h2>
          </div>
          <label className="font-geist text-label-sm text-on-surface/50">App name (header, login, PWA)</label>
          <div className="mt-2 flex gap-2">
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setNameDirty(true); }}
              className="w-full rounded-2xl border border-outline/30 bg-surface-container/60 px-4 py-3 font-geist text-body-md text-on-surface outline-none focus:border-primary"
              placeholder="SKCTI"
            />
            <AnimatePresence>
              {nameDirty && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  onClick={saveName} disabled={saving}
                  className="rounded-2xl bg-primary-container px-5 font-geist text-label-md font-semibold text-white shadow-glow-primary"
                >
                  {saving ? "…" : "Save"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Feature toggles */}
        <GlassCard className="p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-space text-title-md text-on-surface">Features</h2>
            <span className="font-geist text-label-sm text-on-surface/50">
              {offCount === 0 ? "All live" : `${offCount} switched off`}
            </span>
          </div>
          <p className="mb-4 font-geist text-body-sm text-on-surface/50">
            Turn a module off and it vanishes from every student's app in real time.
          </p>
          <div className="space-y-2">
            {FEATURES.map(({ key, Icon, title, sub }) => (
              <div key={key} className="flex items-center gap-4 rounded-2xl bg-surface-container/50 p-4">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${config.features[key] ? "bg-primary-container/20 text-primary" : "bg-on-surface/10 text-on-surface/40"}`}>
                  <Icon size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-geist text-body-md font-semibold text-on-surface">{title}</p>
                  <p className="truncate font-geist text-body-sm text-on-surface/50">{sub}</p>
                </div>
                <Toggle on={config.features[key]} onClick={() => flipFeature(key)} />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Admin access */}
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Mail size={18} className="text-primary" />
            <h2 className="font-space text-title-md text-on-surface">Admin access</h2>
          </div>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAdmin()}
              placeholder="teammate@gmail.com"
              className="w-full rounded-2xl border border-outline/30 bg-surface-container/60 px-4 py-3 font-geist text-body-md text-on-surface outline-none focus:border-primary"
            />
            <button onClick={addAdmin} className="grid w-12 shrink-0 place-items-center rounded-2xl bg-primary-container text-white shadow-glow-primary">
              <Plus size={20} />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {config.adminEmails.length === 0 && (
              <p className="font-geist text-body-sm text-on-surface/40">
                No admins yet — hit “Initialize” on the dashboard first.
              </p>
            )}
            {config.adminEmails.map((e) => (
              <div key={e} className="flex items-center justify-between rounded-2xl bg-surface-container/50 px-4 py-3">
                <span className="truncate font-geist text-body-md text-on-surface">{e}</span>
                {config.adminEmails.length > 1 && (
                  <button onClick={() => removeAdmin(e)} className="text-error/70 hover:text-error">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Public site */}
        <GlassCard className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            <h2 className="font-space text-title-md text-on-surface">Public site</h2>
          </div>
          <p className="mb-4 font-geist text-body-sm text-on-surface/50">
            The landing page at your root URL — where reels traffic lands.
          </p>
          <div className="space-y-3">
            <div>
              <label className="font-geist text-label-sm text-on-surface/50">Headline</label>
              <input value={land.tagline} onChange={(e) => setL({ tagline: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-outline/30 bg-surface-container/60 px-4 py-3 font-geist text-body-md text-on-surface outline-none focus:border-primary" />
            </div>
            <div>
              <label className="font-geist text-label-sm text-on-surface/50">Sub-headline</label>
              <textarea value={land.sub} onChange={(e) => setL({ sub: e.target.value })} rows={2}
                className="mt-1 w-full resize-none rounded-2xl border border-outline/30 bg-surface-container/60 px-4 py-3 font-geist text-body-md text-on-surface outline-none focus:border-primary" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="font-geist text-label-sm text-on-surface/50">WhatsApp (with country code)</label>
                <input value={land.whatsapp} onChange={(e) => setL({ whatsapp: e.target.value })} placeholder="919876543210"
                  className="mt-1 w-full rounded-2xl border border-outline/30 bg-surface-container/60 px-4 py-3 font-geist text-body-md text-on-surface outline-none focus:border-primary" />
              </div>
              <div>
                <label className="font-geist text-label-sm text-on-surface/50">YouTube channel URL</label>
                <input value={land.youtube} onChange={(e) => setL({ youtube: e.target.value })} placeholder="https://youtube.com/@…"
                  className="mt-1 w-full rounded-2xl border border-outline/30 bg-surface-container/60 px-4 py-3 font-geist text-body-md text-on-surface outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="font-geist text-label-sm text-on-surface/50">Instagram URL</label>
              <input value={land.instagram} onChange={(e) => setL({ instagram: e.target.value })} placeholder="https://instagram.com/…"
                className="mt-1 w-full rounded-2xl border border-outline/30 bg-surface-container/60 px-4 py-3 font-geist text-body-md text-on-surface outline-none focus:border-primary" />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-surface-container/50 p-4">
              <div>
                <p className="font-geist text-body-md font-semibold text-on-surface">&quot;Talk to us&quot; form</p>
                <p className="font-geist text-body-sm text-on-surface/50">Counseling callback requests → Leads inbox</p>
              </div>
              <Toggle on={land.showInquiry} onClick={() => setL({ showInquiry: !land.showInquiry })} />
            </div>
            <AnimatePresence>
              {landDirty && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  onClick={() => void saveLanding()} disabled={landSaving}
                  className="w-full rounded-2xl bg-primary-container py-3.5 font-geist text-label-md font-semibold text-white shadow-glow-primary"
                >
                  {landSaving ? "Saving…" : "Save public site"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Theme */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={19} className="text-primary" /> : <Sun size={19} className="text-primary" />}
              <div>
                <p className="font-geist text-body-md font-semibold text-on-surface">Admin theme</p>
                <p className="font-geist text-body-sm text-on-surface/50">Your device only — students pick their own</p>
              </div>
            </div>
            <Toggle on={isDark} onClick={toggleTheme} />
          </div>
        </GlassCard>

        {/* Ghost integrations */}
        <GlassCard className="p-5 opacity-70">
          <div className="mb-3 flex items-center gap-2">
            <Lock size={16} className="text-on-surface/40" />
            <h2 className="font-space text-title-md text-on-surface/60">Coming soon</h2>
          </div>
          {[
            { Icon: CreditCard, title: "Stripe / Razorpay", sub: "Payment rails wired, held behind a launch flag" },
            { Icon: Lock, title: "Pro tier", sub: "Premium content gating for paid batches" },
          ].map(({ Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl bg-surface-container/40 p-4 first:mb-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-on-surface/10 text-on-surface/40"><Icon size={18} /></div>
              <div className="flex-1">
                <p className="font-geist text-body-md font-semibold text-on-surface/60">{title}</p>
                <p className="font-geist text-body-sm text-on-surface/40">{sub}</p>
              </div>
              <div className="relative h-8 w-14 rounded-full bg-on-surface/10">
                <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-on-surface/20" />
              </div>
            </div>
          ))}
        </GlassCard>
      </div>

      {/* Live preview */}
      <div className="hidden xl:block">
        <div className="sticky top-6">
          <p className="mb-3 text-center font-geist text-label-sm text-on-surface/50">Live student preview</p>
          <PhonePreviewFrame>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-geist text-[10px] text-on-surface/50">Good morning</p>
                  <p className="font-space text-sm font-bold text-on-surface">{config.appName}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {config.features.streak && <span className="rounded-full bg-surface-container px-2 py-1 text-[10px]">🔥 4</span>}
                  {config.features.coins && <span className="rounded-full bg-surface-container px-2 py-1 text-[10px]">🪙 120</span>}
                </div>
              </div>
              {config.features.planner && (
                <div className="rounded-2xl bg-primary-container/15 p-3">
                  <p className="font-geist text-[10px] font-semibold text-primary">TODAY'S FOCUS</p>
                  <div className="mt-2 space-y-1.5">
                    {[1, 2].map((i) => <div key={i} className="h-6 rounded-lg bg-surface-container/80" />)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {["PHY", "CHE", "MAT"].map((s) => (
                  <div key={s} className="grid h-14 place-items-center rounded-xl bg-surface-container/70 font-geist text-[10px] text-on-surface/60">{s}</div>
                ))}
              </div>
              <div className="flex justify-around rounded-full bg-surface-container/80 px-2 py-2">
                {["Home", "Learn", ...(config.features.tests ? ["Tests"] : []), ...(config.features.rank ? ["Rank"] : []), ...(config.features.ai ? ["AI"] : [])].map((t) => (
                  <span key={t} className="font-geist text-[9px] text-on-surface/60">{t}</span>
                ))}
              </div>
            </div>
          </PhonePreviewFrame>
        </div>
      </div>
    </div>
  );
}
