"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { triggerHaptic } from "@/lib/store";

export default function TestHub() {
  const router = useRouter();
  return (
    <div className="max-w-container space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora text-headline-xl">Test Hub</h1>
          <p className="font-hanken text-body-md text-neutral-500 dark:text-white/60 mt-1">
            Manage your Google Form quizzes and tests
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { triggerHaptic(); router.push('/admin/tests/add'); }}
          className="flex items-center justify-center gap-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 px-6 py-3 font-geist text-sm font-bold text-neutral-900 dark:text-white transition-all shadow-lg"
        >
          <Plus size={16} /> New Test
        </motion.button>
      </div>

      <GlassCard className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center mb-6">
          <ClipboardList size={32} className="text-neutral-900/40 dark:text-white/40" />
        </div>
        <h2 className="font-sora text-title-md text-neutral-900 dark:text-white">No tests active</h2>
        <p className="font-geist text-body-sm text-neutral-900/50 dark:text-white/50 mt-2 max-w-sm">
          Tests you publish here will appear in the Tests tab for students to attempt and earn coins.
        </p>
      </GlassCard>
    </div>
  );
}
