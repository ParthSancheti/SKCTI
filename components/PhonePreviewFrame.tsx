"use client";

import { Folder } from "lucide-react";
import type { ReactNode } from "react";

/* Mock mobile phone frame used by the Admin OS live previews */
export default function PhonePreviewFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[300px] shrink-0">
      <div className="rounded-[44px] border-4 border-surface-container-highest glassy overflow-hidden shadow-2xl shadow-black/40">
        <div className="h-8 flex items-center justify-center">
          <div className="w-24 h-5 rounded-full glassy-strong" />
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
    <div className="glassy rounded-glass p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-input bg-primary-container/15 flex items-center justify-center shrink-0">
          <Folder size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sora font-semibold text-sm truncate">{title || "Untitled chapter"}</p>
          <p className="font-geist text-[10px] tracking-wider text-on-surface/50">
            {subject || "Subject"} · {stream || "Stream"}
          </p>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-1 font-geist text-[10px] tracking-wider bg-primary-container/20 text-primary border border-primary/30">
          🔥 {weightage || "—"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-full h-8 bg-primary-container text-white font-geist text-[10px] tracking-wider flex items-center justify-center">View PDF</div>
        <div className="rounded-full h-8 glassy font-geist text-[10px] tracking-wider flex items-center justify-center text-on-surface/70">Download</div>
        <div className="rounded-full h-8 glassy font-geist text-[10px] tracking-wider flex items-center justify-center text-on-surface/70">Chapter Test</div>
        <div className="rounded-full h-8 glassy font-geist text-[10px] tracking-wider flex items-center justify-center text-on-surface/70">Mock Exam</div>
      </div>
    </div>
  );
}
