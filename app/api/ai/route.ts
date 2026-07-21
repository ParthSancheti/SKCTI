import { NextResponse } from "next/server";

export const runtime = "edge";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

interface ChatMsg {
  role: "user" | "model";
  text: string;
  image?: string; // base64
}

/** Doubt-solver chat backed by Gemini (Streaming + Multimodal). */
export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });

  const { messages, stream, grade } = (await req.json()) as {
    messages: ChatMsg[];
    stream: string;
    grade: string;
  };

  const system = `You are SKCTI AI, a friendly doubt-solver inside a study app for an Indian ${grade} ${stream} student. Be concise (under 180 words), step-by-step for numericals, encouraging. Use plain text and unicode formatting, no heavy markdown blocks unless strictly necessary.`;

  try {
    const contents = messages.slice(-12).map((m) => {
      const parts: any[] = [{ text: m.text || "Explain this." }];
      if (m.image) {
        // Strip data:image/...;base64, prefix
        const b64 = m.image.split(",")[1] || m.image;
        const mime = m.image.match(/data:(.*?);/)?.[1] || "image/jpeg";
        parts.push({
          inlineData: {
            mimeType: mime,
            data: b64,
          },
        });
      }
      return { role: m.role, parts };
    });

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
        }),
      }
    );

    if (!r.ok) {
      const errTxt = await r.text();
      return NextResponse.json({ error: `Gemini Error: ${r.status} - ${errTxt}` }, { status: 502 });
    }

    return new Response(r.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ai failed" },
      { status: 502 }
    );
  }
}
