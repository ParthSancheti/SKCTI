import { NextResponse } from "next/server";

export const runtime = "edge";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "llama-3.2-11b-vision-preview";

interface ChatMsg {
  role: "user" | "model";
  text: string;
  image?: string; // base64
}

/** Doubt-solver chat backed by Groq (Streaming + Multimodal). */
export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: "GROQ_API_KEY missing" }, { status: 500 });

  const { messages, stream, grade, language } = (await req.json()) as {
    messages: ChatMsg[];
    stream: string;
    grade: string;
    language?: string;
  };

  const langName = language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English";

  const system = `You are SKCTI AI, a friendly doubt-solver inside a study app for an Indian ${grade} ${stream} student. Be concise (under 180 words), step-by-step for numericals, encouraging. Use plain text and unicode formatting, no heavy markdown blocks unless strictly necessary.
Always reply in ${langName}.
If the student explicitly asks for a plan, timetable, tasks, or step-by-step guidance, you MUST append a JSON array of actionable tasks at the very end of your response, wrapped exactly in these tags:
[ACTION_PLAN_JSON] [{"task_name": "string", "duration_minutes": number, "urgency": "High" | "Medium" | "Low"}] [/ACTION_PLAN_JSON]`;

  try {
    let hasImage = false;
    const contents = messages.map((m) => {
      const contentParts: any[] = [];
      if (m.text) {
        contentParts.push({ type: "text", text: m.text });
      } else if (!m.image) {
         contentParts.push({ type: "text", text: "Explain this." });
      }
      
      if (m.image) {
        hasImage = true;
        // Groq supports OpenAI format for image_url
        contentParts.push({
          type: "image_url",
          image_url: { url: m.image },
        });
      }
      return { role: m.role === "model" ? "assistant" : "user", content: contentParts };
    });

    const r = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: hasImage ? VISION_MODEL : MODEL,
          messages: [{ role: "system", content: system }, ...contents],
          temperature: 0.6,
          max_completion_tokens: 800,
          stream: true
        }),
      }
    );

    if (!r.ok) {
      const errTxt = await r.text();
      return NextResponse.json({ error: `Groq Error: ${r.status} - ${errTxt}` }, { status: 502 });
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
