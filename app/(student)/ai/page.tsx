"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Camera, Sparkles, X, ChevronLeft, Plus, Mic, MessageSquare, Circle, CheckCircle2, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore, vibrate } from "@/lib/store";
import { useRouter } from "next/navigation";
import { fbDb, fbAuth } from "@/lib/firebase";
import { addDoc, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { col, createAiChat, updateAiChat } from "@/lib/db";
import { AiChatMsg, AiChatDoc, ActionItem } from "@/lib/types";
import GlassCard from "@/components/GlassCard";

export default function AiLab() {
  const { profile, config, todos, prefs } = useStore();
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
  const [isNearBottom, setIsNearBottom] = useState(true);
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
    const target = e.currentTarget;
    setIsNearBottom(target.scrollHeight - target.scrollTop - target.clientHeight < 50);
  };

  // Smooth scroll
  useEffect(() => {
    if (isNearBottom) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [msgs, busy, isNearBottom]);

  if (!profile) return null;
  if (!config.features.ai)
    return <p className="pt-20 text-center font-hanken text-body-md text-white/50">AI Lab is switched off right now.</p>;

  const firstName = (profile.name || "Student").split(" ")[0];

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
      const token = await fbAuth().currentUser?.getIdToken();
      
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ 
          messages: next,
          stream: profile.stream,
          grade: profile.grade,
          language: prefs.language
        }),
      });

      if (!r.ok || !r.body) {
        if (r.status === 401) throw new Error("Session expired. Please log in again.");
        if (r.status === 429) throw new Error("Daily AI limit reached.");
        throw new Error("Server error: " + r.status);
      }

      const reader = r.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);
              const textChunk = parsed.choices?.[0]?.delta?.content;
              if (textChunk) {
                fullText += textChunk;
                setMsgs((m) => {
                  const updated = [...m];
                  const displayText = fullText.split("[ACTION_PLAN_JSON]")[0].trim();
                  updated[modelIndex] = { role: "model", text: displayText };
                  return updated;
                });
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }

      let finalText = fullText;
      let actionItems: ActionItem[] | undefined = undefined;

      const actionMatch = fullText.match(/\[ACTION_PLAN_JSON\]([\s\S]*?)\[\/ACTION_PLAN_JSON\]/);
      if (actionMatch) {
        try {
          actionItems = JSON.parse(actionMatch[1]);
          finalText = fullText.replace(actionMatch[0], "").trim();
          
          // Sync action items to Today's Focus (Todos)
          if (actionItems && actionItems.length > 0) {
            Promise.all(actionItems.map(item => addDoc(col.todos(profile.uid), {
              title: item.task_name,
              category: "General",
              durationMinutes: item.duration_minutes,
              urgency: item.urgency,
              status: "todo",
              createdAt: Date.now()
            }))).catch(console.error);
          }
        } catch (e) {
          console.error("Failed to parse action items", e);
        }
      }

      const finalMsgs: AiChatMsg[] = [...next, { role: "model", text: finalText, action_items: actionItems }];
      setMsgs(finalMsgs);

      // Save to Firebase without image payload to avoid 1MiB limit
      const saveMsgs = finalMsgs.map(m => {
        if (m.image) {
          const { image, ...rest } = m;
          return { ...rest, text: m.text ? m.text + "\n[Image attached]" : "[Image attached]" };
        }
        return m;
      });

      if (chatId) {
        await updateAiChat(profile.uid, chatId, { messages: saveMsgs, updatedAt: Date.now() });
      } else {
        const title = t.length > 30 ? t.substring(0, 30) + "..." : t || "Image Doubt";
        const newChat = await addDoc(col.aiChats(profile.uid), {
          title,
          messages: saveMsgs,
          updatedAt: Date.now()
        });
        setChatId(newChat.id);
      }
    } catch (error: any) {
      console.error("Frontend Crash Prevented:", error);
      setMsgs((m) => {
        const copy = [...m];
        copy[modelIndex] = { role: "model", text: error.message || "Something went wrong on the network. Try again!" };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
      <div className="flex h-[100dvh] lg:h-[calc(100vh-1.5rem)] w-full gap-0 lg:gap-6 relative px-4 pt-[calc(env(safe-area-inset-top,3rem)+5rem)] pb-4 sm:px-8 lg:px-0 lg:pt-6 overflow-hidden">
      
      {/* Mobile Floating Top Buttons */}
      <div className="lg:hidden absolute top-[calc(env(safe-area-inset-top,3rem)+2rem)] left-4 right-4 px-2 z-50 flex items-center justify-between pointer-events-none">
        <button onClick={() => { vibrate(10); router.push("/home"); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 text-on-surface pointer-events-auto shadow-lg">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => { vibrate(10); setIsMobileHistoryOpen(true); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 text-on-surface pointer-events-auto shadow-lg">
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
            className="lg:hidden fixed inset-0 z-[100] bg-white/10 dark:bg-black/40 backdrop-blur-lg flex flex-col w-full h-full p-6 pt-16"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-sora font-semibold text-xl text-on-surface">Chat History</span>
              <button onClick={() => { vibrate(10); setIsMobileHistoryOpen(false); }} className="w-10 h-10 flex items-center justify-center rounded-full glassy border border-white/10 text-on-surface">
                <X size={20} />
              </button>
            </div>
            
            <button onClick={startNewChat} className="btn-glass rounded-full px-5 py-3.5 mb-8 w-max">
              <Plus size={18} className="text-on-surface" />
              <span className="font-geist font-medium text-sm text-on-surface">New chat</span>
            </button>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              <p className="font-geist text-xs font-semibold text-on-surface mb-3 px-2">Recent</p>
              <div className="space-y-1">
                {chatDocs.map((chat) => (
                  <button key={chat.id} onClick={() => loadChat(chat)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-left group ${chatId === chat.id ? "bg-white/10 dark:bg-white/10" : ""}`}>
                    <MessageSquare size={16} className="text-on-surface transition-colors shrink-0" />
                    <span className="font-hanken font-bold text-sm text-on-surface truncate">{chat.title}</span>
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
            className="absolute top-4 lg:top-0 left-0 w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-white/10 dark:hover:bg-white/10 backdrop-blur-md border border-white/10 text-on-surface transition-colors z-20 shadow-lg"
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
              className="flex flex-col rounded-[2.5rem] bg-surface-container backdrop-blur-lg border border-white/10 p-4 h-[calc(100vh-3rem)] mt-0 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8 w-max min-w-full pt-6">
                <button onClick={startNewChat} className="btn-glass rounded-full px-5 py-3.5">
                  <Plus size={18} className="text-on-surface" />
                  <span className="font-geist font-medium text-sm text-on-surface">New chat</span>
                </button>
                <button 
                  onClick={() => { vibrate(10); setIsExpanded(false); }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-white/10 transition-colors text-on-surface"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto hide-scrollbar w-[248px]">
                <p className="font-geist text-xs font-semibold text-on-surface mb-3 px-2">Recent</p>
                <div className="space-y-1">
                  {chatDocs.map((chat) => (
                    <button key={chat.id} onClick={() => loadChat(chat)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-left group ${chatId === chat.id ? "bg-white/10 dark:bg-white/10" : ""}`}>
                      <MessageSquare size={16} className="text-on-surface transition-colors shrink-0" />
                      <span className="font-hanken font-bold text-sm text-on-surface truncate">{chat.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative pt-20 lg:pt-0 pb-24 h-full">
        <div onScroll={handleScroll} className="flex-1 overflow-y-auto hide-scrollbar flex flex-col px-4 lg:px-12 w-full max-w-4xl mx-auto">
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
                {msgs.map((m, i) => {
                  if (busy && m.role === "model" && m.text === "" && i === msgs.length - 1) return null;
                  return (
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
                        ? "text-on-surface glassy rounded-[1.5rem] rounded-tr-sm" 
                        : "text-on-surface bg-transparent"
                    }`}>
                      {m.image && (
                        <img src={m.image} alt="Upload" className="max-w-[240px] w-full h-auto rounded-xl mb-3 border border-white/20 object-cover shadow-sm" />
                      )}
                      {m.text}
                    </div>
                    {m.action_items && m.action_items.length > 0 && (
                      <GlassCard className={`mt-2 ${m.role === "user" ? "mr-2" : "ml-8 lg:ml-10"} max-w-[85%] w-full rounded-2xl p-4 shadow-xl`}>
                        <p className="font-sora font-semibold text-sm text-on-surface mb-3">Action Plan</p>
                        <div className="space-y-3">
                          {m.action_items.map((task, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <button className="mt-0.5 shrink-0 text-on-surface hover:text-purple-500 transition-colors">
                                <Circle size={18} />
                              </button>
                              <div className="flex-1">
                                <p className="font-hanken text-sm text-on-surface leading-tight">{task.task_name}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="font-geist text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full glassy text-on-surface">
                                    {task.duration_minutes} mins
                                  </span>
                                  <span className={`font-geist text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${
                                    task.urgency === "High" ? "bg-error-container text-on-error-container" :
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
                      </GlassCard>
                    )}
                  </motion.div>
                  );
                })}
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
      <div className="absolute bottom-[calc(env(safe-area-inset-bottom,1.5rem)+1.5rem)] left-0 right-0 w-full px-4 lg:px-0 lg:w-[92%] max-w-[800px] mx-auto z-[70]">
        {/* Image Preview Overlay */}
        {image && (
          <div className="absolute -top-20 left-6">
            <div className="relative p-1 bg-white/10 dark:bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
              <img src={image} className="w-16 h-16 object-cover rounded-xl" alt="Preview" />
              <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-black rounded-full p-1 text-white border border-white/20 shadow-lg hover:bg-neutral-800 transition-colors">
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <div className="glassy rounded-full p-2 pl-4 flex items-center gap-2 shadow-2xl">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImage}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:text-black dark:hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <Plus size={22} />
          </button>
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send(input)}
            placeholder="Ask AI-Tutor..."
            className="bg-transparent outline-none flex-1 min-w-0 font-hanken text-lg text-on-surface placeholder:text-black/50 dark:placeholder:text-white/50 pr-2"
          />

          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => void send(input)} 
            disabled={busy || (!input.trim() && !image)} 
            className="btn-primary w-11 h-11 rounded-full p-0 flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </motion.button>
        </div>
        <p className="text-center text-[11px] font-geist text-on-surface mt-3 hidden md:block">
          Gemini may display inaccurate info, so double-check its responses.
        </p>
      </div>
      </div>
      </div>
    </div>
  );
}
