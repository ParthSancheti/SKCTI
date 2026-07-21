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
}

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

export interface AppConfig {
  appName: string;
  adminEmails: string[];
  homeBlocks: string[];
  hiddenBlocks?: string[];
  customBlocks?: Record<string, string>;
  features: FeatureFlags;
  landing: LandingConfig;
}

export const DEFAULT_CONFIG: AppConfig = {
  appName: "SKCTI",
  adminEmails: [],
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

export const SUBJECTS_PCM = ["Physics", "Chemistry", "Math"];
export const SUBJECTS_PCB = ["Physics", "Chemistry", "Biology"];
export const subjectsFor = (s: Stream) => (s === "PCM" ? SUBJECTS_PCM : SUBJECTS_PCB);

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
  `https://drive.google.com/file/d/${driveId}/preview`;

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
