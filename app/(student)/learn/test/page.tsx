"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { ChevronLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { fbDb } from "@/lib/firebase";
import { type ContentDoc } from "@/lib/types";
import { useStore, vibrate } from "@/lib/store";
import { Browser } from "@capacitor/browser";
import { formEmbedUrl } from "@/lib/types";

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
        <div className="glassy-strong rounded-[2rem] p-8 max-w-sm border border-white/10 bg-white/5 backdrop-blur-md">
          <p className="font-sora text-lg font-bold text-error mb-2">Error</p>
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
        <div className="glassy-strong rounded-[2rem] p-8 max-w-sm border border-white/10 bg-white/5 backdrop-blur-md">
          <p className="font-sora text-lg font-bold text-error mb-2">No Test Found</p>
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
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-8">
      {/* The Modal Container */}
      <div className="w-full h-full md:max-w-4xl bg-white dark:bg-neutral-900 md:rounded-[2rem] overflow-hidden flex flex-col relative shadow-2xl pointer-events-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 md:py-4 border-b border-outline-variant bg-neutral-100 dark:bg-black/50 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { vibrate(10); router.back(); }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container hover:brightness-110 transition-all text-on-surface"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-sora font-semibold text-base md:text-lg text-on-surface truncate max-w-[200px] sm:max-w-[300px]">{content.title}</h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mark Done Button */}
            {profile && !profile.attempted.includes(content.id) && (
              <button 
                onClick={() => { vibrate(20); void markAttempted(content.id, content.rewardCoins ?? 25); router.back(); }}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full border border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all font-geist text-sm font-bold shadow-sm"
              >
                <CheckCircle2 size={16} /> Mark Done +{content.rewardCoins ?? 25}
              </button>
            )}
            <button onClick={() => Browser.open({ url: content.testLink!, windowName: "_system" })} className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container hover:brightness-110 transition-all text-on-surface" title="Open in browser">
              <ExternalLink size={18} />
            </button>
          </div>
        </div>

        {/* Iframe */}
        <iframe
          src={formEmbedUrl(content.testLink!)}
          className="w-full flex-1 border-none bg-white"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title={content.title}
        />

        {/* Mobile Mark Done (floating) */}
        {profile && !profile.attempted.includes(content.id) && (
          <div className="md:hidden absolute bottom-6 right-6 z-20 pointer-events-auto">
            <button 
              onClick={() => { vibrate(20); void markAttempted(content.id, content.rewardCoins ?? 25); router.back(); }}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-purple-500/50 bg-black/80 backdrop-blur-md text-purple-400 hover:bg-black/90 transition-all font-geist text-sm font-bold shadow-lg"
            >
              <CheckCircle2 size={16} className="text-purple-400" />
              <span>Done +{content.rewardCoins ?? 25} 🪙</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
