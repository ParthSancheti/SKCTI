"use client";

import { onAuthStateChanged, signInWithPopup, signOut, signInWithCredential, deleteUser, GoogleAuthProvider, type User } from "firebase/auth";
import { doc, getDocs, increment, onSnapshot, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { usePathname, useRouter } from "next/navigation";
import { StatusBar } from "@capacitor/status-bar";
import { NavigationBar } from "@capawesome/capacitor-navigation-bar";
import { useTheme } from "next-themes";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { fbAuth, fbDb, firebaseReady, googleProvider } from "./firebase";
import { updateUser, col } from "./db";
import type { AppConfig, Grade, Stream, UserDoc, TodoTask, AiChatMsg, NotificationPrefs, UserPrefs, AdminRole } from "./types";
import { vibrate as hVibrate } from "./haptics";
import { DEFAULT_AI, DEFAULT_CONFIG, DEFAULT_MAINTENANCE, DEFAULT_NOTIFICATIONS, DEFAULT_PREFS, todayKey } from "./types";

/* ————————————————— haptics ————————————————— */

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

  /* —— settings that were previously fake local state —— */
  notifications: NotificationPrefs;
  prefs: UserPrefs;
  setNotification: (key: keyof NotificationPrefs, value: boolean) => Promise<void>;
  setPref: <K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => Promise<void>;
  clearDownloads: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  adminRole: AdminRole | null;
  isOwner: boolean;
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

  /* —— initialize capacitor google auth & status bar —— */
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
        NavigationBar.setColor({ color: 'transparent', dividerColor: 'transparent' }).catch(() => {});
        
        CapApp.addListener('backButton', () => {
          if (window.location.pathname.startsWith('/home') || window.location.pathname === '/') {
            CapApp.exitApp();
          } else {
            window.history.back();
          }
        });

        GoogleAuth.initialize({
          clientId: "142521151624-cuv2orimqc8jn9gtjcsl9ga5cindv4j8.apps.googleusercontent.com",
          scopes: ["profile", "email"],
          grantOfflineAccess: true,
        });
      } catch (e) {
        console.error("Failed to init native plugins", e);
      }
    }
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
            ai: { ...DEFAULT_AI, ...(d.ai ?? {}) },
            maintenance: { ...DEFAULT_MAINTENANCE, ...(d.maintenance ?? {}) },
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

  const { theme, setTheme, systemTheme } = useTheme();
  
  useEffect(() => {
    setIsDark(theme === "dark" || (theme === "system" && systemTheme === "dark"));
  }, [theme, systemTheme]);

  const toggleTheme = () => {
    hVibrate(15);
    const overlay = document.getElementById("theme-overlay");
    if (overlay) {
      overlay.classList.remove("theme-overlay-run");
      void overlay.offsetWidth;
      overlay.classList.add("theme-overlay-run");
      window.setTimeout(() => overlay.classList.remove("theme-overlay-run"), 650);
    }
    window.setTimeout(() => {
      setTheme(isDark ? "light" : "dark");
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
      notifications: DEFAULT_NOTIFICATIONS,
      prefs: DEFAULT_PREFS,
      studyMinutes: 0,
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
    // Study Analytics used to display a hardcoded "45h". Log the real minutes
    // from the plan task the student just finished so the number means something.
    const mins = profile.todayPlan?.tasks.find((t) => t.id === taskId)?.minutes ?? 0;
    await updateUser(profile.uid, {
      doneTasks: [...profile.doneTasks.filter((t) => t.startsWith(todayKey())), key],
      coins: increment(10) as never,
      studyMinutes: increment(mins) as never,
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

  /* —— settings persistence (was useState, reset on every reload) —— */
  const notifications: NotificationPrefs = { ...DEFAULT_NOTIFICATIONS, ...(profile?.notifications ?? {}) };
  const prefs: UserPrefs = { ...DEFAULT_PREFS, ...(profile?.prefs ?? {}) };

  const setNotification = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!profile) return;
    await updateUser(profile.uid, { notifications: { ...notifications, [key]: value } });
  };

  const setPref = async <K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => {
    if (!profile) return;
    await updateUser(profile.uid, { prefs: { ...prefs, [key]: value } });
  };

  /* Apply the reduced-effects preference to the document so the CSS in
     globals.css (html[data-perf="low"]) can drop backdrop-filter. */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (prefs.reducedEffects) document.documentElement.dataset.perf = "low";
    else delete document.documentElement.dataset.perf;
  }, [prefs.reducedEffects]);

  /** The "Clear Downloads" button in Settings had no onClick at all. */
  const clearDownloads = async () => {
    if (!profile) return;
    await updateUser(profile.uid, { downloads: [] });
  };

  /**
   * Account deletion. There was previously no way for a student — a minor —
   * to remove their data. Wipes the profile, both subcollections and the
   * leaderboard entry, then signs out.
   */
  const deleteAccount = async () => {
    const u = fbUser;
    if (!u) return;
    const uid = u.uid;
    try {
      const [todoSnap, chatSnap] = await Promise.all([
        getDocs(col.todos(uid)),
        getDocs(col.aiChats(uid)),
      ]);
      const batch = writeBatch(fbDb());
      todoSnap.forEach((d) => batch.delete(d.ref));
      chatSnap.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(fbDb(), "leaderboard", uid));
      batch.delete(doc(fbDb(), "users", uid));
      await batch.commit();
    } finally {
      document.cookie = "skcti_session=; path=/; max-age=0";
      // Removes the Firebase Auth record too, not just the Firestore data.
      await deleteUser(u).catch(() => signOut(fbAuth()));
    }
  };

  const email = (fbUser?.email ?? "").toLowerCase();
  const isAdmin = !!email && (config.adminEmails.map((e) => e.toLowerCase()).includes(email) || envAdmins.includes(email));

  // Absent from adminRoles => "owner", so existing single-admin setups keep
  // full access without a migration.
  const adminRole: AdminRole | null = isAdmin ? (config.adminRoles?.[email] ?? "owner") : null;
  const isOwner = adminRole === "owner";

  return (
    <Ctx.Provider
      value={{
        ready, fbUser, profile, profileLoaded, todos, chatHistory, config, configLoaded, isAdmin,
        notifications, prefs, setNotification, setPref, clearDownloads, deleteAccount, adminRole, isOwner,
        isDark, themePref, toggleTheme, loginWithGoogle, logout, completeOnboarding,
        setStream, upgradeGrade, dismissUpgrade, addCoins, markTaskDone, markDownloaded, markAttempted, markViewed,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export { vibrate, triggerHaptic } from "./haptics";

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
