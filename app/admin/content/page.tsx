"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import {
  ClipboardList, Eye, EyeOff, FileText, Link2, Pencil, PlayCircle, Plus, Trash2, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { LiveChapterCard } from "@/components/PhonePreviewFrame";
import {
  col, createContent, createTest, createVideo, deleteContent, deleteTest, deleteVideo,
  logAudit, snapTo, updateContent, updateTest, updateVideo,
} from "@/lib/db";
import { useStore, vibrate } from "@/lib/store";
import type { ContentDoc, Stream, TestDoc, VideoDoc, Weightage } from "@/lib/types";
import { drivePreviewUrl, extractDriveId, extractYouTubeId, formEmbedUrl, youtubeEmbedUrl } from "@/lib/types";

type Mode = "pdf" | "test" | "video";
type AnyDoc = ContentDoc | TestDoc | VideoDoc;

const STREAMS: Stream[] = ["PCM", "PCB"];
const SUBJECTS = ["Physics", "Chemistry", "Math", "Biology"];
const TYPES = ["Notes PDF", "DPP", "Formula Sheet", "PYQ Pack"];
const WEIGHTS: Weightage[] = ["High", "Medium", "Low"];

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={() => { vibrate(10); onClick(); }}
      className={`rounded-full px-4 py-2 font-geist text-label-sm transition-all ${active ? "bg-primary-container text-white shadow-glow-primary" : "glassy text-on-surface/70"}`}
    >
      {label}
    </motion.button>
  );
}

const modeOf = (d: AnyDoc): Mode => ("driveId" in d ? "pdf" : "youtubeId" in d ? "video" : "test");

export default function ContentHub() {
  const { fbUser } = useStore();
  const me = fbUser?.email ?? "admin";

  const [tab, setTab] = useState<Mode>("pdf");
  const [pdfs, setPdfs] = useState<ContentDoc[]>([]);
  const [tests, setTests] = useState<TestDoc[]>([]);
  const [vids, setVids] = useState<VideoDoc[]>([]);

  /* modal state — null closed, "new" adding, doc = editing */
  const [editorOpen, setEditorOpen] = useState<null | "new" | AnyDoc>(null);
  const [viewing, setViewing] = useState<AnyDoc | null>(null);

  /* form */
  const [mode, setMode] = useState<Mode>("pdf");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("Notes PDF");
  const [weight, setWeight] = useState<Weightage>("High");
  const [kind, setKind] = useState<"Chapter" | "Mock">("Chapter");
  const [duration, setDuration] = useState("30");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(query(col.content(), orderBy("createdAt", "desc")), (s) => setPdfs(s.docs.map((d) => snapTo<ContentDoc>(d))), () => {});
    const u2 = onSnapshot(query(col.tests(), orderBy("createdAt", "desc")), (s) => setTests(s.docs.map((d) => snapTo<TestDoc>(d))), () => {});
    const u3 = onSnapshot(query(col.videos(), orderBy("createdAt", "desc")), (s) => setVids(s.docs.map((d) => snapTo<VideoDoc>(d))), () => {});
    return () => { u1(); u2(); u3(); };
  }, []);

  const editing = editorOpen !== null && editorOpen !== "new" ? editorOpen : null;

  const openNew = () => {
    setMode(tab);
    setUrl(""); setTitle(""); setStreams([]); setSubject("");
    setType("Notes PDF"); setWeight("High"); setKind("Chapter"); setDuration("30");
    setMsg(""); setEditorOpen("new"); vibrate(10);
  };

  const openEdit = (d: AnyDoc) => {
    const m = modeOf(d);
    setMode(m);
    setTitle(d.title); setStreams(d.streams); setSubject(d.subject); setMsg("");
    if (m === "pdf") {
      const c = d as ContentDoc;
      setUrl(c.driveUrl); setType(c.type); setWeight(c.weightage);
    } else if (m === "video") {
      setUrl((d as VideoDoc).youtubeUrl);
    } else {
      const t = d as TestDoc;
      setUrl(t.formUrl); setKind(t.kind); setDuration(String(t.durationMin));
    }
    setEditorOpen(d); vibrate(10);
  };

  const driveId = extractDriveId(url);
  const ytId = extractYouTubeId(url);
  const urlOk = mode === "pdf" ? !!driveId : mode === "video" ? !!ytId : /docs\.google\.com\/forms/.test(url);
  const canSave = urlOk && !!title.trim() && streams.length > 0 && !!subject && (mode !== "pdf" || !!type);

  const save = async () => {
    if (!canSave || busy) return;
    setBusy(true); setMsg("");
    try {
      const base = { title: title.trim(), streams, subject };
      if (editing) {
        if (mode === "pdf") await updateContent(editing.id, { ...base, driveUrl: url.trim(), driveId: driveId!, type, weightage: weight });
        else if (mode === "video") await updateVideo(editing.id, { ...base, youtubeUrl: url.trim(), youtubeId: ytId! });
        else await updateTest(editing.id, { ...base, formUrl: url.trim(), kind, durationMin: Math.max(5, Number(duration) || 30) });
        await logAudit(me, `Edited "${title.trim()}"`);
      } else {
        if (mode === "pdf") await createContent({ ...base, driveUrl: url.trim(), driveId: driveId!, type, weightage: weight, published: true });
        else if (mode === "video") await createVideo({ ...base, youtubeUrl: url.trim(), youtubeId: ytId!, published: true });
        else await createTest({ ...base, formUrl: url.trim(), kind, durationMin: Math.max(5, Number(duration) || 30), published: true });
        await logAudit(me, `Published ${mode} "${title.trim()}"`);
      }
      vibrate(20);
      setEditorOpen(null);
      setTab(mode);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed — check Firestore rules & Initialize on the dashboard.");
    } finally {
      setBusy(false);
    }
  };

  const togglePub = async (d: AnyDoc) => {
    vibrate(10);
    try {
      const m = modeOf(d);
      if (m === "pdf") await updateContent(d.id, { published: !d.published });
      else if (m === "video") await updateVideo(d.id, { published: !d.published });
      else await updateTest(d.id, { published: !d.published });
      await logAudit(me, `${d.published ? "Unpublished" : "Republished"} "${d.title}"`);
    } catch { /* surfaced via list staying unchanged */ }
  };

  const remove = async (d: AnyDoc) => {
    vibrate(20);
    try {
      const m = modeOf(d);
      if (m === "pdf") await deleteContent(d.id);
      else if (m === "video") await deleteVideo(d.id);
      else await deleteTest(d.id);
      await logAudit(me, `Deleted "${d.title}"`);
    } catch { /* noop */ }
  };

  const list: AnyDoc[] = tab === "pdf" ? pdfs : tab === "video" ? vids : tests;

  const previewSrc = (d: AnyDoc) => {
    const m = modeOf(d);
    if (m === "pdf") return drivePreviewUrl((d as ContentDoc).driveId);
    if (m === "video") return youtubeEmbedUrl((d as VideoDoc).youtubeId);
    return formEmbedUrl((d as TestDoc).formUrl);
  };

  return (
    <div className="max-w-container space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sora text-headline-xl">Content Hub</h1>
          <p className="mt-1 font-hanken text-body-md text-on-surface/60">Your Drive, Forms & YouTube — organised, tagged, live.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={openNew}
          className="liquid-shine flex items-center gap-2 rounded-full bg-primary-container px-6 py-3.5 font-geist text-label-md font-bold text-white shadow-glow-primary"
        >
          <Plus size={17} /> Add content
        </motion.button>
      </div>

      {/* library tabs */}
      <div className="glassy flex w-full max-w-md rounded-full p-1.5">
        {([["pdf", `PDFs · ${pdfs.length}`, FileText], ["test", `Tests · ${tests.length}`, ClipboardList], ["video", `Videos · ${vids.length}`, PlayCircle]] as const).map(([m, label, Icon]) => (
          <button key={m} onClick={() => { vibrate(10); setTab(m); }} className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 font-geist text-label-sm">
            {tab === m && <motion.span layoutId="hub-tab" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-full bg-primary-container" />}
            <Icon size={13} className={`relative z-10 ${tab === m ? "text-white" : "text-on-surface/50"}`} />
            <span className={`relative z-10 ${tab === m ? "text-white" : "text-on-surface/60"}`}>{label}</span>
          </button>
        ))}
      </div>

      {/* library */}
      <div className="space-y-3">
        {list.length === 0 && (
          <GlassCard className="p-12 text-center">
            <p className="font-sora font-semibold">Nothing here yet</p>
            <p className="mt-1 font-hanken text-body-md text-on-surface/50">Hit &quot;Add content&quot; — it&apos;s live on every student phone the second you save.</p>
          </GlassCard>
        )}
        {list.map((d) => (
          <GlassCard key={d.id} className={`flex items-center gap-3 p-5 ${d.published ? "" : "opacity-50"}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sora font-semibold">{d.title}</p>
              <p className="font-geist text-label-sm text-on-surface/40">
                {d.subject} · {d.streams.join("+")}
                {"weightage" in d ? ` · ${(d as ContentDoc).weightage} · ${(d as ContentDoc).type}` : "kind" in d ? ` · ${(d as TestDoc).kind} · ${(d as TestDoc).durationMin} min` : " · Video"}
                {!d.published && " · Hidden"}
              </p>
            </div>
            <button onClick={() => { vibrate(10); setViewing(d); }} aria-label="View" className="glassy grid h-10 w-10 shrink-0 place-items-center rounded-full">
              <Eye size={15} className="text-on-surface/70" />
            </button>
            <button onClick={() => openEdit(d)} aria-label="Edit" className="glassy grid h-10 w-10 shrink-0 place-items-center rounded-full">
              <Pencil size={14} className="text-primary" />
            </button>
            <button onClick={() => void togglePub(d)} aria-label="Toggle publish" className="glassy grid h-10 w-10 shrink-0 place-items-center rounded-full">
              {d.published ? <Eye size={15} className="text-primary" /> : <EyeOff size={15} className="text-on-surface/40" />}
            </button>
            <button onClick={() => void remove(d)} aria-label="Delete" className="glassy grid h-10 w-10 shrink-0 place-items-center rounded-full">
              <Trash2 size={15} className="text-error" />
            </button>
          </GlassCard>
        ))}
      </div>

      {/* ————— editor modal ————— */}
      <AnimatePresence>
        {editorOpen !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-6"
            onClick={() => setEditorOpen(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="glassy-strong max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] p-6 md:rounded-[2rem]"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-sora text-headline-lg">{editing ? "Edit content" : "Add content"}</h2>
                <button onClick={() => setEditorOpen(null)} className="glassy grid h-9 w-9 place-items-center rounded-full"><X size={16} /></button>
              </div>

              {!editing && (
                <div className="glassy mb-5 flex rounded-full p-1">
                  {([["pdf", "PDF", FileText], ["test", "Test", ClipboardList], ["video", "Video", PlayCircle]] as const).map(([m, label, Icon]) => (
                    <button key={m} onClick={() => { vibrate(10); setMode(m); setUrl(""); setMsg(""); }} className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 font-geist text-label-sm">
                      {mode === m && <motion.span layoutId="editor-tab" className="absolute inset-0 rounded-full bg-primary-container" />}
                      <Icon size={13} className={`relative z-10 ${mode === m ? "text-white" : "text-on-surface/50"}`} />
                      <span className={`relative z-10 ${mode === m ? "text-white" : "text-on-surface/60"}`}>{label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <p className="mb-2 flex items-center gap-2 font-geist text-label-sm uppercase text-on-surface-variant">
                    <Link2 size={12} /> {mode === "pdf" ? "Google Drive link" : mode === "video" ? "YouTube link" : "Google Form link"} <span className="text-error">*</span>
                  </p>
                  <input value={url} onChange={(e) => { setUrl(e.target.value); setMsg(""); }}
                    placeholder={mode === "pdf" ? "https://drive.google.com/file/d/…/view" : mode === "video" ? "https://youtu.be/…" : "https://docs.google.com/forms/…"}
                    className={`skcti-input h-12 w-full px-4 font-geist text-label-md ${url && !urlOk ? "border-error" : urlOk ? "border-primary/50" : ""}`} />
                  {url && !urlOk && (
                    <p className="mt-1.5 font-geist text-label-sm text-error">
                      {mode === "pdf" ? "Not a valid Drive share link — use Share → Anyone with the link → Viewer" : mode === "video" ? "Not a valid YouTube link" : "Not a valid Google Form link"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="mb-2 font-geist text-label-sm uppercase text-on-surface-variant">Title <span className="text-error">*</span></p>
                  <input value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder={mode === "pdf" ? "Rotational Motion — Complete Notes" : mode === "video" ? "Electrostatics — One Shot" : "Thermodynamics — Chapter Test"}
                    className="skcti-input h-12 w-full px-4" />
                </div>
                <div>
                  <p className="mb-2 font-geist text-label-sm uppercase text-on-surface-variant">Stream <span className="text-error">*</span></p>
                  <div className="flex flex-wrap gap-2">
                    {STREAMS.map((s) => <Chip key={s} label={s} active={streams.includes(s)} onClick={() => setStreams((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]))} />)}
                  </div>
                </div>
                <div>
                  <p className="mb-2 font-geist text-label-sm uppercase text-on-surface-variant">Subject <span className="text-error">*</span></p>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((s) => <Chip key={s} label={s} active={subject === s} onClick={() => setSubject(s)} />)}
                  </div>
                </div>
                {mode === "pdf" && (
                  <>
                    <div>
                      <p className="mb-2 font-geist text-label-sm uppercase text-on-surface-variant">Type</p>
                      <div className="flex flex-wrap gap-2">{TYPES.map((t) => <Chip key={t} label={t} active={type === t} onClick={() => setType(t)} />)}</div>
                    </div>
                    <div>
                      <p className="mb-2 font-geist text-label-sm uppercase text-on-surface-variant">Weightage</p>
                      <div className="flex flex-wrap gap-2">{WEIGHTS.map((w) => <Chip key={w} label={w} active={weight === w} onClick={() => setWeight(w)} />)}</div>
                    </div>
                    <LiveChapterCard title={title || "Your title here"} subject={subject || "Subject"} weightage={weight} stream={streams.join("+") || "PCM"} />
                  </>
                )}
                {mode === "test" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-2 font-geist text-label-sm uppercase text-on-surface-variant">Kind</p>
                      <div className="flex gap-2">{(["Chapter", "Mock"] as const).map((k) => <Chip key={k} label={k} active={kind === k} onClick={() => setKind(k)} />)}</div>
                    </div>
                    <div>
                      <p className="mb-2 font-geist text-label-sm uppercase text-on-surface-variant">Minutes</p>
                      <input inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value.replace(/\D/g, ""))} className="skcti-input h-11 w-full px-4 font-geist" />
                    </div>
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!canSave || busy}
                  onClick={() => void save()}
                  className={`w-full rounded-full py-4 font-geist text-label-md font-bold transition-all ${canSave ? "bg-primary-container text-white shadow-glow-primary" : "glassy cursor-not-allowed text-on-surface/30"}`}
                >
                  {busy ? "Saving…" : editing ? "Save changes" : "Publish live"}
                </motion.button>
                {msg && <p className="font-geist text-label-sm text-error">{msg}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ————— view modal ————— */}
      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            onClick={() => setViewing(null)}
          >
            <motion.div
              initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="glassy-strong flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem]"
            >
              <div className="flex items-center justify-between px-5 py-3.5">
                <p className="truncate font-sora font-semibold">{viewing.title}</p>
                <button onClick={() => setViewing(null)} className="glassy grid h-9 w-9 shrink-0 place-items-center rounded-full"><X size={16} /></button>
              </div>
              <iframe src={previewSrc(viewing)} className="w-full flex-1 bg-white/5" allow="autoplay; encrypted-media" allowFullScreen title={viewing.title} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
