import type { Timestamp } from "firebase/firestore";

export type Stream = "PCM" | "PCB";
export type Grade = "11th" | "12th";
export type Weightage = "High" | "Medium" | "Low";

export interface PlanTask {
  id: string;
  title: string;
  subject: string;
  minutes: number;
}

export interface TodoTask {
  id: string;
  title: string;
  category: string; // "Physics", "Chemistry", "Math", "Biology", "General"
  durationMinutes: number;
  urgency: "High" | "Medium" | "Low";
  status: "todo" | "done";
  dueDate?: string; // ISO date
  createdAt: number;
}

export interface ActionItem {
  task_name: string;
  duration_minutes: number;
  urgency: "High" | "Medium" | "Low";
}

export interface AiChatMsg {
  role: "user" | "model";
  text: string;
  image?: string;
  action_items?: ActionItem[];
}

export interface AiChatDoc {
  id: string;
  title: string;
  messages: AiChatMsg[];
  updatedAt: number;
}

export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  photo: string;
  phone: string;
  grade: Grade;
  stream: Stream;
  coins: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  downloads: string[]; // content ids
  attempted: string[]; // test ids
  doneTasks: string[]; // `${date}:${taskId}`
  todayPlan?: { date: string; tasks: PlanTask[] } | null;
  justUpgraded?: boolean;
  createdAt?: Timestamp;
  lastSeen?: Timestamp;

  /* —— settings that used to be fake local useState —— */
  notifications?: NotificationPrefs;
  prefs?: UserPrefs;
  /** Minutes actually logged from completed plan tasks. Powers Study Analytics. */
  studyMinutes?: number;
}

export interface NotificationPrefs {
  /** "Study Reminders" toggle in Settings. */
  reminders: boolean;
  /** "App Updates" toggle in Settings. */
  updates: boolean;
  /** FCM registration token for this device, if push is granted. */
  pushToken?: string;
}

export interface UserPrefs {
  /** Drops backdrop-filter on weak devices — see html[data-perf] in globals.css. */
  reducedEffects: boolean;
  /** Language for notices and AI replies. */
  language: "en" | "hi" | "mr";
}

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = { reminders: true, updates: true };
export const DEFAULT_PREFS: UserPrefs = { reducedEffects: false, language: "en" };

export interface ContentDoc {
  id: string;
  title: string;
  driveUrl: string;
  driveId: string;
  testLink?: string;
  youtubeUrl?: string;
  streams: Stream[];
  subject: string;
  type: string; // Notes PDF / DPP / Formula Sheet...
  weightage: Weightage;
  published: boolean;
  rewardCoins?: number;
  createdAt?: Timestamp;
}

export interface TestDoc {
  id: string;
  title: string;
  formUrl: string;
  streams: Stream[];
  subject: string;
  kind: "Chapter" | "Mock";
  durationMin: number;
  marks?: number;
  published: boolean;
  rewardCoins?: number;
  createdAt?: Timestamp;
}

export interface BannerDoc {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta?: string;
  streams: Stream[];
  published: boolean;
  createdAt?: Timestamp;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  at?: Timestamp;
}

export interface VideoDoc {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  streams: Stream[];
  subject: string;
  published: boolean;
  createdAt?: Timestamp;
}

export interface AnnouncementDoc {
  id: string;
  text: string;
  streams: Stream[];
  published: boolean;
  createdAt?: Timestamp;
}

export interface InquiryDoc {
  id: string;
  name: string;
  phone: string;
  studentClass: string; // "11th" | "12th" | "Other"
  message: string;
  status: "new" | "contacted";
  createdAt?: Timestamp;
}

export interface FeatureFlags {
  planner: boolean;
  streak: boolean;
  coins: boolean;
  ai: boolean;
  rank: boolean;
  tests: boolean;
  videos: boolean;
  notices: boolean;
}

export type HomeBlockId = string;

export interface LandingConfig {
  tagline: string;
  sub: string;
  whatsapp: string; // digits only, e.g. 919876543210
  instagram: string; // full URL
  youtube: string; // full URL
  showInquiry: boolean;
}

/**
 * Admin-tunable AI settings.
 *
 * NOTE — there is deliberately NO apiKey field here. The admin Settings page
 * currently renders two password inputs labelled "Primary Gemini API Key" and
 * "Fallback API Key". Storing a key in config/app would push it to every
 * signed-in student's device on page load, because that document is read by
 * the client SDK. Keys stay in Vercel environment variables, server-side only.
 * The Settings card now says so instead of pretending to accept one.
 */
export interface AiConfig {
  model: string;
  /** Whole-app ceiling per day. 0 = unlimited. */
  dailyLimit: number;
  /** Per-student ceiling per day, so one user can't drain the shared budget. */
  perUserLimit: number;
  /** Emergency killswitch — pauses all AI generation immediately. */
  paused: boolean;
}

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  /** Admins keep full access while maintenance is on. */
  allowAdmins: boolean;
}

/** Content editors get Content Hub + Test Hub only. Owners get everything. */
export type AdminRole = "owner" | "editor";

export interface AppConfig {
  appName: string;
  adminEmails: string[];
  /** email -> role. Absent email defaults to "owner" for backward compatibility. */
  adminRoles?: Record<string, AdminRole>;
  ai?: AiConfig;
  maintenance?: MaintenanceConfig;
  homeBlocks: string[];
  hiddenBlocks?: string[];
  customBlocks?: Record<string, string>;
  features: FeatureFlags;
  landing: LandingConfig;
}

export const DEFAULT_AI: AiConfig = {
  model: "llama-3.3-70b-versatile",
  dailyLimit: 1000,
  perUserLimit: 40,
  paused: false,
};

export const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  enabled: false,
  message: "We're making the app better. Back in a few minutes.",
  allowAdmins: true,
};

export const DEFAULT_CONFIG: AppConfig = {
  appName: "SKCTI",
  adminEmails: [],
  adminRoles: {},
  ai: DEFAULT_AI,
  maintenance: DEFAULT_MAINTENANCE,
  homeBlocks: ["notice", "focus", "carousel", "subjects"],
  hiddenBlocks: [],
  customBlocks: {},
  features: {
    planner: true, streak: true, coins: true, ai: true, rank: true, tests: true,
    videos: true, notices: true,
  },
  landing: {
    tagline: "Crack 11th & 12th with a system, not stress.",
    sub: "Chapter-wise notes, weekly tests, AI doubt-solving and a plan for every single day — built by your teachers, for you.",
    whatsapp: "",
    instagram: "",
    youtube: "",
    showInquiry: true,
  },
};

export interface ModuleDoc {
  id: string;
  name: string;
  streams: Stream[];
  imageUrl: string;
  createdAt?: Timestamp;
}

export const todayKey = () => new Date().toISOString().slice(0, 10);

/** Pull a Drive file id out of any share-link shape. */
export function extractDriveId(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const m =
    url.match(/\/file\/d\/([\w-]{10,})/) ||
    url.match(/[?&]id=([\w-]{10,})/) ||
    url.match(/\/d\/([\w-]{10,})/);
  return m ? m[1] : null;
}

export const drivePreviewUrl = (driveId: string) =>
  `https://drive.google.com/file/d/${driveId}/preview?rm=minimal`;

/** Normalize a Google Form link into embeddable form. */
export function formEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("embedded", "true");
    return u.toString();
  } catch {
    return url;
  }
}

/* —— YouTube helpers —— */
export function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}
export const youtubeEmbedUrl = (id: string) => `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
