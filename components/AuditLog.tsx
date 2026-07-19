"use client";

import { limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import GlassCard from "./GlassCard";
import { col, snapTo } from "@/lib/db";
import type { AuditEntry } from "@/lib/types";

export default function AuditLog() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  useEffect(() => {
    const q = query(col.audit(), orderBy("at", "desc"), limit(15));
    return onSnapshot(q, (s) => setRows(s.docs.map((d) => snapTo<AuditEntry>(d))), () => {});
  }, []);
  return (
    <GlassCard className="p-8">
      <h2 className="font-sora text-headline-lg flex items-center gap-2 mb-6">
        <ScrollText size={18} className="text-primary" /> Audit ledger
      </h2>
      {rows.length === 0 ? (
        <p className="font-hanken text-body-md text-on-surface/40">No admin actions yet — publish something and it lands here.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="flex items-start gap-3 border-t pt-4 first:border-0 first:pt-0" style={{ borderColor: "var(--glass-stroke)" }}>
              <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-hanken text-body-md">{r.action}</p>
                <p className="font-geist text-label-sm text-on-surface/40 mt-0.5">
                  {r.actor} · {r.at ? r.at.toDate().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "just now"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
