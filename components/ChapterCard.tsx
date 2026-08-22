"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Eye, FileText, File, PlayCircle, CheckCircle2, Atom, FlaskConical, Pi, Dna } from "lucide-react";
import type { ContentDoc } from "@/lib/types";
import { useStore, vibrate } from "@/lib/store";
import { useHapticRouter } from "./HapticRouter";
import { Browser } from "@capacitor/browser";
import GlassCard from "@/components/GlassCard";

export default function ChapterCard({ chapter, onOpen }: { chapter: ContentDoc; onOpen: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { navigate } = useHapticRouter();
  const { profile, markAttempted } = useStore();
  const done = profile?.attempted?.includes(chapter.id) ?? false;

  const handlePrimary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    if (chapter.type === "External Link" && chapter.driveUrl) {
      try { await Browser.open({ url: chapter.driveUrl, windowName: "_system" }); } catch (err) { window.open(chapter.driveUrl, "_system"); }
    } else if (chapter.type === "Video" && chapter.youtubeUrl) {
      try { await Browser.open({ url: chapter.youtubeUrl, windowName: "_system" }); } catch (err) { window.open(chapter.youtubeUrl, "_system"); }
    } else {
      navigate(`/learn/read?id=${chapter.id}`, e as any);
    }
  };

  const handleViewPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    navigate(`/learn/read?id=${chapter.id}`, e as any);
  };

  const handleViewVideo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    if (chapter.youtubeUrl) {
      try {
        await Browser.open({ url: chapter.youtubeUrl, windowName: "_system" });
      } catch (err) {
        window.open(chapter.youtubeUrl, "_system");
      }
    }
  };

  const handleTest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    if (chapter.testLink) {
      try {
        await Browser.open({ url: chapter.testLink, windowName: "_system" });
      } catch (err) {
        window.open(chapter.testLink, "_system");
      }
    }
  };

  return (
    <GlassCard interactive className="overflow-hidden flex flex-col">
      <motion.div 
        onClick={handlePrimary}
        className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="shrink-0 rounded-full glassy border border-white/10 p-3 flex items-center justify-center text-purple-600 dark:text-[#9d72ff]">
            {chapter.subject === "Physics" ? <Atom size={20} /> :
             chapter.subject === "Chemistry" ? <FlaskConical size={20} /> :
             chapter.subject === "Math" ? <Pi size={20} /> :
             chapter.subject === "Biology" ? <Dna size={20} /> : <File size={20} />}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="font-geist text-xs text-on-surface-variant uppercase tracking-wider truncate">{chapter.subject} • {chapter.type}</p>
            <h3 className="font-sora text-lg font-bold text-on-surface truncate">{chapter.title}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {done && (
            <span className="flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-medium">
              <CheckCircle2 size={14} /> <span className="hidden sm:inline">Completed</span>
            </span>
          )}
          <span className="bg-error-container text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-medium">
            {chapter.weightage || "High"}
          </span>
          <motion.button 
            onClick={(e) => { e.stopPropagation(); vibrate(10); setExpanded(!expanded); }}
            animate={{ rotate: expanded ? 180 : 0 }} 
            className="text-on-surface-variant p-2 -mr-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <ChevronDown size={18} />
          </motion.button>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-outline-variant">
              {!!chapter.driveId && chapter.type !== "External Link" && (
                <button onClick={handleViewPDF} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl glassy hover:brightness-110 text-sm font-medium text-on-surface transition-all active:scale-95 ${!chapter.youtubeUrl && !chapter.testLink ? 'col-span-2' : ''}`}>
                  <Eye size={16} />
                  <span>View PDF</span>
                </button>
              )}

              {!!chapter.youtubeUrl && (
                <button onClick={handleViewVideo} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl glassy hover:brightness-110 text-sm font-medium text-on-surface transition-all active:scale-95 ${!chapter.driveId && !chapter.testLink ? 'col-span-2' : ''}`}>
                  <PlayCircle size={16} />
                  <span>Watch Video</span>
                </button>
              )}

              <button 
                onClick={handleTest} 
                disabled={!chapter.testLink}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  (!chapter.testLink || done || (!chapter.youtubeUrl && !chapter.driveId)) ? "col-span-2" : ""
                } ${
                  chapter.testLink 
                    ? "glassy hover:brightness-110 text-on-surface active:scale-95" 
                    : "bg-transparent border border-outline-variant text-black/30 dark:text-white/30 cursor-not-allowed"
                }`}
              >
                <FileText size={16} />
                <span>{chapter.testLink ? "Chapter Test" : "No Test Yet"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
