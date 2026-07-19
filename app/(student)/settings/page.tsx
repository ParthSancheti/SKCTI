"use client";

import { motion } from "framer-motion";
import {
  ChevronRight, Download, Flame, GraduationCap, LogOut, Moon, Pencil, Phone, Shield, Sun,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import { updateUser } from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { Stream } from "@/lib/types";

export default function Settings() {
  const { profile, config, isAdmin, isDark, toggleTheme, setStream, upgradeGrade, logout } = useStore();
  const router = useRouter();
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [confirmStream, setConfirmStream] = useState<Stream | null>(null);

  if (!profile) return null;

  const strength =
    25 +
    (profile.phone ? 15 : 0) +
    Math.min(30, profile.downloads.length * 5) +
    Math.min(30, profile.attempted.length * 6);

  const savePhone = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) return;
    await updateUser(profile.uid, { phone });
    setEditingPhone(false);
  };

  return (
    <div className="pt-6 space-y-6 pb-24">
      <h1 className="font-sora text-headline-xl">Settings</h1>

      {/* ————— profile card ————— */}
      <GlassCard className="p-7 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden glassy flex items-center justify-center shrink-0">
          {profile.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="font-sora font-bold text-primary text-xl">{profile.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sora font-semibold text-lg truncate">{profile.name}</p>
          <p className="font-geist text-label-sm text-on-surface/50 truncate">{profile.email}</p>
          {editingPhone ? (
            <div className="flex gap-2 mt-2">
              <input
                autoFocus
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder={profile.phone}
                className="skcti-input h-9 px-3 w-36 font-geist text-label-sm"
              />
              <button onClick={() => void savePhone()} className="rounded-full bg-primary-container text-white px-3 font-geist text-label-sm">Save</button>
            </div>
          ) : (
            <button onClick={() => { setPhone(profile.phone); setEditingPhone(true); }} className="font-geist text-label-sm text-primary mt-1 flex items-center gap-1">
              <Phone size={11} /> +91 {profile.phone} <Pencil size={10} />
            </button>
          )}
        </div>
        <div className="text-center shrink-0">
          <p className="font-sora font-bold text-xl text-primary">{Math.min(100, strength)}%</p>
          <p className="font-geist text-[10px] text-on-surface/40">profile</p>
        </div>
      </GlassCard>

      {/* ————— MIUI-style 2-col grid ————— */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-3">
            {isDark ? <Moon size={18} className="text-tertiary" /> : <Sun size={18} className="text-primary" />}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              role="switch"
              aria-checked={isDark}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${isDark ? "bg-primary-container" : "bg-surface-container-highest"}`}
            >
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className={`block w-5 h-5 rounded-full bg-white shadow ${isDark ? "ml-auto" : ""}`} />
            </motion.button>
          </div>
          <p className="font-sora font-semibold">Theme</p>
          <p className="font-geist text-label-sm text-on-surface/50">{isDark ? "Dark" : "Light"} · follows device until you flip it</p>
        </GlassCard>

        <GlassCard className="p-6">
          <GraduationCap size={18} className="text-primary mb-3" />
          <p className="font-sora font-semibold">{profile.grade} standard</p>
          {profile.grade === "11th" ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { vibrate(20); void upgradeGrade(); }} className="mt-2 rounded-full bg-primary-container text-white font-geist text-label-sm px-4 py-2">
              Upgrade to 12th 🎓
            </motion.button>
          ) : (
            <p className="font-geist text-label-sm text-on-surface/50">Final lap — go get it.</p>
          )}
        </GlassCard>

        <GlassCard className="p-6 col-span-2">
          <p className="font-sora font-semibold mb-1">Stream</p>
          <p className="font-geist text-label-sm text-on-surface/50 mb-4">Switching wipes today&apos;s AI plan and changes every list in the app.</p>
          <div className="glassy rounded-full p-1.5 flex">
            {(["PCM", "PCB"] as Stream[]).map((s) => (
              <button
                key={s}
                onClick={() => { vibrate(10); if (s !== profile.stream) setConfirmStream(s); }}
                className="relative flex-1 py-2.5 rounded-full font-geist text-label-md"
              >
                {profile.stream === s && <motion.span layoutId="stream-pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-full bg-primary-container" />}
                <span className={`relative z-10 ${profile.stream === s ? "text-white" : "text-on-surface/60"}`}>{s}</span>
              </button>
            ))}
          </div>
          {confirmStream && (
            <div className="mt-4 glassy rounded-input p-4 flex items-center gap-3">
              <p className="font-hanken text-body-md flex-1">Switch to {confirmStream}?</p>
              <button onClick={() => setConfirmStream(null)} className="font-geist text-label-sm text-on-surface/50 px-3">Cancel</button>
              <button
                onClick={() => { vibrate(20); void setStream(confirmStream); setConfirmStream(null); }}
                className="rounded-full bg-primary-container text-white font-geist text-label-sm px-4 py-2"
              >
                Switch
              </button>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ————— stats row ————— */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { Icon: Flame, label: "Streak", val: config.features.streak ? `${profile.streak}d` : "—" },
          { Icon: Download, label: "Saved PDFs", val: profile.downloads.length },
          { Icon: Shield, label: "Tests done", val: profile.attempted.length },
        ].map(({ Icon, label, val }) => (
          <GlassCard key={label} className="p-5 text-center">
            <Icon size={16} className="mx-auto text-primary mb-1.5" />
            <p className="font-sora font-bold text-lg">{val}</p>
            <p className="font-geist text-[10px] text-on-surface/40">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* ————— OxygenOS list ————— */}
      <GlassCard className="divide-y" style={{ borderColor: "var(--glass-stroke)" }}>
        {isAdmin && (
          <button onClick={() => { vibrate(10); router.push("/admin"); }} className="w-full flex items-center gap-4 px-6 py-4 text-left">
            <Shield size={17} className="text-primary shrink-0" />
            <span className="font-hanken text-body-md flex-1">Admin OS</span>
            <ChevronRight size={16} className="text-on-surface/30" />
          </button>
        )}
        <button
          onClick={() => { vibrate(15); void logout().then(() => router.replace("/login")); }}
          className="w-full flex items-center gap-4 px-6 py-4 text-left"
        >
          <LogOut size={17} className="text-error shrink-0" />
          <span className="font-hanken text-body-md flex-1 text-error">Sign out</span>
        </button>
      </GlassCard>

      <p className="font-geist text-label-sm text-on-surface/30 text-center">{config.appName} · synced to your Google account</p>
    </div>
  );
}
