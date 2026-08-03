"use client";

import { motion } from "framer-motion";
import { useHapticRouter } from "@/components/HapticRouter";
import { Atom, Compass, Cpu, Dna, FlaskConical, Pi } from "lucide-react";
import { ReactNode } from "react";

const SUBJECT_ICONS: Record<string, ReactNode> = {
  Physics: <Atom size={20} />,
  Chemistry: <FlaskConical size={20} />,
  Math: <Pi size={20} />,
  Biology: <Dna size={20} />,
};

export default function SubjectCard({ subject, count }: { subject: string; count: number }) {
  const { navigate } = useHapticRouter();
  const Icon = SUBJECT_ICONS[subject] ?? <Atom size={20} />;
  
  return (
    <button onClick={(e) => navigate(`/learn?subject=${subject}`, e)} className="w-full text-left cursor-pointer">
      <motion.div 
        layoutId={`subject-${subject}`}
        whileTap={{ scale: 0.95 }} 
        className="relative bg-white/70 backdrop-blur-xl dark:backdrop-blur-none dark:bg-[#1a1c23] rounded-[1.25rem] p-5 w-full shadow-lg border border-black/10 dark:border-white/5 overflow-hidden transition-all flex flex-col justify-center h-[120px] hover:brightness-105 dark:hover:brightness-110 group"
      >
        {/* Edge-to-Edge Image with Gradient Mask */}
        <div className="absolute inset-y-0 right-0 w-[60%] md:w-[65%] pointer-events-none z-0">
          <img 
            src={
              subject === 'Chemistry' ? 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop' :
              subject === 'Math' ? 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop' :
              subject === 'Physics' ? 'https://images.unsplash.com/photo-1636819488524-1f019c4e1c44?q=80&w=1000&auto=format&fit=crop' :
              `/images/subjects/${subject.toLowerCase()}.jpg`
            } 
            className="absolute inset-0 w-full h-full object-cover opacity-100 dark:opacity-80 dark:mix-blend-screen transition-transform duration-700 group-hover:scale-105" 
            style={{ maskImage: 'linear-gradient(to left, black 10%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 10%, transparent 100%)' }}
            alt={subject} 
          />
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 w-1/2 flex flex-col justify-center h-full">
          <span className="text-purple-600 dark:text-[#9d72ff] mb-2 block">{Icon}</span>
          <span className="font-sora font-bold text-lg text-neutral-900 dark:text-white block tracking-tight">{subject}</span>
          <span className="font-geist text-xs text-neutral-600 dark:text-neutral-400 mt-1 block">{count} Chapter{count === 1 ? '' : 's'}</span>
        </div>
      </motion.div>
    </button>
  );
}
