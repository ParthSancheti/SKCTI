import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseReady = !!cfg.apiKey && !!cfg.projectId;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

function getApp(): FirebaseApp {
  if (!app) app = getApps()[0] ?? initializeApp(cfg);
  return app;
}

export const fbAuth = (): Auth => getAuth(getApp());

/**
 * ============================================================================
 * OFFLINE PERSISTENCE — the single biggest "feels native" change in the data
 * layer, and it is six lines.
 * ============================================================================
 *
 * The original was `getFirestore(getApp())` with defaults. In a native app
 * that means: no network, no data. Not even the chapter the student opened an
 * hour ago. On a bus, in a basement classroom, on patchy hostel wifi, the app
 * is an empty shell. That is the difference between "I'm offline" and "the app
 * is broken", and students report it as the second one.
 *
 * With persistentLocalCache:
 *   - Every doc the student has ever seen is served instantly from IndexedDB.
 *   - onSnapshot fires immediately from cache, THEN again from the server.
 *     The Learn tab paints in ~0ms instead of after a round trip.
 *   - Writes queue offline and flush when connectivity returns.
 *   - It absorbs a large share of the read volume from audit §9 and §10, so it
 *     is a cost fix as much as a UX fix.
 *
 * persistentMultipleTabManager matters because students open the PDF reader in
 * a second tab on desktop. The older enableIndexedDbPersistence threw
 * "failed-precondition" in that case and silently disabled the cache.
 *
 * experimentalAutoDetectLongPolling: some Android WebViews and school/college
 * networks with deep-packet inspection break Firestore's default WebChannel
 * streaming. The symptom is listeners that connect and then never fire — the
 * app hangs on skeletons forever with no error. Auto-detect falls back to long
 * polling instead of hanging.
 * ============================================================================
 */
export const fbDb = (): Firestore => {
  if (!db) {
    db = initializeFirestore(getApp(), {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      experimentalAutoDetectLongPolling: true,
    });
  }
  return db;
};

export const googleProvider = () => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  return p;
};
