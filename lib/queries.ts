"use client";

import {
  collection, doc, limit, orderBy, query, setDoc, where,
  type Query, type DocumentData,
} from "firebase/firestore";
import { fbDb } from "./firebase";
import type { Stream, UserDoc } from "./types";

/**
 * ============================================================================
 * SERVER-SIDE FILTERING — audit §9, the biggest scaling fix in the app.
 * ============================================================================
 *
 * `array-contains` appears exactly zero times in the current codebase. Every
 * stream filter runs client-side, AFTER the download:
 *
 *   home/page.tsx:53   all announcements -> .filter(n => n.streams.includes(…))
 *   home/page.tsx:64   all banners       -> .filter(…)
 *   home/page.tsx:69   all content       -> .filter(…)
 *   learn/page.tsx:58  all content       -> .filter(…)
 *   learn/page.tsx:68  all videos        -> .filter(…)
 *   tests/page.tsx:24  all tests         -> .filter(…)
 *
 * A PCM student downloads every PCB chapter, then discards it. And these are
 * onSnapshot listeners, so it re-runs on every publish.
 *
 * At your target of 100 students with ~300 chapters, Home alone costs 30,000
 * reads to render once. The Firestore free tier is 50,000 reads/day. You hit
 * the wall mid-morning, reads start failing, and every student sees "Library
 * incoming" for the rest of the day — with no error anywhere, because all six
 * of those listeners pass `() => {}` as their error callback.
 *
 * These helpers push the filter to the server. Roughly a 50% cut immediately
 * (one stream instead of two), and it stays flat as the library grows instead
 * of scaling with total content.
 *
 * ---------------------------------------------------------------------------
 * REQUIRED COMPOSITE INDEXES
 * ---------------------------------------------------------------------------
 * Firestore needs an index for each (equality + array-contains + orderBy)
 * combination. Run the app once after switching — the console logs a
 * "The query requires an index" error containing a direct create link. Or add
 * to firestore.indexes.json up front:
 *
 *   content:       published ASC, streams ARRAY, createdAt DESC
 *   tests:         published ASC, streams ARRAY, createdAt DESC
 *   videos:        published ASC, streams ARRAY, createdAt DESC
 *   banners:       published ASC, streams ARRAY, createdAt DESC
 *   announcements: published ASC, streams ARRAY, createdAt DESC
 *
 * Deploy with:  firebase deploy --only firestore:indexes
 * ============================================================================
 */

const CAP = 200; // hard ceiling so one bad publish can't pull 5,000 docs

function published(name: string, stream: Stream, max = CAP): Query<DocumentData> {
  return query(
    collection(fbDb(), name),
    where("published", "==", true),
    where("streams", "array-contains", stream),
    orderBy("createdAt", "desc"),
    limit(max)
  );
}

export const q = {
  /** Learn tab + Home chapter count. */
  content: (stream: Stream) => published("content", stream),

  /** Tests tab. */
  tests: (stream: Stream) => published("tests", stream),

  /** Learn tab video rail. */
  videos: (stream: Stream) => published("videos", stream),

  /** Home carousel — you never show more than a handful. */
  banners: (stream: Stream) => published("banners", stream, 10),

  /** Home notice board — home/page.tsx already slices to 3, so ask for 3. */
  announcements: (stream: Stream) => published("announcements", stream, 5),

  /**
   * Leaderboard. Reads the sanitised projection, NOT /users.
   * See lib/leaderboard.ts for how the projection is written.
   */
  leaderboard: (max = 50) =>
    query(collection(fbDb(), "leaderboard"), orderBy("coins", "desc"), limit(max)),
};

/**
 * ============================================================================
 * LEADERBOARD PROJECTION — audit §3 and §10
 * ============================================================================
 *
 * The hardened rules lock /users/{uid} to self-or-admin, so the old rank query
 * will return empty until this mirror exists. That is deliberate: the rank
 * page was the leak.
 *
 * The mirror carries four fields. No phone. No email. No downloads history.
 * The rules enforce that with `hasOnly([...])`, so even a modified client
 * cannot smuggle extra fields into a doc every student can read.
 *
 * Call this wherever coins change — the simplest place is inside `addCoins`,
 * `markTaskDone`, `markAttempted` and `markViewed` in lib/store.tsx, right
 * after the updateUser call.
 *
 * Better still, do it in a Cloud Function on user-doc write, so a student
 * cannot write a coin count to the leaderboard that doesn't match their real
 * one. The client-side version below is honest about being the interim option.
 */
export async function syncLeaderboard(u: Pick<UserDoc, "uid" | "name" | "photo" | "coins" | "streak">) {
  try {
    await setDoc(
      doc(fbDb(), "leaderboard", u.uid),
      {
        // First name only. The rank page already displays name.split(" ")[0],
        // so full names were being transmitted for no reason.
        displayName: (u.name ?? "Student").split(" ")[0].slice(0, 24),
        photo: u.photo ?? "",
        coins: u.coins ?? 0,
        streak: u.streak ?? 0,
      },
      { merge: true }
    );
  } catch {
    // Never block a coin award on the mirror. Worst case the student's rank
    // is stale until their next action.
  }
}
