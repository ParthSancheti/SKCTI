"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Blocks, Gauge, Inbox, Settings, UploadCloud, Users, LogOut, Menu, X, ClipboardList, Search, Plus, Bell, Link2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MeshBackground from "@/components/MeshBackground";
import ThemeOverlay from "@/components/ThemeOverlay";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore, vibrate, triggerHaptic } from "@/lib/store";

const LINKS = [
  { href: "/admin", label: "Dashboard", Icon: Gauge, exact: true },
  { href: "/admin/builder", label: "App Builder", Icon: Blocks },
  { href: "/admin/content", label: "Content Hub", Icon: UploadCloud },
  { href: "/admin/tests", label: "Test Hub", Icon: ClipboardList },
  { href: "/admin/users", label: "User Matrix", Icon: Users },
  { href: "/admin/leads", label: "Leads", Icon: Inbox },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, fbUser, isAdmin, configLoaded, profile } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [omniOpen, setOmniOpen] = useState(false);
  const [omniSearch, setOmniSearch] = useState("");
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOmniOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const sidebarInner = (
    <>
      <div className="flex items-center justify-center gap-4 py-2 pb-8 border-b border-black/10 dark:border-white/10 mb-6">
        <img src="/src/logo.png" className="w-14 h-14 rounded-xl bg-white p-1.5 shadow-lg" alt="SKCTI Logo" />
        <span className="font-sora font-black text-3xl tracking-tight text-neutral-900 dark:text-white">SKCTI OS</span>
      </div>
      {LINKS.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} onClick={() => { vibrate(10); setMobileMenuOpen(false); }}>
            <motion.div
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-geist text-body-md font-semibold transition-all relative ${
                active
                  ? "bg-black/10 dark:bg-white/20 text-neutral-900 dark:text-white shadow-md border border-black/10 dark:border-white/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Icon size={20} className={active ? "text-purple-600 dark:text-purple-400" : ""} />
              <span className="">{label}</span>
            </motion.div>
          </Link>
        );
      })}

      <div className="pt-6 border-t border-black/10 dark:border-white/10 mt-auto">
        <Link href="/home" className="block" onClick={() => { vibrate(10); setMobileMenuOpen(false); }}>
          <div className="w-full flex items-center gap-3 p-3 pl-4 bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all shadow-md cursor-pointer group">
            {fbUser?.photoURL ? (
              <img src={fbUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-inner shrink-0 border border-black/10 dark:border-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-sora font-bold text-white shadow-inner shrink-0">
                {profile?.name?.charAt(0) ?? "A"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-sora font-semibold text-sm truncate text-neutral-900 dark:text-white group-hover:text-purple-600 transition-colors">Back to App</p>
              <p className="font-geist text-xs text-neutral-500 dark:text-neutral-400 truncate">Exit Admin OS</p>
            </div>
            <button
              className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center shrink-0 transition-all z-10 relative"
              aria-label="Exit"
            >
              <LogOut size={16} />
            </button>
          </div>
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      <MeshBackground />
      <ThemeOverlay />

      {/* Floating Mobile Header */}
        <header className="lg:hidden fixed top-0 inset-x-0 z-50 p-4 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-full px-4 py-2 shadow-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all">
            <img src="/src/logo.png" className="w-8 h-8 rounded-lg bg-white p-1" alt="SKCTI Logo" />
            <span className="font-sora font-bold tracking-tight text-neutral-900 dark:text-white">Admin OS</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { triggerHaptic(); setMobileMenuOpen(!mobileMenuOpen); }}
            className="pointer-events-auto flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-full h-12 w-12 shadow-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all text-neutral-900 dark:text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </header>

        <aside className="hidden lg:flex flex-col fixed left-6 top-6 bottom-6 w-[280px] rounded-[2.5rem] glassy shadow-2xl p-6 z-50">
          {sidebarInner}
        </aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[55]"
              onClick={() => setMobileMenuOpen(false)}
            />
              <motion.aside
              initial={{ opacity: 0, scale: 0.95, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="lg:hidden flex flex-col fixed left-4 top-4 bottom-4 w-[280px] rounded-[2.5rem] glassy shadow-2xl p-6 z-[60]"
            >
              {sidebarInner}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className={`flex-1 min-w-0 overflow-y-auto relative lg:ml-[360px] lg:pr-8 p-4 pt-28 lg:pt-8 lg:py-8`}>{children}</main>

      {/* Omni-Command Palette */}
      <AnimatePresence>
        {omniOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOmniOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white/95 dark:bg-[#0A0A0A] backdrop-blur-3xl border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center gap-3 bg-black/5 dark:bg-white/5">
                <Search size={20} className="text-neutral-500 dark:text-white/50" />
                <input
                  autoFocus
                  type="text"
                  value={omniSearch}
                  onChange={(e) => setOmniSearch(e.target.value)}
                  placeholder="Search Admin Routes..."
                  className="flex-1 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-white/50 outline-none font-geist text-lg"
                />
                <button onClick={() => setOmniOpen(false)} className="text-neutral-500 dark:text-white/50 hover:text-neutral-900 dark:hover:text-white p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {LINKS.filter(l => l.label.toLowerCase().includes(omniSearch.toLowerCase())).map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => { triggerHaptic(); setOmniOpen(false); setOmniSearch(""); }}
                    className="flex items-center gap-4 p-4 hover:bg-black/5 dark:hover:bg-white/10 rounded-2xl transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:bg-purple-600/20 group-hover:border-purple-600/30 transition-colors">
                      <link.Icon size={18} className="text-neutral-500 dark:text-white/70 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                    </div>
                    <span className="font-sora font-semibold text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{link.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Quick Action FAB */}
      <div className="lg:hidden fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
        <AnimatePresence>
            {fabOpen && (
              <>
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }} transition={{ delay: 0.1 }}>
                  <Link href="/admin/content/add" onClick={() => { triggerHaptic(); setFabOpen(false); }} className="flex items-center gap-3 group">
                    <span className="bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-geist text-sm px-3 py-1.5 rounded-lg shadow-lg">Add Content</span>
                    <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-2xl border border-black/10 dark:border-white/20 shadow-lg flex items-center justify-center text-neutral-900 dark:text-white"><UploadCloud size={20} /></div>
                  </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }} transition={{ delay: 0.05 }}>
                  <Link href="/admin/leads" onClick={() => { triggerHaptic(); setFabOpen(false); }} className="flex items-center gap-3 group">
                    <span className="bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-geist text-sm px-3 py-1.5 rounded-lg shadow-lg">Check Leads</span>
                    <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-2xl border border-black/10 dark:border-white/20 shadow-lg flex items-center justify-center text-neutral-900 dark:text-white"><Inbox size={20} /></div>
                  </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }}>
                  <button onClick={() => { triggerHaptic(); setFabOpen(false); alert("Add Notice (Coming Soon)"); }} className="flex items-center gap-3 group">
                    <span className="bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-geist text-sm px-3 py-1.5 rounded-lg shadow-lg">Add Notice</span>
                    <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-2xl border border-black/10 dark:border-white/20 shadow-lg flex items-center justify-center text-neutral-900 dark:text-white"><Bell size={20} /></div>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { triggerHaptic(); setFabOpen(!fabOpen); }}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-colors z-50 border ${fabOpen ? 'bg-red-600 hover:bg-red-500 text-white border-transparent' : 'bg-black/5 dark:bg-white/10 backdrop-blur-xl hover:bg-black/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white border-black/10 dark:border-white/20'}`}
          >
            <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Plus size={24} />
            </motion.div>
          </motion.button>
        </div>
    </div>
  );
}

