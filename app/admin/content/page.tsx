"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import {
  ClipboardList, Eye, EyeOff, FileText, Filter, Pencil, PlayCircle, Plus, Search, Trash2, X,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import { LiveChapterCard } from "@/components/PhonePreviewFrame";
import {
  col, createContent, createTest, createVideo, deleteContent, deleteTest, deleteVideo,
  logAudit, snapTo, updateContent, updateTest, updateVideo,
} from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { ContentDoc, Stream, TestDoc, VideoDoc, Weightage } from "@/lib/types";
import { drivePreviewUrl, extractDriveId, extractYouTubeId, formEmbedUrl, youtubeEmbedUrl } from "@/lib/types";

type Mode = "pdf" | "test" | "video";
type AnyDoc = ContentDoc | TestDoc | VideoDoc;

const STREAMS: Stream[] = ["PCM", "PCB", "PCMB"];
const TYPES = ["Notes PDF", "DPP", "Formula Sheet", "PYQ Pack"];
const WEIGHTS: Weightage[] = ["High", "Medium", "Low"];

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={() => { vibrate(10); onClick(); }}
      className={`rounded-full px-4 py-2 font-geist text-label-sm transition-all border ${active ? "bg-purple-600 dark:bg-white text-white dark:text-black border-transparent shadow-lg" : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white"}`}
    >
      {label}
    </motion.button>
  );
}

const modeOf = (d: AnyDoc): Mode => ("driveId" in d ? "pdf" : "youtubeId" in d ? "video" : "test");

export default function ContentHub() {
  const { fbUser, configLoaded, isAdmin, modules } = useStore();
  const router = useRouter();
  const me = fbUser?.email ?? "admin";

  const [tab, setTab] = useState<Mode>("pdf");
  const [pdfs, setPdfs] = useState<ContentDoc[]>([]);
  const [tests, setTests] = useState<TestDoc[]>([]);
  const [vids, setVids] = useState<VideoDoc[]>([]);

  const [viewing, setViewing] = useState<AnyDoc | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* Advanced Filters State */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("All");
  const [filterSort, setFilterSort] = useState<"Newest" | "Oldest">("Newest");
  const [filterType, setFilterType] = useState<string>("All");

  useEffect(() => {
    if (!configLoaded || !isAdmin) return;
    const u1 = onSnapshot(query(col.content(), orderBy("createdAt", "desc")), (s) => setPdfs(s.docs.map((d) => snapTo<ContentDoc>(d))), (e) => console.warn(e));
    const u2 = onSnapshot(query(col.tests(), orderBy("createdAt", "desc")), (s) => setTests(s.docs.map((d) => snapTo<TestDoc>(d))), (e) => console.warn(e));
    const u3 = onSnapshot(query(col.videos(), orderBy("createdAt", "desc")), (s) => setVids(s.docs.map((d) => snapTo<VideoDoc>(d))), (e) => console.warn(e));
    return () => { u1(); u2(); u3(); };
  }, [configLoaded, isAdmin]);

  const openEdit = (d: AnyDoc) => {
    vibrate(10);
    router.push(`/admin/content/edit?id=${d.id}&mode=${modeOf(d)}`);
  };
  const togglePub = async (d: AnyDoc) => {
    vibrate(10);
    try {
      const m = modeOf(d);
      if (m === "pdf") await updateContent(d.id, { published: !d.published });
      else if (m === "video") await updateVideo(d.id, { published: !d.published });
      else await updateTest(d.id, { published: !d.published });
      await logAudit(me, `${d.published ? "Unpublished" : "Republished"} "${d.title}"`);
    } catch { /* surfaced via list staying unchanged */ }
  };

  const remove = async (d: AnyDoc) => {
    vibrate(20);
    try {
      const m = modeOf(d);
      if (m === "pdf") await deleteContent(d.id);
      else if (m === "video") await deleteVideo(d.id);
      else await deleteTest(d.id);
      await logAudit(me, `Deleted "${d.title}"`);
    } catch { /* noop */ }
  };

  const list: AnyDoc[] = useMemo(() => {
    let raw = [...pdfs, ...vids, ...tests];
    if (filterSubject !== "All") raw = raw.filter(d => d.subject === filterSubject);
    if (filterType !== "All") raw = raw.filter(d => {
      if (filterType === "Video") return modeOf(d) === "video";
      if (filterType === "Test") return modeOf(d) === "test";
      return modeOf(d) === "pdf" && (d as ContentDoc).type === filterType;
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      raw = raw.filter(d => d.title.toLowerCase().includes(q) || d.subject.toLowerCase().includes(q));
    }
    
    return raw.sort((a, b) => {
      const ta = a.createdAt?.toMillis() ?? 0;
      const tb = b.createdAt?.toMillis() ?? 0;
      return filterSort === "Newest" ? tb - ta : ta - tb;
    });
  }, [pdfs, vids, tests, filterSubject, filterType, filterSort, searchQuery]);

  const previewSrc = (d: AnyDoc) => {
    const m = modeOf(d);
    if (m === "pdf") return drivePreviewUrl((d as ContentDoc).driveId);
    if (m === "video") return youtubeEmbedUrl((d as VideoDoc).youtubeId);
    return formEmbedUrl((d as TestDoc).formUrl);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pt-2 pb-12">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-sora text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Content Hub</h1>
          <p className="mt-1 font-geist text-body-md text-neutral-500 dark:text-white/60">Your Drive, Forms & YouTube — organised, tagged, live.</p>
        </div>
        
        {/* Add Content Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { vibrate(10); router.push("/admin/content/add"); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-600/20 px-6 py-3.5 font-geist text-sm font-bold transition-all"
        >
          <Plus size={17} /> Add content
        </motion.button>
      </div>

      {/* Search & Filter Row */}
      <div className="flex w-full items-center gap-3">
        <div className="flex-1 flex items-center gap-3 w-full rounded-full border border-outline/30 glassy px-4 py-3 focus-within:border-primary transition-colors">
          <Search size={18} className="text-neutral-500 dark:text-white/50" />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search content..."
            className="bg-transparent border-none outline-none font-geist text-body-md text-neutral-900 dark:text-white w-full placeholder:text-neutral-500 dark:placeholder:text-white/50"
          />
        </div>
        
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => { vibrate(10); setFiltersOpen(!filtersOpen); }}
          className={`flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 font-geist text-sm font-bold transition-all shadow-lg shrink-0 ${
            filtersOpen 
              ? "bg-purple-600 text-white border-transparent" 
              : "glassy border-black/10 dark:border-white/10 text-neutral-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          <Filter size={16} /> <span>Advanced Filters</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-4 md:p-5 w-full block box-border mb-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Subject</p>
                <div className="flex flex-wrap gap-2">
                  {["All", ...modules.map(m => m.name)].map(s => (
                    <Chip key={s} label={s} active={filterSubject === s} onClick={() => setFilterSubject(s)} />
                  ))}
                </div>
              </div>
              
              <div>
                <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Sort by Date</p>
                <div className="flex flex-wrap gap-2">
                  {["Newest", "Oldest"].map(s => (
                    <Chip key={s} label={s} active={filterSort === s} onClick={() => setFilterSort(s as any)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Content Type</p>
                <div className="flex flex-wrap gap-2">
                  {["All", "Video", "Test", ...TYPES].map(t => (
                    <Chip key={t} label={t} active={filterType === t} onClick={() => setFilterType(t)} />
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* library */}
      <div className="space-y-3">
        {list.length === 0 && (
          <GlassCard className="p-12 text-center">
            <p className="font-sora font-semibold">Nothing here yet</p>
            <p className="mt-1 font-hanken text-body-md text-on-surface/50">Hit &quot;Add content&quot; — it&apos;s live on every student phone the second you save.</p>
          </GlassCard>
        )}
        {list.map((d) => (
          <GlassCard key={d.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 w-full block box-border ${d.published ? "" : "opacity-50"}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-geist text-body-md font-semibold text-neutral-900 dark:text-white">{d.title}</p>
              <p className="font-geist text-sm text-neutral-500 dark:text-white/50 mt-1">
                {d.subject} · {(d.streams || []).join("+")}
                {"weightage" in d ? ` · ${(d as ContentDoc).weightage} · ${(d as ContentDoc).type}` : "kind" in d ? ` · ${(d as TestDoc).kind} · ${(d as TestDoc).durationMin} min` : " · Video"}
                {!d.published && " · Hidden"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { vibrate(10); setViewing(d); }} aria-label="View" title="Preview" className="w-9 h-9 flex items-center justify-center rounded-full glassy hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-neutral-600 dark:text-neutral-400">
                <PlayCircle size={14} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => openEdit(d)} aria-label="Edit" title="Edit" className="w-9 h-9 flex items-center justify-center rounded-full glassy hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-purple-600 dark:text-purple-400">
                <Pencil size={14} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => void togglePub(d)} aria-label="Toggle Publish" title={d.published ? "Unpublish" : "Publish"} className="w-9 h-9 flex items-center justify-center rounded-full glassy hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                {d.published ? <Eye size={14} className="text-purple-600 dark:text-purple-400" /> : <EyeOff size={14} className="text-neutral-500 dark:text-white/50" />}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => void remove(d)} aria-label="Delete" title="Delete" className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                <Trash2 size={14} />
              </motion.button>
            </div>
          </GlassCard>
        ))}
      </div>


      {/* ————— view modal ————— */}
      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            onClick={() => setViewing(null)}
          >
            <motion.div
              initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 dark:bg-black/95 backdrop-blur-lg border border-black/10 dark:border-white/10 flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2.5rem] shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <p className="truncate font-sora font-semibold text-neutral-900 dark:text-white text-lg">{viewing.title}</p>
                <button onClick={() => setViewing(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white transition-colors border border-black/10 dark:border-white/10"><X size={16} /></button>
              </div>
              <iframe src={previewSrc(viewing)} className="w-full flex-1 bg-white dark:bg-[#0A0A0A] rounded-b-[2.5rem]" allow="autoplay; encrypted-media" allowFullScreen title={viewing.title} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
