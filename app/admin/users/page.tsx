"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { Activity, ArrowUpDown, Coins, Download, DownloadCloud, FileCheck, Flame, Phone, Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { col, snapTo } from "@/lib/db";
import { triggerHaptic, useStore } from "@/lib/store";
import type { Stream, UserDoc } from "@/lib/types";

export default function UserMatrix() {
  const [rows, setRows] = useState<UserDoc[] | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [streamFilter, setStreamFilter] = useState<string>("All Streams");
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
    if (streamFilter !== "All Streams") list = list.filter((user) => user.stream === streamFilter);
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
    <div className="w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 flex flex-col gap-6 pt-2 pb-12">
      <div>
        <h1 className="font-sora text-3xl font-black tracking-tight text-neutral-900 dark:text-white">User Matrix</h1>
        <p className="mt-1 font-geist text-body-md text-neutral-500 dark:text-white/60">{rows?.length ?? "…"} students · tap a row for full telemetry</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 min-w-0 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-white/40 z-10 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full pl-11 pr-4 py-3 glassy rounded-full border border-black/10 dark:border-white/10 font-geist text-body-md text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/40 outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
          />
        </div>

        {/* Tab filters */}
        <div className="flex p-1 glassy rounded-full relative overflow-x-auto hide-scrollbar shrink-0">
          {(["All Streams", "PCM", "PCB"] as const).map((t) => (
            <button key={t} onClick={() => { vibrate(); setStreamFilter(t); }} className="relative px-5 py-2 font-geist text-sm font-bold whitespace-nowrap transition-colors z-10">
              {streamFilter === t && (
                <motion.span layoutId="userStreamTab" className="absolute inset-0 rounded-full bg-white dark:bg-white/15 shadow-md border border-black/5 dark:border-white/10 -z-10" />
              )}
              <span className={streamFilter === t ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-white/50 hover:text-neutral-900 dark:hover:text-white"}>{t}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto hide-scrollbar">
          <div className="relative">
            <select
              value={sortConfig}
              onChange={(e) => setSortConfig(e.target.value as any)}
              className="glassy rounded-full pl-4 pr-10 py-3 font-geist text-sm font-bold text-neutral-900 dark:text-white outline-none border border-black/10 dark:border-white/10 appearance-none bg-transparent cursor-pointer"
            >
              <option className="bg-white dark:bg-black" value="coins">Top Coins</option>
              <option className="bg-white dark:bg-black" value="streak">Top Streak</option>
              <option className="bg-white dark:bg-black" value="recent">Recent Active</option>
            </select>
            <ArrowUpDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-white/50 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              if (!rows || rows.length === 0) return;
              vibrate();
              const csv = [
                "Name,Email,Phone,Stream,Coins,Streak,Joined",
                ...filteredUsers.map(u => `"${u.name}","${u.email}","${u.phone || ''}","${u.stream || ''}",${u.coins},${u.streak},"${u.createdAt ? u.createdAt.toDate().toISOString() : ''}"`)
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `skcti_users_${today}.csv`; a.click();
            }}
            className="flex items-center gap-2 glassy rounded-full px-5 py-3 font-geist text-sm font-bold text-neutral-900 dark:text-white border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shadow-sm"
          >
            <DownloadCloud size={16} /> <span className="hidden sm:inline">Export CSV</span>
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
