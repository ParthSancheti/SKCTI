
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const cfg = {
  apiKey: "AIzaSyDyrWF5mBvKh0hPSpM1cxq_HqJE3ZNE6Kc",
  projectId: "project-7d7c40ac-0a05-442d-954",
};

const app = initializeApp(cfg);
const db = getFirestore(app);

const modules = [
  {
    name: "Physics",
    streams: ["PCM", "PCB"],
    imageUrl: "https://images.unsplash.com/photo-1636819488524-1f019c4e1c44?q=80&w=1000&auto=format&fit=crop"
  },
  {
    name: "Chemistry",
    streams: ["PCM", "PCB"],
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop"
  },
  {
    name: "Math",
    streams: ["PCM"],
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop"
  },
  {
    name: "Biology",
    streams: ["PCB"],
    imageUrl: "https://images.unsplash.com/photo-1530213786676-4c72478563a6?q=80&w=1000&auto=format&fit=crop"
  }
];

async function seed() {
  for (const m of modules) {
    await addDoc(collection(db, "modules"), {
      ...m,
      createdAt: serverTimestamp()
    });
    console.log("Added", m.name);
  }
}

seed().catch(console.error).finally(() => process.exit(0));

