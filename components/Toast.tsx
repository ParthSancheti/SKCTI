"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { haptic } from "@/lib/haptics";

/**
 * ============================================================================
 * REPLACES THE 12 alert() CALLS — audit §23
 * ============================================================================
 *
 * Current alert() sites:
 *   admin/page.tsx:108,117,121      admin/content/edit/page.tsx:103,128
 *   admin/content/add/page.tsx:56,82  admin/tests/add/page.tsx:53,74
 *   admin/builder/page.tsx:491      admin/layout.tsx:229
 *   (student)/settings/page.tsx:75
 *
 * In a Capacitor WebView a native alert() renders a system dialog whose title
 * is literally "skcti-lyart.vercel.app says:". Your app announces that it is a
 * website, in a modal, in the admin panel, in front of your teachers. It also
 * blocks the JS thread and cannot be styled or dismissed by tapping away.
 *
 * This is the same glass language as the rest of the app — glassy-strong, the
 * same 32px radius, the same spring. Safe-area aware so it never lands under
 * the status bar or inside the Android gesture strip.
 * ============================================================================
 *
 * SETUP — wrap once, inside AppProvider in app/layout.tsx:
 *
 *   <AppProvider>
 *     <ToastProvider>{children}</ToastProvider>
 *   </AppProvider>
 *
 * USE — anywhere:
 *
 *   const toast = useToast();
 *   toast.success("Content published");
 *   toast.error("Couldn't save — check your connection");
 *   toast.warning("Fill in the title and Drive link first");
 *   toast.info("Already initialized");
 *
 * MIGRATION — the wording matters as much as the widget. Errors should say
 * what happened and what to do, in the interface's voice:
 *
 *   alert("Please fill all required fields correctly.")
 *     -> toast.warning("Add a title and a Drive link to publish")
 *
 *   alert("Failed to save content.")
 *     -> toast.error("Couldn't save. Check your connection and try again")
 *
 *   alert("🚀 SKCTI OS Initialized successfully!")
 *     -> toast.success("SKCTI OS is live. Add your first PDF in Content Hub")
 */

type ToastKind = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (m: string) => void;
  error: (m: string) => void;
  warning: (m: string) => void;
  info: (m: string) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const CONFIG: Record<ToastKind, { Icon: typeof CheckCircle2; accent: string; ms: number }> = {
  success: { Icon: CheckCircle2,   accent: "text-emerald-500", ms: 3000 },
  error:   { Icon: XCircle,        accent: "text-error",     ms: 5000 },
  warning: { Icon: AlertTriangle,  accent: "text-amber-500",   ms: 4000 },
  info:    { Icon: Info,           accent: "text-purple-500",  ms: 3000 },
};

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++seq;
    // Cap at 3 so a loop of failures can't paper over the screen.
    setItems((list) => [...list.slice(-2), { id, kind, message }]);

    if (kind === "success") haptic.success();
    else if (kind === "error") haptic.error();
    else if (kind === "warning") haptic.warning();
    else haptic.tap();

    window.setTimeout(() => dismiss(id), CONFIG[kind].ms);
  }, [dismiss]);

  const api: ToastApi = {
    success: (m) => push("success", m),
    error:   (m) => push("error", m),
    warning: (m) => push("warning", m),
    info:    (m) => push("info", m),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div
      // Top on mobile (thumb can't reach the top, so it won't be dismissed by
      // accident), bottom-right on desktop. Above everything except the PDF
      // reader's fullscreen layer.
      className="fixed inset-x-0 top-0 z-[120] flex flex-col items-center gap-2 px-4 pointer-events-none
                 lg:inset-x-auto lg:right-6 lg:top-auto lg:bottom-6 lg:items-end"
      style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top,3rem))" }}
      role="status"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {items.map(({ id, kind, message }) => {
          const { Icon, accent } = CONFIG[kind];
          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.4, bottom: 0 }}
              onDragEnd={(_, info) => { if (info.offset.y < -30) onDismiss(id); }}
              className="glassy-strong rounded-glass pointer-events-auto flex w-full max-w-[420px]
                         items-start gap-3 px-4 py-3.5 shadow-2xl"
            >
              <Icon size={18} className={`${accent} mt-0.5 shrink-0`} />
              <p className="font-hanken text-body-md flex-1 leading-snug text-on-surface">
                {message}
              </p>
              <button
                onClick={() => { haptic.tap(); onDismiss(id); }}
                aria-label="Dismiss"
                className="press -mr-1 -mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full
                           text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Escape hatch for the handful of places that genuinely need a blocking
 * yes/no — currently none of the 12 alert() sites do, but the admin delete
 * buttons in content/page.tsx call deleteContent() with NO confirmation at
 * all, which is its own bug: one mis-tap and a chapter is gone with no undo.
 */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    message: string;
    resolve?: (v: boolean) => void;
  }>({ open: false, message: "" });

  const confirm = useCallback((message: string) => {
    haptic.heavy();
    return new Promise<boolean>((resolve) => setState({ open: true, message, resolve }));
  }, []);

  const answer = (v: boolean) => {
    state.resolve?.(v);
    setState({ open: false, message: "" });
  };

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") answer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const dialog = (
    <AnimatePresence>
      {state.open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] grid place-items-center bg-black/50 p-6 backdrop-blur-sm"
          onClick={() => answer(false)}
        >
          <motion.div
            initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glassy-strong rounded-glass w-full max-w-sm p-6 shadow-2xl"
          >
            <p className="font-hanken text-body-lg text-on-surface">{state.message}</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => answer(false)}
                className="press glassy flex-1 rounded-full py-3 font-geist text-label-md font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => answer(true)}
                className="press flex-1 rounded-full bg-red-600 py-3 font-geist text-label-md font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { confirm, dialog };
}
