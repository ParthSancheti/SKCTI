"use client";

import { motion } from "framer-motion";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { CheckCircle2, Inbox, Phone, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { col, deleteInquiry, logAudit, snapTo, updateInquiry } from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { InquiryDoc } from "@/lib/types";

export default function Leads() {
  const { fbUser } = useStore();
  const me = fbUser?.email ?? "admin";
  const [rows, setRows] = useState<InquiryDoc[] | null>(null);
  const [tab, setTab] = useState<"new" | "contacted" | "all">("new");

  useEffect(() => {
    const q = query(col.inquiries(), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setRows(s.docs.map((d) => snapTo<InquiryDoc>(d))), () => setRows([]));
  }, []);

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
    <div className="max-w-container space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-sora text-headline-xl">Leads</h1>
          <p className="mt-1 font-hanken text-body-md text-on-surface/60">
            Callback requests from the public site — your admissions pipeline.
          </p>
        </div>
        {newCount > 0 && (
          <span className="rounded-full bg-primary-container px-4 py-1.5 font-geist text-label-sm font-bold text-white shadow-glow-primary">
            {newCount} new
          </span>
        )}
      </div>

      <div className="glassy flex w-full max-w-sm rounded-full p-1.5">
        {(["new", "contacted", "all"] as const).map((t) => (
          <button key={t} onClick={() => { vibrate(10); setTab(t); }} className="relative flex-1 rounded-full py-2.5 font-geist text-label-md capitalize">
            {tab === t && <motion.span layoutId="lead-tab" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-full bg-primary-container" />}
            <span className={`relative z-10 ${tab === t ? "text-white" : "text-on-surface/60"}`}>{t}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {rows === null && [0, 1, 2].map((i) => <div key={i} className="glassy h-24 animate-pulse rounded-glass" />)}
        {rows !== null && shown.length === 0 && (
          <GlassCard className="p-12 text-center">
            <Inbox size={36} className="mx-auto text-on-surface/30" />
            <p className="mt-3 font-sora font-semibold">No {tab === "all" ? "" : tab} leads</p>
            <p className="mt-1 font-hanken text-body-md text-on-surface/50">
              Requests from the landing page&apos;s &quot;Talk to us&quot; form land here in real time.
            </p>
          </GlassCard>
        )}
        {shown.map((r) => (
          <GlassCard key={r.id} className={`flex items-center gap-4 p-5 ${r.status === "contacted" ? "opacity-60" : ""}`}>
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-sora font-bold ${r.status === "new" ? "bg-primary-container text-white" : "glassy text-on-surface/50"}`}>
              {r.name[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-sora font-semibold">{r.name}</p>
                <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 font-geist text-[10px] text-on-surface/60">{r.studentClass}</span>
              </div>
              <p className="truncate font-hanken text-body-sm text-on-surface/50">
                {r.message || "No message"} · {r.createdAt ? r.createdAt.toDate().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "…"}
              </p>
            </div>
            <a href={`tel:${r.phone}`} onClick={() => vibrate(10)} className="glassy flex h-10 shrink-0 items-center gap-2 rounded-full px-4 font-geist text-label-sm font-semibold text-primary">
              <Phone size={14} /> {r.phone}
            </a>
            <button onClick={() => void flip(r)} aria-label="Toggle contacted" className="glassy grid h-10 w-10 shrink-0 place-items-center rounded-full">
              <CheckCircle2 size={16} className={r.status === "contacted" ? "text-primary" : "text-on-surface/40"} />
            </button>
            <button
              onClick={() => { vibrate(15); void deleteInquiry(r.id); void logAudit(me, `Deleted lead: ${r.name}`); }}
              aria-label="Delete"
              className="glassy grid h-10 w-10 shrink-0 place-items-center rounded-full"
            >
              <Trash2 size={15} className="text-error" />
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
