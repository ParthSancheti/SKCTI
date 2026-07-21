"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { Activity, ArrowUpDown, Coins, Download, FileCheck, Flame, Phone, Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { col, snapTo } from "@/lib/db";
import { triggerHaptic, useStore } from "@/lib/store";
import type { Stream, UserDoc } from "@/lib/types";

export default function UserMatrix() {
  const [rows, setRows] = useState<UserDoc[] | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [streamFilter, setStreamFilter] = useState<Stream | "All">("All");
  const [sortConfig, setSortConfig] = useState<"coins" | "streak" | "recent">("coins");

  const { configLoaded, isAdmin } = useStore();

  useEffect(() => {
    if (!configLoaded || !isAdmin) return;
    const qq = query(col.users(), orderBy("coins", "desc"));
    return onSnapshot(qq, (s) => setRows(s.docs.map((d) => snapTo<UserDoc>(d))), (e) => { console.warn("Users access denied", e); setRows([]); });
  }, [configLoaded, isAdmin]);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setExpandedUserId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [listRef]);

  const filteredUsers = useMemo(() => {
    let list = rows ?? [];
    if (streamFilter !== "All") list = list.filter((user) => user.stream === streamFilter);
    if (searchQuery.trim()) {
      const searchLower = searchQuery.trim().toLowerCase();
      list = list.filter((user) => `${user.name || ""} ${user.email || ""} ${user.phone || ""}`.toLowerCase().includes(searchLower));
    }
    
    // Always create a new array for sorting to prevent mutating the original state
    list = [...list].sort((a, b) => {
      if (sortConfig === "coins") return b.coins - a.coins;
      if (sortConfig === "streak") return b.streak - a.streak;
      if (sortConfig === "recent") {
        return (b.lastActiveDate || "").localeCompare(a.lastActiveDate || "");
      }
      return 0;
    });

    return list;
  }, [rows, searchQuery, streamFilter, sortConfig]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8 max-w-container">
      <div>
        <h1 className="font-sora text-headline-xl">User Matrix</h1>
        <p className="font-hanken text-body-md text-neutral-500 dark:text-white/60 mt-1">{rows?.length ?? "…"} students · tap a row for full telemetry</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-3">
        <div className="glassy rounded-full flex-1 flex items-center gap-3 px-5 border border-black/10 dark:border-white/10">
          <Search size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off" spellCheck={false} placeholder="Search name, email, phone…" className="outline-none focus:ring-0 bg-transparent w-full text-neutral-900 dark:text-white placeholder:text-neutral-900/50 dark:placeholder:text-white/50 autofill:bg-transparent [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-neutral-900 dark:[&:-webkit-autofill]:text-white py-3 font-hanken text-body-md" />
        </div>
        
        <div className="flex gap-2 shrink-0 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 -mb-2 sm:mb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="glassy rounded-full p-1.5 flex border border-black/10 dark:border-white/10 shrink-0">
            {(["All", "PCM", "PCB"] as const).map((s) => (
              <button key={s} onClick={() => setStreamFilter(s)} className={`px-4 py-2 rounded-full font-geist text-label-sm ${streamFilter === s ? "bg-black/10 dark:bg-white/20 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-500 dark:text-white/60 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="glassy rounded-full flex items-center border border-black/10 dark:border-white/10 relative h-full min-h-[44px] shrink-0">
             <select 
                value={sortConfig} 
                onChange={(e) => setSortConfig(e.target.value as any)}
                className="appearance-none bg-transparent pl-5 pr-10 py-2 outline-none font-geist text-label-sm text-neutral-900/80 dark:text-white/80 cursor-pointer h-full"
             >
                <option value="coins" className="bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-white">Top Coins</option>
                <option value="streak" className="bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-white">Top Streak</option>
                <option value="recent" className="bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-white">Recently Active</option>
             </select>
             <ArrowUpDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-white/40 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              if (!rows || rows.length === 0) return;
              const headers = ["Name", "Email", "Phone", "Stream", "Grade", "Coins", "Streak", "Last Active"];
              const csv = [
                headers.join(","),
                ...rows.map((r) => [r.name, r.email, r.phone, r.stream, r.grade, r.coins, r.streak, r.lastActiveDate].map(v => `"${v}"`).join(","))
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
            }}
            className="flex h-full min-h-[44px] items-center gap-2 glassy rounded-full px-5 py-2 font-geist text-label-sm font-semibold text-neutral-900 dark:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 transition-colors shrink-0"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div ref={listRef}>
          <div className="grid grid-cols-[1fr_70px_70px_70px_90px] max-md:grid-cols-[1fr_70px_70px] gap-3 px-6 py-4 border-b font-geist text-label-sm uppercase text-neutral-500 dark:text-white/50" style={{ borderColor: "var(--glass-stroke)" }}>
          <span>Student</span><span>Stream</span><span>Coins</span><span className="max-md:hidden">Streak</span><span className="max-md:hidden">Active</span>
        </div>
        {rows === null && <p className="p-6 font-hanken text-body-md text-neutral-500 dark:text-white/40">Loading…</p>}
        {rows !== null && filteredUsers.length === 0 && (
          <div className="p-10 text-center">
            <Users size={20} className="mx-auto text-purple-600 dark:text-purple-400 mb-2" />
            <p className="font-hanken text-body-md text-neutral-500 dark:text-white/40">{rows.length === 0 ? "No signups yet — share the app link!" : "No matches."}</p>
          </div>
        )}
        {filteredUsers.map((user, i) => {
          const uId = user.uid || (user as any).id;
          return (
            <div key={uId || i} className="border-b last:border-0" style={{ borderColor: "var(--glass-stroke)" }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                onClick={() => { triggerHaptic(); setExpandedUserId(expandedUserId === uId ? null : uId); }}
                className={`w-full grid grid-cols-[1fr_70px_70px_70px_90px] max-md:grid-cols-[1fr_70px_70px] gap-3 px-6 py-4 items-center text-left hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${expandedUserId === uId ? "bg-black/5 dark:bg-white/5" : ""}`}
              >
                <div className="min-w-0">
                  <p className="font-sora font-semibold text-sm truncate text-neutral-900 dark:text-white">{user.name}</p>
                  <p className="font-geist text-label-sm text-neutral-500 dark:text-white/40 truncate">{user.grade} · {user.email}</p>
                </div>
                <span className="font-geist text-label-sm glassy rounded-full px-2 py-1 text-center text-purple-600 dark:text-purple-400">{user.stream}</span>
                <span className="font-geist text-label-md tabular-nums text-neutral-900 dark:text-white">{user.coins}</span>
                <span className="font-geist text-label-md tabular-nums max-md:hidden text-neutral-900 dark:text-white">{user.streak}d</span>
                <span className={`font-geist text-label-sm max-md:hidden ${user.lastActiveDate === today ? "text-purple-600 dark:text-purple-400" : "text-neutral-500 dark:text-white/40"}`}>
                  {user.lastActiveDate === today ? "● today" : user.lastActiveDate}
                </span>
              </motion.div>
              
              <AnimatePresence>
                {expandedUserId === uId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-6"
                  >
                    <div className="pb-6 pt-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {[
                          { Icon: Coins, label: "Coins", val: user.coins || 0 },
                          { Icon: Flame, label: "Streak", val: `${user.streak || 0}d` },
                          { Icon: FileCheck, label: "Tests attempted", val: user.attempted?.length || 0 },
                          { Icon: Download, label: "PDFs saved", val: user.downloads?.length || 0 },
                        ].map(({ Icon, label, val }) => (
                          <div key={label} className="glassy rounded-[1rem] p-4 flex flex-col items-center text-center border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                            <Icon size={16} className="text-purple-600 dark:text-purple-400 mb-2" />
                            <p className="font-sora font-bold text-lg text-neutral-900 dark:text-white">{val}</p>
                            <p className="font-geist text-label-sm text-neutral-500 dark:text-white/50">{label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="glassy rounded-[1rem] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                        <p className="font-geist text-label-sm flex items-center gap-2 text-neutral-600 dark:text-white/70"><Phone size={13} className="text-purple-600 dark:text-purple-400 shrink-0" /> +91 {user.phone || 'No phone provided'}</p>
                        <p className="font-geist text-label-sm flex items-center gap-2 text-neutral-600 dark:text-white/70">
                          <Activity size={13} className="text-purple-600 dark:text-purple-400 shrink-0" /> Last active {user.lastActiveDate}
                          {user.createdAt ? ` · joined ${user.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        </div>
      </GlassCard>
    </div>
  );
}
