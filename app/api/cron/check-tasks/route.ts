import { NextResponse } from "next/server";


// Vercel Cron Job Configuration
// Defines the maximum duration the function can run (in seconds).
export const maxDuration = 60;
export const runtime = "edge";

export async function GET(req: Request) {
  // 1. Verify cron secret to ensure this is only called by Vercel Cron
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    console.log("[CRON] Running 6-hour task check...");

    // 2. Query the database for tasks created > 6 hours ago where status === 'pending'
    // const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    // const pendingTasks = await db.collection("tasks")
    //   .where("status", "==", "pending")
    //   .where("createdAt", "<=", sixHoursAgo)
    //   .get();

    // if (pendingTasks.empty) {
    //   return NextResponse.json({ message: "No overdue tasks found." });
    // }

    // 3. For each overdue task, generate a strict push notification using Groq fetch
    // const apiKey = process.env.GROQ_API_KEY;
    
    // const notifications = [];
    // for (const task of pendingTasks.docs) {
    //   const taskData = task.data();
    //   const prompt = `The student has not completed "${taskData.task_name}" for 6 hours. Generate a strict, highly motivating 2-sentence push notification to get them back to work.`;
      
    //   const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    //     method: "POST",
    //     headers: {
    //       "Authorization": `Bearer ${apiKey}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       model: "llama-3.3-70b-versatile",
    //       messages: [{ role: "user", content: prompt }]
    //     })
    //   });
    //   const data = await response.json();
    //   const notificationText = data.choices?.[0]?.message?.content || "";

    //   // 4. Save the AI's generated push notification payload to a notifications table
    //   notifications.push({
    //     userId: taskData.userId,
    //     taskId: task.id,
    //     message: notificationText,
    //     createdAt: new Date(),
    //     status: "queued"
    //   });
    // }

    // await db.collection("notifications").insertMany(notifications);

    return NextResponse.json({ 
      success: true, 
      message: "Cron scaffold executed. Database logic is commented out for now." 
    });
  } catch (error: any) {
    console.error("[CRON] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
