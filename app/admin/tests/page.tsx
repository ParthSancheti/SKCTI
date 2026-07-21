"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Trash2, Search, Filter, X } from "lucide-react";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import GlassCard from "@/components/GlassCard";
import { col, deleteTest, logAudit, snapTo, updateTest } from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { TestDoc } from "@/lib/types";

export default function TestHub() {
  const router = useRouter();
  const { configLoaded, isAdmin, fbUser } = useStore();
  const [tests, setTests] = useState<TestDoc[]>([]);
  const me = fbUser?.email ?? "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("All");

  useEffect(() => {
    if (!configLoaded || !isAdmin) return;
    const q = query(col.tests(), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => {
      setTests(s.docs.map((d) => snapTo<TestDoc>(d)));
    }, (e) => console.warn(e));
  }, [configLoaded, isAdmin]);

  const list = tests.filter((t) => {
    if (filterSubject !== "All" && t.subject !== filterSubject) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q)) return false;
    }
    return true;
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
    <div className="max-w-container space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora text-headline-xl">Test Hub</h1>
          <p className="font-hanken text-body-md text-neutral-500 dark:text-white/60 mt-1">
            Manage your Google Form quizzes and tests
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { vibrate(10); router.push('/admin/tests/add'); }}
          className="flex items-center justify-center gap-2 rounded-full glassy hover:brightness-110 px-6 py-3 font-geist text-sm font-bold text-black dark:text-white transition-all shadow-lg"
        >
          <Plus size={16} /> New Test
        </motion.button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tests..."
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors backdrop-blur-md text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"><X size={16} /></button>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border transition-colors font-geist text-sm font-bold ${filtersOpen || filterSubject !== "All" ? "bg-purple-600 border-purple-600 text-white" : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-black/10 dark:hover:bg-white/10"}`}
        >
          <Filter size={16} /> Filters {(filterSubject !== "All") && "•"}
        </button>
      </div>

      {filtersOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <GlassCard className="p-5 flex flex-wrap items-center gap-4 border border-black/10 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Subject:</span>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 font-geist text-sm text-neutral-900 dark:text-white outline-none focus:border-purple-500 transition-colors"
              >
                <option value="All" className="text-black">All Subjects</option>
                <option value="Physics" className="text-black">Physics</option>
                <option value="Chemistry" className="text-black">Chemistry</option>
                <option value="Math" className="text-black">Math</option>
                <option value="Biology" className="text-black">Biology</option>
              </select>
            </div>
            {filterSubject !== "All" && (
              <button onClick={() => setFilterSubject("All")} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors">Clear</button>
            )}
          </GlassCard>
        </motion.div>
      )}

      <div className="space-y-3">
        {list.length === 0 && configLoaded ? (
          <GlassCard className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl glassy flex items-center justify-center mb-6">
              <ClipboardList size={32} className="text-black/40 dark:text-white/40" />
            </div>
            <h2 className="font-sora text-title-md text-black dark:text-white">No tests found</h2>
            <p className="font-geist text-body-sm text-black/50 dark:text-white/50 mt-2 max-w-sm">
              Try adjusting your search or filters.
            </p>
          </GlassCard>
        ) : (
          list.map((t) => (
            <GlassCard key={t.id} className={`flex items-center gap-3 p-5 glassy ${t.published ? "" : "opacity-50"}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sora font-semibold text-black dark:text-white">{t.title}</p>
                <p className="font-geist text-label-sm text-black/60 dark:text-white/60 mt-1">
                  {t.subject} · {t.streams.join("+")} · {t.kind} · {t.durationMin} min
                  {!t.published && " · Draft"}
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => openEdit(t)} className="glassy hover:brightness-110 px-4 py-2 shrink-0 rounded-xl font-geist text-xs font-bold text-black dark:text-white transition-all">Edit</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => void togglePub(t)} className="glassy hover:brightness-110 px-4 py-2 shrink-0 rounded-xl font-geist text-xs font-bold text-black dark:text-white transition-all">
                {t.published ? "Draft" : "Publish"}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => void remove(t)} aria-label="Delete" className="glassy hover:bg-red-500/20 grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors">
                <Trash2 size={16} className="text-black dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors" />
              </motion.button>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
