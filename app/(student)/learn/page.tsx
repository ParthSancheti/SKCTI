"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, query, where } from "firebase/firestore";
import {
  Atom, Bookmark, Calculator, ChevronLeft, ChevronRight, Dna, FlaskConical,
  PlayCircle, Search, X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import ChapterCard from "@/components/ChapterCard";
import PdfViewerModal from "@/components/PdfViewerModal";
import { ChapterSkeleton } from "@/components/SkeletonLoader";
import { col, snapTo } from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { ContentDoc, VideoDoc } from "@/lib/types";
import { subjectsFor, youtubeEmbedUrl, youtubeThumb } from "@/lib/types";

const SUBJECT_ICON: Record<string, typeof Atom> = {
  Physics: Atom, Chemistry: FlaskConical, Math: Calculator, Biology: Dna,
};
const SUBJECT_HUE: Record<string, string> = {
  Physics: "from-orange-500/25 to-red-600/10",
  Chemistry: "from-amber-400/25 to-orange-600/10",
  Math: "from-red-500/25 to-rose-700/10",
  Biology: "from-lime-500/25 to-emerald-700/10",
};

function VideoModal({ video, onClose }: { video: VideoDoc | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {video && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
            className="glassy-strong w-full max-w-3xl overflow-hidden rounded-[2rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="min-w-0">
                <p className="font-geist text-label-sm text-primary">{video.subject}</p>
                <p className="truncate font-sora text-sm font-semibold">{video.title}</p>
              </div>
              <button onClick={onClose} className="glassy grid h-9 w-9 shrink-0 place-items-center rounded-full"><X size={16} /></button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe src={youtubeEmbedUrl(video.youtubeId)} className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={video.title} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LearnInner() {
  const { profile, config } = useStore();
  const params = useSearchParams();
  const [items, setItems] = useState<ContentDoc[] | null>(null);
  const [videos, setVideos] = useState<VideoDoc[] | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<ContentDoc | null>(null);
  const [openVideo, setOpenVideo] = useState<VideoDoc | null>(null);
  const [mode, setMode] = useState<"notes" | "videos" | "saved">("notes");
  const [subject, setSubject] = useState<string | null>(params.get("subject"));
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const qq = query(col.content(), where("published", "==", true));
    return onSnapshot(qq, (s) => {
      const docs = s.docs.map((d) => snapTo<ContentDoc>(d)).filter((c) => c.streams.includes(profile.stream));
      docs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      setItems(docs);
    }, () => setItems([]));
  }, [profile?.stream]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile || !config.features.videos) return;
    const qq = query(col.videos(), where("published", "==", true));
    return onSnapshot(qq, (s) => {
      const docs = s.docs.map((d) => snapTo<VideoDoc>(d)).filter((v) => v.streams.includes(profile.stream));
      docs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      setVideos(docs);
    }, () => setVideos([]));
  }, [profile?.stream, config.features.videos]); // eslint-disable-line react-hooks/exhaustive-deps

  const searching = q.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!searching) return [];
    const t = q.trim().toLowerCase();
    return (items ?? []).filter((i) => `${i.title} ${i.subject} ${i.type}`.toLowerCase().includes(t));
  }, [items, q, searching]);

  const subjectItems = useMemo(() => {
    let list = (items ?? []).filter((i) => i.subject === subject);
    if (typeFilter) list = list.filter((i) => i.type === typeFilter);
    return list;
  }, [items, subject, typeFilter]);

  const subjectTypes = useMemo(
    () => Array.from(new Set((items ?? []).filter((i) => i.subject === subject).map((i) => i.type))),
    [items, subject]
  );

  const savedItems = useMemo(
    () => (items ?? []).filter((i) => profile?.downloads.includes(i.id)),
    [items, profile?.downloads]
  );

  const shownVideos = useMemo(() => {
    let list = videos ?? [];
    if (searching) {
      const t = q.trim().toLowerCase();
      list = list.filter((v) => `${v.title} ${v.subject}`.toLowerCase().includes(t));
    }
    return list;
  }, [videos, q, searching]);

  if (!profile) return null;
  const subjects = subjectsFor(profile.stream);
  const tabs: readonly (readonly ["notes" | "videos" | "saved", string])[] = [
    ["notes", "Notes"] as const,
    ...(config.features.videos ? [["videos", "Videos"] as const] : []),
    ["saved", "Saved"] as const,
  ];

  const countFor = (s: string) => (items ?? []).filter((i) => i.subject === s).length;
  const videoCountFor = (s: string) => (videos ?? []).filter((v) => v.subject === s).length;

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="font-sora text-headline-xl">Learn OS</h1>
        <p className="mt-1 font-hanken text-body-md text-on-surface/60">
          {profile.stream} · {profile.grade} — {(items?.length ?? 0) + (videos?.length ?? 0)} resources live
        </p>
      </div>

      {/* search + tabs */}
      <div className="header-blur-mask sticky top-0 z-40 -mx-margin-mobile space-y-3 px-margin-mobile py-2 lg:mx-0 lg:px-0">
        <div className="glassy flex items-center gap-3 rounded-full px-5">
          <Search size={17} className="shrink-0 text-primary" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any chapter, topic, subject…"
            className="w-full bg-transparent py-3.5 font-hanken text-body-md outline-none placeholder:text-on-surface/30" />
          {q && <button onClick={() => setQ("")} className="shrink-0 text-on-surface/40"><X size={15} /></button>}
        </div>
        {!searching && (
          <div className="glassy inline-flex rounded-full p-1">
            {tabs.map(([m, label]) => (
              <button key={m} onClick={() => { vibrate(10); setMode(m); }}
                className={`relative rounded-full px-5 py-2.5 font-geist text-label-md ${mode === m ? "text-white" : "text-on-surface/60"}`}>
                {mode === m && <motion.span layoutId="learn-mode" className="absolute inset-0 rounded-full bg-primary-container shadow-glow-primary" />}
                <span className="relative flex items-center gap-1.5">
                  {m === "saved" && <Bookmark size={12} />}
                  {m === "videos" && <PlayCircle size={12} />}
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ————— global search results ————— */}
      {searching ? (
        <div className="space-y-4">
          <p className="font-geist text-label-sm text-on-surface/50">{searchResults.length + shownVideos.length} results</p>
          {searchResults.map((c) => <ChapterCard key={c.id} chapter={c} onOpen={() => setOpen(c)} />)}
          {config.features.videos && shownVideos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {shownVideos.map((v) => (
                <VideoTile key={v.id} v={v} onOpen={() => setOpenVideo(v)} />
              ))}
            </div>
          )}
          {searchResults.length + shownVideos.length === 0 && (
            <div className="glassy rounded-glass p-10 text-center">
              <p className="font-sora font-semibold">No matches</p>
              <p className="mt-1 font-hanken text-body-md text-on-surface/50">Try a chapter name like &quot;Thermodynamics&quot;.</p>
            </div>
          )}
        </div>
      ) : mode === "notes" ? (
        <AnimatePresence mode="wait">
          {!subject ? (
            /* ————— level 1: subject cards ————— */
            <motion.div key="subjects" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="grid grid-cols-2 gap-4">
              {subjects.map((s, i) => {
                const Icon = SUBJECT_ICON[s] ?? Atom;
                return (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { vibrate(10); setSubject(s); setTypeFilter(null); }}
                    className={`glassy-elite relative overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 text-left ${SUBJECT_HUE[s] ?? ""}`}
                  >
                    <div className="glassy grid h-12 w-12 place-items-center rounded-2xl text-primary">
                      <Icon size={22} />
                    </div>
                    <p className="mt-5 font-sora text-title-lg font-bold">{s}</p>
                    <p className="mt-0.5 font-geist text-label-sm text-on-surface/50">
                      {items === null ? "…" : `${countFor(s)} notes${config.features.videos ? ` · ${videoCountFor(s)} videos` : ""}`}
                    </p>
                    <ChevronRight size={17} className="absolute bottom-6 right-5 text-on-surface/30" />
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            /* ————— level 2: topic-wise ————— */
            <motion.div key={subject} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => { vibrate(10); setSubject(null); }} className="glassy grid h-10 w-10 place-items-center rounded-full">
                  <ChevronLeft size={17} />
                </button>
                <div>
                  <h2 className="font-sora text-headline-lg">{subject}</h2>
                  <p className="font-geist text-label-sm text-on-surface/50">{subjectItems.length} topics</p>
                </div>
              </div>
              {subjectTypes.length > 1 && (
                <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                  {["All", ...subjectTypes].map((t) => {
                    const active = t === "All" ? !typeFilter : typeFilter === t;
                    return (
                      <button key={t} onClick={() => { vibrate(10); setTypeFilter(t === "All" ? null : t); }}
                        className={`shrink-0 rounded-full px-4 py-2 font-geist text-label-sm ${active ? "bg-primary-container text-white shadow-glow-primary" : "glassy text-on-surface/70"}`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}
              {items === null && [0, 1, 2].map((i) => <ChapterSkeleton key={i} />)}
              {items !== null && subjectItems.length === 0 && (
                <div className="glassy rounded-glass p-10 text-center">
                  <p className="font-sora font-semibold">Nothing in {subject} yet</p>
                  <p className="mt-1 font-hanken text-body-md text-on-surface/50">Notes published from the admin panel appear here instantly.</p>
                </div>
              )}
              {subjectItems.map((c) => <ChapterCard key={c.id} chapter={c} onOpen={() => setOpen(c)} />)}

              {config.features.videos && videoCountFor(subject) > 0 && (
                <>
                  <h3 className="pt-2 font-sora text-headline-lg">Lectures</h3>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {(videos ?? []).filter((v) => v.subject === subject).map((v) => (
                      <VideoTile key={v.id} v={v} onOpen={() => setOpenVideo(v)} />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      ) : mode === "videos" ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {videos === null && [0, 1, 2, 3].map((i) => <div key={i} className="glassy aspect-video animate-pulse rounded-2xl" />)}
          {videos !== null && shownVideos.length === 0 && (
            <div className="glassy col-span-full rounded-glass p-10 text-center">
              <p className="font-sora font-semibold">No videos yet</p>
              <p className="mt-1 font-hanken text-body-md text-on-surface/50">Lectures published from the admin panel appear here instantly.</p>
            </div>
          )}
          {shownVideos.map((v) => <VideoTile key={v.id} v={v} onOpen={() => setOpenVideo(v)} />)}
        </div>
      ) : (
        /* ————— saved ————— */
        <div className="space-y-4">
          {savedItems.length === 0 ? (
            <div className="glassy rounded-glass p-10 text-center">
              <Bookmark size={28} className="mx-auto text-on-surface/30" />
              <p className="mt-3 font-sora font-semibold">No saved notes yet</p>
              <p className="mt-1 font-hanken text-body-md text-on-surface/50">Tap Save on any note and it lives here for instant access.</p>
            </div>
          ) : (
            savedItems.map((c) => <ChapterCard key={c.id} chapter={c} onOpen={() => setOpen(c)} />)
          )}
        </div>
      )}

      <PdfViewerModal chapter={open} onClose={() => setOpen(null)} />
      <VideoModal video={openVideo} onClose={() => setOpenVideo(null)} />
    </div>
  );
}

function VideoTile({ v, onOpen }: { v: VideoDoc; onOpen: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.96 }} onClick={() => { vibrate(10); onOpen(); }} className="glassy overflow-hidden rounded-2xl text-left">
      <div className="relative aspect-video w-full bg-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={youtubeThumb(v.youtubeId)} alt={v.title} className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/10">
          <PlayCircle size={34} className="text-white drop-shadow-lg" />
        </span>
      </div>
      <div className="p-3">
        <p className="font-geist text-[10px] font-semibold uppercase tracking-wide text-primary">{v.subject}</p>
        <p className="mt-0.5 line-clamp-2 font-sora text-sm font-semibold leading-snug">{v.title}</p>
      </div>
    </motion.button>
  );
}

export default function Learn() {
  return (
    <Suspense fallback={null}>
      <LearnInner />
    </Suspense>
  );
}
