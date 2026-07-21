export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return Response.json({ error: "API key missing" }, { status: 500 });
  }

  try {
    const { prompt, context } = await req.json();

    const systemPrompt = `You are an elite, highly dynamic AI Tutor specifically tailored for a ${context?.grade || "student"} studying ${context?.stream || "their coursework"}. 
You must output a valid JSON object exactly matching the schema. 
CRITICAL INSTRUCTION FOR action_items: Do NOT generate action_items for general questions or casual chat. ONLY populate the action_items array if the user explicitly asks for a study plan, timetable, tasks, or step-by-step guidance. 
You know the user's current Todo list is: ${JSON.stringify(context?.todos || [])}. Do not suggest tasks they are already working on or have completed.
Tone: Be highly personalized, intelligent, and deeply integrated into their specific coursework. Never sound like a generic AI.
JSON Schema requirement: Your output MUST be parsable JSON.
Schema: { "chat_response": "Your deep, personalized advice...", "student_vibe": "Quick motivational assessment", "action_items": [{ "task_name": "Specific actionable task", "duration_minutes": 30, "urgency": "High" }] }`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Current active Groq model
        response_format: { type: "json_object" }, // Forces strict JSON output
        messages: [
          { 
            role: "system", 
            content: systemPrompt 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🚨 GROQ API REJECTED REQUEST:", response.status, errorText);
      return Response.json({ error: "Groq API Error", details: errorText }, { status: response.status });
    }

    const data = await response.json();
    const jsonString = data.choices[0]?.message?.content || "{}";
    const payload = JSON.parse(jsonString);
    
    return Response.json(payload);
    
  } catch (error) {
    console.error("Backend API Error:", error);
    return Response.json({ error: "Failed to fetch response" }, { status: 500 });
  }
}
