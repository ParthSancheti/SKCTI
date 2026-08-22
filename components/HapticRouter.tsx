"use client";

import { createContext, useContext, ReactNode, MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { vibrate } from "@/lib/store";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface HapticRouterContextType {
  navigate: (path: string, e: ReactMouseEvent | MouseEvent) => void;
}

const HapticRouterContext = createContext<HapticRouterContextType | null>(null);

export function useHapticRouter() {
  const ctx = useContext(HapticRouterContext);
  const router = useRouter();
  
  if (!ctx) {
    return {
      navigate: (path: string, e: ReactMouseEvent | MouseEvent) => {
        e.preventDefault();
        router.push(path);
      }
    };
  }
  return ctx;
}

export function HapticRouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const navigate = (path: string, e: ReactMouseEvent | MouseEvent) => {
    e.preventDefault();
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => vibrate(50));
    router.push(path);
  };

  return (
    <HapticRouterContext.Provider value={{ navigate }}>
      {children}
    </HapticRouterContext.Provider>
  );
}
