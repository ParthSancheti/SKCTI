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
import { ChapterSkeleton } from "@/components/SkeletonLoader";
import { col, snapTo } from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { ContentDoc, VideoDoc } from "@/lib/types";
import { subjectsFor, youtubeEmbedUrl, youtubeThumb } from "@/lib/types";
import SubjectCard from "@/components/SubjectCard";
import { useHapticRouter } from "@/components/HapticRouter";

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
  const { navigate } = useHapticRouter();

  useEffect(() => {
    setSubject(params.get("subject"));
  }, [params.get("subject")]);

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
    <div className="space-y-6 pb-24">
      {!subject && (
        <div className="mx-6 mt-6 mb-8 flex flex-col gap-6">
          <div>
            <h1 className="font-sora text-6xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">Learn OS</h1>
          <p className="font-geist text-body-lg text-neutral-600 dark:text-neutral-400">
            {profile.stream} · {profile.grade} — {(items?.length ?? 0) + (videos?.length ?? 0)} resources live
          </p>
        </div>
        
        {/* Massive Search Bar (identical to Home style) */}
        <div className="w-full flex items-center gap-3 bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full px-6 py-4 shadow-xl transition-all focus-within:bg-white/10 focus-within:border-white/30">
          <Search size={22} className="shrink-0 text-purple-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chapters, topics..."
            className="w-full bg-transparent font-hanken text-body-lg outline-none text-black dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400" />
          {q && <button onClick={() => setQ("")} className="shrink-0 text-black dark:text-white"><X size={18} /></button>}
        </div>
      </div>
      )}

      {!searching && !subject && (
        <div className="mx-6 flex flex-wrap gap-2">
          {tabs.map(([m, label]) => (
            <button key={m} onClick={() => { vibrate(10); setMode(m); }}
              className={`flex items-center gap-2 rounded-full px-5 py-2 font-geist text-label-sm font-semibold transition-all ${
                mode === m
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                  : "bg-white/10 text-neutral-700 dark:text-white hover:bg-white/20"
              }`}>
              {m === "saved" && <Bookmark size={14} />}
              {m === "videos" && <PlayCircle size={14} />}
              {label}
            </button>
          ))}
        </div>
      )}

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
            <motion.div key="subjects" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mx-6">
              {subjects.map((s) => (
                <SubjectCard key={s} subject={s} count={countFor(s)} />
              ))}
            </motion.div>
          ) : (
            /* ————— level 2: topic-wise ————— */
            <motion.div key={subject} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} className="space-y-4 pt-6">
              <div className="flex items-center gap-3 mx-6">
                <button onClick={(e) => { vibrate(10); navigate("/learn", e); }} className="bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/10 w-10 h-10 flex items-center justify-center rounded-full text-neutral-900 dark:text-white hover:bg-white/20 transition-all shadow-md">
                  <ChevronLeft size={17} />
                </button>
                <div>
                  <h2 className="font-sora text-headline-lg font-black tracking-tight text-neutral-900 dark:text-white">{subject}</h2>
                  <p className="font-geist text-label-sm text-black dark:text-neutral-400">{subjectItems.length} topics</p>
                </div>
              </div>
              {subjectTypes.length > 1 && (
                <div className="hide-scrollbar flex gap-2 overflow-x-auto mx-6">
                  {["All", ...subjectTypes].map((t) => {
                    const active = t === "All" ? !typeFilter : typeFilter === t;
                    return (
                      <button key={t} onClick={() => { vibrate(10); setTypeFilter(t === "All" ? null : t); }}
                        className={`shrink-0 rounded-full px-5 py-2 font-geist text-label-sm font-semibold transition-all ${
                          active 
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg" 
                            : "bg-white/10 text-neutral-700 dark:text-white hover:bg-white/20"
                        }`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="mx-6 space-y-4">
                {items === null && [0, 1, 2].map((i) => <ChapterSkeleton key={i} />)}
                {items !== null && subjectItems.length === 0 && (
                  <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-xl">
                    <p className="font-sora font-semibold text-neutral-900 dark:text-white">Nothing in {subject} yet</p>
                    <p className="mt-1 font-geist text-label-sm text-black dark:text-neutral-400">Notes published from the admin panel appear here instantly.</p>
                  </div>
                )}
                {subjectItems.map((c) => <ChapterCard key={c.id} chapter={c} onOpen={() => setOpen(c)} />)}
              </div>

              {config.features.videos && videoCountFor(subject) > 0 && (
                <div className="mx-6 pt-4">
                  <h3 className="font-sora text-headline-lg font-black tracking-tight text-neutral-900 dark:text-white mb-4">Lectures</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(videos ?? []).filter((v) => v.subject === subject).map((v) => (
                      <VideoTile key={v.id} v={v} onOpen={() => setOpenVideo(v)} />
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      ) : mode === "videos" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mx-6">
          {videos === null && [0, 1, 2, 3].map((i) => <div key={i} className="bg-white/10 animate-pulse border border-white/5 aspect-video rounded-3xl" />)}
          {videos !== null && shownVideos.length === 0 && (
            <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-xl col-span-full">
              <p className="font-sora font-semibold text-neutral-900 dark:text-white">No videos yet</p>
              <p className="mt-1 font-geist text-label-sm text-black dark:text-neutral-400">Lectures published from the admin panel appear here instantly.</p>
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

      <VideoModal video={openVideo} onClose={() => setOpenVideo(null)} />
    </div>
  );
}

function VideoTile({ v, onOpen }: { v: VideoDoc; onOpen: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.96 }} onClick={() => { vibrate(10); onOpen(); }} className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-white/10 transition-all shadow-xl overflow-hidden text-left flex flex-col">
      <div className="relative aspect-video w-full bg-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={youtubeThumb(v.youtubeId)} alt={v.title} className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/20 hover:bg-black/10 transition-colors">
          <PlayCircle size={38} className="text-white drop-shadow-xl" />
        </span>
      </div>
      <div className="p-4 flex-1">
        <p className="font-geist text-[10px] font-bold uppercase tracking-widest text-purple-500">{v.subject}</p>
        <p className="mt-1 line-clamp-2 font-sora text-sm font-semibold leading-snug text-neutral-900 dark:text-white">{v.title}</p>
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


