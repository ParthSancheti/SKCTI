import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

/** Generates today's study plan as strict JSON via Gemini. */
export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: "GROQ_API_KEY missing" }, { status: 500 });

  try {
    const { stream, grade, chapters } = (await req.json()) as {
      stream: string;
      grade: string;
      chapters: string[];
    };

    const prompt = `You are a study planner for an Indian ${grade} standard ${stream} student preparing for boards + ${
      stream === "PCB" ? "NEET" : "JEE"
    }.
Available chapters on their app today: ${chapters.length ? chapters.join("; ") : `none uploaded yet — use standard ${stream} syllabus topics`}.
Create today's focused plan: exactly 4 tasks, total 120-180 minutes, mixing subjects, specific and actionable (e.g. "Solve 15 numericals on Rotational Motion").
Return ONLY a JSON object containing a "tasks" array, no markdown: {"tasks": [{"title": "string", "subject": "string", "minutes": number}]}`;

    const r = await fetch(
      `https://api.groq.com/openai/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.7
        }),
      }
    );
    
    if (!r.ok) throw new Error(`Groq ${r.status}`);
    const data = await r.json();
    const text: string = data?.choices?.[0]?.message?.content ?? '{"tasks":[]}';
    const raw = JSON.parse(text);
    if (!raw.tasks || !Array.isArray(raw.tasks)) throw new Error("bad shape");
    const tasks = raw.tasks.slice(0, 5).map((t: Record<string, unknown>, i: number) => ({
      id: `g${i}`,
      title: String(t.title ?? "Study session"),
      subject: String(t.subject ?? stream[i % stream.length]),
      minutes: Math.max(15, Math.min(90, Number(t.minutes) || 30)),
    }));
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("AI PLANNER CRASH:", error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
