"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Construction, X } from "lucide-react";
import { useEffect, useState } from "react";
import { vibrate } from "@/lib/store";

interface ComingSoonProps {
  open: boolean;
  onClose: () => void;
  title: string;
}

export default function ComingSoon({ open, onClose, title }: ComingSoonProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* PC Modal Version (hidden on mobile) */}
          <motion.div
            key="pc-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden lg:flex fixed inset-0 z-[100] items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                vibrate(10);
                onClose();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-white/10 dark:bg-white/5 backdrop-blur-3xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative gradient orb */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
              
              <button
                onClick={() => { vibrate(10); onClose(); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <X size={16} className="text-neutral-900 dark:text-white" />
              </button>

              <div className="flex flex-col items-center text-center mt-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                  <Construction size={32} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="font-sora text-2xl font-bold text-neutral-900 dark:text-white mb-2">{title}</h2>
                <p className="font-hanken text-body-md text-neutral-600 dark:text-neutral-400 mb-8">
                  We&apos;re crafting something amazing here. Stay tuned for the upcoming update!
                </p>
                <button
                  onClick={() => { vibrate(10); onClose(); }}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-geist font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Mobile Full-Screen Version (hidden on PC) */}
          <motion.div
            key="mobile-page"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed inset-0 z-[100] bg-neutral-50 dark:bg-[#0a0a0a] flex flex-col lg:hidden"
          >
            <div className="flex items-center gap-4 px-4 py-4 bg-white/5 dark:bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10">
              <button
                onClick={() => { vibrate(10); onClose(); }}
                className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-neutral-900 dark:text-white" />
              </button>
              <h1 className="font-sora font-semibold text-lg text-neutral-900 dark:text-white">{title}</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 flex items-center justify-center mb-6 shadow-inner"
              >
                <Construction size={48} className="text-purple-600 dark:text-purple-400" />
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="font-sora text-3xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight"
              >
                Coming Soon
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-hanken text-body-lg text-black dark:text-neutral-400"
              >
                This feature is currently under active development. Check back in the next update!
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


