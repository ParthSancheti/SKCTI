"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  elite?: boolean;
  strong?: boolean;
  interactive?: boolean;
}

/* Never a solid card: glass fill + backdrop blur + 1px stroke, 32px radius. */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ elite, strong, interactive, className = "", children, ...rest }, ref) => (
    <motion.div
      ref={ref}
      whileTap={interactive ? { scale: 0.95 } : undefined}
      className={`rounded-glass ${elite ? "glassy-elite" : strong ? "glassy-strong" : "glassy"} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
);
GlassCard.displayName = "GlassCard";
export default GlassCard;
