"use client";

import { motion } from "framer-motion";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { CheckCircle2, Inbox, Phone, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { col, deleteInquiry, logAudit, snapTo, updateInquiry } from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
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
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20 lg:pb-0">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-sora text-headline-xl">Leads</h1>
          <p className="mt-1 font-hanken text-body-md text-neutral-500 dark:text-white/60">
            Callback requests from the public site — your admissions pipeline.
          </p>
        </div>
        {newCount > 0 && (
          <span className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1.5 font-geist text-xs font-bold text-white shadow-lg shadow-purple-600/20">
            {newCount} new
          </span>
        )}
      </div>

      <div className="flex bg-black/5 dark:bg-white/5 backdrop-blur-3xl rounded-full p-1 border border-black/5 dark:border-white/10 shadow-xl w-full max-w-sm">
        {(["new", "contacted", "all"] as const).map((t) => (
          <button key={t} onClick={() => { vibrate(10); setTab(t); }} className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 font-geist text-sm font-bold transition-all hover:bg-black/10 dark:hover:bg-white/10 group">
            {tab === t && <motion.span layoutId="lead-tab" className="absolute inset-0 rounded-full bg-white dark:bg-white/20 shadow-md" />}
            <span className={`relative z-10 capitalize ${tab === t ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-white/50 group-hover:text-neutral-900 dark:group-hover:text-white"}`}>{t}</span>
          </button>
        ))}
      </div>

      <div className="w-full overflow-x-auto rounded-[2rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-3xl shadow-xl">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
            <tr className="font-geist text-xs uppercase tracking-widest text-neutral-500 dark:text-white/50">
              <th className="px-6 py-5 font-semibold">Name</th>
              <th className="px-6 py-5 font-semibold">Class</th>
              <th className="px-6 py-5 font-semibold">Message</th>
              <th className="px-6 py-5 font-semibold">Date</th>
              <th className="px-6 py-5 font-semibold">Contact</th>
              <th className="px-6 py-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {rows === null && [0, 1, 2].map((i) => (
              <tr key={i}>
                <td colSpan={6} className="px-6 py-4">
                  <div className="h-12 w-full animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
                </td>
              </tr>
            ))}
            {shown.map((r) => (
              <tr key={r.id} className={`transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${r.status === "contacted" ? "opacity-60" : ""}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-sora font-bold text-xs ${r.status === "new" ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-600/20" : "bg-black/10 dark:bg-white/10 text-neutral-500 dark:text-white/50"}`}>
                      {r.name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <p className="font-sora font-semibold text-neutral-900 dark:text-white">{r.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-black/10 dark:bg-white/10 px-3 py-1 font-geist text-xs font-semibold text-neutral-600 dark:text-white/70">{r.studentClass}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="max-w-[240px] truncate font-hanken text-sm text-neutral-600 dark:text-white/60" title={r.message || "No message"}>{r.message || "No message"}</p>
                </td>
                <td className="px-6 py-4 font-hanken text-sm text-neutral-600 dark:text-white/60">
                  {r.createdAt ? r.createdAt.toDate().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "…"}
                </td>
                <td className="px-6 py-4">
                  <a href={`tel:${r.phone}`} onClick={() => vibrate(10)} className="inline-flex h-9 items-center gap-2 rounded-full bg-black/5 dark:bg-white/5 px-4 font-geist text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/10 shadow-sm">
                    <Phone size={14} /> {r.phone}
                  </a>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => void flip(r)} aria-label="Toggle contacted" className="grid h-9 w-9 place-items-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/10 shadow-sm">
                      <CheckCircle2 size={16} className={r.status === "contacted" ? "text-purple-600 dark:text-purple-400" : "text-neutral-400 dark:text-white/40"} />
                    </button>
                    <button
                      onClick={() => { vibrate(15); void deleteInquiry(r.id); void logAudit(me, `Deleted lead: ${r.name}`); }}
                      aria-label="Delete"
                      className="grid h-9 w-9 place-items-center rounded-full bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows !== null && shown.length === 0 && (
          <div className="p-16 text-center">
            <Inbox size={48} className="mx-auto text-neutral-300 dark:text-white/20 mb-4" />
            <p className="font-sora font-semibold text-lg text-neutral-900 dark:text-white">No {tab === "all" ? "" : tab} leads</p>
            <p className="mt-2 font-hanken text-sm text-neutral-500 dark:text-white/50 max-w-xs mx-auto">
              Requests from the landing page's "Talk to us" form land here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
