"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Book, Plus, Trash2, X, Save, UploadCloud, Pencil, Eye, Code } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import PhonePreviewFrame from "@/components/PhonePreviewFrame";
import SubjectCard from "@/components/SubjectCard";
import { createModule, createDefaultModule, deleteModule, logAudit, updateModule, col } from "@/lib/db";
import { fbStorage, fbDb } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { writeBatch, getDocs, query, where } from "firebase/firestore";
import { useStore, vibrate } from "@/lib/store";
import type { ModuleDoc, Stream } from "@/lib/types";
import { useToast } from "@/components/Toast";

export default function ModulesHub() {
  const { isAdmin, fbUser, modules, configLoaded } = useStore();
  const me = fbUser?.email ?? "admin";
  const toast = useToast();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [localModules, setLocalModules] = useState<ModuleDoc[]>([]);

  useEffect(() => {
    setLocalModules(modules);
  }, [modules]);
  
  const hasOrderChanged = localModules.some((m, i) => m.id !== modules[i]?.id);

  const saveOrder = async () => {
    setSaving(true);
    try {
      await Promise.all(localModules.map((m, i) => updateModule(m.id, { order: i })));
      await logAudit(me, "Reordered modules");
    } catch {
      toast.error("Failed to save order.");
    }
    setSaving(false);
  };
  
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [streams, setStreams] = useState<Stream[]>(["PCM", "PCB", "PCMB"]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(fbStorage(), `modules/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
    } catch (err) {
      toast.error("Image upload failed.");
    }
    setUploading(false);
  };

  const resetForm = () => {
    setName("");
    setImageUrl("");
    setStreams(["PCM", "PCB", "PCMB"]);
    setAdding(false);
    setEditingId(null);
  };

  const handleEdit = (m: ModuleDoc) => {
    setName(m.name);
    setImageUrl(m.imageUrl);
    setStreams(m.streams);
    setEditingId(m.id);
    setAdding(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const oldModule = localModules.find(m => m.id === editingId);
        await updateModule(editingId, { name, imageUrl, streams });
        
        // Sync orphaned content if name changed
        if (oldModule && oldModule.name !== name) {
          const batch = writeBatch(fbDb());
          const [cSnap, vSnap, tSnap] = await Promise.all([
            getDocs(query(col.content(), where("subject", "==", oldModule.name))),
            getDocs(query(col.videos(), where("subject", "==", oldModule.name))),
            getDocs(query(col.tests(), where("subject", "==", oldModule.name)))
          ]);
          cSnap.forEach(d => batch.update(d.ref, { subject: name }));
          vSnap.forEach(d => batch.update(d.ref, { subject: name }));
          tSnap.forEach(d => batch.update(d.ref, { subject: name }));
          await batch.commit();
        }
        
        await logAudit(me, `Updated module "${name}"`);
      } else {
        await createModule({ name, imageUrl, streams });
        await logAudit(me, `Created module "${name}"`);
      }
      resetForm();
    } catch {
      toast.error("Failed to save module.");
    }
    setSaving(false);
  };

  const remove = async (m: ModuleDoc) => {
    if (m.id.startsWith("default_")) {
      toast.error("This is a system default module. You can edit it to override it, but you cannot delete it directly.");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${m.name}?`)) return;
    vibrate(20);
    try {
      await deleteModule(m.id);
      await logAudit(me, `Deleted module "${m.name}"`);
    } catch { /* ignored */ }
  };

  const seedingRef = useRef(false);

  const seedDefaultModules = async () => {
    vibrate(20);
    const defaults = [
      { id: "default_physics", name: "Physics", streams: ["PCM", "PCB", "PCMB"], imageUrl: "https://images.unsplash.com/photo-1636819488524-1f019c4e1c44?q=80&w=1000&auto=format&fit=crop" },
      { id: "default_chemistry", name: "Chemistry", streams: ["PCM", "PCB", "PCMB"], imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop" },
      { id: "default_math", name: "Math", streams: ["PCM", "PCMB"], imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop" },
      { id: "default_biology", name: "Biology", streams: ["PCB", "PCMB"], imageUrl: "https://images.unsplash.com/photo-1530213786676-4c72478563a6?q=80&w=1000&auto=format&fit=crop" }
    ];
    setSaving(true);
    try {
      for (const m of defaults) {
        const { id, ...data } = m;
        await createDefaultModule(id, data as any);
      }
      await logAudit(me, "Restored default PCM/PCB modules");
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore modules.");
    }
    setSaving(false);
  };

  const toggleStream = (s: Stream) => {
    setStreams((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  if (!isAdmin) return null;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pt-2 pb-12">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-sora text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Modules</h1>
          <p className="mt-1 font-geist text-body-md text-neutral-500 dark:text-white/60">Manage subjects and streams</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2">
          
          {/* Mobile Tabs */}
          <div className="flex lg:hidden bg-black/5 dark:bg-white/5 rounded-full p-1 mb-2 md:mb-0 w-full">
            <button
              onClick={() => { vibrate(10); setMobileTab("editor"); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full font-geist text-sm font-bold transition-all ${
                mobileTab === "editor" ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Code size={16} /> Editor
            </button>
            <button
              onClick={() => { vibrate(10); setMobileTab("preview"); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full font-geist text-sm font-bold transition-all ${
                mobileTab === "preview" ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Eye size={16} /> Preview
            </button>
          </div>

          {!adding && hasOrderChanged && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { vibrate(10); void saveOrder(); }}
              disabled={saving}
              className="w-full md:w-auto flex items-center justify-center gap-2 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-lg px-6 py-3.5 font-geist text-sm font-bold transition-all disabled:opacity-50"
            >
              <Save size={17} /> <span>{saving ? "Saving..." : "Save Order"}</span>
            </motion.button>
          )}
          {!adding && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { vibrate(10); resetForm(); setAdding(true); setMobileTab("editor"); }}
              className="w-full md:w-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-600/20 px-6 py-3.5 font-geist text-sm font-bold transition-all"
            >
              <Plus size={17} /> <span>Add Module</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Pane (Editor) */}
        <div className={`w-full lg:col-span-7 xl:col-span-8 flex flex-col gap-6 ${mobileTab !== "editor" ? "hidden lg:flex" : ""}`}>
          <AnimatePresence>
            {adding && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <GlassCard className="p-4 md:p-5 w-full block box-border mb-8 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-sora text-xl font-bold text-neutral-900 dark:text-white">{editingId ? "Edit Module" : "New Module"}</h2>
                <button onClick={resetForm} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-neutral-900 dark:text-white" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Module Name <span className="text-red-500">*</span></p>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Computer Science" className="w-full rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Image URL <span className="text-neutral-400 font-normal">(Optional)</span></p>
                  <div className="flex items-center gap-2">
                    <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="flex-1 rounded-2xl border border-outline/30 glassy px-4 py-3 font-geist text-body-md text-neutral-900 dark:text-white outline-none focus:border-primary min-w-0" />
                    <label className="flex items-center justify-center rounded-2xl glassy hover:bg-black/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 px-4 py-3 cursor-pointer transition-colors text-neutral-900 dark:text-white shrink-0 shadow-sm">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                      {uploading ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <UploadCloud size={18} />}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Streams <span className="text-red-500">*</span></p>
                <div className="flex gap-2">
                  {(["PCM", "PCB", "PCMB"] as Stream[]).map(s => (
                    <button key={s} onClick={() => toggleStream(s)} className={`px-4 py-2 rounded-full font-geist text-sm font-bold transition-all border ${streams.includes(s) ? "bg-purple-600 border-purple-600 text-white shadow-lg" : "glassy border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-purple-500/50"}`}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving || !name.trim() || streams.length === 0} className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-600/20 px-6 py-3.5 font-geist text-sm font-bold transition-all disabled:opacity-50">
                  {saving ? "Saving..." : "Save Module"}
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <Reorder.Group axis="y" values={localModules} onReorder={setLocalModules} className="flex flex-col gap-4 max-w-3xl">
        {localModules.map((m) => (
          <Reorder.Item key={m.id} value={m} className="list-none outline-none relative z-0">
            <GlassCard className="p-3 md:p-4 w-full box-border flex flex-row items-center gap-4 group cursor-grab active:cursor-grabbing">
              {m.imageUrl && (
                <div className="h-16 w-24 md:h-20 md:w-32 shrink-0 rounded-xl overflow-hidden bg-black/10 dark:bg-white/10 pointer-events-none">
                  <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              )}
              <div className="flex-1 pointer-events-none">
                <h3 className="font-sora font-bold text-lg md:text-xl text-neutral-900 dark:text-white">{m.name}</h3>
                <p className="font-geist text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{m.streams.join(" + ")}</p>
              </div>
              <div className="flex justify-end gap-2 shrink-0">
                <button onPointerDown={(e) => e.stopPropagation()} onClick={() => handleEdit(m)} aria-label="Edit" title="Edit" className="w-9 h-9 flex items-center justify-center rounded-full glassy hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-purple-600 dark:text-purple-400">
                  <Pencil size={14} />
                </button>
                <button onPointerDown={(e) => e.stopPropagation()} onClick={() => remove(m)} aria-label="Delete" title="Delete" className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </GlassCard>
          </Reorder.Item>
        ))}
        {localModules.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center gap-4">
            <p className="text-neutral-500 font-geist text-body-md">No modules found. Create one to get started.</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={seedDefaultModules}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-600/20 px-6 py-3 font-geist text-sm font-bold transition-all disabled:opacity-50"
            >
              {saving ? "Restoring..." : "Restore default PCM/PCB Subjects"}
            </motion.button>
          </div>
        )}
      </Reorder.Group>
        </div>

        {/* Right Pane (Live Preview) */}
        <div className={`w-full lg:col-span-5 xl:col-span-4 lg:sticky lg:top-32 flex flex-col items-center ${mobileTab !== "preview" ? "hidden lg:flex" : "mt-8"}`}>
          <p className="font-geist text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Student Preview
          </p>
          <div className="lg:scale-90 lg:origin-top w-full max-w-[380px]">
            <PhonePreviewFrame>
              <div className="space-y-4 pt-4 px-4 bg-[#f8f9fb] dark:bg-[#0A0A0A] min-h-[500px]">
                <h2 className="font-sora font-black text-xl px-2 text-neutral-900 dark:text-white">Your subjects</h2>
                <div className="flex flex-col gap-4">
                  {localModules.map((m) => (
                    <div key={m.id} className="pointer-events-none">
                      <SubjectCard 
                        subject={m.name} 
                        imageUrl={m.imageUrl} 
                        count={0} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </PhonePreviewFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
