"use client";

import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useStore, vibrate } from "@/lib/store";
import { useRouter } from "next/navigation";
import { updateDoc, doc } from "firebase/firestore";
import { col } from "@/lib/db";
import { TodoTask } from "@/lib/types";

export default function TodoWidget() {
  const { todos, profile } = useStore();
  const router = useRouter();
  
  const todayTasks = todos.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString());
  const total = todayTasks.length;
  const completed = todayTasks.filter(t => t.status === "done").length;
  const progress = total === 0 ? 0 : (completed / total) * 100;
  const strokeDasharray = 2 * Math.PI * 36;
  const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

  const toggleTask = async (e: React.MouseEvent, task: TodoTask) => {
    e.stopPropagation();
    vibrate(10);
    if (!profile) return;
    try {
      await updateDoc(doc(col.todos(profile.uid), task.id), {
        status: task.status === "done" ? "todo" : "done"
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="block outline-none">
      <motion.div 
        onClick={() => { vibrate(10); router.push("/todo"); }}
        whileHover={{ scale: 0.99, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="relative bg-white/5 dark:bg-white/5 rounded-[2.5rem] p-6 lg:p-8 w-full shadow-2xl border border-white/10 backdrop-blur-3xl overflow-hidden cursor-pointer transition-all"
      >
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="font-sora text-2xl font-bold text-black dark:text-white flex items-center gap-2">
            Today's Focus
          </h2>
          {total > 0 && (
            <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-geist text-xs font-bold px-4 py-1.5 rounded-full border border-purple-500/20 uppercase tracking-widest shadow-sm">
              In Progress
            </span>
          )}
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center relative z-10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4 border border-white/10 shadow-xl">
              <Sparkles size={28} className="text-purple-500 dark:text-purple-400" />
            </div>
            <h3 className="font-sora text-lg font-semibold text-black dark:text-white mb-2">No tasks yet</h3>
            <p className="font-hanken text-sm text-neutral-500 dark:text-neutral-400 max-w-[200px] mb-6">Ask your AI tutor to generate a personalized study plan for today.</p>
            <button className="flex items-center gap-2 font-geist text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-shadow">
              Get Started <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
            
            {/* Left Half: Big Pie Chart */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center text-center">
              <div className="relative w-36 h-36 flex items-center justify-center mb-4 drop-shadow-2xl">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-black/5 dark:text-white/5" />
                  <circle 
                    cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6" 
                    className="text-purple-600 dark:text-purple-400 transition-all duration-1000 ease-out" 
                    strokeDasharray={strokeDasharray} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-sora text-3xl font-black text-black dark:text-white">{Math.round(progress)}%</span>
                  <span className="font-geist text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">Done</span>
                </div>
              </div>
              <p className="font-hanken text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-[200px]">
                {total - completed === 0 ? "All tasks completed! You're on fire! 🔥" : `Complete ${total - completed} more tasks to maintain your streak!`}
              </p>
            </div>

            {/* Right Half: Clickable List */}
            <div className="w-full lg:w-1/2 flex flex-col gap-3">
              {todayTasks.slice(0, 4).map(task => (
                <div 
                  key={task.id} 
                  onClick={(e) => toggleTask(e, task)}
                  className={`flex items-center gap-4 p-4 rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 transition-all shadow-sm hover:bg-white/10 dark:hover:bg-white/10 ${task.status === "done" ? 'opacity-60' : ''}`}
                >
                  <button className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors">
                    {task.status === "done" ? (
                      <CheckCircle2 size={24} className="text-green-500 hover:text-neutral-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-neutral-400 hover:border-purple-500 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 overflow-hidden">
                    <span className={`font-hanken text-sm text-black dark:text-white block truncate ${task.status === "done" ? 'line-through text-neutral-500 dark:text-neutral-400' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                  {task.urgency === "High" && task.status !== "done" && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  )}
                </div>
              ))}
              {todayTasks.length > 4 && (
                <p className="text-center font-geist text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest pt-2">
                  + {todayTasks.length - 4} more tasks
                </p>
              )}
            </div>

          </div>
        )}
      </motion.div>
    </div>
  );
}
