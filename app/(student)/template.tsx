"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";

const TABS = ["/home", "/learn", "/tests", "/rank"];

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [direction, setDirection] = useState(0);
  const [prevPath, setPrevPath] = useState(pathname);

  if (pathname !== prevPath) {
    const currentIndex = TABS.findIndex((t) => pathname.startsWith(t));
    const prevIndex = TABS.findIndex((t) => prevPath.startsWith(t));
    
    if (currentIndex !== -1 && prevIndex !== -1 && currentIndex !== prevIndex) {
      setDirection(currentIndex > prevIndex ? 1 : -1);
    } else {
      setDirection(0);
    }
    setPrevPath(pathname);
  }

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : dir < 0 ? -60 : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 60 : dir > 0 ? -60 : 0,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 350, damping: 35 },
          opacity: { duration: 0.15 },
        }}
        className="w-full min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
