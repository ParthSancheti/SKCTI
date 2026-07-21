"use client";

import { motion } from "framer-motion";
import { useHapticRouter } from "@/components/HapticRouter";
import { Atom, Compass, Cpu, Dna } from "lucide-react";
import { ReactNode } from "react";

const SUBJECT_ICONS: Record<string, ReactNode> = {
  Physics: <Atom size={24} />,
  Chemistry: <Compass size={24} />,
  Math: <Cpu size={24} />,
  Biology: <Dna size={24} />,
};

export default function SubjectCard({ subject, count }: { subject: string; count: number }) {
  const { navigate } = useHapticRouter();
  const Icon = SUBJECT_ICONS[subject] ?? <Atom size={24} />;
  
  return (
    <button onClick={(e) => navigate(`/learn?subject=${subject}`, e)} className="w-full text-left cursor-pointer">
      <motion.div 
        layoutId={`subject-${subject}`}
        whileTap={{ scale: 0.95 }} 
        className="bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 shadow-xl rounded-3xl overflow-hidden relative p-6 flex flex-col justify-center h-36 hover:shadow-2xl transition-all group"
      >
        {/* Edge-to-Edge Image with Gradient Mask */}
        <div className="absolute inset-y-0 right-0 w-[60%] md:w-[55%] pointer-events-none z-0">
          <img 
            src={subject === 'Chemistry' ? 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop' : `/images/subjects/${subject.toLowerCase()}.jpg`} 
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" 
            style={{ maskImage: 'linear-gradient(to left, black 30%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 100%)' }}
            alt={subject} 
          />
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 w-1/2">
          <span className="text-purple-600 dark:text-purple-400 mb-3 block">{Icon}</span>
          <span className="font-sora font-semibold text-xl text-neutral-900 dark:text-white block tracking-tight">{subject}</span>
          <span className="font-geist text-sm text-black dark:text-neutral-400 mt-1 block">{count} chapters</span>
        </div>
      </motion.div>
    </button>
  );
}
