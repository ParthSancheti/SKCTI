"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Coins, Download, FileCheck, Flame, Phone, X } from "lucide-react";
import type { UserDoc } from "@/lib/types";

export default function UserDrawer({ student, onClose }: { student: UserDoc | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {student && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]" />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md glassy-elite z-[81] p-8 overflow-y-auto hide-scrollbar"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-sora text-headline-lg">Telemetry</h2>
              <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full glassy flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="flex items-center gap-4 mb-8">
              {student.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.photo} alt="" className="w-14 h-14 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center font-sora font-bold text-primary">
                  {student.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-sora font-semibold text-lg">{student.name}</p>
                <p className="font-geist text-label-sm text-on-surface/50">{student.grade} · {student.stream} · {student.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { Icon: Coins, label: "Coins", val: student.coins },
                { Icon: Flame, label: "Streak", val: `${student.streak}d` },
                { Icon: FileCheck, label: "Tests attempted", val: student.attempted.length },
                { Icon: Download, label: "PDFs saved", val: student.downloads.length },
              ].map(({ Icon, label, val }) => (
                <div key={label} className="glassy rounded-glass p-5">
                  <Icon size={16} className="text-primary mb-2" />
                  <p className="font-sora font-bold text-xl">{val}</p>
                  <p className="font-geist text-label-sm text-on-surface/50">{label}</p>
                </div>
              ))}
            </div>
            <div className="glassy rounded-glass p-5 mt-4 space-y-3">
              <p className="font-geist text-label-sm flex items-center gap-2 text-on-surface/70"><Phone size={13} className="text-primary" /> +91 {student.phone}</p>
              <p className="font-geist text-label-sm flex items-center gap-2 text-on-surface/70">
                <Activity size={13} className="text-primary" /> Last active {student.lastActiveDate}
                {student.createdAt ? ` · joined ${student.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
