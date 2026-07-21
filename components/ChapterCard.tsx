"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Eye, FileText, File, PlayCircle } from "lucide-react";
import type { ContentDoc } from "@/lib/types";
import { vibrate } from "@/lib/store";
import { useHapticRouter } from "./HapticRouter";

export default function ChapterCard({ chapter, onOpen }: { chapter: ContentDoc; onOpen: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { navigate } = useHapticRouter();

  const handleViewPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    navigate(`/learn/read?id=${chapter.id}`, e as any);
  };

  const handleViewVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    if (chapter.youtubeUrl) {
      window.open(chapter.youtubeUrl, "_blank");
    }
  };

  const handleTest = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    if (chapter.testLink) {
      navigate(`/learn/test?id=${chapter.id}`, e as any);
    }
  };

  return (
    <div className="glassy rounded-[1.5rem] overflow-hidden transition-all hover:brightness-110 cursor-pointer">
      <motion.div 
        onClick={() => { vibrate(10); setExpanded(!expanded); }}
        className="p-5 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="shrink-0 rounded-xl glassy p-3 flex items-center justify-center text-black dark:text-white">
            <File size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="font-geist text-xs text-black/50 dark:text-white/50 uppercase tracking-wider truncate">{chapter.subject} • {chapter.type}</p>
            <h3 className="font-sora text-lg font-bold text-black dark:text-white truncate">{chapter.title}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-medium">
            {chapter.weightage || "High"}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="text-black/50 dark:text-white/50">
            <ChevronDown size={18} />
          </motion.div>
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
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/10 dark:border-white/10">
              <button onClick={handleViewPDF} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl glassy hover:brightness-110 text-sm font-medium text-black dark:text-white transition-all active:scale-95 ${!chapter.youtubeUrl ? 'col-span-2' : ''}`}>
                <Eye size={16} />
                <span>View PDF</span>
              </button>

              {chapter.youtubeUrl && (
                <button onClick={handleViewVideo} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl glassy hover:brightness-110 text-sm font-medium text-black dark:text-white transition-all active:scale-95">
                  <PlayCircle size={16} />
                  <span>Watch Video</span>
                </button>
              )}
              
              <button 
                onClick={handleTest} 
                disabled={!chapter.testLink}
                className={`col-span-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  chapter.testLink 
                    ? "glassy hover:brightness-110 text-black dark:text-white active:scale-95" 
                    : "bg-transparent border border-black/10 dark:border-white/10 text-black/30 dark:text-white/30 cursor-not-allowed"
                }`}
              >
                <FileText size={16} />
                <span>Chapter Test</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
