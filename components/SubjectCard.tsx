"use client";

import { motion } from "framer-motion";
import { useHapticRouter } from "@/components/HapticRouter";
import { Atom, Compass, Cpu, Dna, FlaskConical, Pi } from "lucide-react";
import { ReactNode } from "react";
import GlassCard from "@/components/GlassCard";
import TransitionLink from "@/components/TransitionLink";

const SUBJECT_ICONS: Record<string, ReactNode> = {
  Physics: <Atom size={20} />,
  Chemistry: <FlaskConical size={20} />,
  Math: <Pi size={20} />,
  Biology: <Dna size={20} />,
};

export default function SubjectCard({ subject, count, completedCount = 0, imageUrl }: { subject: string; count: number; completedCount?: number; imageUrl?: string }) {
  const { navigate } = useHapticRouter();
  const Icon = SUBJECT_ICONS[subject] ?? <Atom size={20} />;
  
  return (
    <TransitionLink href={`/learn?subject=${subject}`} className="w-full text-left">
      <GlassCard 
        layoutId={`subject-${subject}`}
        interactive
        className="relative p-5 w-full overflow-hidden flex flex-col justify-center h-[120px] group"
      >
        {/* Edge-to-Edge Image with Gradient Mask */}
        <div className="absolute inset-y-0 right-0 w-[60%] md:w-[65%] pointer-events-none z-0">
          <img 
            src={imageUrl || `/images/subjects/${subject.toLowerCase()}.jpg`} 
            className="absolute inset-0 w-full h-full object-cover opacity-100 dark:opacity-80 dark:mix-blend-screen transition-transform duration-700 group-hover:scale-105" 
            style={{ maskImage: 'linear-gradient(to left, black 10%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 10%, transparent 100%)' }}
            alt={subject} 
          />
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 w-3/4 flex flex-col justify-center h-full pt-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-purple-600 dark:text-[#9d72ff]">{Icon}</span>
            <span className="font-sora font-bold text-lg text-on-surface tracking-tight uppercase">{subject}</span>
          </div>
          
          {count > 0 ? (
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.round((completedCount / count) * 100))}%` }}
                  />
                </div>
                <span className="font-geist text-[10px] font-bold text-on-surface-variant w-7 text-right">
                  {Math.round((completedCount / count) * 100)}%
                </span>
              </div>
              <span className="font-hanken text-[11px] text-on-surface-variant">
                {completedCount} / {count} completed
              </span>
            </div>
          ) : (
            <span className="font-geist text-xs text-on-surface-variant mt-1 block">Coming soon</span>
          )}
        </div>
      </GlassCard>
    </TransitionLink>
  );
}
