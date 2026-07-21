"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useStore, vibrate } from "@/lib/store";

export default function AiFab() {
  const router = useRouter();
  const pathname = usePathname();
  const { config } = useStore();
  
  if (!config.features.ai || pathname === "/ai") return null;
  
  return (
    <button
      onClick={() => {
        vibrate(20);
        router.push("/ai");
      }}
      aria-label="Open AI Lab"
      className="fixed right-6 bottom-28 z-[60] w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform lg:right-10 lg:bottom-10"
    >
      <Sparkles size={24} />
    </button>
  );
}
