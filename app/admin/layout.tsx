"use client";

import { motion } from "framer-motion";
import { Blocks, Gauge, Inbox, Settings, UploadCloud, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MeshBackground from "@/components/MeshBackground";
import ThemeOverlay from "@/components/ThemeOverlay";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore, vibrate } from "@/lib/store";

const LINKS = [
  { href: "/admin", label: "Dashboard", Icon: Gauge, exact: true },
  { href: "/admin/builder", label: "App Builder", Icon: Blocks },
  { href: "/admin/content", label: "Content Hub", Icon: UploadCloud },
  { href: "/admin/users", label: "User Matrix", Icon: Users },
  { href: "/admin/leads", label: "Leads", Icon: Inbox },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, fbUser, isAdmin, configLoaded } = useStore();

  useEffect(() => {
    if (!ready) return;
    if (!fbUser) router.replace("/login");
    else if (configLoaded && !isAdmin) router.replace("/home");
  }, [ready, fbUser, isAdmin, configLoaded, router]);

  if (!ready || !fbUser || !configLoaded || !isAdmin)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MeshBackground />
        <div className="glassy-strong rounded-glass px-8 py-6 text-center">
          <span className="mx-auto block w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
          <p className="font-geist text-label-sm text-on-surface/60">Checking admin clearance…</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex relative">
      <MeshBackground />
      <ThemeOverlay />

      <aside className="w-64 shrink-0 glassy-strong border-r p-6 flex flex-col gap-1 sticky top-0 h-screen max-md:w-20 max-md:p-3" style={{ borderColor: "var(--glass-stroke)" }}>
        <div className="flex items-center gap-2 mb-8 px-2 max-md:justify-center">
          <span className="w-3 h-3 rounded-full bg-primary" style={{ boxShadow: "0 0 12px rgba(246,96,24,0.9)" }} />
          <span className="font-sora font-bold tracking-tight max-md:hidden">SKCTI OS</span>
        </div>
        {LINKS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => vibrate(10)}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-geist text-label-md transition-colors max-md:justify-center max-md:px-0 ${
                  active
                    ? "bg-primary-container text-on-primary-container shadow-glow-primary"
                    : "text-on-surface/70 hover:bg-glass/5"
                }`}
              >
                <Icon size={18} />
                <span className="max-md:hidden">{label}</span>
              </motion.div>
            </Link>
          );
        })}
        <p className="mt-auto font-geist text-label-sm text-on-surface/30 px-2 max-md:hidden">
          Every action is written to the audit ledger.
        </p>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto p-6 md:p-10">{children}</main>
    </div>
  );
}
