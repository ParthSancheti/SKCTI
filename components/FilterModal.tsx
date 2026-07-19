"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import type { Weightage } from "@/lib/types";
import { vibrate } from "@/lib/store";

export interface Filters {
  subject: string | null;
  weightage: Weightage | null;
  type: string | null;
}

export default function FilterModal({
  open, onClose, filters, setFilters, subjects, types,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  subjects: string[];
  types: string[];
}) {
  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={() => { vibrate(10); onClick(); }}
      className={`rounded-full px-4 py-2 font-geist text-label-sm ${active ? "bg-primary-container text-white" : "glassy text-on-surface/70"}`}
    >
      {label}
    </motion.button>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]" />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 lg:left-1/2 lg:right-auto lg:bottom-8 lg:-translate-x-1/2 lg:w-[480px] glassy-elite rounded-t-glass lg:rounded-glass p-8 z-[81]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-sora text-headline-lg flex items-center gap-2"><SlidersHorizontal size={18} className="text-primary" /> Filters</h2>
              <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full glassy flex items-center justify-center"><X size={16} /></button>
            </div>
            <p className="font-geist text-label-sm uppercase text-on-surface-variant mb-3">Subject</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {subjects.map((s) => (
                <Chip key={s} label={s} active={filters.subject === s} onClick={() => setFilters({ ...filters, subject: filters.subject === s ? null : s })} />
              ))}
            </div>
            <p className="font-geist text-label-sm uppercase text-on-surface-variant mb-3">Weightage</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {(["High", "Medium", "Low"] as Weightage[]).map((w) => (
                <Chip key={w} label={w} active={filters.weightage === w} onClick={() => setFilters({ ...filters, weightage: filters.weightage === w ? null : w })} />
              ))}
            </div>
            <p className="font-geist text-label-sm uppercase text-on-surface-variant mb-3">Type</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {types.map((t) => (
                <Chip key={t} label={t} active={filters.type === t} onClick={() => setFilters({ ...filters, type: filters.type === t ? null : t })} />
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setFilters({ subject: null, weightage: null, type: null }); onClose(); }} className="w-full glassy rounded-full py-3.5 font-geist text-label-md">
              Clear all
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
