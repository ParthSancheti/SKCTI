# SKCTI — Live Build

Glassmorphism learning app for 11th/12th (PCM · PCB). Google login, Firestore-backed,
Gemini-powered day planner, and an Admin OS where **everything is dynamic** — your
Google Drive PDFs and Google Form quizzes are the content, this app is the shell.

## 1 · Firebase console (one time, ~10 min, free tier)

1. Go to https://console.firebase.google.com → open your project.
2. **Authentication → Sign-in method → Google → Enable.** Set a support email, save.
3. **Firestore Database → Create database** → production mode → nearest region (asia-south1 = Mumbai).
4. **Firestore → Rules** → paste the contents of `firestore.rules` from this repo → Publish.
5. **Project settings → General → Your apps → Web (</>)** → register an app → copy the config values.
6. When you deploy later (Vercel etc.), add your live domain under
   **Authentication → Settings → Authorized domains**. `localhost` already works.

## 2 · Environment

```bash
cp .env.example .env.local
```

Fill in the Firebase values from step 5, put **your Gmail** in `NEXT_PUBLIC_ADMIN_EMAILS`,
and paste your Gemini key (`https://aistudio.google.com/apikey`).

## 3 · Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 → **Continue with Google** → do the 3-step setup
(phone → grade → stream) → you land on Home.

## 4 · Claim the Admin OS

1. Visit **/admin** (also linked from Settings once you're an admin).
2. You'll see a one-time **Initialize** card — click it. This writes the default
   config to Firestore and registers your email as admin #1.
3. From then on, admin access is managed in **Admin → Mission Control** (add/remove
   teammate emails — no redeploy needed).

## 5 · Add your content

**PDFs (Content Hub → PDF):**
1. In Google Drive, right-click the PDF → Share → **Anyone with the link → Viewer**.
2. Copy link → paste in Content Hub → tag stream/subject/type/weightage → Publish.
3. It appears in students' Learn tab instantly (live listeners, no refresh).

**Quizzes (Content Hub → Test):**
1. In Google Forms: Send → link icon → copy the link.
2. Paste → pick Chapter/Mock, streams, duration → Publish.
3. Students take the form embedded inside the app and tap "Mark done" for +25 coins.

**Banners & home layout:** Admin → App Builder. Reorder home blocks, add promo
banners with image URLs — the phone preview mirrors every change live.

**Feature switches:** Admin → Mission Control. Streaks, coins, AI tab, leaderboard,
tests tab, day planner — flip any of them off/on and every student's app updates
in real time.

## 6 · How the AI planner works

Each morning the app sends the student's stream, grade, and pending chapter list to
`/api/plan` → Gemini returns strict JSON (4 tasks) → cached on the user doc for the
day. The refresh icon on Today's Focus regenerates. If Gemini is unreachable the
block degrades gracefully — the rest of the app never blocks on it.

## New in the Growth Update

- **Public landing page at `/`** — hero, feature grid, YouTube/Instagram buttons and a
  "Talk to us" callback form. Edit everything in **Admin → Mission Control → Public site**.
  This is the page your reels should link to.
- **Leads inbox (Admin → Leads)** — every callback request lands here live, with
  tap-to-call and new/contacted tracking. Your admissions pipeline.
- **Video lectures** — paste YouTube links in Content Hub → Videos; students watch them
  embedded in the Learn tab. The free-lecture hook, inside the app.
- **Notice board** — post announcements from App Builder; they appear on student home
  instantly. Toggle any of these off in Mission Control.

## Notes

- **Nothing is hardcoded.** Empty Firestore = empty app. Everything students see
  comes from what you publish.
- The Gemini key never ships to the browser — only the two `/api/*` routes use it.
- Leaderboard requires user docs to be readable by signed-in students (names,
  coins, streaks are visible to peers — same model as any class leaderboard).
- Coins: +50 signup, +10 per plan task, +25 per test marked done.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · Firebase Auth +
Firestore (client SDK, live snapshots) · Gemini REST API.
