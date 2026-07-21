"use client";

import {
  addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc,
  type DocumentData, type QueryDocumentSnapshot,
} from "firebase/firestore";
import { fbDb } from "./firebase";
import type {
  AnnouncementDoc, AppConfig, AuditEntry, BannerDoc, ContentDoc, InquiryDoc, TestDoc, UserDoc, VideoDoc, AiChatDoc
} from "./types";
import { DEFAULT_CONFIG } from "./types";

export const col = {
  users: () => collection(fbDb(), "users"),
  content: () => collection(fbDb(), "content"),
  tests: () => collection(fbDb(), "tests"),
  banners: () => collection(fbDb(), "banners"),
  audit: () => collection(fbDb(), "audit"),
  videos: () => collection(fbDb(), "videos"),
  announcements: () => collection(fbDb(), "announcements"),
  inquiries: () => collection(fbDb(), "inquiries"),
  todos: (uid: string) => collection(fbDb(), "users", uid, "todos"),
  aiChats: (uid: string) => collection(fbDb(), "users", uid, "aiChats"),
};

export const configRef = () => doc(fbDb(), "config", "app");
export const userRef = (uid: string) => doc(fbDb(), "users", uid);

export const snapTo = <T,>(s: QueryDocumentSnapshot<DocumentData>): T =>
  ({ id: s.id, ...s.data() } as T);

/* ————— writes ————— */

export async function ensureConfig(adminEmail: string) {
  await setDoc(
    configRef(),
    { ...DEFAULT_CONFIG, adminEmails: [adminEmail.toLowerCase()] },
    { merge: true }
  );
}

export const saveConfig = (patch: Partial<AppConfig>) =>
  setDoc(configRef(), patch, { merge: true });

export async function logAudit(actor: string, action: string) {
  try {
    await addDoc(col.audit(), { actor, action, at: serverTimestamp() } satisfies Omit<AuditEntry, "id" | "at"> & { at: unknown });
  } catch {
    /* audit must never block the action itself */
  }
}

export const createContent = (d: Omit<ContentDoc, "id" | "createdAt">) =>
  addDoc(col.content(), { ...d, createdAt: serverTimestamp() });
export const updateContent = (id: string, patch: Partial<ContentDoc>) =>
  updateDoc(doc(fbDb(), "content", id), patch);
export const deleteContent = (id: string) => deleteDoc(doc(fbDb(), "content", id));

export const createTest = (d: Omit<TestDoc, "id" | "createdAt">) =>
  addDoc(col.tests(), { ...d, createdAt: serverTimestamp() });
export const updateTest = (id: string, patch: Partial<TestDoc>) =>
  updateDoc(doc(fbDb(), "tests", id), patch);
export const deleteTest = (id: string) => deleteDoc(doc(fbDb(), "tests", id));

export const createBanner = (d: Omit<BannerDoc, "id" | "createdAt">) =>
  addDoc(col.banners(), { ...d, createdAt: serverTimestamp() });
export const updateBanner = (id: string, patch: Partial<BannerDoc>) =>
  updateDoc(doc(fbDb(), "banners", id), patch);
export const deleteBanner = (id: string) => deleteDoc(doc(fbDb(), "banners", id));

export const updateUser = (uid: string, patch: Partial<UserDoc>) =>
  updateDoc(userRef(uid), patch);

export const createVideo = (d: Omit<VideoDoc, "id" | "createdAt">) =>
  addDoc(col.videos(), { ...d, createdAt: serverTimestamp() });
export const updateVideo = (id: string, patch: Partial<VideoDoc>) =>
  updateDoc(doc(fbDb(), "videos", id), patch);
export const deleteVideo = (id: string) => deleteDoc(doc(fbDb(), "videos", id));

export const createAnnouncement = (d: Omit<AnnouncementDoc, "id" | "createdAt">) =>
  addDoc(col.announcements(), { ...d, createdAt: serverTimestamp() });
export const updateAnnouncement = (id: string, patch: Partial<AnnouncementDoc>) =>
  updateDoc(doc(fbDb(), "announcements", id), patch);
export const deleteAnnouncement = (id: string) => deleteDoc(doc(fbDb(), "announcements", id));

export const createInquiry = (d: Omit<InquiryDoc, "id" | "createdAt" | "status">) =>
  addDoc(col.inquiries(), { ...d, status: "new", createdAt: serverTimestamp() });
export const updateInquiry = (id: string, patch: Partial<InquiryDoc>) =>
  updateDoc(doc(fbDb(), "inquiries", id), patch);
export const deleteInquiry = (id: string) => deleteDoc(doc(fbDb(), "inquiries", id));

export const createAiChat = (uid: string, d: Omit<AiChatDoc, "id">) =>
  addDoc(col.aiChats(uid), d);
export const updateAiChat = (uid: string, id: string, patch: Partial<AiChatDoc>) =>
  updateDoc(doc(fbDb(), "users", uid, "aiChats", id), patch);
