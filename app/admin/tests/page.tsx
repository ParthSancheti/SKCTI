"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Trash2, Search, Filter, X, Pencil, Eye, EyeOff } from "lucide-react";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import GlassCard from "@/components/GlassCard";
import { col, deleteTest, logAudit, snapTo, updateTest } from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { TestDoc, Stream } from "@/lib/types";

const STREAMS: Stream[] = ["PCM", "PCB"];

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={() => { vibrate(10); onClick(); }}
      className={`rounded-full px-4 py-2 font-geist text-label-sm transition-all border ${active ? "bg-purple-600 dark:bg-white text-white dark:text-black border-transparent shadow-lg" : "glassy border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white"}`}
    >
      {label}
    </motion.button>
  );
}

export default function TestHub() {
  const router = useRouter();
  const { configLoaded, isAdmin, fbUser, modules } = useStore();
  const [tests, setTests] = useState<TestDoc[]>([]);
  const me = fbUser?.email ?? "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("All");
  const [filterSort, setFilterSort] = useState<"Newest" | "Oldest">("Newest");
  const [filterStream, setFilterStream] = useState<string>("All");

  useEffect(() => {
    if (!configLoaded || !isAdmin) return;
    const q = query(col.tests(), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => {
      setTests(s.docs.map((d) => snapTo<TestDoc>(d)));
    }, (e) => console.warn(e));
  }, [configLoaded, isAdmin]);

  const list = tests.filter((t) => {
    if (filterSubject !== "All" && t.subject !== filterSubject) return false;
    if (filterStream !== "All" && !t.streams.includes(filterStream as Stream)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    const ta = a.createdAt?.toMillis() ?? 0;
    const tb = b.createdAt?.toMillis() ?? 0;
    return filterSort === "Newest" ? tb - ta : ta - tb;
  });

  const togglePub = async (d: TestDoc) => {
    vibrate(10);
    try {
      await updateTest(d.id, { published: !d.published });
      await logAudit(me, `${d.published ? "Unpublished" : "Republished"} test "${d.title}"`);
    } catch { /* ignored */ }
  };

  const remove = async (d: TestDoc) => {
    vibrate(20);
    try {
      await deleteTest(d.id);
      await logAudit(me, `Deleted test "${d.title}"`);
    } catch { /* ignored */ }
  };

  const openEdit = (d: TestDoc) => {
    vibrate(10);
    router.push(`/admin/content/edit?id=${d.id}&mode=test`);
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 flex flex-col gap-6 pt-2 pb-12">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-sora text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Test Hub</h1>
          <p className="font-geist text-body-md text-neutral-500 dark:text-white/60 mt-1">
            Manage your Google Form quizzes and tests
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { vibrate(10); router.push('/admin/tests/add'); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-600/20 px-6 py-3.5 font-geist text-sm font-bold transition-all"
        >
          <Plus size={16} /> New Test
        </motion.button>
      </div>

      {/* Search & Filter Row */}
      <div className="flex w-full items-center gap-3">
        <div className="flex-1 min-w-0 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-white/40 z-10 pointer-events-none" />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tests..."
            className="w-full pl-11 pr-10 py-3 glassy rounded-full border border-black/10 dark:border-white/10 font-geist text-body-md text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/40 outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors z-10"><X size={16} /></button>
          )}
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

      {filtersOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
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
              <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Stream</p>
              <div className="flex flex-wrap gap-2">
                {["All", ...STREAMS].map(t => (
                  <Chip key={t} label={t} active={filterStream === t} onClick={() => setFilterStream(t)} />
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <div className="space-y-3">
        {list.length === 0 && configLoaded ? (
          <GlassCard className="p-16 text-center w-full block box-border">
            <ClipboardList size={48} className="mx-auto text-neutral-300 dark:text-white/20 mb-4" />
            <h2 className="font-sora font-semibold text-xl text-neutral-900 dark:text-white">No tests found</h2>
            <p className="mt-2 font-geist text-sm text-neutral-500 dark:text-white/50 max-w-xs mx-auto">
              Try adjusting your search or filters.
            </p>
          </GlassCard>
        ) : (
          list.map((t) => (
            <GlassCard key={t.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 w-full block box-border ${t.published ? "" : "opacity-50"}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-geist text-body-md font-semibold text-neutral-900 dark:text-white">{t.title}</p>
                <p className="font-geist text-sm text-neutral-500 dark:text-white/50 mt-1">
                  {t.subject} · {t.streams.join("+")} · {t.kind} · {t.durationMin} min
                  {!t.published && " · Draft"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => openEdit(t)} aria-label="Edit" title="Edit" className="w-9 h-9 flex items-center justify-center rounded-full glassy hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-purple-600 dark:text-purple-400">
                  <Pencil size={14} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => void togglePub(t)} aria-label="Toggle Publish" title={t.published ? "Unpublish" : "Publish"} className="w-9 h-9 flex items-center justify-center rounded-full glassy hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  {t.published ? <Eye size={14} className="text-purple-600 dark:text-purple-400" /> : <EyeOff size={14} className="text-neutral-500 dark:text-white/50" />}
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => void remove(t)} aria-label="Delete" title="Delete" className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
