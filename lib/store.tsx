"use client";

import { onAuthStateChanged, signInWithPopup, signOut, signInWithCredential, GoogleAuthProvider, type User } from "firebase/auth";
import { doc, increment, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { fbAuth, fbDb, firebaseReady, googleProvider } from "./firebase";
import { updateUser, col } from "./db";
import type { AppConfig, Grade, Stream, UserDoc, TodoTask, AiChatMsg } from "./types";
import { DEFAULT_CONFIG, todayKey } from "./types";

/* ————————————————— haptics ————————————————— */
export function vibrate(ms = 10) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {}
}
export function triggerHaptic(pattern: number | number[] = 50) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {}
}

/* ————————————————— visual event bus (R3/R4) ————————————————— */
export function firePortal(x: number, y: number) {
  window.dispatchEvent(new CustomEvent("skcti:portal", { detail: { x, y } }));
}
export function fireCoinFly(x: number, y: number, amount = 10) {
  window.dispatchEvent(new CustomEvent("skcti:coinfly", { detail: { x, y, amount } }));
}

/* ————————————————— context ————————————————— */
type ThemePref = "device" | "light" | "dark";

interface Store {
  ready: boolean; // auth state resolved
  fbUser: User | null; // firebase auth user
  profile: UserDoc | null; // firestore user doc (null = needs onboarding)
  profileLoaded: boolean;
  todos: TodoTask[];
  chatHistory: AiChatMsg[];
  config: AppConfig;
  configLoaded: boolean;
  isAdmin: boolean;
  isDark: boolean;
  themePref: ThemePref;
  toggleTheme: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (d: { phone: string; grade: Grade; stream: Stream }) => Promise<void>;
  setStream: (s: Stream) => Promise<void>;
  upgradeGrade: () => Promise<void>;
  dismissUpgrade: () => Promise<void>;
  addCoins: (n: number) => Promise<void>;
  markTaskDone: (taskId: string) => Promise<void>;
  markDownloaded: (contentId: string) => Promise<void>;
  markAttempted: (testId: string, rewardCoins?: number) => Promise<void>;
  markViewed: (contentId: string, rewardCoins?: number) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [todos, setTodos] = useState<TodoTask[]>([]);
  const [chatHistory, setChatHistory] = useState<AiChatMsg[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [themePref, setThemePref] = useState<ThemePref>("device");
  const streakDone = useRef(false);

  /* —— auth —— */
  useEffect(() => {
    if (!firebaseReady) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(fbAuth(), (u) => {
      setFbUser(u);
      setReady(true);
      if (u) {
        document.cookie = "skcti_session=true; path=/; max-age=86400";
      } else {
        document.cookie = "skcti_session=; path=/; max-age=0";
        setProfile(null);
        setProfileLoaded(true);
        streakDone.current = false;
      }
    });
  }, []);

  /* —— live user doc —— */
  useEffect(() => {
    if (!fbUser) return;
    setProfileLoaded(false);
    const unsub = onSnapshot(
      doc(fbDb(), "users", fbUser.uid),
      (s) => {
        setProfile(s.exists() ? ({ uid: s.id, ...s.data() } as UserDoc) : null);
        setProfileLoaded(true);
      },
      () => setProfileLoaded(true)
    );
    return unsub;
  }, [fbUser]);

  /* —— live todos —— */
  useEffect(() => {
    if (!fbUser) {
      setTodos([]);
      return;
    }
    const unsub = onSnapshot(col.todos(fbUser.uid), (snap) => {
      const arr: TodoTask[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() } as TodoTask));
      arr.sort((a, b) => b.createdAt - a.createdAt);
      setTodos(arr);
    });
    return unsub;
  }, [fbUser]);

  /* —— live chat history —— */
  useEffect(() => {
    if (!fbUser) {
      setChatHistory([]);
      return;
    }
    const unsub = onSnapshot(doc(fbDb(), "users", fbUser.uid, "private", "chat"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setChatHistory(data.msgs || []);
      } else {
        setChatHistory([]);
      }
    });
    return unsub;
  }, [fbUser]);

  /* —— live config —— */
  useEffect(() => {
    if (!firebaseReady || !fbUser) return;
    const unsub = onSnapshot(
      doc(fbDb(), "config", "app"),
      (s) => {
        if (s.exists()) {
          const d = s.data() as Partial<AppConfig>;
          setConfig({
            ...DEFAULT_CONFIG,
            ...d,
            features: { ...DEFAULT_CONFIG.features, ...(d.features ?? {}) },
            landing: { ...DEFAULT_CONFIG.landing, ...(d.landing ?? {}) },
          });
        }
        setConfigLoaded(true);
      },
      () => setConfigLoaded(true)
    );
    return unsub;
  }, [fbUser]);

  /* —— streak + presence, once per session after profile loads —— */
  useEffect(() => {
    if (!profile || streakDone.current) return;
    streakDone.current = true;
    const today = todayKey();
    if (profile.lastActiveDate !== today) {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterday = y.toISOString().slice(0, 10);
      const streak = profile.lastActiveDate === yesterday ? profile.streak + 1 : 1;
      updateUser(profile.uid, { streak, lastActiveDate: today, lastSeen: serverTimestamp() as never }).catch(() => {});
    } else {
      updateUser(profile.uid, { lastSeen: serverTimestamp() as never }).catch(() => {});
    }
  }, [profile]);

  /* —— theme (local, device-first) —— */
  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )skcti-theme=([^;]+)/);
    const pref = (m ? m[1] : "device") as ThemePref;
    setThemePref(pref);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = pref === "dark" || (pref === "device" && mq.matches);
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    if (pref === "device") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [themePref]);

  const toggleTheme = () => {
    vibrate(15);
    const next: ThemePref = isDark ? "light" : "dark";
    const overlay = document.getElementById("theme-overlay");
    if (overlay) {
      overlay.classList.remove("theme-overlay-run");
      void overlay.offsetWidth;
      overlay.classList.add("theme-overlay-run");
      window.setTimeout(() => overlay.classList.remove("theme-overlay-run"), 650);
    }
    window.setTimeout(() => {
      document.cookie = `skcti-theme=${next};path=/;max-age=31536000`;
      setThemePref(next);
      setIsDark(next === "dark");
      document.documentElement.classList.toggle("dark", next === "dark");
    }, 250);
  };

  /* —— auth actions —— */
  const loginWithGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const user = await GoogleAuth.signIn();
        if (user.authentication.idToken) {
          const credential = GoogleAuthProvider.credential(user.authentication.idToken);
          await signInWithCredential(fbAuth(), credential);
        }
      } catch (err) {
        console.error("Native Google Login failed:", err);
        throw err;
      }
    } else {
      await signInWithPopup(fbAuth(), googleProvider());
    }
  };
  const logout = async () => {
    document.cookie = "skcti_session=; path=/; max-age=0";
    await signOut(fbAuth());
  };

  const completeOnboarding = async (d: { phone: string; grade: Grade; stream: Stream }) => {
    if (!fbUser) return;
    const docData: Omit<UserDoc, "uid"> = {
      name: fbUser.displayName ?? "Student",
      email: (fbUser.email ?? "").toLowerCase(),
      photo: fbUser.photoURL ?? "",
      phone: d.phone,
      grade: d.grade,
      stream: d.stream,
      coins: 50,
      streak: 1,
      lastActiveDate: todayKey(),
      downloads: [],
      attempted: [],
      doneTasks: [],
      todayPlan: null,
      justUpgraded: false,
    };
    await setDoc(doc(fbDb(), "users", fbUser.uid), {
      ...docData,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
  };

  /* —— profile mutations —— */
  const setStream = async (s: Stream) => {
    if (profile && s !== profile.stream)
      await updateUser(profile.uid, { stream: s, todayPlan: null });
  };
  const upgradeGrade = async () => {
    if (profile && profile.grade === "11th")
      await updateUser(profile.uid, { grade: "12th", justUpgraded: true, todayPlan: null });
  };
  const dismissUpgrade = async () => {
    if (profile) await updateUser(profile.uid, { justUpgraded: false });
  };
  const addCoins = async (n: number) => {
    if (profile) await updateUser(profile.uid, { coins: increment(n) as never });
  };
  const markTaskDone = async (taskId: string) => {
    if (!profile) return;
    const key = `${todayKey()}:${taskId}`;
    if (profile.doneTasks.includes(key)) return;
    await updateUser(profile.uid, {
      doneTasks: [...profile.doneTasks.filter((t) => t.startsWith(todayKey())), key],
      coins: increment(10) as never,
    });
  };
  const markDownloaded = async (contentId: string) => {
    if (profile && !profile.downloads.includes(contentId))
      await updateUser(profile.uid, { downloads: [...profile.downloads, contentId] });
  };
  const markAttempted = async (testId: string, rewardCoins: number = 25) => {
    if (profile && !profile.attempted.includes(testId))
      await updateUser(profile.uid, {
        attempted: [...profile.attempted, testId],
        coins: increment(rewardCoins) as never,
      });
  };

  const markViewed = async (contentId: string, rewardCoins: number = 10) => {
    if (profile && !profile.downloads.includes(contentId))
      await updateUser(profile.uid, {
        downloads: [...profile.downloads, contentId],
        coins: increment(rewardCoins) as never,
      });
  };

  const email = (fbUser?.email ?? "").toLowerCase();
  const isAdmin = !!email && (config.adminEmails.map((e) => e.toLowerCase()).includes(email) || envAdmins.includes(email));

  return (
    <Ctx.Provider
      value={{
        ready, fbUser, profile, profileLoaded, todos, chatHistory, config, configLoaded, isAdmin,
        isDark, themePref, toggleTheme, loginWithGoogle, logout, completeOnboarding,
        setStream, upgradeGrade, dismissUpgrade, addCoins, markTaskDone, markDownloaded, markAttempted, markViewed,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside AppProvider");
  return ctx;
}

/* Redirect guard for student pages. Returns true when it's safe to render. */
export function useAuthGate() {
  const { ready, fbUser, profile, profileLoaded } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!ready) return;
    // Explicitly allow the root landing page (public zone)
    if (pathname === "/") return;
    
    if (!fbUser) router.replace("/");
    else if (profileLoaded && !profile && pathname !== "/onboarding") router.replace("/onboarding");
  }, [ready, fbUser, profile, profileLoaded, pathname, router]);
  
  return ready && !!fbUser && profileLoaded && !!profile;
}
