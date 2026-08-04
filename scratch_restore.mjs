import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

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

const modules = [
  { name: "Physics", streams: ["PCM", "PCB"], imageUrl: "https://images.unsplash.com/photo-1636819488524-1f019c4e1c44?q=80&w=1000&auto=format&fit=crop" },
  { name: "Chemistry", streams: ["PCM", "PCB"], imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop" },
  { name: "Math", streams: ["PCM"], imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop" },
  { name: "Biology", streams: ["PCB"], imageUrl: "/images/subjects/biology.jpg" }
];

async function run() {
  for (const m of modules) {
    await addDoc(collection(db, "modules"), { ...m, createdAt: serverTimestamp() });
    console.log("Added", m.name);
  }
  process.exit(0);
}
run();
