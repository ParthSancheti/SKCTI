"use client";

import { AnimatePresence, motion, Reorder } from "framer-motion";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { ChevronLeft, Eye, EyeOff, GripVertical, Megaphone, Plus, Trash2, UploadCloud, Code, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import PhonePreviewFrame from "@/components/PhonePreviewFrame";
import {
  col, createAnnouncement, createBanner, deleteAnnouncement, deleteBanner,
  logAudit, saveConfig, snapTo, updateAnnouncement, updateBanner,
} from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { AnnouncementDoc, BannerDoc, Stream } from "@/lib/types";

const BLOCK_META: Record<string, { name: string; desc: string }> = {
  notice: { name: "Notice board", desc: "Your announcements" },
  focus: { name: "Today's Focus", desc: "AI plan + progress ring" },
  carousel: { name: "Hero carousel", desc: "Your banners" },
  subjects: { name: "Subject grid", desc: "Physics / Chem / …" },
};

export default function Builder() {
  const { config, configLoaded, fbUser, isAdmin } = useStore();
  const me = fbUser?.email ?? "admin";

  const [blocks, setBlocks] = useState<string[]>(config.homeBlocks);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  useEffect(() => {
    const all: string[] = ["notice", "focus", "carousel", "subjects"];
    setBlocks([...config.homeBlocks, ...all.filter((b) => !config.homeBlocks.includes(b))]);
  }, [config.homeBlocks]);

  /* banner form */
  const [bTitle, setBTitle] = useState("");
  const [bSub, setBSub] = useState("");
  const [bImg, setBImg] = useState("");
  const [bCta, setBCta] = useState("");
  const [bStreams, setBStreams] = useState<Stream[]>(["PCM", "PCB"]);
  const [busy, setBusy] = useState(false);
  const [banners, setBanners] = useState<BannerDoc[]>([]);

  /* announcement form */
  const [nText, setNText] = useState("");
  const [nPush, setNPush] = useState(false);
  const [nStreams, setNStreams] = useState<Stream[]>(["PCM", "PCB"]);
  const [nBusy, setNBusy] = useState(false);
  const [anns, setAnns] = useState<AnnouncementDoc[]>([]);

  /* custom html form */
  const [cHtml, setCHtml] = useState("");

  useEffect(() => {
    if (!configLoaded || !isAdmin) return;
    const q = query(col.banners(), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setBanners(s.docs.map((d) => snapTo<BannerDoc>(d))), (e) => console.warn(e));
  }, [configLoaded, isAdmin]);

  useEffect(() => {
    if (!configLoaded || !isAdmin) return;
    const q = query(col.announcements(), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setAnns(s.docs.map((d) => snapTo<AnnouncementDoc>(d))), (e) => console.warn(e));
  }, [configLoaded, isAdmin]);

  const addAnnouncement = async (published: boolean) => {
    if (!nText.trim() || nStreams.length === 0) return;
    setNBusy(true);
    await createAnnouncement({ text: nText.trim(), streams: nStreams, published });
    await logAudit(me, `${published ? "Posted" : "Drafted"} notice "${nText.trim().slice(0, 40)}" ${nPush ? "with Push" : ""}`);
    setNText(""); setNBusy(false); setAddingNew(false); vibrate(15);
  };

  const addBanner = async () => {
    if (!bTitle.trim() || busy) return;
    setBusy(true); vibrate(20);
    try {
      await createBanner({ title: bTitle.trim(), subtitle: bSub.trim(), image: bImg.trim(), cta: bCta.trim(), streams: bStreams, published: true } as any);
      await logAudit(me, `Added banner "${bTitle.trim()}"`);
      setBTitle(""); setBSub(""); setBImg(""); setBCta(""); setAddingNew(false);
    } finally {
      setBusy(false);
    }
  };
  
  const saveCustomHtml = async (id: string) => {
    if (!cHtml.trim() || busy) return;
    setBusy(true); vibrate(20);
    try {
      const newCustomBlocks = { ...(config.customBlocks || {}), [id]: cHtml };
      await saveConfig({ customBlocks: newCustomBlocks });
      await logAudit(me, `Updated custom HTML block ${id}`);
      setAddingNew(false);
    } finally {
      setBusy(false);
    }
  };

  const addCustomBlock = async () => {
    vibrate(10);
    const id = `custom_${Date.now()}`;
    const newBlocks = [...blocks, id];
    setBlocks(newBlocks);
    const newCustomBlocks = { ...(config.customBlocks || {}), [id]: "<div style=\"padding: 20px; background: rgba(255,255,255,0.1); border-radius: 16px; text-align: center; color: white; font-family: sans-serif;\">Hello World</div>" };
    await saveConfig({ homeBlocks: newBlocks, customBlocks: newCustomBlocks });
    await logAudit(me, `Added custom HTML block`);
  };

  const deleteCustomBlock = async (id: string) => {
    vibrate(15);
    const newBlocks = blocks.filter((b) => b !== id);
    setBlocks(newBlocks);
    const newCustomBlocks = { ...config.customBlocks };
    delete newCustomBlocks[id];
    await saveConfig({ homeBlocks: newBlocks, customBlocks: newCustomBlocks });
    await logAudit(me, `Deleted custom HTML block`);
  };

  const toggleVisibility = async (id: string) => {
    vibrate(10);
    const hidden = config.hiddenBlocks || [];
    const isHidden = hidden.includes(id);
    const newHidden = isHidden ? hidden.filter(h => h !== id) : [...hidden, id];
    await saveConfig({ hiddenBlocks: newHidden });
    await logAudit(me, `${isHidden ? 'Showed' : 'Hidden'} block ${id}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBImg(reader.result as string);
    reader.readAsDataURL(file);
  };

  const openEditor = (id: string) => {
    setExpandedBlock(expandedBlock === id ? null : id);
    setAddingNew(false);
    if (id.startsWith("custom_")) {
      setCHtml(config.customBlocks?.[id] || "");
    }
  };

  const pubAnns = anns.filter((a) => a.published);
  const draftAnns = anns.filter((a) => !a.published);
  const hidden = config.hiddenBlocks || [];
  
  const isCustom = (id: string) => id.startsWith("custom_");
  const blockName = (id: string) => isCustom(id) ? "Custom HTML Block" : (BLOCK_META[id]?.name || id);
  const blockDesc = (id: string) => isCustom(id) ? "Raw HTML injection" : (BLOCK_META[id]?.desc || "");

  const renderEditorForm = (id: string) => {
    if (id === "carousel") {
      return (
        <div className="space-y-6 pt-4 border-t border-black/10 dark:border-white/10 mt-4">
          {!addingNew ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-geist font-bold text-xs uppercase tracking-widest text-neutral-500 dark:text-white/50">Active Banners</h3>
                <button onClick={() => setAddingNew(true)} className="rounded-full px-3 py-1.5 font-geist text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 shadow-md">
                  + Add New
                </button>
              </div>
              {banners.map((b) => (
                <div key={b.id} className={`bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-sm ${b.published ? "" : "opacity-50"}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-sora font-semibold text-sm truncate text-neutral-900 dark:text-white">{b.title}</p>
                    <p className="font-geist text-xs text-neutral-500 dark:text-white/50 truncate">{b.subtitle || "—"} · {b.streams.join("+")}</p>
                  </div>
                  <button onClick={() => { vibrate(10); void updateBanner(b.id, { published: !b.published }); }} aria-label="Toggle" className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    {b.published ? <Eye size={14} className="text-purple-600 dark:text-purple-400" /> : <EyeOff size={14} className="text-neutral-500 dark:text-white/50" />}
                  </button>
                  <button onClick={() => { vibrate(15); void deleteBanner(b.id); }} aria-label="Delete" className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 hover:bg-red-500 hover:text-white transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {banners.length === 0 && <p className="font-hanken text-sm text-neutral-500 dark:text-white/50">No banners yet.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-geist font-bold text-xs uppercase tracking-widest text-neutral-900 dark:text-white">Create Banner</h3>
                <button onClick={() => setAddingNew(false)} className="text-xs text-neutral-500 dark:text-white/50 hover:text-neutral-900 dark:hover:text-white">Cancel</button>
              </div>
              <input value={bTitle} onChange={(e) => setBTitle(e.target.value)} placeholder="Title — e.g. Mission JEE: 90 Days ⚡" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30" />
              <input value={bSub} onChange={(e) => setBSub(e.target.value)} placeholder="Subtitle (optional)" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30" />
              
              <div className="relative w-full h-32 rounded-xl border-2 border-dashed border-black/20 dark:border-white/20 hover:border-purple-500 dark:hover:border-white/40 transition-colors flex items-center justify-center overflow-hidden bg-black/5 dark:bg-white/5">
                {bImg ? (
                  <img src={bImg} alt="Preview" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-neutral-500 dark:text-white/40 pointer-events-none">
                    <UploadCloud size={24} className="text-neutral-400 dark:text-white/50" />
                    <span className="font-geist text-xs font-semibold text-neutral-500 dark:text-white/50">Drop image or click to upload</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>

              <input value={bCta} onChange={(e) => setBCta(e.target.value)} placeholder="Target Link (CTA) — e.g., /tests/jee-mock-1" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30" />

              <div className="flex gap-2">
                {(["PCM", "PCB"] as Stream[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { vibrate(10); setBStreams((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s])); }}
                    className={`rounded-full px-4 py-2 font-geist text-xs font-bold transition-all ${bStreams.includes(s) ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg" : "bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/20 hover:text-neutral-900 dark:hover:text-white"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={!bTitle.trim() || bStreams.length === 0 || busy}
                onClick={() => void addBanner()}
                className={`w-full rounded-full py-3.5 font-geist text-sm font-bold flex items-center justify-center gap-2 transition-all ${bTitle.trim() && bStreams.length ? "bg-purple-600 dark:bg-white text-white dark:text-black shadow-lg shadow-purple-600/20 dark:shadow-white/20 hover:bg-purple-700 dark:hover:bg-white/90" : "bg-black/5 dark:bg-white/5 text-neutral-400 dark:text-white/40"}`}
              >
                <Plus size={16} /> {busy ? "Publishing…" : "Publish banner"}
              </motion.button>
            </div>
          )}
        </div>
      );
    }
    if (id === "notice") {
      return (
        <div className="space-y-6 pt-4 border-t border-black/10 dark:border-white/10 mt-4">
          {!addingNew ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-geist font-bold text-xs uppercase tracking-widest text-neutral-500 dark:text-white/50">Notices</h3>
                <button onClick={() => setAddingNew(true)} className="rounded-full px-3 py-1.5 font-geist text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 shadow-md">
                  + Add New
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-geist font-bold text-[10px] uppercase tracking-widest text-neutral-400 dark:text-white/40 mb-3">Published</h4>
                  <div className="space-y-3">
                    {pubAnns.map((a) => (
                      <div key={a.id} className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                        <p className="flex-1 min-w-0 font-hanken text-sm text-neutral-900 dark:text-white truncate">{a.text}</p>
                        <button onClick={() => { vibrate(10); void updateAnnouncement(a.id, { published: false }); }} aria-label="Unpublish" className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 text-neutral-900 dark:text-white flex items-center justify-center shrink-0 hover:bg-black/10 dark:hover:bg-white/10">
                          <EyeOff size={14} />
                        </button>
                        <button onClick={() => { vibrate(15); void deleteAnnouncement(a.id); }} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {pubAnns.length === 0 && <p className="font-hanken text-sm text-neutral-500 dark:text-white/50">No published notices.</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-geist font-bold text-[10px] uppercase tracking-widest text-neutral-400 dark:text-white/40 mb-3">Drafts</h4>
                  <div className="space-y-3">
                    {draftAnns.map((a) => (
                      <div key={a.id} className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-sm opacity-60">
                        <p className="flex-1 min-w-0 font-hanken text-sm text-neutral-900 dark:text-white truncate">{a.text}</p>
                        <button onClick={() => { vibrate(10); void updateAnnouncement(a.id, { published: true }); }} aria-label="Publish" className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 text-neutral-900 dark:text-white flex items-center justify-center shrink-0 hover:bg-black/10 dark:hover:bg-white/10">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => { vibrate(15); void deleteAnnouncement(a.id); }} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {draftAnns.length === 0 && <p className="font-hanken text-sm text-neutral-500 dark:text-white/50">No drafts.</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-geist font-bold text-xs uppercase tracking-widest text-neutral-900 dark:text-white">Create Notice</h3>
                <button onClick={() => setAddingNew(false)} className="text-xs text-neutral-500 dark:text-white/50 hover:text-neutral-900 dark:hover:text-white">Cancel</button>
              </div>
              <textarea
                value={nText}
                onChange={(e) => setNText(e.target.value)}
                rows={3}
                placeholder="📢 Physics chapter test this Sunday..."
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors resize-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30"
              />
              <div className="flex gap-2">
                {(["PCM", "PCB"] as Stream[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { vibrate(10); setNStreams((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s])); }}
                    className={`rounded-full px-4 py-2 font-geist text-xs font-bold transition-all ${nStreams.includes(s) ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg" : "bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/20 hover:text-neutral-900 dark:hover:text-white"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              
              {/* Push Notification Toggle */}
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <div className={`relative w-10 h-6 rounded-full transition-colors ${nPush ? 'bg-purple-600' : 'bg-black/10 dark:bg-white/10'}`}>
                  <motion.div layout className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm ${nPush ? 'translate-x-4' : ''}`} />
                </div>
                <span className="font-geist text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Bell size={14} className="text-purple-600 dark:text-purple-400" />
                  Send Push Notification to Students
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={!nText.trim() || nStreams.length === 0 || nBusy}
                  onClick={() => void addAnnouncement(false)}
                  className={`w-full rounded-full py-3 font-geist text-sm font-bold flex items-center justify-center transition-all ${nText.trim() && nStreams.length ? "bg-black/10 dark:bg-white/10 text-neutral-900 dark:text-white hover:bg-black/20 dark:hover:bg-white/20" : "bg-black/5 dark:bg-white/5 text-neutral-400 dark:text-white/40"}`}
                >
                  Save Draft
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={!nText.trim() || nStreams.length === 0 || nBusy}
                  onClick={() => void addAnnouncement(true)}
                  className={`w-full rounded-full py-3 font-geist text-sm font-bold flex items-center justify-center gap-2 transition-all ${nText.trim() && nStreams.length ? "bg-purple-600 dark:bg-white text-white dark:text-black shadow-lg shadow-purple-600/20 dark:shadow-white/20 hover:bg-purple-700 dark:hover:bg-white/90" : "bg-black/5 dark:bg-white/5 text-neutral-400 dark:text-white/40"}`}
                >
                  <Megaphone size={16} /> {nBusy ? "Posting…" : "Publish Now"}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (isCustom(id)) {
      return (
        <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10 mt-4">
          <textarea
            value={cHtml}
            onChange={(e) => setCHtml(e.target.value)}
            rows={5}
            placeholder="<div>Your HTML here</div>"
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors resize-none text-neutral-900 dark:text-white font-mono placeholder-neutral-400 dark:placeholder-white/30"
          />
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!cHtml.trim() || busy}
            onClick={() => void saveCustomHtml(id)}
            className={`w-full rounded-full py-3 font-geist text-sm font-bold flex items-center justify-center transition-all ${cHtml.trim() ? "bg-purple-600 dark:bg-white text-white dark:text-black shadow-lg shadow-purple-600/20 dark:shadow-white/20 hover:bg-purple-700 dark:hover:bg-white/90" : "bg-black/5 dark:bg-white/5 text-neutral-400 dark:text-white/40"}`}
          >
            Save HTML Block
          </motion.button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 max-w-container pb-20 lg:pb-0">
      
      {/* Page Title */}
      <div>
        <h1 className="font-sora text-headline-xl">App Builder</h1>
        <p className="font-hanken text-body-md text-on-surface/60 mt-1">Drag and drop the home screen layout.</p>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] gap-8 items-start w-full">
        
        {/* Mobile Sticky Tabs */}
        <div className="lg:hidden flex justify-center w-full sticky top-16 z-40 mb-6">
          <div className="flex p-1 mx-auto w-full max-w-sm bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-full relative z-50 pointer-events-auto">
            {(["editor", "preview"] as const).map((t) => (
              <button key={t} onClick={() => { vibrate(10); setMobileTab(t); }} className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 font-geist text-sm font-bold transition-all group">
                {mobileTab === t && <motion.span layoutId="mobileTab" className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/15 shadow-lg" />}
                <span className={`relative z-10 capitalize ${mobileTab === t ? "text-neutral-900 dark:text-white" : "bg-transparent text-neutral-500 dark:text-white/50 group-hover:text-neutral-900 dark:group-hover:text-white"}`}>{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor Pane (Left Column) */}
        <div className={`space-y-6 w-full ${mobileTab !== "editor" ? "hidden lg:block" : ""}`}>

        
        <GlassCard className="p-4 sm:p-6 lg:p-8 mt-2 lg:mt-0">
          <h2 className="font-sora text-headline-lg mb-6 text-neutral-900 dark:text-white hidden sm:block">Home screen layout</h2>
          <Reorder.Group axis="y" values={blocks} onReorder={(next) => {
            setBlocks(next);
            saveConfig({ homeBlocks: next }).catch(console.error);
            logAudit(me, `Reordered home layout`).catch(console.error);
          }} className="space-y-3">
            {blocks.map((id) => {
              const isHidden = hidden.includes(id);
              const custom = isCustom(id);
              const isExpanded = expandedBlock === id;
              
              return (
                <Reorder.Item 
                  key={id} 
                  value={id} 
                  whileDrag={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  onDragStart={() => vibrate(20)}
                  className={`glassy rounded-[1.5rem] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all overflow-hidden ${isHidden ? "opacity-60" : ""}`}
                >
                  <div className="p-4 flex items-center gap-3 sm:gap-4 cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <GripVertical size={16} className="text-neutral-400 dark:text-white/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`font-sora font-semibold text-neutral-900 dark:text-white ${isHidden ? "line-through opacity-70" : ""}`}>{blockName(id)}</p>
                      <p className="font-geist text-label-sm text-neutral-500 dark:text-white/40 truncate">{blockDesc(id)}</p>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button onClick={() => toggleVisibility(id)} className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer pointer-events-auto">
                        {isHidden ? <EyeOff size={14} className="text-neutral-400 dark:text-white/50" /> : <Eye size={14} className="text-purple-600 dark:text-purple-400" />}
                      </button>
                      
                      {custom && (
                        <button onClick={() => deleteCustomBlock(id)} className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 hover:bg-red-500 hover:text-white transition-colors cursor-pointer pointer-events-auto">
                          <Trash2 size={14} />
                        </button>
                      )}

                      {["carousel", "notice"].includes(id) || custom ? (
                        <button 
                          onClick={() => { vibrate(10); openEditor(id); }}
                          className={`rounded-full px-3 sm:px-4 py-2 font-geist text-xs font-bold transition-colors pointer-events-auto ${isExpanded ? "bg-purple-600 text-white" : "bg-purple-600/10 text-purple-600 dark:text-purple-400 hover:bg-purple-600/20"}`}
                        >
                          {isExpanded ? "Close" : "Edit"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Unified Inline Expansion Accordion */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden px-4 sm:px-6 pb-6"
                      >
                        {renderEditorForm(id)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
          
          <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/10">
            <button onClick={addCustomBlock} className="w-full rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 hover:border-purple-500 dark:hover:border-purple-400 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all p-4 flex flex-col items-center justify-center gap-2 text-neutral-900 dark:text-white/50 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer">
              <Code size={20} />
              <span className="font-sora font-semibold text-sm">Add Custom HTML Block</span>
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Live Preview (Right Column - Sticky) */}
      <div className={`w-full lg:sticky lg:-top-4 ${mobileTab !== "preview" ? "hidden lg:flex lg:justify-center" : "flex flex-col items-center justify-center mt-8 pb-12"}`}>
        <div className="w-full max-w-[380px] lg:scale-[0.85] lg:origin-top lg:max-h-[85vh]">
          <p className="font-geist text-label-sm uppercase text-neutral-500 dark:text-white/50 text-center mb-2 tracking-widest font-bold hidden lg:block">Live home preview</p>
          <PhonePreviewFrame>
            <div className="mx-6 mb-6 pt-4">
              <p className="font-geist text-label-md text-neutral-500 dark:text-neutral-400">Good afternoon</p>
              <h2 className="font-sora text-3xl font-black text-neutral-900 dark:text-white tracking-tight mt-1">Welcome back, Admin</h2>
            </div>
            
            <AnimatePresence>
              {blocks.filter(id => !hidden.includes(id)).map((id) => (
                <motion.div key={id} layout transition={{ type: "spring", stiffness: 380, damping: 30 }} className="mb-4 px-6 relative">
                  {id === "notice" && (
                    <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md flex items-start gap-3 rounded-2xl border-l-4 border-purple-600 dark:border-purple-400 px-4 py-3.5 shadow-sm">
                      <Megaphone size={16} className="mt-0.5 shrink-0 text-purple-600 dark:text-purple-400" />
                      <p className="font-hanken text-[12px] leading-snug text-neutral-900 dark:text-white">{addingNew && expandedBlock === "notice" ? (nText || "Type to preview...") : (anns[0]?.text || "Your notice appears here")}</p>
                    </div>
                  )}
                  {id === "focus" && (
                    <div className="glassy rounded-2xl p-5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                      <p className="font-sora font-semibold text-sm mb-3 text-neutral-900 dark:text-white">Today&apos;s Focus</p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-[3px] border-purple-500/70 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 rounded-full w-full bg-black/10 dark:bg-white/10" />
                          <div className="h-3 rounded-full w-2/3 bg-black/10 dark:bg-white/10" />
                        </div>
                      </div>
                    </div>
                  )}
                  {id === "carousel" && (
                    <div onClick={(e) => { e.preventDefault(); alert(`Link would open: ${addingNew ? bCta : (banners[0]?.cta || '#')}`); }} className="rounded-[1.5rem] h-40 p-5 flex flex-col justify-end relative overflow-hidden cursor-pointer" style={{ background: "linear-gradient(120deg, #9333ea, #3b82f6)" }}>
                      {(addingNew ? bImg : banners[0]?.image) ? (
                        <img src={addingNew ? bImg : banners[0]?.image} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" alt="" />
                      ) : null}
                      <div className="relative z-10">
                        <p className="font-sora font-bold text-white text-lg truncate">{addingNew && expandedBlock === "carousel" ? (bTitle || "Type to preview...") : (banners[0]?.title || "Your banner here")}</p>
                        <p className="font-geist text-sm text-white/90 truncate">{addingNew && expandedBlock === "carousel" ? bSub : (banners[0]?.subtitle || "Subtitle")}</p>
                      </div>
                    </div>
                  )}
                  {id === "subjects" && (
                    <div className="grid grid-cols-2 gap-3">
                      {["Physics", "Chemistry", "Math", "Biology"].map((s) => (
                        <div key={s} className="glassy rounded-2xl p-4 text-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                          <p className="font-geist text-xs font-bold text-neutral-900 dark:text-white">{s}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {isCustom(id) && (
                    <div 
                      className="rounded-2xl overflow-hidden" 
                      dangerouslySetInnerHTML={{ __html: (expandedBlock === id ? cHtml : config.customBlocks?.[id]) || "<div class='text-center p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-neutral-500 dark:text-white/50 text-sm'>Empty Custom Block</div>" }} 
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </PhonePreviewFrame>
        </div>
      </div>
    </div>
    </div>
  );
}
