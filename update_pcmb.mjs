import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(cfg);
const db = getFirestore(app);

async function run() {
  console.log("Updating modules...");
  const modsSnap = await getDocs(collection(db, "modules"));
  for (const d of modsSnap.docs) {
    const data = d.data();
    if (data.streams && Array.isArray(data.streams)) {
      if (!data.streams.includes("PCMB")) {
        // Add PCMB to all of them, or depending on name
        let newStreams = [...data.streams];
        if (data.name === "Math" && !newStreams.includes("PCMB")) newStreams.push("PCMB");
        else if (data.name === "Biology" && !newStreams.includes("PCMB")) newStreams.push("PCMB");
        else if ((data.name === "Physics" || data.name === "Chemistry") && !newStreams.includes("PCMB")) newStreams.push("PCMB");
        
        if (newStreams.length > data.streams.length) {
           await updateDoc(doc(db, "modules", d.id), { streams: newStreams });
           console.log(`Updated module ${data.name}`);
        }
      }
    }
  }

  console.log("Updating content...");
  const contentSnap = await getDocs(collection(db, "content"));
  for (const d of contentSnap.docs) {
    const data = d.data();
    if (data.streams && Array.isArray(data.streams)) {
      if (!data.streams.includes("PCMB")) {
        let newStreams = [...data.streams];
        // If content applies to PCM or PCB, it probably applies to PCMB too
        if (newStreams.includes("PCM") || newStreams.includes("PCB")) {
          newStreams.push("PCMB");
          await updateDoc(doc(db, "content", d.id), { streams: newStreams });
          console.log(`Updated content ${data.title}`);
        }
      }
    }
  }

  console.log("Updating tests...");
  const testsSnap = await getDocs(collection(db, "tests"));
  for (const d of testsSnap.docs) {
    const data = d.data();
    if (data.streams && Array.isArray(data.streams)) {
      if (!data.streams.includes("PCMB")) {
        let newStreams = [...data.streams];
        if (newStreams.includes("PCM") || newStreams.includes("PCB")) {
          newStreams.push("PCMB");
          await updateDoc(doc(db, "tests", d.id), { streams: newStreams });
          console.log(`Updated test ${data.title}`);
        }
      }
    }
  }

  console.log("Updating banners...");
  const bannersSnap = await getDocs(collection(db, "banners"));
  for (const d of bannersSnap.docs) {
    const data = d.data();
    if (data.streams && Array.isArray(data.streams)) {
      if (!data.streams.includes("PCMB")) {
        let newStreams = [...data.streams];
        if (newStreams.includes("PCM") || newStreams.includes("PCB")) {
          newStreams.push("PCMB");
          await updateDoc(doc(db, "banners", d.id), { streams: newStreams });
          console.log(`Updated banner ${data.title}`);
        }
      }
    }
  }

  console.log("Updating announcements...");
  const annSnap = await getDocs(collection(db, "announcements"));
  for (const d of annSnap.docs) {
    const data = d.data();
    if (data.streams && Array.isArray(data.streams)) {
      if (!data.streams.includes("PCMB")) {
        let newStreams = [...data.streams];
        if (newStreams.includes("PCM") || newStreams.includes("PCB")) {
          newStreams.push("PCMB");
          await updateDoc(doc(db, "announcements", d.id), { streams: newStreams });
          console.log(`Updated announcement ${data.id}`);
        }
      }
    }
  }

  console.log("Done.");
  process.exit(0);
}
run();
