"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Plus, Trash2, X, Save, UploadCloud } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { createModule, deleteModule, logAudit, updateModule } from "@/lib/db";
import { fbStorage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useStore, vibrate } from "@/lib/store";
import type { ModuleDoc, Stream } from "@/lib/types";

export default function ModulesHub() {
  const { isAdmin, fbUser, modules } = useStore();
  const me = fbUser?.email ?? "admin";

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [streams, setStreams] = useState<Stream[]>(["PCM", "PCB"]);
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
      alert("Image upload failed.");
    }
    setUploading(false);
  };

  const resetForm = () => {
    setName("");
    setImageUrl("");
    setStreams(["PCM", "PCB"]);
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
        await updateModule(editingId, { name, imageUrl, streams });
        await logAudit(me, `Updated module "${name}"`);
      } else {
        await createModule({ name, imageUrl, streams });
        await logAudit(me, `Created module "${name}"`);
      }
      resetForm();
    } catch {
      alert("Failed to save module.");
    }
    setSaving(false);
  };

  const remove = async (m: ModuleDoc) => {
    if (!confirm(`Are you sure you want to delete ${m.name}?`)) return;
    vibrate(20);
    try {
      await deleteModule(m.id);
      await logAudit(me, `Deleted module "${m.name}"`);
    } catch { /* ignored */ }
  };

  const toggleStream = (s: Stream) => {
    setStreams((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  if (!isAdmin) return null;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sora font-black text-3xl tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <Book size={28} className="text-purple-600 dark:text-purple-400" />
            Modules
          </h1>
          <p className="font-geist text-neutral-600 dark:text-neutral-400 mt-1">Manage subjects and modules</p>
        </div>
        <div className="flex items-center gap-2">
          {!adding && (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  vibrate(10);
                  const defaults = [
                    { name: "Physics", streams: ["PCM", "PCB"] as Stream[], imageUrl: "https://images.unsplash.com/photo-1636819488524-1f019c4e1c44?q=80&w=1000&auto=format&fit=crop" },
                    { name: "Chemistry", streams: ["PCM", "PCB"] as Stream[], imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop" },
                    { name: "Math", streams: ["PCM"] as Stream[], imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop" },
                    { name: "Biology", streams: ["PCB"] as Stream[], imageUrl: "/images/subjects/biology.jpg" }
                  ];
                  for (const d of defaults) {
                    if (!modules.find(m => m.name === d.name)) {
                      await createModule(d);
                    }
                  }
                  alert("Default modules restored!");
                }}
                className="flex items-center gap-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white px-5 py-3 rounded-full font-geist font-bold text-sm transition-all"
              >
                Restore Defaults
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { vibrate(10); resetForm(); setAdding(true); }}
                className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-black px-5 py-3 rounded-full font-geist font-bold text-sm shadow-xl hover:shadow-2xl transition-all"
              >
                <Plus size={18} /> <span className="hidden md:inline">Add Module</span>
              </motion.button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <GlassCard className="p-6 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-8 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-sora font-semibold text-lg text-neutral-900 dark:text-white">{editingId ? "Edit Module" : "New Module"}</h2>
                <button onClick={resetForm} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-neutral-900 dark:text-white" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Module Name <span className="text-red-500">*</span></p>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Computer Science" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors backdrop-blur-md text-neutral-900 dark:text-white" />
                </div>
                <div>
                  <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Image URL <span className="text-neutral-400 font-normal">(Optional)</span></p>
                  <div className="flex items-center gap-2">
                    <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-geist text-sm outline-none focus:border-purple-500 transition-colors backdrop-blur-md text-neutral-900 dark:text-white min-w-0" />
                    <label className="flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 cursor-pointer transition-colors text-neutral-900 dark:text-white shrink-0">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                      {uploading ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <UploadCloud size={18} />}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 font-geist text-xs font-bold uppercase tracking-widest text-neutral-500">Streams <span className="text-red-500">*</span></p>
                <div className="flex gap-2">
                  {(["PCM", "PCB"] as Stream[]).map(s => (
                    <button key={s} onClick={() => toggleStream(s)} className={`px-4 py-2 rounded-full font-geist text-sm font-bold transition-all border ${streams.includes(s) ? "bg-purple-600 border-purple-600 text-white" : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-purple-500/50"}`}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving || !name.trim() || streams.length === 0} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg disabled:opacity-50">
                  <Save size={16} /> {saving ? "Saving..." : "Save Module"}
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => (
          <GlassCard key={m.id} className="p-5 flex flex-col gap-4 bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 group">
            {m.imageUrl && (
              <div className="h-32 w-full rounded-xl overflow-hidden bg-black/10 dark:bg-white/10">
                <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-sora font-bold text-xl text-neutral-900 dark:text-white">{m.name}</h3>
              <p className="font-geist text-sm text-neutral-500 dark:text-neutral-400 mt-1">{m.streams.join(" + ")}</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-black/10 dark:border-white/10 pt-4 mt-2">
              <button onClick={() => handleEdit(m)} className="px-4 py-2 rounded-full font-geist font-bold text-sm bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-neutral-900 dark:text-white">Edit</button>
              <button onClick={() => remove(m)} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
            </div>
          </GlassCard>
        ))}
        {modules.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500">
            No modules found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
