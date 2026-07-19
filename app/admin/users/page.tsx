"use client";

import { motion } from "framer-motion";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import UserDrawer from "@/components/UserDrawer";
import { col, snapTo } from "@/lib/db";
import type { Stream, UserDoc } from "@/lib/types";

export default function UserMatrix() {
  const [rows, setRows] = useState<UserDoc[] | null>(null);
  const [sel, setSel] = useState<UserDoc | null>(null);
  const [q, setQ] = useState("");
  const [streamFilter, setStreamFilter] = useState<Stream | "All">("All");

  useEffect(() => {
    const qq = query(col.users(), orderBy("coins", "desc"));
    return onSnapshot(qq, (s) => setRows(s.docs.map((d) => snapTo<UserDoc>(d))), () => setRows([]));
  }, []);

  const shown = useMemo(() => {
    let list = rows ?? [];
    if (streamFilter !== "All") list = list.filter((r) => r.stream === streamFilter);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter((r) => `${r.name} ${r.email} ${r.phone}`.toLowerCase().includes(t));
    }
    return list;
  }, [rows, q, streamFilter]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8 max-w-container">
      <div>
        <h1 className="font-sora text-headline-xl">User Matrix</h1>
        <p className="font-hanken text-body-md text-on-surface/60 mt-1">{rows?.length ?? "…"} students · tap a row for full telemetry</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="glassy rounded-full flex-1 flex items-center gap-3 px-5">
          <Search size={16} className="text-primary shrink-0" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…" className="bg-transparent outline-none w-full py-3 font-hanken text-body-md placeholder:text-on-surface/30" />
        </div>
        <div className="glassy rounded-full p-1.5 flex shrink-0">
          {(["All", "PCM", "PCB"] as const).map((s) => (
            <button key={s} onClick={() => setStreamFilter(s)} className={`px-5 py-2 rounded-full font-geist text-label-sm ${streamFilter === s ? "bg-primary-container text-white" : "text-on-surface/60"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="grid grid-cols-[1fr_70px_70px_70px_90px] max-md:grid-cols-[1fr_70px_70px] gap-3 px-6 py-4 border-b font-geist text-label-sm uppercase text-on-surface-variant" style={{ borderColor: "var(--glass-stroke)" }}>
          <span>Student</span><span>Stream</span><span>Coins</span><span className="max-md:hidden">Streak</span><span className="max-md:hidden">Active</span>
        </div>
        {rows === null && <p className="p-6 font-hanken text-body-md text-on-surface/40">Loading…</p>}
        {rows !== null && shown.length === 0 && (
          <div className="p-10 text-center">
            <Users size={20} className="mx-auto text-primary mb-2" />
            <p className="font-hanken text-body-md text-on-surface/40">{rows.length === 0 ? "No signups yet — share the app link!" : "No matches."}</p>
          </div>
        )}
        {shown.map((r, i) => (
          <motion.button
            key={r.uid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(i * 0.03, 0.4) }}
            onClick={() => setSel(r)}
            className="w-full grid grid-cols-[1fr_70px_70px_70px_90px] max-md:grid-cols-[1fr_70px_70px] gap-3 px-6 py-4 items-center text-left hover:bg-glass/5 border-b last:border-0"
            style={{ borderColor: "var(--glass-stroke)" }}
          >
            <div className="min-w-0">
              <p className="font-sora font-semibold text-sm truncate">{r.name}</p>
              <p className="font-geist text-label-sm text-on-surface/40 truncate">{r.grade} · {r.email}</p>
            </div>
            <span className="font-geist text-label-sm glassy rounded-full px-2 py-1 text-center text-primary">{r.stream}</span>
            <span className="font-geist text-label-md tabular-nums">{r.coins}</span>
            <span className="font-geist text-label-md tabular-nums max-md:hidden">{r.streak}d</span>
            <span className={`font-geist text-label-sm max-md:hidden ${r.lastActiveDate === today ? "text-primary" : "text-on-surface/40"}`}>
              {r.lastActiveDate === today ? "● today" : r.lastActiveDate}
            </span>
          </motion.button>
        ))}
      </GlassCard>

      <UserDrawer student={sel} onClose={() => setSel(null)} />
    </div>
  );
}
