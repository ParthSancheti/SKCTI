"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Download, X } from "lucide-react";
import type { ContentDoc } from "@/lib/types";
import { drivePreviewUrl } from "@/lib/types";
import { useStore, vibrate } from "@/lib/store";

/* Fullscreen reader — streams the PDF straight from the user's Google Drive. */
export default function PdfViewerModal({ chapter, onClose }: { chapter: ContentDoc | null; onClose: () => void }) {
  const { profile, markDownloaded } = useStore();
  const saved = chapter ? profile?.downloads.includes(chapter.id) : false;

  return (
    <AnimatePresence>
      {chapter && (
        <motion.div
          layoutId={`pdf-${chapter.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex flex-col"
          style={{ background: "rgb(var(--surface))" }}
        >
          <div className="glassy-strong flex items-center gap-3 px-4 py-3 m-3 rounded-glass">
            <button onClick={() => { vibrate(10); onClose(); }} aria-label="Close" className="w-10 h-10 rounded-full glassy flex items-center justify-center shrink-0">
              <X size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-sora font-semibold truncate">{chapter.title}</p>
              <p className="font-geist text-label-sm text-on-surface/50">{chapter.subject} · {chapter.weightage} weightage</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => { vibrate(15); void markDownloaded(chapter.id); }}
              className={`rounded-full px-4 py-2.5 font-geist text-label-sm flex items-center gap-2 shrink-0 ${saved ? "glassy text-primary" : "bg-primary-container text-white"}`}
            >
              {saved ? <CheckCircle2 size={14} /> : <Download size={14} />} {saved ? "Saved" : "Save"}
            </motion.button>
          </div>
          <iframe
            src={drivePreviewUrl(chapter.driveId)}
            className="flex-1 w-full rounded-t-glass"
            style={{ border: 0 }}
            allow="autoplay"
            title={chapter.title}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
