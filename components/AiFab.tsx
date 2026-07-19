"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore, vibrate } from "@/lib/store";

/* Glowing FAB floating just above the bottom nav, right side → AI Lab */
export default function AiFab() {
  const router = useRouter();
  const { config } = useStore();
  if (!config.features.ai) return null;
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.08 }}
      onClick={() => {
        vibrate(20);
        router.push("/ai");
      }}
      aria-label="Open AI Lab"
      className="fixed right-5 bottom-24 lg:right-10 lg:bottom-10 z-50 w-14 h-14 rounded-full bg-primary-container text-white flex items-center justify-center shadow-glow-primary"
      animate={{ boxShadow: ["0 0 16px rgba(234,88,12,0.4)", "0 0 32px rgba(234,88,12,0.7)", "0 0 16px rgba(234,88,12,0.4)"] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <Sparkles size={24} />
    </motion.button>
  );
}
