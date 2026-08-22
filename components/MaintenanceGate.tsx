"use client";

import { Wrench } from "lucide-react";
import { useStore } from "@/lib/store";

/**
 * Wraps the student app. When an admin flips maintenance mode in Mission
 * Control, students get an explanation instead of skeletons that never resolve
 * — which is what a Firestore quota wall looks like from their side.
 *
 * Admins keep access (unless allowAdmins is off) so you can verify a fix before
 * reopening the doors.
 */
export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { config, configLoaded, isAdmin } = useStore();
  const m = config.maintenance;

  if (!configLoaded || !m?.enabled) return <>{children}</>;
  if (isAdmin && m.allowAdmins) {
    return (
      <>
        <div
          className="fixed inset-x-0 z-[110] mx-auto w-max rounded-full border border-amber-500/30 bg-amber-500/20 px-4 py-1.5 font-geist text-xs font-bold text-amber-700 backdrop-blur-md dark:text-amber-300"
          style={{ top: "calc(0.5rem + env(safe-area-inset-top,3rem))" }}
        >
          Maintenance mode is ON — students are locked out
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="grid min-h-[100dvh] place-items-center p-6">
      <div className="glassy-strong rounded-glass max-w-sm p-8 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-purple-500/15">
          <Wrench size={24} className="text-purple-500" />
        </div>
        <h1 className="font-sora text-xl font-bold text-on-surface">
          Back in a few minutes
        </h1>
        <p className="font-hanken text-body-md mt-2 text-on-surface-variant">
          {m.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="press glassy mt-6 w-full rounded-full py-3 font-geist text-sm font-bold text-on-surface"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
