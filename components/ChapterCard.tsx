"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Download, Eye, FileText, File, Share2 } from "lucide-react";
import type { ContentDoc } from "@/lib/types";
import { vibrate } from "@/lib/store";
import { useHapticRouter } from "./HapticRouter";

export default function ChapterCard({ chapter, onOpen }: { chapter: ContentDoc; onOpen: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { navigate } = useHapticRouter();

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    if (chapter.youtubeUrl) {
      window.open(chapter.youtubeUrl, "_blank");
    } else {
      navigate(`/learn/read?id=${chapter.id}`, e as any);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    window.open(chapter.driveUrl, "_blank");
  };

  const handleTest = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    if (chapter.testLink) {
      window.open(chapter.testLink, "_blank");
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    try {
      await navigator.share({
        title: chapter.title,
        text: `Check out ${chapter.title} on SKCTI Learn OS`,
        url: window.location.href,
      });
    } catch {
      // share failed or cancelled
    }
  };

  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-lg overflow-hidden transition-all hover:bg-white/10 cursor-pointer">
      <motion.div 
        layout 
        onClick={() => { vibrate(10); setExpanded(!expanded); }}
        className="p-5 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="shrink-0 rounded-xl bg-white/5 p-3 flex items-center justify-center text-white">
            <File size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="font-geist text-xs text-white/50 uppercase tracking-wider truncate">{chapter.subject} • {chapter.type}</p>
            <h3 className="font-sora text-lg font-bold text-white truncate">{chapter.title}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-medium">
            {chapter.weightage || "High"}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="text-white/50">
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
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
              <button onClick={handleView} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-all active:scale-95">
                <Eye size={16} />
                <span>{chapter.youtubeUrl ? "Watch Video" : "View PDF"}</span>
              </button>
              
              <button onClick={handleDownload} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-all active:scale-95">
                <Download size={16} />
                <span>Download</span>
              </button>
              
              <button 
                onClick={handleTest} 
                disabled={!chapter.testLink}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 text-sm font-medium transition-all ${
                  chapter.testLink 
                    ? "bg-white/5 hover:bg-white/10 text-white active:scale-95" 
                    : "bg-transparent text-white/30 cursor-not-allowed"
                }`}
              >
                <FileText size={16} />
                <span>Chapter Test</span>
              </button>
              
              <button onClick={handleShare} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-all active:scale-95">
                <Share2 size={16} />
                <span>Share</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
