"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Image as ImageIcon, Megaphone, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import PhonePreviewFrame from "@/components/PhonePreviewFrame";
import {
  col, createAnnouncement, createBanner, deleteAnnouncement, deleteBanner,
  logAudit, saveConfig, snapTo, updateAnnouncement, updateBanner,
} from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { AnnouncementDoc, BannerDoc, HomeBlockId, Stream } from "@/lib/types";

const BLOCK_META: Record<HomeBlockId, { name: string; desc: string }> = {
  notice: { name: "Notice board", desc: "Your announcements" },
  focus: { name: "Today's Focus", desc: "AI plan + progress ring" },
  carousel: { name: "Hero carousel", desc: "Your banners" },
  subjects: { name: "Subject grid", desc: "Physics / Chem / …" },
};

export default function Builder() {
  const { fbUser, config } = useStore();
  const me = fbUser?.email ?? "admin";

  const [blocks, setBlocks] = useState<HomeBlockId[]>(config.homeBlocks);
  useEffect(() => {
    const all: HomeBlockId[] = ["notice", "focus", "carousel", "subjects"];
    setBlocks([...config.homeBlocks, ...all.filter((b) => !config.homeBlocks.includes(b))]);
  }, [config.homeBlocks]);

  /* banner form */
  const [bTitle, setBTitle] = useState("");
  const [bSub, setBSub] = useState("");
  const [bImg, setBImg] = useState("");
  const [bStreams, setBStreams] = useState<Stream[]>(["PCM", "PCB"]);
  const [busy, setBusy] = useState(false);
  const [banners, setBanners] = useState<BannerDoc[]>([]);

  /* announcement form */
  const [nText, setNText] = useState("");
  const [nStreams, setNStreams] = useState<Stream[]>(["PCM", "PCB"]);
  const [nBusy, setNBusy] = useState(false);
  const [anns, setAnns] = useState<AnnouncementDoc[]>([]);

  useEffect(() => {
    const q = query(col.banners(), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setBanners(s.docs.map((d) => snapTo<BannerDoc>(d))), () => {});
  }, []);

  useEffect(() => {
    const q = query(col.announcements(), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setAnns(s.docs.map((d) => snapTo<AnnouncementDoc>(d))), () => {});
  }, []);

  const addAnnouncement = async () => {
    if (!nText.trim() || nStreams.length === 0) return;
    setNBusy(true);
    await createAnnouncement({ text: nText.trim(), streams: nStreams, published: true });
    await logAudit(me, `Posted notice "${nText.trim().slice(0, 40)}"`);
    setNText(""); setNBusy(false); vibrate(15);
  };

  const move = async (i: number, dir: -1 | 1) => {
    vibrate(10);
    const next = [...blocks];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
    await saveConfig({ homeBlocks: next });
    await logAudit(me, `Reordered home: ${next.join(" → ")}`);
  };

  const addBanner = async () => {
    if (!bTitle.trim() || busy) return;
    setBusy(true);
    vibrate(20);
    try {
      await createBanner({ title: bTitle.trim(), subtitle: bSub.trim(), image: bImg.trim(), streams: bStreams, published: true });
      await logAudit(me, `Added banner "${bTitle.trim()}"`);
      setBTitle(""); setBSub(""); setBImg("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 max-w-container">
      <div>
        <h1 className="font-sora text-headline-xl">App Builder</h1>
        <p className="font-hanken text-body-md text-on-surface/60 mt-1">Reorder the home screen & run banners — students see it live, no deploy.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-8 items-start">
        <div className="space-y-6 min-w-0">
          {/* ————— block order ————— */}
          <GlassCard className="p-8">
            <h2 className="font-sora text-headline-lg mb-6">Home screen order</h2>
            <div className="space-y-3">
              {blocks.map((id, i) => (
                <motion.div key={id} layout transition={{ type: "spring", stiffness: 400, damping: 32 }} className="glassy rounded-glass p-5 flex items-center gap-4">
                  <GripVertical size={16} className="text-on-surface/30 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-sora font-semibold">{BLOCK_META[id].name}</p>
                    <p className="font-geist text-label-sm text-on-surface/40">{BLOCK_META[id].desc}</p>
                  </div>
                  <button onClick={() => void move(i, -1)} disabled={i === 0} aria-label="Up" className="w-9 h-9 rounded-full glassy flex items-center justify-center disabled:opacity-25"><ArrowUp size={14} /></button>
                  <button onClick={() => void move(i, 1)} disabled={i === blocks.length - 1} aria-label="Down" className="w-9 h-9 rounded-full glassy flex items-center justify-center disabled:opacity-25"><ArrowDown size={14} /></button>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* ————— banner studio ————— */}
          <GlassCard className="p-8 space-y-5">
            <h2 className="font-sora text-headline-lg flex items-center gap-2"><Megaphone size={18} className="text-primary" /> Banner studio</h2>
            <input value={bTitle} onChange={(e) => setBTitle(e.target.value)} placeholder="Title — e.g. Mission JEE: 90 Days ⚡" className="skcti-input w-full h-12 px-4" />
            <input value={bSub} onChange={(e) => setBSub(e.target.value)} placeholder="Subtitle (optional)" className="skcti-input w-full h-12 px-4" />
            <div className="flex items-center gap-3">
              <ImageIcon size={16} className="text-on-surface/40 shrink-0" />
              <input value={bImg} onChange={(e) => setBImg(e.target.value)} placeholder="Image URL (optional — gradient used if empty)" className="skcti-input w-full h-12 px-4" />
            </div>
            <div className="flex gap-2">
              {(["PCM", "PCB"] as Stream[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { vibrate(10); setBStreams((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s])); }}
                  className={`rounded-full px-4 py-2 font-geist text-label-sm ${bStreams.includes(s) ? "bg-primary-container text-white" : "glassy text-on-surface/60"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={!bTitle.trim() || bStreams.length === 0 || busy}
              onClick={() => void addBanner()}
              className={`w-full rounded-full py-3.5 font-geist text-label-md flex items-center justify-center gap-2 ${bTitle.trim() && bStreams.length ? "bg-primary-container text-white" : "glassy text-on-surface/30"}`}
            >
              <Plus size={15} /> {busy ? "Publishing…" : "Publish banner"}
            </motion.button>

            <div className="space-y-3 pt-2">
              {banners.map((b) => (
                <div key={b.id} className={`glassy rounded-glass p-4 flex items-center gap-3 ${b.published ? "" : "opacity-50"}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-sora font-semibold text-sm truncate">{b.title}</p>
                    <p className="font-geist text-label-sm text-on-surface/40 truncate">{b.subtitle || "—"} · {b.streams.join("+")}</p>
                  </div>
                  <button onClick={() => { vibrate(10); void updateBanner(b.id, { published: !b.published }); void logAudit(me, `${b.published ? "Hid" : "Showed"} banner "${b.title}"`); }} aria-label="Toggle" className="w-9 h-9 rounded-full glassy flex items-center justify-center shrink-0">
                    {b.published ? <Eye size={14} className="text-primary" /> : <EyeOff size={14} className="text-on-surface/40" />}
                  </button>
                  <button onClick={() => { vibrate(15); void deleteBanner(b.id); void logAudit(me, `Deleted banner "${b.title}"`); }} aria-label="Delete" className="w-9 h-9 rounded-full glassy flex items-center justify-center shrink-0">
                    <Trash2 size={14} className="text-error" />
                  </button>
                </div>
              ))}
              {banners.length === 0 && <p className="font-hanken text-body-md text-on-surface/40">No banners yet — the carousel hides itself until one exists.</p>}
            </div>
          </GlassCard>

          {/* ————— notice board ————— */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-primary" />
              <h2 className="font-sora text-headline-lg">Notice board</h2>
            </div>
            <p className="font-hanken text-body-md text-on-surface/50 -mt-2">Test tomorrow? New batch? Post it — appears on student home instantly.</p>
            <textarea
              value={nText}
              onChange={(e) => setNText(e.target.value)}
              rows={2}
              placeholder="📢 Physics chapter test this Sunday, 10 AM — syllabus: Rotational Motion"
              className="skcti-input w-full px-4 py-3 resize-none font-hanken text-body-md"
            />
            <div className="flex gap-2">
              {(["PCM", "PCB"] as Stream[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { vibrate(10); setNStreams((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s])); }}
                  className={`rounded-full px-4 py-2 font-geist text-label-sm ${nStreams.includes(s) ? "bg-primary-container text-white" : "glassy text-on-surface/60"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={!nText.trim() || nStreams.length === 0 || nBusy}
              onClick={() => void addAnnouncement()}
              className={`w-full rounded-full py-3.5 font-geist text-label-md flex items-center justify-center gap-2 ${nText.trim() && nStreams.length ? "bg-primary-container text-white" : "glassy text-on-surface/30"}`}
            >
              <Plus size={15} /> {nBusy ? "Posting…" : "Post notice"}
            </motion.button>
            <div className="space-y-3 pt-1">
              {anns.map((a) => (
                <div key={a.id} className={`glassy rounded-glass p-4 flex items-center gap-3 ${a.published ? "" : "opacity-50"}`}>
                  <p className="flex-1 min-w-0 font-hanken text-body-md truncate">{a.text}</p>
                  <button onClick={() => { vibrate(10); void updateAnnouncement(a.id, { published: !a.published }); }} aria-label="Toggle" className="w-9 h-9 rounded-full glassy flex items-center justify-center shrink-0">
                    {a.published ? <Eye size={14} className="text-primary" /> : <EyeOff size={14} className="text-on-surface/40" />}
                  </button>
                  <button onClick={() => { vibrate(15); void deleteAnnouncement(a.id); void logAudit(me, "Deleted a notice"); }} aria-label="Delete" className="w-9 h-9 rounded-full glassy flex items-center justify-center shrink-0">
                    <Trash2 size={14} className="text-error" />
                  </button>
                </div>
              ))}
              {anns.length === 0 && <p className="font-hanken text-body-md text-on-surface/40">No notices yet.</p>}
            </div>
          </GlassCard>
        </div>

        {/* ————— live preview mirrors block order ————— */}
        <div className="sticky top-10 max-xl:hidden">
          <p className="font-geist text-label-sm uppercase text-on-surface-variant text-center mb-4">Live home preview</p>
          <PhonePreviewFrame>
            <AnimatePresence>
              {blocks.map((id) => (
                <motion.div key={id} layout transition={{ type: "spring", stiffness: 380, damping: 30 }}>
                  {id === "notice" && (
                    <div className="glassy rounded-glass border-l-4 border-primary px-3 py-2.5">
                      <p className="font-hanken text-[10px] truncate">📢 {nText || anns[0]?.text || "Your notice appears here"}</p>
                    </div>
                  )}
                  {id === "focus" && (
                    <div className="glassy rounded-glass p-4">
                      <p className="font-sora font-semibold text-xs mb-2">Today&apos;s Focus</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-[3px] border-primary/70 shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 rounded-full w-full" style={{ background: "var(--glass-fill-strong)" }} />
                          <div className="h-2.5 rounded-full w-2/3" style={{ background: "var(--glass-fill-strong)" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {id === "carousel" && (
                    <div className="rounded-glass h-20 p-4 flex flex-col justify-end" style={{ background: "linear-gradient(120deg, rgba(234,88,12,0.75), rgba(127,29,29,0.8))" }}>
                      <p className="font-sora font-bold text-white text-xs truncate">{bTitle || banners[0]?.title || "Your banner here"}</p>
                      <p className="font-geist text-[9px] text-white/70 truncate">{bSub || banners[0]?.subtitle || "subtitle"}</p>
                    </div>
                  )}
                  {id === "subjects" && (
                    <div className="grid grid-cols-3 gap-2">
                      {["Phy", "Chem", "Math"].map((s) => (
                        <div key={s} className="glassy rounded-glass p-3 text-center">
                          <p className="font-geist text-[10px]">{s}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </PhonePreviewFrame>
        </div>
      </div>
    </div>
  );
}
