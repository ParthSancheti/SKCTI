"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ClipboardList, FileText, Link2, PlayCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import PhonePreviewFrame, { LiveChapterCard } from "@/components/PhonePreviewFrame";
import { vibrate, useStore } from "@/lib/store";
import { createContent, createTest, createVideo } from "@/lib/db";
import { extractDriveId, extractYouTubeId, Stream, Weightage } from "@/lib/types";

const STREAMS: Stream[] = ["PCM", "PCB"];
const SUBJECTS = ["Physics", "Chemistry", "Math", "Biology"];
const TYPES = ["Notes PDF", "DPP", "Formula Sheet", "PYQ Pack"];
const WEIGHTS: Weightage[] = ["High", "Medium", "Low"];

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={() => { vibrate(10); onClick(); }}
      className={`rounded-full px-4 py-2 font-geist text-xs font-bold transition-all border ${
        active 
          ? "bg-purple-600 dark:bg-white text-white dark:text-black border-transparent shadow-lg" 
          : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-black/10 dark:hover:bg-white/10"
      }`}
    >
      {label}
    </motion.button>
  );
}

export default function AddContentStudio() {
  const router = useRouter();
  const { fbUser } = useStore();
  
  const [mode, setMode] = useState<"pdf" | "test" | "video">("pdf");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [weight, setWeight] = useState<Weightage>("High");
  const [testLink, setTestLink] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [rewardCoins, setRewardCoins] = useState<number>(25);
  const [saving, setSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  const urlOk = mode === "pdf" ? !!extractDriveId(url) : mode === "video" ? !!extractYouTubeId(url) : url.includes("docs.google.com/forms");

  const handleSave = async () => {
    if (!title || !topic || streams.length === 0 || !subject || !url || !urlOk) {
      alert("Please fill all required fields correctly.");
      return;
    }
    setSaving(true);
    try {
      if (mode === "pdf") {
        await createContent({
          title, topic, streams, subject, type: type || "Notes PDF", weightage: weight,
          driveId: extractDriveId(url)!, driveUrl: url, published: true, uploaderEmail: fbUser?.email ?? "admin",
          testLink: testLink || undefined, youtubeUrl: youtubeUrl || undefined, rewardCoins
        } as any);
      } else if (mode === "video") {
        await createVideo({
          title, topic, streams, subject, youtubeId: extractYouTubeId(url)!, youtubeUrl: url,
          published: true
        } as any);
      } else {
        await createTest({
          title, topic, streams, subject, formUrl: url,
          published: true, uploaderEmail: fbUser?.email ?? "admin", kind: "Chapter Test", durationMin: 60, rewardCoins
        } as any);
      }
      vibrate(50);
      router.back();
    } catch (e) {
      console.error(e);
      alert("Failed to save content.");
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
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-neutral-900 dark:text-white"
          >
            <ChevronLeft size={20} />
          </motion.button>
          <h1 className="font-sora text-headline-xl">New Content Studio</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="hidden lg:flex items-center gap-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 px-6 py-3 font-geist text-sm font-bold text-neutral-900 dark:text-white transition-all shadow-lg disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Saving..." : "Publish Content"}
        </motion.button>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Mobile Sticky Tabs */}
        <div className="lg:hidden flex justify-center w-full sticky top-[72px] z-40 -mt-4 mb-2">
          <div className="flex p-1 mx-auto w-full max-w-sm bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-full relative z-50 pointer-events-auto">
            {(["editor", "preview"] as const).map((t) => (
              <button key={t} onClick={() => { vibrate(10); setMobileTab(t); }} className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 font-geist text-sm font-bold transition-all group">
                {mobileTab === t && <motion.span layoutId="mobileTabAdd" className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/15 shadow-lg" />}
                <span className={`relative z-10 capitalize ${mobileTab === t ? "text-neutral-900 dark:text-white" : "bg-transparent text-neutral-500 dark:text-white/50 group-hover:text-neutral-900 dark:group-hover:text-white"}`}>{t}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Left Pane (Form) */}
        <div className={`lg:col-span-7 xl:col-span-8 space-y-6 w-full ${mobileTab !== "editor" ? "hidden lg:block" : ""}`}>
          <GlassCard className="p-6 md:p-8 bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 space-y-6">
            <h2 className="font-sora font-semibold text-lg flex items-center gap-3 mb-4">
              <span className="w-7 h-7 text-sm rounded-full bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-neutral-900 dark:text-white flex items-center justify-center">1</span>
              Details & Link
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="mb-2 flex items-center gap-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">
                  <Link2 size={12} /> {mode === "pdf" ? "Google Drive link" : mode === "video" ? "YouTube link" : "Google Form link"} <span className="text-red-500">*</span>
                </p>
                <input value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder={mode === "pdf" ? "https://drive.google.com/..." : mode === "video" ? "https://youtu.be/..." : "https://docs.google.com/forms/..."}
                  className={`w-full bg-black/5 dark:bg-white/5 border ${url && !urlOk ? "border-red-500" : "border-black/10 dark:border-white/10"} rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors backdrop-blur-md text-neutral-900 dark:text-white`} />
              </div>
              
              {mode === "pdf" && (
                <>
                  <div>
                    <p className="mb-2 flex items-center gap-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">
                      <Link2 size={12} /> Test Link (Optional)
                    </p>
                    <input value={testLink} onChange={(e) => setTestLink(e.target.value)} placeholder="https://docs.google.com/forms/..." className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors backdrop-blur-md text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30" />
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">
                      <Link2 size={12} /> YouTube Link (Optional)
                    </p>
                    <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtu.be/..." className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors backdrop-blur-md text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30" />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Title <span className="text-red-500">*</span></p>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rotational Motion Notes" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors backdrop-blur-md text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30" />
              </div>
              <div>
                <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Chapter <span className="text-red-500">*</span></p>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Rotational Motion" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors backdrop-blur-md text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 md:p-8 bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 space-y-6">
            <h2 className="font-sora font-semibold text-lg flex items-center gap-3 mb-4">
              <span className="w-7 h-7 text-sm rounded-full bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-neutral-900 dark:text-white flex items-center justify-center">2</span>
              Tags & Taxonomy
            </h2>
            <div>
              <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Subject</p>
              <div className="flex flex-wrap gap-2">{SUBJECTS.map((s) => <Chip key={s} label={s} active={subject === s} onClick={() => setSubject(s)} />)}</div>
            </div>
            <div>
              <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Stream</p>
              <div className="flex flex-wrap gap-2">{STREAMS.map((s) => <Chip key={s} label={s} active={streams.includes(s)} onClick={() => setStreams((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]))} />)}</div>
            </div>
            
            {mode === "pdf" && (
              <>
                <div>
                  <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Document Type</p>
                  <div className="flex flex-wrap gap-2">{TYPES.map((t) => <Chip key={t} label={t} active={type === t} onClick={() => setType(t)} />)}</div>
                </div>
                <div>
                  <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Weightage</p>
                  <div className="flex flex-wrap gap-2">{WEIGHTS.map((w) => <Chip key={w} label={w} active={weight === w} onClick={() => setWeight(w)} />)}</div>
                </div>
              </>
            )}

            {mode !== "video" && (
              <div>
                <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Reward Coins (on Completion)</p>
                <input 
                  type="number" 
                  value={rewardCoins} 
                  onChange={(e) => setRewardCoins(parseInt(e.target.value) || 0)} 
                  className="w-full max-w-[150px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors backdrop-blur-md text-neutral-900 dark:text-white" 
                />
              </div>
            )}
          </GlassCard>

          {/* Bottom Form Publish Button */}
          <div className="pt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white shadow-lg shadow-black/20 py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
            >
              <Save size={18} /> {saving ? "Saving..." : "Publish Content"}
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
                <LiveChapterCard 
                  title={title} 
                  subject={subject} 
                  weightage={weight} 
                  stream={streams.join(" + ")} 
                />
                <div className="opacity-40 pointer-events-none">
                  <LiveChapterCard title="Kinematics Notes" subject="Physics" weightage="Medium" stream="PCM" />
                </div>
              </div>
            </PhonePreviewFrame>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
