"use client";

import { motion } from "framer-motion";

interface Props {
  progress: number; // 0..1
  size?: number;
  label?: string;
  sub?: string;
}

/* 8px stroke, white/5 track, orange-600 → red-900 gradient indicator */
export default function ProgressRing({ progress, size = 120, label, sub }: Props) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" className="stroke-glass/5 stroke-[8px]" style={{ stroke: "var(--glass-stroke)" }} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          stroke="url(#ring-grad)"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ filter: "drop-shadow(0 0 6px rgba(234,88,12,0.5))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sora font-bold text-xl leading-none">{label ?? `${Math.round(clamped * 100)}%`}</span>
        {sub && <span className="font-geist text-label-sm text-on-surface/50 mt-1">{sub}</span>}
      </div>
    </div>
  );
}
