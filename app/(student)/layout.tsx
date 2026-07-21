"use client";

import { usePathname } from "next/navigation";
import AiFab from "@/components/AiFab";
import BottomNav from "@/components/BottomNav";
import { CoinFlightLayer } from "@/components/CoinSystem";
import PortalEffect from "@/components/PortalEffect";
import SideNav from "@/components/SideNav";
import ThemeOverlay from "@/components/ThemeOverlay";
import TitleBar from "@/components/TitleBar";
import { useAuthGate } from "@/lib/store";

import { HapticRouterProvider } from "@/components/HapticRouter";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const ok = useAuthGate();
  const pathname = usePathname();
  const isImmersive = pathname === "/todo" || pathname === "/ai" || pathname === "/settings";

  if (!ok)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-14 h-14 rounded-glass glassy-strong flex items-center justify-center">
          <span className="w-6 h-6 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
        </div>
      </div>
    );

  return (
    <HapticRouterProvider>
      <ThemeOverlay />
      <PortalEffect />
      <CoinFlightLayer />
      <SideNav />
      <main className={`px-4 lg:pl-[360px] lg:pr-8 min-h-screen transition-all duration-300 ${isImmersive ? "pt-0 pb-0 max-w-full" : "pt-8 lg:pt-6 pb-44 lg:pb-12 max-w-[1400px]"}`}>
        {!isImmersive && <TitleBar />}
        {children}
      </main>
      {!isImmersive && (
        <div 
          className="lg:hidden fixed bottom-0 left-0 w-full h-48 pointer-events-none z-[40] backdrop-blur-[40px]"
          style={{ maskImage: 'linear-gradient(to top, black 20%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 100%)' }}
        ></div>
      )}
      {!isImmersive && <BottomNav />}
      {!isImmersive && <AiFab />}
    </HapticRouterProvider>
  );
}
