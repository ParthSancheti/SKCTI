"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ClipboardList, Clock, Link2, Save, Target } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import PhonePreviewFrame, { LiveExamCard } from "@/components/PhonePreviewFrame";
import { vibrate, useStore } from "@/lib/store";
import { createTest } from "@/lib/db";
import { Stream } from "@/lib/types";

const STREAMS: Stream[] = ["PCM", "PCB"];


function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={() => { vibrate(10); onClick(); }}
      className={`rounded-full px-4 py-2 font-geist text-xs font-bold transition-all ${
        active 
          ? "bg-purple-600 text-white shadow-lg border-transparent" 
          : "glassy border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10"
      }`}
    >
      {label}
    </motion.button>
  );
}

export default function AddTestStudio() {
  const router = useRouter();
  const { fbUser, isAdmin, modules } = useStore();
  const searchParams = useSearchParams();
  
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subject, setSubject] = useState("");
  
  // Test-Specific Telemetry
  const [duration, setDuration] = useState("");
  const [marks, setMarks] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  const urlOk = url.includes("docs.google.com/forms");

  const handleSave = async () => {
    if (!title || !topic || streams.length === 0 || !subject || !url || !urlOk || !duration || !marks) {
      alert("Please fill all required fields correctly (Title, Chapter, Subject, Form URL, Duration, Marks).");
      return;
    }
    setSaving(true);
    try {
      await createTest({
        title, 
        topic, 
        streams, 
        subject, 
        formUrl: url,
        published: true, 
        kind: "Mock", 
        durationMin: parseInt(duration) || 180,
        marks: parseInt(marks) || 300,
      } as any);
      
      vibrate(50);
      router.back();
    } catch (e) {
      console.error(e);
      alert("Failed to save test.");
    }
    setSaving(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="max-w-container space-y-7 pb-24 lg:pb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => { vibrate(10); router.back(); }}
            className="w-10 h-10 flex items-center justify-center rounded-full glassy border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-neutral-900 dark:text-white shadow-sm"
          >
            <ChevronLeft size={20} />
          </motion.button>
          <h1 className="font-sora text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Test Uploader</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="hidden lg:flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-600/20 px-6 py-3 font-geist text-sm font-bold transition-all disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Saving..." : "Publish Test"}
        </motion.button>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Mobile Sticky Tabs */}
        <div className="lg:hidden flex justify-center w-full sticky top-[72px] z-40 -mt-4 mb-2 pointer-events-none">
          <div className="flex p-1 mx-auto w-full max-w-sm glassy rounded-full relative z-50 pointer-events-auto">
            {(["editor", "preview"] as const).map((t) => (
              <button key={t} onClick={() => { vibrate(10); setMobileTab(t); }} className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 font-geist text-sm font-bold transition-all group z-10">
                {mobileTab === t && <motion.span layoutId="mobileTabAdd" className="absolute inset-0 rounded-full bg-white dark:bg-white/15 shadow-md border border-black/5 dark:border-white/10 -z-10" />}
                <span className={`relative z-10 capitalize ${mobileTab === t ? "text-neutral-900 dark:text-white" : "bg-transparent text-neutral-500 dark:text-white/50 group-hover:text-neutral-900 dark:group-hover:text-white"}`}>{t}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Left Pane (Form) */}
        <div className={`lg:col-span-7 xl:col-span-8 space-y-6 w-full ${mobileTab !== "editor" ? "hidden lg:block" : ""}`}>
          <GlassCard className="p-6 md:p-8 space-y-6">
            <h2 className="font-sora font-semibold text-lg flex items-center gap-3 mb-4">
              <span className="w-7 h-7 text-sm rounded-full glassy border border-black/20 dark:border-white/20 text-neutral-900 dark:text-white flex items-center justify-center">1</span>
              Test Details & Link
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="mb-2 flex items-center gap-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">
                  <Link2 size={12} /> Google Form Link <span className="text-red-500">*</span>
                </p>
                <input value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder={"https://docs.google.com/forms/..."}
                  className={`w-full glassy border ${url && !urlOk ? "border-red-500" : "border-outline/30"} rounded-2xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors text-neutral-900 dark:text-white`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Test Title <span className="text-red-500">*</span></p>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mock Test 4: Rotational Motion" className="w-full glassy border border-outline/30 rounded-2xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30" />
              </div>
              <div>
                <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Chapter <span className="text-red-500">*</span></p>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Rotational Motion" className="w-full glassy border border-outline/30 rounded-2xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 md:p-8 space-y-6">
            <h2 className="font-sora font-semibold text-lg flex items-center gap-3 mb-4">
              <span className="w-7 h-7 text-sm rounded-full glassy border border-black/20 dark:border-white/20 text-neutral-900 dark:text-white flex items-center justify-center">2</span>
              Telemetry
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="mb-2 flex items-center gap-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">
                  <Clock size={12} /> Duration (mins) <span className="text-red-500">*</span>
                </p>
                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="180" className="w-full glassy border border-outline/30 rounded-2xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30" />
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">
                  <Target size={12} /> Total Marks <span className="text-red-500">*</span>
                </p>
                <input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="300" className="w-full glassy border border-outline/30 rounded-2xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 md:p-8 space-y-6">
            <h2 className="font-sora font-semibold text-lg flex items-center gap-3 mb-4">
              <span className="w-7 h-7 text-sm rounded-full glassy border border-black/20 dark:border-white/20 text-neutral-900 dark:text-white flex items-center justify-center">3</span>
              Tags & Taxonomy
            </h2>
            <div>
              <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Subject <span className="text-red-500">*</span></p>
              <div className="flex flex-wrap gap-2">{modules.map((m) => <Chip key={m.id} label={m.name} active={subject === m.name} onClick={() => setSubject(m.name)} />)}</div>
            </div>
            <div>
              <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Stream <span className="text-red-500">*</span></p>
              <div className="flex flex-wrap gap-2">{STREAMS.map((s) => <Chip key={s} label={s} active={streams.includes(s)} onClick={() => setStreams((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]))} />)}</div>
            </div>
          </GlassCard>

          {/* Bottom Form Publish Button */}
          <div className="pt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-600/20 py-4 font-bold text-sm transition-all disabled:opacity-50"
            >
              <Save size={18} /> {saving ? "Saving..." : "Publish Test"}
            </motion.button>
          </div>

        </div>

        {/* Right Pane (Live Preview) */}
        <div className={`w-full lg:col-span-5 xl:col-span-4 lg:sticky lg:top-32 flex flex-col items-center ${mobileTab !== "preview" ? "hidden lg:flex" : "mt-8"}`}>
          <p className="font-geist text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Student Preview
          </p>
          <div className="lg:scale-90 lg:origin-top w-full max-w-[380px]">
            <PhonePreviewFrame>
              <div className="space-y-4">
                <h2 className="font-sora font-black text-xl px-2 text-neutral-900 dark:text-white">Learn OS</h2>
                <LiveExamCard 
                  title={title} 
                  subject={subject} 
                  duration={duration} 
                  marks={marks}
                  stream={streams.join(" + ")} 
                />
              </div>
            </PhonePreviewFrame>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
