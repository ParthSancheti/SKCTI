"use client";

import { motion } from "framer-motion";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { CheckCircle2, Inbox, Phone, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { col, deleteInquiry, logAudit, snapTo, updateInquiry } from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import GlassCard from "@/components/GlassCard";
import type { InquiryDoc } from "@/lib/types";

export default function Leads() {
  const { fbUser, configLoaded, isAdmin } = useStore();
  const me = fbUser?.email ?? "admin";
  const [rows, setRows] = useState<InquiryDoc[] | null>(null);
  const [tab, setTab] = useState<"new" | "contacted" | "all">("new");

  useEffect(() => {
    if (!configLoaded || !isAdmin) return;
    const q = query(col.inquiries(), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setRows(s.docs.map((d) => snapTo<InquiryDoc>(d))), (e) => { console.warn(e); setRows([]); });
  }, [configLoaded, isAdmin]);

  const shown = useMemo(() => {
    const list = rows ?? [];
    if (tab === "all") return list;
    return list.filter((r) => r.status === tab);
  }, [rows, tab]);

  const newCount = (rows ?? []).filter((r) => r.status === "new").length;

  const flip = async (r: InquiryDoc) => {
    vibrate(12);
    const status = r.status === "new" ? "contacted" : "new";
    await updateInquiry(r.id, { status });
    if (status === "contacted") await logAudit(me, `Marked lead contacted: ${r.name}`);
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 flex flex-col gap-6 pt-2 pb-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-sora text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Leads</h1>
          <p className="mt-1 font-geist text-body-md text-neutral-500 dark:text-white/60">
            Callback requests from the public site — your admissions pipeline.
          </p>
        </div>
        {newCount > 0 && (
          <span className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1.5 font-geist text-xs font-bold text-white shadow-lg">
            {newCount} new
          </span>
        )}
      </div>

      <div className="flex justify-center w-full">
        <div className="flex p-1 mx-auto w-full max-w-sm glassy rounded-full relative">
          {(["new", "contacted", "all"] as const).map((t) => (
            <button key={t} onClick={() => { vibrate(10); setTab(t); }} className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 font-geist text-sm font-bold transition-all group z-10">
              {tab === t && <motion.span layoutId="lead-tab" className="absolute inset-0 rounded-full bg-white dark:bg-white/15 shadow-md border border-black/5 dark:border-white/10 -z-10" />}
              <span className={`relative z-10 capitalize ${tab === t ? "text-neutral-900 dark:text-white" : "bg-transparent text-neutral-500 dark:text-white/50 group-hover:text-neutral-900 dark:group-hover:text-white"}`}>{t}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rows === null && [0, 1, 2].map((i) => (
          <GlassCard key={i} className="p-4 md:p-5 w-full block box-border animate-pulse">
            <div className="h-12 w-full rounded-xl bg-black/5 dark:bg-white/5" />
          </GlassCard>
        ))}
        {rows !== null && shown.length === 0 && (
          <GlassCard className="p-16 text-center w-full block box-border">
            <Inbox size={48} className="mx-auto text-neutral-300 dark:text-white/20 mb-4" />
            <h2 className="font-sora font-semibold text-xl text-neutral-900 dark:text-white">No {tab === "all" ? "" : tab} leads</h2>
            <p className="mt-2 font-geist text-sm text-neutral-500 dark:text-white/50 max-w-xs mx-auto">
              Requests from the landing page's "Talk to us" form land here in real time.
            </p>
          </GlassCard>
        )}
        {shown.map((r) => (
          <GlassCard key={r.id} className={`p-4 md:p-5 w-full flex flex-col md:flex-row md:items-center justify-between gap-4 box-border ${r.status === "contacted" ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-sora font-bold text-lg ${r.status === "new" ? "bg-purple-600/20 text-purple-600 dark:bg-purple-400/20 dark:text-purple-400" : "bg-black/10 dark:bg-white/10 text-neutral-500 dark:text-white/40"}`}>
                {r.name[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-geist text-body-md font-semibold text-neutral-900 dark:text-white truncate">{r.name}</p>
                  <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-0.5 font-geist text-[10px] font-bold text-neutral-600 dark:text-white/70 tracking-wider uppercase">{r.studentClass}</span>
                </div>
                <p className="truncate font-geist text-sm text-neutral-500 dark:text-white/50" title={r.message || "No message"}>{r.message || "No message"}</p>
                <p className="font-geist text-xs text-neutral-400 dark:text-white/30 mt-1">
                  {r.createdAt ? r.createdAt.toDate().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "…"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 shrink-0">
              <a href={`tel:${r.phone}`} onClick={() => vibrate(10)} className="inline-flex h-10 items-center gap-2 rounded-full glassy px-5 font-geist text-sm font-bold text-purple-600 dark:text-purple-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shadow-sm">
                <Phone size={16} /> {r.phone}
              </a>
              <button onClick={() => void flip(r)} aria-label="Toggle contacted" className={`grid h-10 w-10 place-items-center rounded-full transition-colors shadow-sm ${r.status === "contacted" ? "bg-purple-600 text-white" : "glassy text-neutral-500 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10"}`}>
                <CheckCircle2 size={18} />
              </button>
              <button
                onClick={() => { vibrate(15); void deleteInquiry(r.id); void logAudit(me, `Deleted lead: ${r.name}`); }}
                aria-label="Delete"
                className="grid h-10 w-10 place-items-center rounded-full bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
