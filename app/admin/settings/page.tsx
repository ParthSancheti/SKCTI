"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot, Brain, CircleDollarSign, CreditCard, Flame, Globe, ListChecks, Lock, Mail,
  Megaphone, Moon, PlayCircle, Plus, Sun, Trash2, Trophy, Type, KeyRound, Wrench, ShieldCheck,
} from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import PhonePreviewFrame from "@/components/PhonePreviewFrame";
import { logAudit, saveConfig } from "@/lib/db";
import { useStore, vibrate, triggerHaptic } from "@/lib/store";
import type { AdminRole, AiConfig, FeatureFlags, MaintenanceConfig } from "@/lib/types";
import { DEFAULT_AI, DEFAULT_CONFIG, DEFAULT_MAINTENANCE } from "@/lib/types";

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
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-purple-600 dark:bg-purple-500" : "bg-black/10 dark:bg-white/10"}`}
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

function MissionControlContent() {
  const { config, isDark, toggleTheme, fbUser } = useStore();
  const searchParams = useSearchParams();
  const [mobileTab, setMobileTab] = useState("editor");
  const [name, setName] = useState("");
  const [nameDirty, setNameDirty] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [land, setLand] = useState(DEFAULT_CONFIG.landing);
  const [landDirty, setLandDirty] = useState(false);
  const [landSaving, setLandSaving] = useState(false);

  const [ai, setAi] = useState<AiConfig>(DEFAULT_AI);
  const [aiDirty, setAiDirty] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);

  const [maint, setMaint] = useState<MaintenanceConfig>(DEFAULT_MAINTENANCE);
  const [maintDirty, setMaintDirty] = useState(false);
  const [maintSaving, setMaintSaving] = useState(false);

  useEffect(() => {
    if (!nameDirty) setName(config.appName);
  }, [config.appName, nameDirty]);

  useEffect(() => {
    if (!landDirty) setLand(config.landing);
  }, [config.landing, landDirty]);

  useEffect(() => {
    if (!aiDirty) setAi({ ...DEFAULT_AI, ...(config.ai ?? {}) });
  }, [config.ai, aiDirty]);

  useEffect(() => {
    if (!maintDirty) setMaint({ ...DEFAULT_MAINTENANCE, ...(config.maintenance ?? {}) });
  }, [config.maintenance, maintDirty]);

  const saveLanding = async () => {
    setLandSaving(true);
    await saveConfig({ landing: { ...land, whatsapp: land.whatsapp.replace(/\D/g, "") } });
    logAudit(fbUser?.email ?? "admin", "Updated public site");
    setLandSaving(false);
    setLandDirty(false);
  };

  const setL = (patch: Partial<typeof land>) => { setLand({ ...land, ...patch }); setLandDirty(true); };

  const setA = (patch: Partial<AiConfig>) => { setAi({ ...ai, ...patch }); setAiDirty(true); };
  const saveAi = async () => {
    setAiSaving(true);
    await saveConfig({ ai });
    logAudit(fbUser?.email ?? "admin", `Updated AI config (model ${ai.model}${ai.paused ? ", PAUSED" : ""})`);
    setAiSaving(false);
    setAiDirty(false);
  };

  const setM = (patch: Partial<MaintenanceConfig>) => { setMaint({ ...maint, ...patch }); setMaintDirty(true); };
  const saveMaint = async () => {
    setMaintSaving(true);
    await saveConfig({ maintenance: maint });
    logAudit(fbUser?.email ?? "admin", maint.enabled ? "Enabled maintenance mode" : "Disabled maintenance mode");
    setMaintSaving(false);
    setMaintDirty(false);
  };

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

  const setRole = async (target: string, role: AdminRole) => {
    // Never let the last owner demote themselves — that locks everyone out of
    // Mission Control permanently, with no way back except editing Firestore.
    const roles = { ...(config.adminRoles ?? {}) };
    const owners = config.adminEmails.filter((e) => (roles[e] ?? "owner") === "owner");
    if (role === "editor" && owners.length <= 1 && (roles[target] ?? "owner") === "owner") return;
    roles[target] = role;
    await saveConfig({ adminRoles: roles });
    logAudit(fbUser?.email ?? "admin", `Set ${target} to ${role}`);
    vibrate(12);
  };

  const removeAdmin = async (target: string) => {
    if (config.adminEmails.length <= 1) return; // never lock yourself out
    await saveConfig({ adminEmails: config.adminEmails.filter((e) => e !== target) });
    logAudit(fbUser?.email ?? "admin", `Revoked admin: ${target}`);
  };

  const offCount = FEATURES.filter((f) => !config.features[f.key]).length;

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 flex flex-col gap-6 pt-2 pb-12">
      <div>
        <h1 className="font-sora text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Mission Control</h1>
        <p className="mt-1 font-geist text-body-md text-neutral-500 dark:text-white/60">
          Every switch here writes live to Firestore — students see it instantly.
        </p>
      </div>

      {/* Mobile Sticky Tabs */}
      <div className="xl:hidden flex justify-center w-full sticky top-[100px] z-40 -mt-2 mb-2 pointer-events-none">
        <div className="flex p-1 mx-auto w-[calc(100%-1rem)] sm:w-full max-w-sm glassy rounded-full relative z-50 pointer-events-auto">
          {(["editor", "preview"] as const).map((t) => (
            <button key={t} onClick={() => { vibrate(10); setMobileTab(t); }} className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 font-geist text-sm font-bold transition-all group z-10">
              {mobileTab === t && <motion.span layoutId="mobileTabSettings" className="absolute inset-0 rounded-full bg-white dark:bg-white/15 shadow-md border border-black/5 dark:border-white/10 -z-10" />}
              <span className={`relative z-10 capitalize ${mobileTab === t ? "text-neutral-900 dark:text-white" : "bg-transparent text-neutral-500 dark:text-white/50 group-hover:text-neutral-900 dark:group-hover:text-white"}`}>{t}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 w-full max-w-full">
        <div className={`flex flex-col gap-6 w-full max-w-full box-border ${mobileTab !== "editor" ? "hidden xl:flex" : ""}`}>
        {/* App identity */}
        <GlassCard className="p-4 md:p-5 w-full block box-border">
          <div className="mb-4 flex items-center gap-2">
            <Type size={18} className="text-purple-600 dark:text-purple-400" />
            <h2 className="font-sora text-xl font-bold text-neutral-900 dark:text-white">App identity</h2>
          </div>
          <label className="font-geist text-label-sm text-neutral-500 dark:text-white/50">App name (header, login, PWA)</label>
          <div className="mt-2 flex gap-2">
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setNameDirty(true); }}
              className="w-full rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary"
              placeholder="SKCTI"
            />
            <AnimatePresence>
              {nameDirty && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  onClick={saveName} disabled={saving}
                  className="rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 px-6 font-geist text-sm font-bold text-neutral-900 dark:text-white transition-all shadow-lg shrink-0"
                >
                  {saving ? "…" : "Save"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Feature toggles */}
        <GlassCard className="p-4 md:p-5 w-full block box-border">
          <div className="mb-1 flex items-center justify-between gap-4">
            <h2 className="font-sora text-xl font-bold text-neutral-900 dark:text-white">Features</h2>
            <span className="font-geist text-label-sm text-neutral-500 dark:text-white/50 shrink-0">
              {offCount === 0 ? "All live" : `${offCount} switched off`}
            </span>
          </div>
          <p className="mb-4 font-geist text-sm text-neutral-500 dark:text-white/50">
            Turn a module off and it vanishes from every student's app in real time.
          </p>
          <div className="space-y-2">
            {FEATURES.map(({ key, Icon, title, sub }) => (
              <div key={key} className="flex items-center justify-between gap-4 w-full rounded-2xl glassy p-4">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${config.features[key] ? "bg-purple-600/20 text-purple-600 dark:bg-purple-400/20 dark:text-purple-400" : "bg-black/10 dark:bg-white/10 text-neutral-500 dark:text-white/40"}`}>
                  <Icon size={19} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-geist text-body-md font-semibold text-neutral-900 dark:text-white truncate">{title}</p>
                  <p className="truncate font-geist text-sm text-neutral-500 dark:text-white/50">{sub}</p>
                </div>
                <Toggle on={config.features[key]} onClick={() => flipFeature(key)} />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Admin access */}
        <GlassCard className="p-4 md:p-5 w-full block box-border">
          <div className="mb-4 flex items-center gap-2">
            <Mail size={18} className="text-purple-600 dark:text-purple-400" />
            <h2 className="font-sora text-xl font-bold text-neutral-900 dark:text-white">Admin access</h2>
          </div>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAdmin()}
              placeholder="teammate@gmail.com"
              className="w-full rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary"
            />
            <button onClick={addAdmin} className="grid w-12 shrink-0 place-items-center rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white transition-all shadow-lg">
              <Plus size={20} />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {config.adminEmails.length === 0 && (
              <p className="font-geist text-sm text-neutral-500 dark:text-white/40">
                No admins yet — hit “Initialize” on the dashboard first.
              </p>
            )}
            {config.adminEmails.map((e) => {
              const role: AdminRole = config.adminRoles?.[e] ?? "owner";
              return (
                <div key={e} className="flex items-center gap-3 rounded-2xl glassy px-4 py-3">
                  <span className="min-w-0 flex-1 truncate font-geist text-body-md text-neutral-900 dark:text-white">{e}</span>
                  {/* isAdmin was a single boolean, so anyone added to help with
                      Content Hub also got Leads, the User Matrix, and the power
                      to add more admins. Editors now get content only. */}
                  <select
                    value={role}
                    onChange={(ev) => void setRole(e, ev.target.value as AdminRole)}
                    className="shrink-0 rounded-full border border-black/10 bg-transparent px-3 py-1.5 font-geist text-xs font-bold text-neutral-900 outline-none dark:border-white/15 dark:text-white"
                  >
                    <option className="bg-white dark:bg-[#0A0A0A]" value="owner">Owner</option>
                    <option className="bg-white dark:bg-[#0A0A0A]" value="editor">Editor</option>
                  </select>
                  {config.adminEmails.length > 1 && (
                    <button onClick={() => removeAdmin(e)} aria-label={`Remove ${e}`} className="shrink-0 text-error/70 hover:text-error">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
            <p className="flex items-start gap-2 pt-1 font-geist text-xs text-neutral-500 dark:text-white/40">
              <ShieldCheck size={13} className="mt-0.5 shrink-0" />
              Owners get everything. Editors get Content Hub and Test Hub only — no leads, no student data, no admin management.
            </p>
          </div>
        </GlassCard>

        {/* Public site */}
        <GlassCard className="p-4 md:p-5 w-full block box-border">
          <div className="mb-1 flex items-center gap-2">
            <Globe size={18} className="text-purple-600 dark:text-purple-400" />
            <h2 className="font-sora text-xl font-bold text-neutral-900 dark:text-white">Public site</h2>
          </div>
          <p className="mb-4 font-geist text-sm text-neutral-500 dark:text-white/50">
            The landing page at your root URL — where reels traffic lands.
          </p>
          <div className="space-y-3">
            <div>
              <label className="font-geist text-label-sm text-neutral-500 dark:text-white/50">Headline</label>
              <input value={land.tagline} onChange={(e) => setL({ tagline: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="font-geist text-label-sm text-neutral-500 dark:text-white/50">Sub-headline</label>
              <textarea value={land.sub} onChange={(e) => setL({ sub: e.target.value })} rows={2}
                className="mt-1 w-full resize-none rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="font-geist text-label-sm text-neutral-500 dark:text-white/50">WhatsApp (with country code)</label>
                <input value={land.whatsapp} onChange={(e) => setL({ whatsapp: e.target.value })} placeholder="919876543210"
                  className="mt-1 w-full rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary" />
              </div>
              <div>
                <label className="font-geist text-label-sm text-neutral-500 dark:text-white/50">YouTube channel URL</label>
                <input value={land.youtube} onChange={(e) => setL({ youtube: e.target.value })} placeholder="https://youtube.com/@…"
                  className="mt-1 w-full rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="font-geist text-label-sm text-neutral-500 dark:text-white/50">Instagram URL</label>
              <input value={land.instagram} onChange={(e) => setL({ instagram: e.target.value })} placeholder="https://instagram.com/…"
                className="mt-1 w-full rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary" />
            </div>
            <div className="flex items-center justify-between rounded-2xl glassy p-4 gap-4">
              <div className="min-w-0">
                <p className="font-geist text-body-md font-semibold text-neutral-900 dark:text-white truncate">&quot;Talk to us&quot; form</p>
                <p className="font-geist text-sm text-neutral-500 dark:text-white/50 truncate">Counseling callback requests → Leads inbox</p>
              </div>
              <Toggle on={land.showInquiry} onClick={() => setL({ showInquiry: !land.showInquiry })} />
            </div>
            <AnimatePresence>
              {landDirty && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  onClick={() => void saveLanding()} disabled={landSaving}
                  className="w-full rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 py-3.5 font-geist text-sm font-bold text-neutral-900 dark:text-white transition-all shadow-lg"
                >
                  {landSaving ? "Saving…" : "Save public site"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Theme */}
        <GlassCard className="p-4 md:p-5 w-full block box-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {isDark ? <Moon size={19} className="text-purple-600 dark:text-purple-400 shrink-0" /> : <Sun size={19} className="text-purple-600 dark:text-purple-400 shrink-0" />}
              <div className="min-w-0">
                <p className="font-geist text-body-md font-semibold text-neutral-900 dark:text-white truncate">Admin theme</p>
                <p className="font-geist text-sm text-neutral-500 dark:text-white/50 truncate">Your device only — students pick their own</p>
              </div>
            </div>
            <Toggle on={isDark} onClick={toggleTheme} />
          </div>
        </GlassCard>

        {/* Ghost integrations */}
        <GlassCard className="p-4 md:p-5 opacity-70 w-full block box-border">
          <div className="mb-3 flex items-center gap-2">
            <Lock size={16} className="text-neutral-500 dark:text-white/40 shrink-0" />
            <h2 className="font-sora text-xl font-bold text-neutral-500 dark:text-white/60">Coming soon</h2>
          </div>
          {[
            { Icon: CreditCard, title: "Stripe / Razorpay", sub: "Payment rails wired, held behind a launch flag" },
            { Icon: Lock, title: "Pro tier", sub: "Premium content gating for paid batches" },
          ].map(({ Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl glassy p-4 first:mb-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-black/10 dark:bg-white/10 text-neutral-500 dark:text-white/40"><Icon size={18} /></div>
              <div className="flex-1 min-w-0">
                <p className="font-geist text-body-md font-semibold text-neutral-500 dark:text-white/60 truncate">{title}</p>
                <p className="font-geist text-sm text-neutral-500 dark:text-white/40 truncate">{sub}</p>
              </div>
              <div className="relative h-8 w-14 rounded-full bg-black/10 dark:bg-white/10">
                <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-black/20 dark:bg-white/20" />
              </div>
            </div>
          ))}
        </GlassCard>

        {/* AI Configuration — now actually writes to Firestore */}
        <GlassCard className="p-4 md:p-6 w-full block box-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-input bg-purple-600/10 dark:bg-purple-400/10 flex items-center justify-center border border-purple-600/20 shadow-inner">
              <Bot size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-sora text-headline-lg truncate">AI Configuration</h2>
              <p className="font-geist text-sm text-neutral-500 dark:text-white/60 truncate">Model, limits and the killswitch</p>
            </div>
          </div>

          {/* This card used to render two "API Key" password inputs that were
              never saved anywhere. Worse than missing: an admin could type a
              real key in and believe it was configured. Keys cannot live here
              at all — config/app is read by the client SDK, so anything in it
              ships to every student's device. */}
          <div className="mb-5 flex items-start gap-3 rounded-card border border-amber-500/25 bg-amber-500/10 p-4">
            <KeyRound size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <p className="font-geist text-sm font-semibold text-amber-600 dark:text-amber-400">API keys live in Vercel, not here</p>
              <p className="font-geist mt-1 text-xs text-neutral-500 dark:text-white/50">
                Anything saved on this page is readable by every signed-in student.
                Set <span className="font-mono">GROQ_API_KEY</span> in Vercel → Settings → Environment Variables, then redeploy.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-geist text-label-sm text-neutral-500 dark:text-white/50">Active model</label>
              <select
                value={ai.model}
                onChange={(e) => setA({ model: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-outline/30 glassy bg-transparent px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary"
              >
                {["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemini-2.0-flash", "gemini-2.5-flash"].map((m) => (
                  <option key={m} className="bg-white dark:bg-[#0A0A0A]">{m}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="font-geist text-label-sm text-neutral-500 dark:text-white/50">Daily limit — whole app</label>
                <input type="number" min={0} value={ai.dailyLimit}
                  onChange={(e) => setA({ dailyLimit: Math.max(0, Number(e.target.value) || 0) })}
                  className="mt-1 w-full rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary" />
              </div>
              <div>
                <label className="font-geist text-label-sm text-neutral-500 dark:text-white/50">Daily limit — per student</label>
                <input type="number" min={0} value={ai.perUserLimit}
                  onChange={(e) => setA({ perUserLimit: Math.max(0, Number(e.target.value) || 0) })}
                  className="mt-1 w-full rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary" />
              </div>
            </div>
            <p className="font-geist text-xs text-neutral-500 dark:text-white/40">
              Per-student caps stop one user draining the shared budget. 0 = unlimited.
            </p>

            <div className={`flex items-center justify-between gap-4 rounded-card border p-4 transition-colors ${ai.paused ? "border-red-500/40 bg-red-500/15" : "border-red-500/20 bg-red-500/10"}`}>
              <div className="min-w-0">
                <p className="font-sora text-sm font-semibold text-red-500">Emergency killswitch</p>
                <p className="font-geist text-xs text-red-400/80">
                  {ai.paused ? "AI is paused for every student right now." : "Pause all AI generation immediately"}
                </p>
              </div>
              <Toggle on={ai.paused} onClick={() => setA({ paused: !ai.paused })} />
            </div>

            <AnimatePresence>
              {aiDirty && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  onClick={() => void saveAi()} disabled={aiSaving}
                  className="w-full rounded-2xl border border-black/10 bg-black/5 py-3.5 font-geist text-sm font-bold text-neutral-900 shadow-lg transition-all hover:bg-black/10 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  {aiSaving ? "Saving…" : "Save AI settings"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Maintenance mode */}
        <GlassCard className="mb-8 p-4 md:p-5 w-full block box-border">
          <div className="mb-1 flex items-center gap-2">
            <Wrench size={18} className="text-purple-600 dark:text-purple-400" />
            <h2 className="font-sora text-xl font-bold text-neutral-900 dark:text-white">Maintenance mode</h2>
          </div>
          <p className="mb-4 font-geist text-sm text-neutral-500 dark:text-white/50">
            Swaps the student app for a friendly holding screen. Useful if you hit a Firestore
            quota wall — students see an explanation instead of skeletons that never load.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-card glassy p-4">
              <div className="min-w-0">
                <p className="font-geist text-body-md font-semibold text-neutral-900 dark:text-white">
                  {maint.enabled ? "Students are locked out" : "App is live"}
                </p>
                <p className="truncate font-geist text-sm text-neutral-500 dark:text-white/50">
                  Takes effect instantly for everyone
                </p>
              </div>
              <Toggle on={maint.enabled} onClick={() => setM({ enabled: !maint.enabled })} />
            </div>

            <div>
              <label className="font-geist text-label-sm text-neutral-500 dark:text-white/50">Message students see</label>
              <textarea value={maint.message} onChange={(e) => setM({ message: e.target.value })} rows={2}
                className="mt-1 w-full resize-none rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary" />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-card glassy p-4">
              <div className="min-w-0">
                <p className="font-geist text-body-md font-semibold text-neutral-900 dark:text-white">Admins keep access</p>
                <p className="truncate font-geist text-sm text-neutral-500 dark:text-white/50">So you can verify the fix before reopening</p>
              </div>
              <Toggle on={maint.allowAdmins} onClick={() => setM({ allowAdmins: !maint.allowAdmins })} />
            </div>

            <AnimatePresence>
              {maintDirty && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  onClick={() => void saveMaint()} disabled={maintSaving}
                  className="w-full rounded-2xl border border-black/10 bg-black/5 py-3.5 font-geist text-sm font-bold text-neutral-900 shadow-lg transition-all hover:bg-black/10 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  {maintSaving ? "Saving…" : "Save maintenance settings"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
          </div>

      {/* Live preview */}
      <div className={`w-full pt-4 xl:pt-0 h-full ${mobileTab !== "preview" ? "hidden xl:block" : ""}`}>
        <div className="sticky top-[100px]">
          <p className="mb-3 text-center font-geist text-label-sm text-neutral-500 dark:text-white/50 tracking-widest uppercase font-bold">Live home preview</p>
          <PhonePreviewFrame>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-geist text-[10px] text-neutral-500 dark:text-white/50 truncate">Good morning</p>
                  <p className="font-sora text-sm font-bold text-neutral-900 dark:text-white truncate">{config.appName}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {config.features.streak && <span className="rounded-full glassy px-2 py-1 text-[10px]">🔥 4</span>}
                  {config.features.coins && <span className="rounded-full glassy px-2 py-1 text-[10px]">🪙 120</span>}
                </div>
              </div>
              {config.features.planner && (
                <div className="rounded-2xl bg-primary-container/15 p-3">
                  <p className="font-geist text-[10px] font-semibold text-purple-600 dark:text-purple-400">TODAY'S FOCUS</p>
                  <div className="mt-2 space-y-1.5">
                    {[1, 2].map((i) => <div key={i} className="h-6 rounded-lg glassy" />)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {["PHY", "CHE", "MAT"].map((s) => (
                  <div key={s} className="grid h-14 place-items-center rounded-xl glassy font-geist text-[10px] text-neutral-500 dark:text-white/60">{s}</div>
                ))}
              </div>
              <div className="flex justify-around rounded-full glassy px-2 py-2">
                {["Home", "Learn", ...(config.features.tests ? ["Tests"] : []), ...(config.features.rank ? ["Rank"] : []), ...(config.features.ai ? ["AI"] : [])].map((t) => (
                  <span key={t} className="font-geist text-[9px] text-neutral-500 dark:text-white/60">{t}</span>
                ))}
              </div>
            </div>
          </PhonePreviewFrame>
        </div>
      </div>
    </div>
    </div>
  );
}

export default function MissionControl() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <MissionControlContent />
    </Suspense>
  );
}
