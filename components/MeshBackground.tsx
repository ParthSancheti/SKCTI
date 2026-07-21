"use client";

export default function MeshBackground() {
  return (
    <div className="fixed inset-0 z-[-50] overflow-hidden pointer-events-none bg-[#f0f4f8] dark:bg-[#050508] transition-colors duration-500">
      {/* The hue-shifting fluid wave container */}
      <div 
        className="absolute inset-0 w-full h-full" 
        style={{ animation: "hue-shift 20s infinite ease-in-out" }}
      >
        {/* Orb 1: Purple/Pink */}
        <div className="absolute top-[-10%] left-[-20%] w-[120vw] md:w-[60vw] h-[120vw] md:h-[60vw] rounded-full blur-[100px] md:blur-[140px] opacity-60 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen bg-gradient-to-tr from-purple-600 to-pink-500 animate-[spin_25s_linear_infinite]" />
        
        {/* Orb 2: Blue/Cyan */}
        <div className="absolute bottom-[-10%] right-[-20%] w-[100vw] md:w-[50vw] h-[100vw] md:h-[50vw] rounded-full blur-[100px] md:blur-[140px] opacity-60 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen bg-gradient-to-tr from-blue-600 to-cyan-400 animate-[spin_30s_linear_infinite_reverse]" />
        
        {/* Orb 3: Indigo/Violet */}
        <div className="absolute top-[20%] right-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] rounded-full blur-[100px] md:blur-[140px] opacity-50 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen bg-gradient-to-bl from-indigo-500 to-violet-600 animate-[spin_35s_linear_infinite]" />
        
        {/* Orb 4: Rose/Orange */}
        <div className="absolute bottom-[20%] left-[-10%] w-[90vw] md:w-[60vw] h-[90vw] md:h-[60vw] rounded-full blur-[100px] md:blur-[140px] opacity-50 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen bg-gradient-to-tr from-rose-500 to-orange-400 animate-[spin_28s_linear_infinite_reverse]" />
      </div>
    </div>
  );
}
