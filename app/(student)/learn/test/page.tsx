"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { fbDb } from "@/lib/firebase";
import { formEmbedUrl, type ContentDoc } from "@/lib/types";
import { useStore, vibrate } from "@/lib/store";

export default function TestViewerPage() {
  const params = useSearchParams();
  const id = params.get("id");
  const { profile, markAttempted } = useStore();
  const [content, setContent] = useState<ContentDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  if (!content.testLink) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="glassy-strong rounded-[2rem] p-8 max-w-sm border border-white/10 bg-white/5 backdrop-blur-2xl">
          <p className="font-sora text-lg font-bold text-red-500 mb-2">No Test Found</p>
          <p className="font-geist text-sm text-neutral-400 mb-6">This chapter does not have an associated test link.</p>
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

  return (
    <div className="fixed inset-0 z-[100] bg-black lg:relative lg:inset-auto lg:z-auto lg:bg-transparent">
      {/* Floating UI */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {/* Top Left: Back Button */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center justify-center w-12 h-12 rounded-full glassy hover:brightness-110 transition-all text-white lg:text-black lg:dark:text-white"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Bottom Right: Mark Done Button */}
        {profile && !profile.attempted.includes(content.id) && (
          <div className="absolute bottom-6 right-6 pointer-events-auto">
            <button 
              onClick={() => { vibrate(20); void markAttempted(content.id, content.rewardCoins ?? 25); router.back(); }}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-purple-500/50 bg-black/40 backdrop-blur-md text-purple-400 hover:bg-black/60 transition-all font-geist text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              <CheckCircle2 size={16} className="text-purple-300" />
              <span className="text-white drop-shadow-md">Mark done +{content.rewardCoins ?? 25} 🪙</span>
            </button>
          </div>
        )}
      </div>

      {/* Test Iframe Container */}
      <div className="w-full h-full lg:h-[calc(100vh-80px)] p-0 lg:p-4">
        <iframe 
          src={formEmbedUrl(content.testLink)} 
          className="w-full h-full border-none rounded-none lg:rounded-2xl bg-white pointer-events-auto"
          allow="autoplay; encrypted-media" 
          allowFullScreen 
          onContextMenu={(e) => e.preventDefault()}
          title={`Test for ${content.title}`}
        />
      </div>
    </div>
  );
}
