"use client";

import { Folder } from "lucide-react";
import type { ReactNode } from "react";

/* Mock mobile phone frame used by the Admin OS live previews */
export default function PhonePreviewFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[300px] shrink-0">
      <div className="rounded-[44px] border-4 border-surface-container-highest glassy overflow-hidden shadow-2xl shadow-black/40">
        <div className="h-8 flex items-center justify-center relative">
          <div className="w-24 h-5 rounded-full glassy-strong" />
          <div className="absolute right-4 flex items-center gap-1.5 opacity-80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="font-geist text-[9px] font-bold tracking-wider text-green-500 uppercase">Live Sync</span>
          </div>
        </div>
        <div className="h-[560px] overflow-y-auto hide-scrollbar p-4 space-y-4">{children}</div>
        <div className="h-6 flex items-center justify-center">
          <div className="w-28 h-1.5 rounded-full glassy-strong" />
        </div>
      </div>
    </div>
  );
}

/* Exact student-app chapter card, mirrored live as the admin types */
export function LiveChapterCard({
  title,
  subject,
  weightage,
  stream,
}: {
  title: string;
  subject: string;
  weightage: string;
  stream: string;
}) {
  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-lg overflow-hidden transition-all">
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-600/20 dark:bg-purple-400/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Folder size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-sora font-semibold text-neutral-900 dark:text-white truncate">{title || "Untitled chapter"}</h3>
            <p className="font-geist text-xs text-neutral-500 dark:text-neutral-400 truncate">{subject || "Subject"} · {stream || "Stream"}</p>
          </div>
        </div>
      </div>
      
      <div className="px-5 pb-5 border-t border-black/5 dark:border-white/5">
        <div className="pt-4 grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md">
            <div className="w-4 h-4 rounded-sm bg-white/20" />
            <span className="font-geist text-[10px] font-bold tracking-wider">View</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl glassy text-neutral-700 dark:text-white">
            <div className="w-4 h-4 rounded-sm bg-black/10 dark:bg-white/20" />
            <span className="font-geist text-[10px] tracking-wider">Save</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl glassy text-neutral-700 dark:text-white">
            <div className="w-4 h-4 rounded-sm bg-black/10 dark:bg-white/20" />
            <span className="font-geist text-[10px] tracking-wider">Test</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl glassy text-neutral-700 dark:text-white">
            <div className="w-4 h-4 rounded-sm bg-black/10 dark:bg-white/20" />
            <span className="font-geist text-[10px] tracking-wider">Share</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Custom Live Exam Card for the NTA-style mock tests */
export function LiveExamCard({
  title,
  subject,
  duration,
  marks,
  stream,
}: {
  title: string;
  subject: string;
  duration: string | number;
  marks: string | number;
  stream: string;
}) {
  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-lg overflow-hidden transition-all">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2 mb-1">
            <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full font-geist text-[10px] font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
              Live
            </span>
            <span className="bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-neutral-700 dark:text-white/70 px-2.5 py-1 rounded-full font-geist text-[10px] font-bold tracking-wider uppercase">
              {stream || "Stream"}
            </span>
          </div>
        </div>
        
        <div className="min-w-0">
          <h3 className="font-sora font-bold text-lg leading-tight text-neutral-900 dark:text-white mb-1">{title || "Untitled Test"}</h3>
          <p className="font-geist text-xs text-neutral-500 dark:text-neutral-400">{subject || "Subject"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 py-3 border-y border-black/5 dark:border-white/5">
          <div className="flex flex-col">
            <span className="font-geist text-[10px] uppercase tracking-wider text-neutral-500 dark:text-white/40 mb-0.5">Duration</span>
            <span className="font-sora font-semibold text-neutral-900 dark:text-white text-sm">{duration || "0"} mins</span>
          </div>
          <div className="flex flex-col">
            <span className="font-geist text-[10px] uppercase tracking-wider text-neutral-500 dark:text-white/40 mb-0.5">Total Marks</span>
            <span className="font-sora font-semibold text-neutral-900 dark:text-white text-sm">{marks || "0"}</span>
          </div>
        </div>
        
        <div className="pt-2">
          <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md font-geist text-sm font-bold tracking-wide cursor-pointer hover:shadow-lg transition-shadow">
            Take Test
          </div>
        </div>
      </div>
    </div>
  );
}
