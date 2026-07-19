"use client";

import { motion } from "framer-motion";
import { BookOpen, Download, Eye, FileText, Play } from "lucide-react";
import type { ContentDoc } from "@/lib/types";
import { useStore, vibrate } from "@/lib/store";

const W_COLORS: Record<string, string> = {
  High: "bg-primary-container/20 text-primary",
  Medium: "bg-tertiary/15 text-tertiary",
  Low: "bg-on-surface/10 text-on-surface/50",
};

export default function ChapterCard({ chapter, onOpen }: { chapter: ContentDoc; onOpen: () => void }) {
  const { profile, markDownloaded } = useStore();
  const downloaded = profile?.downloads.includes(chapter.id) ?? false;

  const actions = [
    { icon: Eye, label: "Read", primary: true, act: onOpen },
    { icon: downloaded ? BookOpen : Download, label: downloaded ? "Saved" : "Save", act: () => void markDownloaded(chapter.id) },
    { icon: FileText, label: chapter.type.split(" ")[0], act: onOpen },
    { icon: Play, label: "Revise", act: onOpen },
  ];

  return (
    <motion.div layout whileTap={{ scale: 0.985 }} className="glassy rounded-glass p-6">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h3 className="font-sora font-semibold text-lg leading-snug">{chapter.title}</h3>
        <span className={`shrink-0 rounded-full px-3 py-1 font-geist text-label-sm ${W_COLORS[chapter.weightage]}`}>
          {chapter.weightage === "High" ? "High · 12%" : chapter.weightage === "Medium" ? "Med · 7%" : "Low · 4%"}
        </span>
      </div>
      <p className="font-geist text-label-sm text-on-surface/50 mb-5">{chapter.subject} · {chapter.type}</p>
      <div className="grid grid-cols-4 gap-2">
        {actions.map(({ icon: Icon, label, primary, act }) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.92 }}
            onClick={() => { vibrate(10); act(); }}
            className={`rounded-input py-3 flex flex-col items-center gap-1.5 transition-colors ${primary ? "bg-primary-container text-white" : "glassy"}`}
          >
            <Icon size={16} />
            <span className="font-geist text-[10px] tracking-wide">{label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
