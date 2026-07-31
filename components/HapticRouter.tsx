"use client";

import { createContext, useContext, useState, ReactNode, MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { vibrate } from "@/lib/store";

interface HapticRouterContextType {
  navigate: (path: string, e: ReactMouseEvent | MouseEvent) => void;
}

const HapticRouterContext = createContext<HapticRouterContextType | null>(null);

export function useHapticRouter() {
  const ctx = useContext(HapticRouterContext);
  if (!ctx) throw new Error("useHapticRouter must be used within HapticRouterProvider");
  return ctx;
}

export function HapticRouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [animating, setAnimating] = useState<{ x: number; y: number } | null>(null);

  const navigate = (path: string, e: ReactMouseEvent | MouseEvent) => {
    e.preventDefault();
    vibrate(50);
    
    // Capture click coordinates
    const { clientX, clientY } = e as any;
    setAnimating({ x: clientX, y: clientY });
    
    // Route after the overlay covers the screen
    setTimeout(() => {
      router.push(path);
      // Wait for route to transition then fade out
      setTimeout(() => {
        setAnimating(null);
      }, 150);
    }, 50);
  };

  return (
    <HapticRouterContext.Provider value={{ navigate }}>
      {children}
      <AnimatePresence>
        {animating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-black/5 dark:bg-black/20 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </HapticRouterContext.Provider>
  );
}
