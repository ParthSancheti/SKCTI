import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

interface ChatMsg { role: "user" | "model"; text: string; }

/** Doubt-solver chat backed by Gemini. */
export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });

  const { messages, stream, grade } = (await req.json()) as {
    messages: ChatMsg[];
    stream: string;
    grade: string;
  };

  const system = `You are SKCTI AI, a friendly doubt-solver inside a study app for an Indian ${grade} ${stream} student. Be concise (under 180 words), step-by-step for numericals, encouraging. Plain text only — no markdown symbols.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.slice(-12).map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
          generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
        }),
      }
    );
    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const data = await r.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Hmm, try asking that again?";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ai failed" },
      { status: 502 }
    );
  }
}
