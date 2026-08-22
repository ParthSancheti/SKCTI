"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore, vibrate } from "@/lib/store";

interface TransitionLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  color?: string; // Optional: specify the background color to expand. Defaults to var(--layer-primary)
}

/**
 * A wrapper around router.push that captures the clicked element's bounding rect
 * and triggers a global expanding overlay animation before navigating.
 */
export default function TransitionLink({ href, className, children, color = "var(--layer-primary)" }: TransitionLinkProps) {
  const router = useRouter();
  const { setNavTransition } = useStore();
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    vibrate(10);
    
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      
      // 1. Trigger the expanding overlay
      setNavTransition({ active: true, rect, color, href });
      
    } else {
      router.push(href);
    }
  };

  return (
    <div ref={ref} onClick={handleClick} className={`cursor-pointer ${className || ""}`}>
      {children}
    </div>
  );
}
