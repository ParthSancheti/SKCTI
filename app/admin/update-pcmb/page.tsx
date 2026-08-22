"use client";

import { useStore } from "@/lib/store";
import { getDocs, updateDoc, doc } from "firebase/firestore";
import { col } from "@/lib/db";
import { useState } from "react";

export default function UpdatePCMB() {
  const { isAdmin } = useStore();
  const [log, setLog] = useState<string[]>([]);

  const appendLog = (msg: string) => setLog(prev => [...prev, msg]);

  const handleUpdate = async () => {
    if (!isAdmin) {
      appendLog("Not an admin.");
      return;
    }
    
    appendLog("Starting update...");

    const collectionsToUpdate = [
      { name: "modules", colRef: col.modules() },
      { name: "content", colRef: col.content() },
      { name: "tests", colRef: col.tests() },
      { name: "banners", colRef: col.banners() },
      { name: "announcements", colRef: col.announcements() },
    ];

    for (const { name, colRef } of collectionsToUpdate) {
      appendLog(`Fetching ${name}...`);
      try {
        const snap = await getDocs(colRef);
        for (const d of snap.docs) {
          const data = d.data();
          if (data.streams && Array.isArray(data.streams)) {
            if (!data.streams.includes("PCMB")) {
              let newStreams = [...data.streams];
              
              if (name === "modules") {
                if (data.name === "Math" && !newStreams.includes("PCMB")) newStreams.push("PCMB");
                else if (data.name === "Biology" && !newStreams.includes("PCMB")) newStreams.push("PCMB");
                else if ((data.name === "Physics" || data.name === "Chemistry") && !newStreams.includes("PCMB")) newStreams.push("PCMB");
              } else {
                if (newStreams.includes("PCM") || newStreams.includes("PCB")) {
                  newStreams.push("PCMB");
                }
              }

              if (newStreams.length > data.streams.length) {
                await updateDoc(doc(colRef.firestore, name, d.id), { streams: newStreams });
                appendLog(`Updated ${name} ${d.id}`);
              }
            }
          }
        }
        appendLog(`Finished ${name}.`);
      } catch (err: any) {
         appendLog(`Error in ${name}: ${err.message}`);
      }
    }
    
    appendLog("Done!");
  };

  return (
    <div className="p-12">
      <h1 className="text-2xl font-bold mb-4">PCMB Database Updater</h1>
      <button 
        onClick={handleUpdate}
        className="bg-purple-600 text-white px-6 py-3 rounded-lg mb-4"
      >
        Run Update Script
      </button>
      <div className="bg-black/10 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
        {log.map((l, i) => <div key={i}>{l}</div>)}
        {log.length === 0 && "Ready..."}
      </div>
    </div>
  );
}
