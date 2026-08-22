"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Flame, GraduationCap, LogOut, Moon, Pencil, Phone, Shield, Sun, Sparkles, Bell, Mail, X, Trash2, Cpu, Download, FileText, BarChart3, Gauge, Target
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { updateUser, col } from "@/lib/db";
import { useStore } from "@/lib/store";
import { haptic, vibrate } from "@/lib/haptics";
import { useToast } from "@/components/Toast";
import type { Stream } from "@/lib/types";
import { type ExamType, type VariantType } from "@/lib/examConfig";
import { fbDb } from "@/lib/firebase";
import { getDocs, writeBatch } from "firebase/firestore";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function ProfileEditForm({
  phone, setPhone, email, setEmail, saveProfile
}: {
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  saveProfile: () => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-col gap-4 mt-6 overflow-hidden"
    >
      <div>
        <label className="font-geist text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-1 block">Phone Number</label>
        <div className="flex items-center gap-3 glassy rounded-2xl p-3">
          <Phone size={16} className="text-neutral-500" />
          <span className="font-geist font-bold text-sm">+91</span>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit number"
            className="bg-transparent border-none outline-none flex-1 font-geist text-sm text-on-surface"
          />
        </div>
      </div>
      <div>
        <label className="font-geist text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-1 block">Email Address</label>
        <div className="flex items-center gap-3 glassy rounded-2xl p-3">
          <Mail size={16} className="text-neutral-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="bg-transparent border-none outline-none flex-1 font-geist text-sm text-on-surface"
          />
        </div>
      </div>
      <button 
        onClick={saveProfile} 
        className="w-full btn-primary py-4 mt-2 rounded-2xl"
      >
        Save Changes
      </button>
    </motion.div>
  );
}

export default function Settings() {
  const {
    profile, config, isAdmin, isDark, toggleTheme, setTargetExam, upgradeGrade, logout,
    notifications, prefs, setNotification, setPref, clearDownloads, deleteAccount,
  } = useStore();
  const router = useRouter();
  const toast = useToast();
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
    const [editingExam, setEditingExam] = useState(false);
  const [draftExam, setDraftExam] = useState<any>(null);
  const [draftStream, setDraftStream] = useState<any>(null);
  const [draftVariant, setDraftVariant] = useState<any>(null);
  
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  
  // Easter Egg
  const [tapCount, setTapCount] = useState(0);
  const [godMode, setGodMode] = useState(false);
  const [clearingAi, setClearingAi] = useState(false);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!profile) return;
    vibrate(20);
    const updatesObj: any = {};
    if (/^[6-9]\d{9}$/.test(phone)) updatesObj.phone = phone;
    if (email.includes("@")) updatesObj.email = email;
    if (Object.keys(updatesObj).length > 0) {
      await updateUser(profile.uid, updatesObj);
    }
    setEditingProfile(false);
  };

  const handleEggTap = () => {
    setTapCount(prev => {
      const next = prev + 1;
      if (next === 5) {
        vibrate(100);
        setGodMode(true);
        setTimeout(() => setGodMode(false), 4000);
        return 0;
      }
      return next;
    });
  };

  const clearAiHistory = async () => {
    if (!profile || clearingAi) return;
    setClearingAi(true);
    vibrate(50);
    try {
      const q = await getDocs(col.aiChats(profile.uid));
      const batch = writeBatch(fbDb());
      q.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      toast.success("AI history cleared");
    } catch {
      toast.error("Couldn't clear it. Check your connection and try again.");
    }
    setClearingAi(false);
  };

  if (!profile) return null;

  const studyHours = `${Math.floor((profile.studyMinutes ?? 0) / 60)}h`;
  const tasksDone = profile.doneTasks.length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col min-h-[calc(100vh-2rem)] w-full relative pb-20 px-4 md:px-8 lg:px-12 mx-auto"
    >
      
      <div className="w-full max-w-5xl flex flex-col h-full pt-[calc(env(safe-area-inset-top,3rem)+2rem)] lg:pt-14 mb-8 px-5 lg:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { vibrate(10); router.push("/home"); }} 
              className="flex w-10 h-10 items-center justify-center rounded-full glassy text-on-surface pointer-events-auto shrink-0 hover:brightness-110 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <p className="font-geist text-sm font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-1">
                Preferences
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2 font-sora tracking-tight">Settings</h1>
            </div>
          </div>
          {isAdmin && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button 
                onClick={() => { vibrate(10); router.push("/admin"); }}
                className="btn-primary px-6 py-3 rounded-full w-full sm:w-max shrink-0"
              >
                🚀 Admin OS
              </button>
            </div>
          )}
        </div>
      </div>

      {/* God Mode Toast Overlay */}
      <AnimatePresence>
        {godMode && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed inset-0 m-auto w-max h-max z-[200] pointer-events-none"
          >
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-lg border border-white/20 p-8 rounded-full shadow-2xl flex items-center gap-4">
              <Sparkles size={40} className="text-yellow-400 animate-pulse" />
              <h1 className="font-sora font-black text-2xl md:text-5xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                🚀 God Mode Unlocked: Welcome {profile.name.split(" ")[0]}!
              </h1>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-5xl pb-10">
        
        {/* Profile Card */}
        <motion.div 
          layoutId="profile-card"
          className="glassy rounded-[24px] p-5 flex flex-col md:col-span-2 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-5 relative z-10">
            <div className={`shrink-0 ${isAdmin ? 'bg-[conic-gradient(#ea4335_0deg_90deg,#4285f4_90deg_180deg,#34a853_180deg_270deg,#fbbc05_270deg_360deg)] p-1' : 'border border-white/20 p-1'} rounded-full transition-all`}>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20 dark:border-black/50">
                {profile.photo ? (
                  <img src={profile.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-sora font-black text-2xl text-purple-600 dark:text-purple-400">{profile.name.charAt(0)}</span>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-sora font-bold text-xl md:text-2xl text-on-surface truncate">{profile.name}</p>
              <p className="font-geist text-sm text-on-surface-variant truncate mb-2">{profile.email}</p>
              
              <button 
                onClick={() => { vibrate(10); setEditingProfile(!editingProfile); }}
                className="hidden lg:flex items-center gap-2 font-geist text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 hover:opacity-80 transition-opacity"
              >
                {editingProfile ? "Cancel Editing" : "Edit Profile"} <Pencil size={12} />
              </button>
              <button 
                onClick={() => { vibrate(10); setEditingProfile(true); }}
                className="lg:hidden flex items-center gap-2 font-geist text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-4 py-2 rounded-full w-max mt-1"
              >
                Edit <Pencil size={12} />
              </button>
            </div>
            
            <div className="text-center shrink-0 ml-auto hidden md:block">
              <p className="font-sora font-bold text-2xl text-purple-600 dark:text-purple-400">
                {Math.min(100, 25 + (profile.phone ? 15 : 0) + Math.min(30, profile.downloads.length * 5) + Math.min(30, profile.attempted.length * 6))}%
              </p>
              <p className="font-geist text-[10px] uppercase font-bold tracking-widest text-neutral-400 mt-1">Profile</p>
            </div>
          </div>

          <AnimatePresence>
            {editingProfile && (
              <div className="hidden lg:block relative z-10">
                <ProfileEditForm phone={phone} setPhone={setPhone} email={email} setEmail={setEmail} saveProfile={saveProfile} />
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2 grid grid-cols-3 gap-4">
          <div className="glassy rounded-[20px] p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <Flame size={20} className="text-orange-500 mb-2" />
            <p className="font-sora font-bold text-lg md:text-xl text-on-surface">
              {config.features.streak ? `${profile.streak}d` : "—"}
            </p>
            <p className="font-geist text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mt-1">Streak</p>
          </div>
          <div className="glassy rounded-[20px] p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <Download size={20} className="text-blue-500 mb-2" />
            <p className="font-sora font-bold text-lg md:text-xl text-on-surface">{profile.downloads.length}</p>
            <p className="font-geist text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mt-1">Saved PDFs</p>
          </div>
          <div className="glassy rounded-[20px] p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <Shield size={20} className="text-purple-500 mb-2" />
            <p className="font-sora font-bold text-lg md:text-xl text-on-surface">{profile.attempted.length}</p>
            <p className="font-geist text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mt-1">Tests Done</p>
          </div>
        </motion.div>

        {/* Theme Toggle Card */}
        <motion.div variants={itemVariants} className="glassy rounded-[24px] p-5 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3">
            {isDark ? <Moon size={22} className="text-purple-400" /> : <Sun size={22} className="text-yellow-500" />}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { vibrate(15); toggleTheme(e); }}
              role="switch"
              aria-checked={isDark}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${isDark ? "bg-purple-500" : "bg-surface-container-highest"}`}
            >
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className={`block w-6 h-6 rounded-full bg-white shadow ${isDark ? "ml-auto" : ""}`} />
            </motion.button>
          </div>
          <p className="font-sora font-semibold text-on-surface">Theme</p>
          <p className="font-geist text-xs text-on-surface-variant mt-1">{isDark ? "Dark" : "Light"} · follows device</p>
        </motion.div>

        {/* Class / Standard Card */}
        <motion.div variants={itemVariants} className="glassy rounded-[24px] p-5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap size={22} className="text-blue-500" />
          </div>
          <p className="font-sora font-semibold text-on-surface">{profile.grade} Standard</p>
          {profile.grade === "11th" ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { vibrate(20); void upgradeGrade(); }} className="mt-3 w-full rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-geist font-bold text-sm py-2.5">
              Upgrade to 12th 🎓
            </motion.button>
          ) : (
            <p className="font-geist text-xs text-on-surface-variant mt-1">Final lap — go get it.</p>
          )}
        </motion.div>

        {/* Target Exam Card */}
        <motion.div variants={itemVariants} className="glassy rounded-[24px] p-5 flex flex-col md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Target size={22} className="text-pink-500" />
                <h3 className="font-sora font-semibold text-on-surface">Target Exam</h3>
              </div>
              <p className="font-geist text-xs text-error font-bold">Switching wipes today's AI plan.</p>
            </div>
            {!editingExam ? (
              <button onClick={() => {
                setDraftExam(profile.exam || "MHT_CET");
                setDraftStream(profile.stream || "PCM");
                setDraftVariant(profile.variant || "MAIN");
                setEditingExam(true);
              }} className="px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-geist text-xs font-bold transition-colors">
                Change
              </button>
            ) : (
              <button onClick={() => setEditingExam(false)} className="px-4 py-1.5 rounded-full bg-black/10 dark:bg-white/10 text-on-surface font-geist text-xs font-bold transition-colors">
                Cancel
              </button>
            )}
          </div>

          {!editingExam ? (
            <div className="flex flex-col">
              <p className="font-sora text-xl font-bold text-on-surface mb-1">
                {profile.exam === "JEE" ? "JEE" : (profile.exam === "NEET" ? "NEET" : "MHT-CET")}
              </p>
              <p className="font-geist text-sm text-on-surface-variant">
                {profile.exam === "JEE" ? `Targeting JEE ${profile.variant === "ADVANCED" ? "Advanced" : "Main"}` : (profile.exam === "NEET" ? "Medical UG" : `Stream: ${profile.stream || "PCM"}`)}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {([
                  { id: "MHT_CET" as ExamType, label: "MHT-CET" },
                  { id: "JEE" as ExamType, label: "JEE" },
                  { id: "NEET" as ExamType, label: "NEET" }
                ]).map((ex) => (
                  <button key={ex.id} onClick={() => {
                    setDraftExam(ex.id);
                    if (ex.id === "MHT_CET") setDraftStream("PCM");
                    if (ex.id === "JEE") setDraftVariant("MAIN");
                  }} className={`py-3 rounded-xl font-sora font-bold text-sm transition-all border ${draftExam === ex.id ? "bg-purple-600 border-purple-600 text-white shadow-md" : "glassy border-black/10 dark:border-white/10 text-on-surface-variant"}`}>
                    {ex.label}
                  </button>
                ))}
              </div>

              {draftExam === "MHT_CET" && (
                <div className="flex gap-2">
                  {(["PCM", "PCB"] as Stream[]).map((s) => (
                    <button key={s} onClick={() => setDraftStream(s)} className={`flex-1 py-2 rounded-xl font-geist font-bold text-sm transition-all border ${draftStream === s ? "bg-blue-600 border-blue-600 text-white shadow-md" : "glassy border-black/10 dark:border-white/10 text-on-surface-variant"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {draftExam === "JEE" && (
                <div className="flex gap-2">
                  {(["MAIN", "ADVANCED"] as VariantType[]).map((v) => (
                    <button key={v} onClick={() => setDraftVariant(v)} className={`flex-1 py-2 rounded-xl font-geist font-bold text-sm transition-all border ${draftVariant === v ? "bg-orange-600 border-orange-600 text-white shadow-md" : "glassy border-black/10 dark:border-white/10 text-on-surface-variant"}`}>
                      JEE {v === "ADVANCED" ? "Advanced" : "Main"}
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => {
                const finalStream = draftExam === "MHT_CET" ? draftStream : null;
                const finalVariant = draftExam === "JEE" ? draftVariant : null;
                void setTargetExam(draftExam as ExamType, finalStream, finalVariant);
                setEditingExam(false);
              }} className="mt-2 w-full py-3 rounded-xl bg-green-500 text-white font-geist font-bold text-sm shadow-md">
                Confirm Change
              </button>
            </div>
          )}
        </motion.div>

        {/* AI Preferences */}
        <motion.div variants={itemVariants} className="glassy rounded-[24px] p-5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <Cpu size={22} className="text-purple-500" />
            <h3 className="font-sora font-semibold text-on-surface">AI Preferences</h3>
          </div>
          <button 
            onClick={clearAiHistory}
            disabled={clearingAi}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-surface-container border border-outline-variant hover:bg-black/10 dark:hover:bg-white/10 transition-colors group disabled:opacity-50"
          >
            <span className="font-geist font-bold text-sm text-on-surface">Clear AI History</span>
            <Trash2 size={16} className="text-error group-hover:scale-110 transition-transform" />
          </button>
        </motion.div>

        {/* Notifications — now persisted, not local useState */}
        <motion.div variants={itemVariants} className="glassy rounded-[24px] p-5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <Bell size={22} className="text-orange-500" />
            <h3 className="font-sora font-semibold text-on-surface">Notifications</h3>
          </div>
          <div className="space-y-3">
            {([
              { key: "reminders" as const, label: "Study Reminders", sub: "A nudge if your plan is untouched by evening" },
              { key: "updates" as const, label: "App Updates", sub: "New chapters, tests and notices" },
            ]).map(({ key, label, sub }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-geist text-sm text-on-surface">{label}</span>
                  <p className="font-geist text-[11px] text-on-surface-variant">{sub}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  role="switch"
                  aria-checked={notifications[key]}
                  aria-label={label}
                  onClick={() => { haptic.select(); void setNotification(key, !notifications[key]); }}
                  className={`w-11 h-6 shrink-0 rounded-full p-1 transition-colors ${notifications[key] ? "bg-green-500" : "bg-surface-container-highest"}`}
                >
                  <motion.span layout className={`block w-4 h-4 rounded-full bg-white shadow ${notifications[key] ? "ml-auto" : ""}`} />
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Saved chapters */}
        <motion.div variants={itemVariants} className="glassy rounded-[24px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText size={22} className="text-blue-400" />
              <h3 className="font-sora font-semibold text-on-surface">Saved Chapters</h3>
            </div>
            <p className="font-geist text-xs text-on-surface-variant mb-6">
              Chapters you&apos;ve opened. Recently read ones stay available offline.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="font-geist font-bold text-sm text-on-surface">
              {profile.downloads.length} {profile.downloads.length === 1 ? "chapter" : "chapters"} saved
            </span>
            <button
              onClick={() => { haptic.warning(); setConfirmClear(true); }}
              disabled={profile.downloads.length === 0}
              className="press shrink-0 rounded-full bg-white/10 px-4 py-2 font-geist text-xs font-bold text-black transition-colors hover:bg-white/20 disabled:opacity-40 dark:text-white"
            >
              Clear
            </button>
          </div>

          <AnimatePresence>
            {confirmClear && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-error-container p-4">
                  <p className="font-hanken mb-3 text-sm text-error">
                    Clear your saved chapter list? Your coins and streak stay.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmClear(false)} className="press flex-1 rounded-xl bg-white/10 py-2 font-geist text-xs font-bold text-on-surface">Cancel</button>
                    <button
                      onClick={() => { haptic.impact(); void clearDownloads(); setConfirmClear(false); }}
                      className="press flex-1 rounded-xl bg-red-500 py-2 font-geist text-xs font-bold text-white shadow-md"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Study Analytics */}
        <motion.div variants={itemVariants} className="glassy rounded-[24px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 size={22} className="text-green-500" />
              <h3 className="font-sora font-semibold text-on-surface">Study Analytics</h3>
            </div>
            <p className="font-geist text-xs text-on-surface-variant mb-6">Your overall platform progress.</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { value: studyHours, label: "Total Hours" },
              { value: tasksDone, label: "Tasks Done" },
              { value: profile.attempted.length, label: "Tests Taken" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center justify-center rounded-input glassy p-3 text-center">
                <p className="font-sora text-sm font-bold tabular-nums text-on-surface">{value}</p>
                <p className="font-geist mt-1 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>
          {tasksDone === 0 && (
            <p className="font-geist mt-3 text-center text-[11px] text-on-surface-variant">
              Finish a task from Today&apos;s Focus and these start filling in.
            </p>
          )}
        </motion.div>

        {/* Appearance & language */}
        <motion.div variants={itemVariants} className="glassy rounded-[24px] p-5 flex flex-col justify-center md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Gauge size={22} className="text-cyan-500" />
            <h3 className="font-sora font-semibold text-on-surface">Performance &amp; Language</h3>
          </div>

          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="min-w-0">
              <span className="font-geist text-sm text-on-surface">Reduce visual effects</span>
              <p className="font-geist text-[11px] text-on-surface-variant">
                Turns off the glass blur. Try this if scrolling feels choppy.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              role="switch"
              aria-checked={prefs.reducedEffects}
              aria-label="Reduce visual effects"
              onClick={() => { haptic.select(); void setPref("reducedEffects", !prefs.reducedEffects); }}
              className={`w-11 h-6 shrink-0 rounded-full p-1 transition-colors ${prefs.reducedEffects ? "bg-cyan-500" : "bg-surface-container-highest"}`}
            >
              <motion.span layout className={`block w-4 h-4 rounded-full bg-white shadow ${prefs.reducedEffects ? "ml-auto" : ""}`} />
            </motion.button>
          </div>

          <label className="font-geist text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-2 block">
            Language for notices &amp; AI replies
          </label>
          <div className="flex rounded-full glassy p-1.5">
            {([
              { code: "en" as const, label: "English" },
              { code: "hi" as const, label: "हिंदी" },
              { code: "mr" as const, label: "मराठी" },
            ]).map(({ code, label }) => (
              <button
                key={code}
                onClick={() => { haptic.select(); void setPref("language", code); }}
                className="relative flex-1 rounded-full py-2.5 font-geist text-sm font-bold transition-colors"
              >
                {prefs.language === code && (
                  <motion.span layoutId="lang-pill" className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 shadow-md" />
                )}
                <span className={`relative z-10 ${prefs.language === code ? "text-white" : "text-on-surface-variant"}`}>{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sign Out Card */}
        <motion.button
          variants={itemVariants}
          onClick={() => { vibrate(15); void logout().then(() => router.replace("/")); }}
          className="bg-error-container dark:bg-error-container backdrop-blur-md border border-red-500/20 rounded-[24px] p-5 flex items-center justify-center gap-3 md:col-span-2 hover:bg-red-500/20 transition-colors group"
        >
          <LogOut size={20} className="text-error group-hover:-translate-x-1 transition-transform" />
          <span className="font-sora font-bold text-error">Sign Out</span>
        </motion.button>

        {/* Danger zone */}
        <motion.div variants={itemVariants} className="md:col-span-2 rounded-[24px] border border-red-500/20 bg-red-500/[0.06] p-5">
          <div className="flex items-center gap-3 mb-2">
            <Trash2 size={20} className="text-error" />
            <h3 className="font-sora font-semibold text-error">Delete account</h3>
          </div>
          <p className="font-geist text-xs text-on-surface-variant">
            Permanently removes your profile, plan, todos, AI history and rank entry.
            Coins and streak are gone for good. This cannot be undone.
          </p>

          {!confirmDelete ? (
            <button
              onClick={() => { haptic.warning(); setConfirmDelete(true); }}
              className="press mt-4 rounded-full border border-red-500/30 px-5 py-2.5 font-geist text-xs font-bold text-error"
            >
              Delete my account
            </button>
          ) : (
            <div className="mt-4">
              <p className="font-hanken mb-2 text-sm text-error">
                Type <span className="font-geist font-bold">DELETE</span> to confirm.
              </p>
              <input
                autoFocus
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value.toUpperCase())}
                placeholder="DELETE"
                className="w-full rounded-2xl border border-red-500/25 bg-black/5 px-4 py-3 font-geist text-sm tracking-widest text-black outline-none focus:border-red-500 dark:bg-white/5 dark:text-white"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { setConfirmDelete(false); setDeleteText(""); }}
                  className="press flex-1 rounded-xl bg-white/10 py-2.5 font-geist text-xs font-bold text-on-surface"
                >
                  Keep my account
                </button>
                <button
                  disabled={deleteText !== "DELETE" || deleting}
                  onClick={async () => {
                    setDeleting(true);
                    haptic.heavy();
                    try { await deleteAccount(); router.replace("/"); }
                    catch { setDeleting(false); setDeleteErr("Couldn't delete. Sign out, sign back in, and try again."); }
                  }}
                  className="press flex-1 rounded-xl bg-red-600 py-2.5 font-geist text-xs font-bold text-white shadow-md disabled:opacity-40"
                >
                  {deleting ? "Deleting…" : "Delete forever"}
                </button>
              </div>
              {deleteErr && (
                <p className="font-geist mt-2 text-xs text-error">{deleteErr}</p>
              )}
            </div>
          )}
        </motion.div>

      </div>

      <p 
        onClick={handleEggTap}
        className="text-xs text-gray-500 text-center tracking-widest mt-12 mb-8 cursor-pointer font-geist uppercase font-bold"
      >
        CREATED BY @PSG CREATIONS
      </p>

      {/* Mobile Full Screen Profile Editor Overlay */}
      <AnimatePresence>
        {editingProfile && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-0 z-[100] bg-white dark:bg-[#0a0a0c] flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8 pt-4">
              <span className="font-sora font-semibold text-xl text-on-surface">Edit Profile</span>
              <button onClick={() => { vibrate(10); setEditingProfile(false); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container border border-outline-variant text-on-surface">
                <X size={20} />
              </button>
            </div>
            
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-surface-container mb-8 flex items-center justify-center border-4 border-purple-500/20 shadow-2xl">
              {profile.photo ? (
                <img src={profile.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-sora font-black text-4xl text-purple-600 dark:text-purple-400">{profile.name.charAt(0)}</span>
              )}
            </div>

            <div className="flex-1">
              <ProfileEditForm phone={phone} setPhone={setPhone} email={email} setEmail={setEmail} saveProfile={saveProfile} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
