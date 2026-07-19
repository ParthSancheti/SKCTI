"use client";

import AiFab from "@/components/AiFab";
import BottomNav from "@/components/BottomNav";
import { CoinFlightLayer } from "@/components/CoinSystem";
import MeshBackground from "@/components/MeshBackground";
import PortalEffect from "@/components/PortalEffect";
import SideNav from "@/components/SideNav";
import ThemeOverlay from "@/components/ThemeOverlay";
import { useAuthGate } from "@/lib/store";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const ok = useAuthGate();

  if (!ok)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MeshBackground />
        <div className="w-14 h-14 rounded-glass glassy-strong flex items-center justify-center">
          <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );

  return (
    <>
      <MeshBackground />
      <ThemeOverlay />
      <PortalEffect />
      <CoinFlightLayer />
      <SideNav />
      <main className="px-margin-mobile lg:pl-[340px] lg:pr-12 pb-44 lg:pb-12 max-w-[1400px]">
        {children}
      </main>
      <BottomNav />
      <AiFab />
    </>
  );
}
