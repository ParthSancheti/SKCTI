"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function NavTransitionOverlay() {
  const { navTransition, setNavTransition } = useStore();
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "expanding" | "fading">("idle");

  useEffect(() => {
    if (navTransition?.active && phase === "idle") {
      setPhase("expanding");
      
      // Navigate exactly halfway through the expansion
      setTimeout(() => {
        router.push(navTransition.href);
      }, 300);

      // Finish expanding and start fading out
      setTimeout(() => {
        setPhase("fading");
      }, 600);

      // Reset entirely
      setTimeout(() => {
        setPhase("idle");
        setNavTransition(null);
      }, 1000);
    }
  }, [navTransition, phase, router, setNavTransition]);

  if (!navTransition?.rect || phase === "idle") return null;

  const { rect, color } = navTransition;

  return (
    <AnimatePresence>
      {(phase === "expanding" || phase === "fading") && (
        <motion.div
          initial={{
            position: "fixed",
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: "24px", // Match typical card rounding
            zIndex: 9999, // Above everything
            opacity: 1,
          }}
          animate={{
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            borderRadius: "0px",
            opacity: phase === "fading" ? 0 : 1,
          }}
          transition={{
            duration: phase === "fading" ? 0.4 : 0.6,
            ease: [0.22, 1, 0.36, 1], // Custom snappy easing for expansion
          }}
          className="pointer-events-none glassy border border-white/10"
        />
      )}
    </AnimatePresence>
  );
}
