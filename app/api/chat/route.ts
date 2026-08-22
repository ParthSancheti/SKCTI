// Drop in at: app/api/chat/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ============================================================================
 * WHAT WAS WRONG WITH THE ORIGINAL
 * ============================================================================
 *
 * 1. NO AUTHENTICATION AT ALL.
 *    This route was a public, unauthenticated proxy to your paid Groq account.
 *    Anyone on the internet could run:
 *        curl -X POST https://skcti-lyart.vercel.app/api/chat \
 *             -d '{"prompt":"write me a novel"}'
 *    ...in a loop, forever, on your key. No login, no rate limit, no origin
 *    check. The same applies to /api/plan. This is the highest-severity issue
 *    in the repo after the Firestore rules, because it costs real money and
 *    there is no signal until the bill arrives.
 *
 * 2. RAW UPSTREAM ERRORS RETURNED TO THE CLIENT.
 *        return Response.json({ error: "Groq API Error", details: errorText })
 *    Groq's error bodies echo request metadata and sometimes key prefixes and
 *    org identifiers. Never forward an upstream provider's error text to a
 *    browser.
 *
 * 3. NO INPUT CAP.
 *    `prompt` and the whole todo list went straight into the request body with
 *    no length limit. One student pasting a textbook chapter burns your entire
 *    token budget in a single call.
 *
 * 4. UNGUARDED JSON.parse ON THE MODEL OUTPUT.
 *        const payload = JSON.parse(jsonString)
 *    was inside the try block, so a malformed response returned the generic
 *    500 rather than something the UI could show. Combined with the UI's
 *    silent catch, students saw "Something went wrong" with no way to tell
 *    whether it was them or you.
 *
 * 5. `data.choices[0]` indexed without a length check.
 * ============================================================================
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const FALLBACK_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Reads the admin's AI settings from Firestore over REST — no admin SDK needed.
 * The killswitch and the per-student cap in Mission Control are meaningless if
 * only the client honours them, since anyone can call this endpoint directly.
 */
async function readAiConfig(): Promise<{ model: string; paused: boolean; perUserLimit: number }> {
  const fallback = { model: FALLBACK_MODEL, paused: false, perUserLimit: 0 };
  try {
    const pid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!pid) return fallback;
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/config/app`,
      { next: { revalidate: 30 } }
    );
    if (!r.ok) return fallback;
    const f = (await r.json())?.fields?.ai?.mapValue?.fields ?? {};
    return {
      model: f.model?.stringValue || FALLBACK_MODEL,
      paused: f.paused?.booleanValue === true,
      perUserLimit: Number(f.perUserLimit?.integerValue ?? f.perUserLimit?.doubleValue ?? 0),
    };
  } catch {
    return fallback;
  }
}

/** Rolling 24h counter per student, for the admin's per-user daily cap. */
const daily = new Map<string, { day: string; n: number }>();
function overDailyCap(uid: string, cap: number): boolean {
  if (cap <= 0) return false;
  const day = new Date().toISOString().slice(0, 10);
  const rec = daily.get(uid);
  if (!rec || rec.day !== day) { daily.set(uid, { day, n: 1 }); return false; }
  if (rec.n >= cap) return true;
  rec.n += 1;
  return false;
}

const MAX_PROMPT_CHARS = 2000;
const MAX_TODOS = 20;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12; // 12 doubts per minute per student is generous

/**
 * In-memory limiter. Good enough for a single-region deployment and 100-500
 * students. It resets on cold start, which is acceptable for abuse control at
 * this scale — you are stopping a script, not a determined attacker.
 *
 * Move to Upstash Redis (`@upstash/ratelimit`) when you outgrow one region.
 */
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound across a long-lived instance.
  // NOTE: `for (const [k, v] of hits)` fails type-check here because
  // tsconfig.json declares no "target" — tsc then defaults to ES5 and rejects
  // Map iteration without --downlevelIteration. Worth adding
  //     "target": "ES2020"
  // to tsconfig.json; until then, Array.from is the portable form.
  if (hits.size > 5000) {
    Array.from(hits.keys()).forEach((k) => {
      const v = hits.get(k);
      if (v && v.every((t) => now - t > WINDOW_MS)) hits.delete(k);
    });
  }
  return false;
}

/**
 * Verifies a Firebase ID token without pulling in firebase-admin (which needs
 * a service account and bloats the function). Google's tokeninfo endpoint is
 * the pragmatic option at this scale.
 *
 * The client must send:  Authorization: Bearer <await user.getIdToken()>
 */
async function verifyIdToken(authHeader: string | null): Promise<{ uid: string; email: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token || token.length > 4096) return null;

  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!r.ok) return null;
    const data = await r.json();
    const u = data?.users?.[0];
    if (!u?.localId) return null;
    return { uid: u.localId, email: u.email ?? "" };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[chat] GROQ_API_KEY is not set");
    return NextResponse.json({ error: "AI is not configured right now." }, { status: 503 });
  }

  // ---- 1. Who is asking? -------------------------------------------------
  const user = await verifyIdToken(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Sign in to use the AI Lab." }, { status: 401 });
  }

  // ---- 2. How often? -----------------------------------------------------
  if (rateLimited(user.uid)) {
    return NextResponse.json(
      { error: "Slow down a little — try again in a minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // ---- 2b. Has an admin paused AI, or capped this student? ---------------
  const aiCfg = await readAiConfig();
  if (aiCfg.paused) {
    return NextResponse.json(
      { error: "AI is paused by your teacher right now." },
      { status: 503 }
    );
  }
  if (overDailyCap(user.uid, aiCfg.perUserLimit)) {
    return NextResponse.json(
      { error: `You've hit today's limit of ${aiCfg.perUserLimit} questions. Resets tomorrow.` },
      { status: 429 }
    );
  }

  // ---- 3. Parse and clamp ------------------------------------------------
  let prompt: string;
  let context: { grade?: string; stream?: string; todos?: unknown[] };
  try {
    const body = await req.json();
    prompt = String(body?.prompt ?? "").slice(0, MAX_PROMPT_CHARS).trim();
    context = body?.context ?? {};
  } catch {
    return NextResponse.json({ error: "Could not read that request." }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json({ error: "Type a question first." }, { status: 400 });
  }

  const grade = String(context.grade ?? "student").slice(0, 20);
  const stream = String(context.stream ?? "their coursework").slice(0, 20);
  const todos = Array.isArray(context.todos)
    ? context.todos.slice(0, MAX_TODOS).map((t) => {
        const o = t as Record<string, unknown>;
        return { title: String(o?.title ?? "").slice(0, 120), status: String(o?.status ?? "") };
      })
    : [];

  const systemPrompt = `You are a study tutor for an Indian ${grade} standard ${stream} student.
Output a single valid JSON object and nothing else.
Only populate action_items when the student explicitly asks for a plan, timetable, tasks, or step-by-step guidance. Never for casual chat or a single factual question.
Their current todo list is: ${JSON.stringify(todos)}. Do not suggest anything already on it.
Keep chat_response under 200 words. Be specific to their syllabus.
Schema: {"chat_response": string, "student_vibe": string, "action_items": [{"task_name": string, "duration_minutes": number, "urgency": "High"|"Medium"|"Low"}]}`;

  // ---- 4. Call upstream --------------------------------------------------
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    const response = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiCfg.model,
        response_format: { type: "json_object" },
        max_tokens: 900,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      // Log the detail server-side; return nothing useful to a caller.
      console.error("[chat] groq rejected", response.status, await response.text().catch(() => ""));
      return NextResponse.json(
        { error: "The AI is busy right now. Try again in a moment." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const jsonString: string = data?.choices?.[0]?.message?.content ?? "";
    if (!jsonString) {
      return NextResponse.json({ error: "The AI returned an empty answer." }, { status: 502 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(jsonString);
    } catch {
      // Model broke JSON mode. Degrade to plain text rather than failing.
      payload = { chat_response: jsonString.slice(0, 2000), student_vibe: "", action_items: [] };
    }

    // Never trust the model's shape — the client maps action_items straight
    // into Firestore writes.
    const actionItems = Array.isArray(payload.action_items)
      ? (payload.action_items as Record<string, unknown>[]).slice(0, 6).map((it) => ({
          task_name: String(it?.task_name ?? "Study session").slice(0, 120),
          duration_minutes: Math.max(5, Math.min(180, Number(it?.duration_minutes) || 30)),
          urgency: ["High", "Medium", "Low"].includes(String(it?.urgency))
            ? String(it.urgency)
            : "Medium",
        }))
      : [];

    return NextResponse.json({
      chat_response: String(payload.chat_response ?? "").slice(0, 4000),
      student_vibe: String(payload.student_vibe ?? "").slice(0, 200),
      action_items: actionItems,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    console.error("[chat] failure", error);
    return NextResponse.json(
      { error: aborted ? "That took too long. Try a shorter question." : "Could not reach the AI." },
      { status: aborted ? 504 : 500 }
    );
  }
}
