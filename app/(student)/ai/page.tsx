"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore, vibrate } from "@/lib/store";

interface Msg { role: "user" | "model"; text: string; }

export default function AiLab() {
  const { profile, config } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  if (!profile) return null;
  if (!config.features.ai)
    return <p className="pt-20 text-center font-hanken text-body-md text-on-surface/50">AI Lab is switched off right now.</p>;

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    vibrate(10);
    const next: Msg[] = [...msgs, { role: "user", text: t }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, stream: profile.stream, grade: profile.grade }),
      });
      const data = await r.json();
      setMsgs((m) => [...m, { role: "model", text: r.ok ? data.text : `Hmm, the AI engine hiccuped (${data.error}). Try again?` }]);
    } catch {
      setMsgs((m) => [...m, { role: "model", text: "Network wobble — send that again?" }]);
    } finally {
      setBusy(false);
    }
  };

  const chips = [
    `Explain a tough ${profile.stream === "PCB" ? "Biology" : "Math"} concept`,
    "Make a 1-hour revision sprint",
    "5 PYQ-style questions on my weakest chapter",
  ];

  return (
    <div className="pt-6 flex flex-col min-h-[calc(100dvh-180px)]">
      <div className="mb-4">
        <h1 className="font-sora text-headline-xl flex items-center gap-2"><Sparkles size={22} className="text-primary" /> AI Lab</h1>
        <p className="font-hanken text-body-md text-on-surface/60 mt-1">Gemini-powered doubt solver · knows you&apos;re {profile.stream} {profile.grade}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto hide-scrollbar pb-4">
        {msgs.length === 0 && (
          <div className="glassy rounded-glass p-8 text-center">
            <p className="font-sora font-semibold">Ask me anything</p>
            <p className="font-hanken text-body-md text-on-surface/50 mt-1 mb-5">Doubts, derivations, revision plans — instant answers.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {chips.map((c) => (
                <button key={c} onClick={() => void send(c)} className="glassy rounded-full px-4 py-2 font-geist text-label-sm text-primary">{c}</button>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`max-w-[85%] rounded-glass px-5 py-3.5 font-hanken text-body-md whitespace-pre-wrap ${
                m.role === "user" ? "ml-auto text-white" : "glassy"
              }`}
              style={m.role === "user" ? { background: "linear-gradient(135deg, rgba(234,88,12,0.9), rgba(127,29,29,0.9))", backdropFilter: "blur(12px)" } : undefined}
            >
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <div className="glassy rounded-glass px-5 py-3.5 w-24 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="w-2 h-2 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-28 lg:bottom-6 glassy-strong rounded-full p-2 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void send(input)}
          placeholder="Type your doubt…"
          className="bg-transparent outline-none flex-1 px-4 font-hanken text-body-md placeholder:text-on-surface/30"
        />
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => void send(input)} disabled={busy} aria-label="Send" className="w-11 h-11 rounded-full bg-primary-container text-white flex items-center justify-center shrink-0 disabled:opacity-50">
          <ArrowUp size={18} />
        </motion.button>
      </div>
    </div>
  );
}
