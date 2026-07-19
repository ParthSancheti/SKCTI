"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Coins, Gift, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fireCoinFly, useStore, vibrate } from "@/lib/store";

/* Frosted coin pill in the header — flashes + pulses when coins land. */
export function CoinPill() {
  const { profile, config } = useStore();
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    const h = () => {
      vibrate(20);
      setFlash((f) => f + 1);
    };
    window.addEventListener("skcti:coinflash", h);
    return () => window.removeEventListener("skcti:coinflash", h);
  }, []);
  if (!config.features.coins) return null;
  return (
    <motion.button
      id="coin-pill"
      key={flash}
      onClick={() => {
        vibrate(10);
        window.dispatchEvent(new Event("skcti:openshop"));
      }}
      className={`glassy rounded-full pl-2.5 pr-3.5 py-1.5 flex items-center gap-1.5 ${flash ? "pill-flash" : ""}`}
      whileTap={{ scale: 0.92 }}
    >
      <span className={flash ? "coin-pop inline-flex" : "inline-flex"}>
        <Coins size={15} className="text-primary" />
      </span>
      <span className="font-geist text-label-md tabular-nums">{profile?.coins ?? 0}</span>
    </motion.button>
  );
}

/* Renders flying coins from any (x,y) to the pill. */
export function CoinFlightLayer() {
  const [coins, setCoins] = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([]);
  useEffect(() => {
    const h = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      const pill = document.getElementById("coin-pill")?.getBoundingClientRect();
      const tx = pill ? pill.left + pill.width / 2 : window.innerWidth - 40;
      const ty = pill ? pill.top + pill.height / 2 : 30;
      const batch = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        dx: tx - x,
        dy: ty - y,
      }));
      setCoins((c) => [...c, ...batch]);
      window.setTimeout(() => window.dispatchEvent(new Event("skcti:coinflash")), 650);
      window.setTimeout(() => setCoins((c) => c.filter((k) => !batch.find((b) => b.id === k.id))), 900);
    };
    window.addEventListener("skcti:coinfly", h);
    return () => window.removeEventListener("skcti:coinfly", h);
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-[95]">
      {coins.map((c, i) => (
        <span
          key={c.id}
          className="coin-fly absolute"
          style={{
            left: c.x, top: c.y,
            ["--dx" as never]: `${c.dx}px`, ["--dy" as never]: `${c.dy}px`,
            animationDelay: `${(i % 6) * 60}ms`,
          }}
        >
          <Coins size={16} className="text-primary drop-shadow" />
        </span>
      ))}
    </div>
  );
}

export function CoinShopModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useStore();
  const coins = profile?.coins ?? 0;
  const perks = [
    { name: "Streak Freeze (1 day)", cost: 150 },
    { name: "Golden name on Rank list", cost: 400 },
    { name: "Priority doubt in AI hub", cost: 250 },
  ];
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[96]" />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md glassy-elite rounded-glass p-8 z-[97]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-sora text-headline-lg flex items-center gap-2"><Gift size={20} className="text-primary" /> Coin Shop</h2>
              <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full glassy flex items-center justify-center"><X size={16} /></button>
            </div>
            <p className="font-geist text-label-md text-on-surface/60 mb-6">Balance: <span className="text-primary font-semibold">{coins} coins</span></p>
            <div className="space-y-3">
              {perks.map((p) => (
                <div key={p.name} className="glassy rounded-input p-4 flex items-center justify-between">
                  <p className="font-hanken text-body-md">{p.name}</p>
                  <span className={`font-geist text-label-md ${coins >= p.cost ? "text-primary" : "text-on-surface/30"}`}>{p.cost} 🪙</span>
                </div>
              ))}
            </div>
            <p className="font-geist text-label-sm text-on-surface/40 mt-6">Redemptions unlock in a future update — keep stacking.</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* Marks a plan task done: coins fly, Firestore increments. */
export function useCompleteTask() {
  const { markTaskDone } = useStore();
  return (taskId: string, e: React.MouseEvent | { clientX: number; clientY: number }) => {
    vibrate(20);
    fireCoinFly(e.clientX, e.clientY);
    void markTaskDone(taskId);
  };
}
