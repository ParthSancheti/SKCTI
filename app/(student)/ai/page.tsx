"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Camera, Sparkles, X, ChevronLeft, Plus, Mic, MessageSquare, Circle, CheckCircle2, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore, vibrate } from "@/lib/store";
import { useRouter } from "next/navigation";
import { fbDb } from "@/lib/firebase";
import { addDoc, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { col, createAiChat, updateAiChat } from "@/lib/db";
import { AiChatMsg, AiChatDoc, ActionItem } from "@/lib/types";

export default function AiLab() {
  const { profile, config, todos } = useStore();
  const router = useRouter();
  const [chatDocs, setChatDocs] = useState<AiChatDoc[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<AiChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat history documents
  useEffect(() => {
    if (!profile) return;
    const q = query(col.aiChats(profile.uid), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AiChatDoc));
      setChatDocs(docs);
    });
  }, [profile?.uid]);

  const startNewChat = () => {
    vibrate(10);
    setChatId(null);
    setMsgs([]);
    setIsExpanded(false);
    setIsMobileHistoryOpen(false);
  };

  const loadChat = (chat: AiChatDoc) => {
    vibrate(10);
    setChatId(chat.id);
    setMsgs(chat.messages || []);
    setIsExpanded(false);
    setIsMobileHistoryOpen(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 20);
  };

  // Smooth scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  if (!profile) return null;
  if (!config.features.ai)
    return <p className="pt-20 text-center font-hanken text-body-md text-white/50">AI Lab is switched off right now.</p>;

  const firstName = profile.name.split(" ")[0];

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const send = async (text: string) => {
    const t = text.trim();
    if ((!t && !image) || busy) return;
    vibrate(10);

    const userMsg: AiChatMsg = { role: "user", text: t, ...(image && { image }) };
    const next: AiChatMsg[] = [...msgs, userMsg];
    setMsgs(next);
    setInput("");
    setImage(null);
    setBusy(true);

    setMsgs((m) => [...m, { role: "model", text: "" }]);
    const modelIndex = next.length;

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: t,
          context: {
            stream: profile.stream,
            grade: profile.grade,
            todos: todos.map(t => ({ title: t.title, status: t.status }))
          }
        }),
      });

      if (!r.ok) {
        throw new Error("Server error: " + r.status);
      }

      const data = await r.json();
      if (!data || !data.chat_response) {
        throw new Error("Invalid data format received from API");
      }
      
      const aiMsg: AiChatMsg = { 
        role: "model", 
        text: data.chat_response,
        action_items: data.action_items || []
      };

      const finalMsgs = [...next, aiMsg];
      setMsgs(finalMsgs);

      // Save to Firebase
      if (chatId) {
        await updateAiChat(profile.uid, chatId, { messages: finalMsgs, updatedAt: Date.now() });
      } else {
        const title = t.length > 30 ? t.substring(0, 30) + "..." : t;
        const newChat = await addDoc(col.aiChats(profile.uid), {
          title,
          messages: finalMsgs,
          updatedAt: Date.now()
        });
        setChatId(newChat.id);
      }

      // SYNC: Push AI generated action items to Firebase Todos
      if (data.action_items && data.action_items.length > 0) {
        Promise.all(data.action_items.map((item: ActionItem) => 
          addDoc(col.todos(profile.uid), {
            title: item.task_name,
            category: "General",
            durationMinutes: item.duration_minutes,
            urgency: item.urgency,
            status: "todo",
            createdAt: Date.now()
          })
        )).catch(console.error);
      }

    } catch (error) {
      console.error("Frontend Crash Prevented:", error);
      setMsgs((m) => {
        const copy = [...m];
        copy[modelIndex] = { role: "model", text: "Something went wrong on the network. Try again!" };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] w-full gap-6 relative lg:pt-6">
      
      {/* Mobile Floating Top Buttons */}
      <div className={`lg:hidden absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${scrolled ? "opacity-0" : "opacity-100"}`}>
        <button onClick={() => { vibrate(10); router.push("/home"); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 text-black dark:text-white pointer-events-auto shadow-lg">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => { vibrate(10); setIsMobileHistoryOpen(true); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 text-black dark:text-white pointer-events-auto shadow-lg">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile History Drawer Overlay */}
      <AnimatePresence>
        {isMobileHistoryOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -50 }}
            className="lg:hidden fixed inset-0 z-[100] bg-white/10 dark:bg-black/40 backdrop-blur-[40px] flex flex-col w-full h-full p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-sora font-semibold text-xl text-black dark:text-white">Chat History</span>
              <button onClick={() => { vibrate(10); setIsMobileHistoryOpen(false); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 dark:bg-white/5 border border-white/10 text-black dark:text-white">
                <X size={20} />
              </button>
            </div>
            
            <button onClick={startNewChat} className="flex items-center gap-3 bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 transition-colors rounded-full px-5 py-3.5 mb-8 w-max">
              <Plus size={18} className="text-black dark:text-white" />
              <span className="font-geist font-medium text-sm text-black dark:text-white">New chat</span>
            </button>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              <p className="font-geist text-xs font-semibold text-black dark:text-white mb-3 px-2">Recent</p>
              <div className="space-y-1">
                {chatDocs.map((chat) => (
                  <button key={chat.id} onClick={() => loadChat(chat)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-left group ${chatId === chat.id ? "bg-white/10 dark:bg-white/10" : ""}`}>
                    <MessageSquare size={16} className="text-black dark:text-white transition-colors shrink-0" />
                    <span className="font-hanken text-sm text-black dark:text-white truncate">{chat.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat History Sidebar (PC Only) */}
      <div className="hidden lg:flex relative">
        {/* Collapsed State Hamburger */}
        {!isExpanded && (
          <button 
            onClick={() => { vibrate(10); setIsExpanded(true); }}
            className="absolute top-4 lg:top-0 left-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 backdrop-blur-md border border-white/10 text-black dark:text-white transition-colors z-20 shadow-lg"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Expanded Glass Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, width: 0, marginLeft: -20 }}
              animate={{ opacity: 1, width: 280, marginLeft: 0 }}
              exit={{ opacity: 0, width: 0, marginLeft: -20 }}
              className="flex flex-col rounded-[2.5rem] bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 p-4 h-[calc(100vh-3rem)] mt-0 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8 w-max min-w-full">
                <button onClick={startNewChat} className="flex items-center gap-3 bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 transition-colors rounded-full px-5 py-3.5">
                  <Plus size={18} className="text-black dark:text-white" />
                  <span className="font-geist font-medium text-sm text-black dark:text-white">New chat</span>
                </button>
                <button 
                  onClick={() => { vibrate(10); setIsExpanded(false); }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-white/10 transition-colors text-black dark:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto hide-scrollbar w-[248px]">
                <p className="font-geist text-xs font-semibold text-black dark:text-white mb-3 px-2">Recent</p>
                <div className="space-y-1">
                  {chatDocs.map((chat) => (
                    <button key={chat.id} onClick={() => loadChat(chat)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-left group ${chatId === chat.id ? "bg-white/10 dark:bg-white/10" : ""}`}>
                      <MessageSquare size={16} className="text-black dark:text-white transition-colors shrink-0" />
                      <span className="font-hanken text-sm text-black dark:text-white truncate">{chat.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative pt-14 lg:pt-0 pb-24 h-full">
        <div onScroll={handleScroll} className="flex-1 overflow-y-auto hide-scrollbar flex flex-col px-2 lg:px-12 w-full max-w-4xl mx-auto">
          {msgs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center mt-[-10vh]">
              {/* Animated SVG Star */}
              <motion.div 
                animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="mb-6 relative w-16 h-16 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 blur-xl opacity-50 rounded-full" />
                <Sparkles size={48} className="text-transparent bg-gradient-to-tr from-purple-400 to-blue-400 bg-clip-text relative z-10" />
                <Sparkles size={48} className="text-blue-500 absolute inset-0 m-auto mix-blend-overlay z-10" />
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-black to-gray-600 dark:from-gray-200 dark:to-gray-500 bg-clip-text text-transparent mb-2">
                What's the vibe, <br />{firstName}?
              </h1>
            </div>
          ) : (
            <div className="space-y-6 pb-12 w-full pt-6">
              <AnimatePresence initial={false}>
                {msgs.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col w-full ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    {m.role === "model" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center mb-2 shadow-lg">
                        <Sparkles size={16} className="text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-5 py-3.5 font-hanken text-body-md whitespace-pre-wrap shadow-sm ${
                      m.role === "user" 
                        ? "text-black dark:text-white bg-white/20 dark:bg-white/10 backdrop-blur-xl rounded-[1.5rem] rounded-tr-sm border border-white/20" 
                        : "text-black dark:text-white bg-transparent"
                    }`}>
                      {m.image && (
                        <img src={m.image} alt="Upload" className="max-w-[240px] w-full h-auto rounded-xl mb-3 border border-white/20 object-cover shadow-sm" />
                      )}
                      {m.text}
                    </div>
                    {m.action_items && m.action_items.length > 0 && (
                      <div className={`mt-2 ${m.role === "user" ? "mr-2" : "ml-8 lg:ml-10"} max-w-[85%] w-full bg-white/10 dark:bg-black/20 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-xl`}>
                        <p className="font-sora font-semibold text-sm text-black dark:text-white mb-3">Action Plan</p>
                        <div className="space-y-3">
                          {m.action_items.map((task, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <button className="mt-0.5 shrink-0 text-black dark:text-white hover:text-purple-500 transition-colors">
                                <Circle size={18} />
                              </button>
                              <div className="flex-1">
                                <p className="font-hanken text-sm text-black dark:text-white leading-tight">{task.task_name}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="font-geist text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full bg-white/10 dark:bg-white/5 text-black dark:text-white">
                                    {task.duration_minutes} mins
                                  </span>
                                  <span className={`font-geist text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${
                                    task.urgency === "High" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                                    task.urgency === "Medium" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                                    "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  }`}>
                                    {task.urgency}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {busy && msgs[msgs.length - 1]?.text === "" && (
                <div className="flex flex-col items-start w-full">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center mb-2 shadow-lg">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div className="flex gap-2 px-2 py-4">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="w-2 h-2 rounded-full bg-purple-500/50" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
      {/* Floating Input Console (Inside Main Chat Area for perfect centering) */}
      <div className="absolute bottom-6 left-0 right-0 w-[92%] max-w-[800px] mx-auto z-[70]">
        {/* Image Preview Overlay */}
        {image && (
          <div className="absolute -top-20 left-6">
            <div className="relative p-1 bg-white/10 dark:bg-black/50 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
              <img src={image} className="w-16 h-16 object-cover rounded-xl" alt="Preview" />
              <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-black rounded-full p-1 text-white border border-white/20 shadow-lg hover:bg-neutral-800 transition-colors">
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/10 dark:bg-[#1a1a1f]/80 backdrop-blur-[40px] rounded-full p-2 pl-4 flex items-center gap-2 border border-white/10 shadow-2xl">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImage}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-black dark:text-white hover:text-black dark:hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <Plus size={22} />
          </button>
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send(input)}
            placeholder="Ask Gemini..."
            className="bg-transparent outline-none flex-1 font-hanken text-lg text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
          />
          
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center text-black dark:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <Mic size={20} />
          </button>

          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => void send(input)} 
            disabled={busy || (!input.trim() && !image)} 
            aria-label="Send" 
            className="w-11 h-11 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg disabled:opacity-30 transition-opacity"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </motion.button>
        </div>
        <p className="text-center text-[11px] font-geist text-black dark:text-white mt-3 hidden md:block">
          Gemini may display inaccurate info, so double-check its responses.
        </p>
      </div>
      </div>
      </div>
    </div>
  );
}
