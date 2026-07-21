"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, Trash2, Calendar, CheckCircle2, Circle, Edit2, X, Sparkles } from "lucide-react";
import { useStore, vibrate } from "@/lib/store";
import { useRouter } from "next/navigation";
import { col } from "@/lib/db";
import { addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { fbDb } from "@/lib/firebase";
import type { TodoTask } from "@/lib/types";

const CATEGORIES = ["All", "Physics", "Chemistry", "Math", "Biology", "General"];
const URGENCIES = ["High", "Medium", "Low"];

export default function TodoApp() {
  const { profile, todos } = useStore();
  const router = useRouter();
  
  const [filterCat, setFilterCat] = useState("All");
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [urgency, setUrgency] = useState<"High"|"Medium"|"Low">("Medium");
  const [dueDate, setDueDate] = useState("");

  if (!profile) return null;

  const filteredTodos = todos.filter(t => filterCat === "All" || t.category === filterCat);
  const pendingTodos = filteredTodos.filter(t => t.status === "todo");
  const completedTodos = filteredTodos.filter(t => t.status === "done");

  const resetForm = () => {
    setTitle("");
    setCategory("General");
    setUrgency("Medium");
    setDueDate("");
    setIsAdding(false);
    setIsEditing(null);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    vibrate(10);
    
    if (isEditing) {
      await updateDoc(doc(fbDb(), "users", profile.uid, "todos", isEditing), {
        title, category, urgency, dueDate
      });
    } else {
      await addDoc(col.todos(profile.uid), {
        title,
        category,
        urgency,
        dueDate,
        durationMinutes: 30, // Default AI duration
        status: "todo",
        createdAt: Date.now()
      });
    }
    resetForm();
  };

  const toggleStatus = async (task: TodoTask) => {
    vibrate(10);
    await updateDoc(doc(fbDb(), "users", profile.uid, "todos", task.id), {
      status: task.status === "todo" ? "done" : "todo"
    });
  };

  const deleteTask = async (taskId: string) => {
    vibrate(20);
    await deleteDoc(doc(fbDb(), "users", profile.uid, "todos", taskId));
  };

  const openEdit = (task: TodoTask) => {
    setTitle(task.title);
    setCategory(task.category || "General");
    setUrgency(task.urgency || "Medium");
    setDueDate(task.dueDate || "");
    setIsEditing(task.id);
    setIsAdding(true);
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] lg:h-auto min-h-[calc(100vh-4rem)] w-full gap-6 relative px-4 lg:px-8 py-0">

      {/* Mobile Floating Back Button */}
      <button 
        onClick={() => { vibrate(10); router.push("/home"); }} 
        className="lg:hidden absolute top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 text-black dark:text-white pointer-events-auto shadow-lg hover:bg-white/20 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="w-full max-w-4xl flex flex-col h-full pt-20 lg:pt-14">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { vibrate(10); router.push("/home"); }} 
              className="hidden lg:flex w-10 h-10 items-center justify-center rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 text-black dark:text-white pointer-events-auto shadow-lg shrink-0 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white mb-2 font-sora tracking-tight">
                Focus Mode
              </h1>
              <p className="font-geist text-body-lg text-neutral-600 dark:text-neutral-400">Organize your study plan and dominate your goals.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button 
              onClick={() => { vibrate(10); router.push("/ai"); }}
              className="flex items-center justify-center gap-2 bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-6 py-3 rounded-full font-geist font-bold hover:bg-purple-600/20 transition-all w-full sm:w-max shrink-0"
            >
              <Sparkles size={18} />
              AI Generate
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-geist font-bold shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all w-full sm:w-max shrink-0"
            >
              <Plus size={18} />
              Add Task
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-5 py-2.5 rounded-full font-geist text-sm font-bold whitespace-nowrap transition-all border ${
                filterCat === cat 
                  ? "bg-purple-600 text-white border-purple-500" 
                  : "bg-white/10 dark:bg-white/5 text-black dark:text-white border-white/20 hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main List Area */}
        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-6 pb-24">
          
          {/* Pending Tasks */}
          <div className="space-y-3">
            <h2 className="font-sora text-sm font-bold text-black/40 dark:text-white/40 uppercase tracking-widest px-2">Pending ({pendingTodos.length})</h2>
            <AnimatePresence>
              {pendingTodos.map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm hover:shadow-md hover:bg-white/10 dark:hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
                    <button onClick={() => toggleStatus(task)} className="text-neutral-400 hover:text-purple-500 transition-colors shrink-0">
                      <Circle size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-hanken text-base text-black dark:text-white font-medium truncate">{task.title}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="font-geist text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-white/50 dark:bg-white/10 text-black dark:text-white border border-black/5 dark:border-white/5">
                          {task.category || "General"}
                        </span>
                        <span className={`font-geist text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                          task.urgency === "High" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" :
                          task.urgency === "Medium" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" :
                          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        }`}>
                          {task.urgency || "Medium"}
                        </span>
                        {task.dueDate && (
                          <span className="font-geist text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 flex items-center gap-1 border border-black/5 dark:border-white/5">
                            <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end w-full sm:w-auto gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity mt-2 sm:mt-0 border-t border-black/5 dark:border-white/5 sm:border-t-0 pt-2 sm:pt-0">
                    <button onClick={() => openEdit(task)} className="p-2 text-black/40 dark:text-white/40 hover:text-blue-500 transition-colors flex items-center gap-2">
                      <Edit2 size={16} /> <span className="sm:hidden font-geist text-xs font-bold uppercase">Edit</span>
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-2 text-black/40 dark:text-white/40 hover:text-red-500 transition-colors flex items-center gap-2">
                      <Trash2 size={16} /> <span className="sm:hidden font-geist text-xs font-bold uppercase">Delete</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {pendingTodos.length === 0 && (
              <div className="text-center py-12 px-4 border border-dashed border-black/10 dark:border-white/10 rounded-3xl bg-black/5 dark:bg-white/5">
                <p className="font-hanken text-black/40 dark:text-white/40">You're all caught up! Enjoy your free time or ask the AI for a new plan.</p>
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          {completedTodos.length > 0 && (
            <div className="space-y-3 mt-8">
              <h2 className="font-sora text-sm font-bold text-black/40 dark:text-white/40 uppercase tracking-widest px-2">Completed ({completedTodos.length})</h2>
              <AnimatePresence>
                {completedTodos.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 opacity-60 hover:opacity-100 hover:bg-white/10 dark:hover:bg-white/10 transition-all"
                  >
                    <button onClick={() => toggleStatus(task)} className="text-green-500 hover:text-neutral-400 transition-colors shrink-0">
                      <CheckCircle2 size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-hanken text-base text-black dark:text-white font-medium line-through truncate">{task.title}</p>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="p-2 text-black/40 dark:text-white/40 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100">
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal Overlay */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/20 dark:bg-black/60 backdrop-blur-md flex items-center justify-center p-0 lg:p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white/90 dark:bg-[#1a1a1f] border border-white/20 dark:border-white/10 lg:shadow-2xl rounded-none lg:rounded-[2rem] w-full h-full lg:h-auto max-w-lg p-6 pt-16 lg:pt-8 lg:p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-sora text-2xl font-bold text-black dark:text-white">
                  {isEditing ? "Edit Task" : "New Task"}
                </h2>
                <button onClick={resetForm} className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="font-geist text-xs font-bold text-black/60 dark:text-white/60 uppercase tracking-widest mb-2 block">Task Title</label>
                  <input 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Read Physics Chapter 4"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-hanken text-black dark:text-white outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-geist text-xs font-bold text-black/60 dark:text-white/60 uppercase tracking-widest mb-2 block">Category</label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-hanken text-black dark:text-white outline-none focus:border-purple-500 transition-colors appearance-none"
                    >
                      {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-geist text-xs font-bold text-black/60 dark:text-white/60 uppercase tracking-widest mb-2 block">Priority</label>
                    <select 
                      value={urgency}
                      onChange={e => setUrgency(e.target.value as any)}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-hanken text-black dark:text-white outline-none focus:border-purple-500 transition-colors appearance-none"
                    >
                      {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-geist text-xs font-bold text-black/60 dark:text-white/60 uppercase tracking-widest mb-2 block">Due Date (Optional)</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-hanken text-black dark:text-white outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="mt-auto pt-8">
                <button 
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-geist font-bold text-lg py-4 rounded-xl shadow-lg disabled:opacity-50 transition-opacity"
                >
                  Save Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
