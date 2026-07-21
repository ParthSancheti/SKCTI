"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { ChevronLeft, Download, Sparkles } from "lucide-react";
import { fbDb } from "@/lib/firebase";
import { drivePreviewUrl, type ContentDoc } from "@/lib/types";
import { vibrate } from "@/lib/store";
import { useHapticRouter } from "@/components/HapticRouter";

export default function PdfReaderPage() {
  const params = useSearchParams();
  const id = params.get("id");
  const [content, setContent] = useState<ContentDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { navigate } = useHapticRouter();

  useEffect(() => {
    if (!id) {
      setError("No document ID provided.");
      return;
    }
    const fetchDoc = async () => {
      try {
        const snap = await getDoc(doc(fbDb(), "content", id));
        if (snap.exists()) {
          setContent({ id: snap.id, ...snap.data() } as ContentDoc);
        } else {
          setError("Document not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load document.");
      }
    };
    fetchDoc();
  }, [id]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="glassy-strong rounded-[2rem] p-8 max-w-sm border border-white/10 bg-white/5 backdrop-blur-2xl">
          <p className="font-sora text-lg font-bold text-red-500 mb-2">Error</p>
          <p className="font-geist text-sm text-neutral-400 mb-6">{error}</p>
          <button 
            onClick={() => router.back()}
            className="w-full bg-white/10 hover:bg-white/20 text-white rounded-full py-3 font-geist text-sm font-bold transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Floating Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-2xl border-b border-white/10 p-4 flex items-center justify-between">
        <button 
          onClick={(e) => { vibrate(10); navigate("/learn", e as any); }}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
        >
          <ChevronLeft size={22} />
          <span className="font-geist text-sm font-bold hidden sm:inline">Back</span>
        </button>
        
        <p className="font-sora font-semibold text-sm truncate px-4 flex-1 text-center text-white">
          {content.title}
        </p>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => vibrate(10)} 
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all font-geist text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
          
          <button 
            onClick={() => { vibrate(10); window.open(content.driveUrl, "_blank"); }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            aria-label="Download"
          >
            <Download size={16} />
          </button>
        </div>
      </header>

      {/* PDF Iframe Container */}
      <div className="w-full h-full pt-16 sm:pt-[72px]">
        <iframe 
          src={drivePreviewUrl(content.driveId)} 
          className="w-full h-full border-none"
          allow="autoplay; encrypted-media" 
          allowFullScreen 
          title={content.title}
        />
      </div>
    </div>
  );
}
