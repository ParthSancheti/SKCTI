# What changed in this build

Full findings are in `SKCTI-AUDIT.md`. This is the changelog for the code in
this repo.

Verified: `✓ Compiled successfully`, no type errors, all four API routes
emitted as functions, middleware emitted.

---

## Security

- **`firestore.rules` rewritten.** `/users/{uid}` is now self-or-admin only —
  previously any signed-in student could read every classmate's phone number
  and email through the leaderboard query. Coins are constrained to move
  upward by at most 100 per write, streaks by at most +1, and a field
  allowlist stops `email`/`createdAt` being rewritten. `users/{uid}/private/*`
  now has a rule at all (the chat-history listener was permission-denied on
  every session). Admin check is case-insensitive and requires a verified
  email.
- **`/api/chat` now requires a Firebase ID token**, rate-limits to 12/min per
  student, caps prompts at 2000 chars, and no longer forwards Groq's raw error
  bodies to the browser. It was a public unauthenticated proxy to a paid API.
- **`capacitor.config.ts`**: removed the `"*"` wildcard from `allowNavigation`
  (any URL could load full-screen inside the app WebView) and set
  `cleartext: false`. `webDir` corrected to `out`.
- **Security headers added** in `next.config.mjs` — CSP, HSTS,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- **PDF/form iframes sandboxed**, with `referrerPolicy="no-referrer"`.

## Broken things that now work

- **`output: 'export'` removed.** It was silently dropping all four API routes
  and the middleware from every production build, so the AI Lab and the day
  planner had never worked in production.
- **`rounded-xl` renders at 12px, not 48px.** The `borderRadius` block in
  `tailwind.config.ts` was overwriting Tailwind's scale 4× across 78 elements.
  Oversized values kept as `rounded-glass` / `rounded-squircle` / `rounded-card`.
- **Safe areas work.** Added the `viewport` export with `viewport-fit=cover` —
  without it `env(safe-area-inset-*)` returned 0px, so the safe-area maths that
  already existed had never done anything.
- **"Ask AI" on the PDF reader** was `onClick={() => vibrate(10)}`. It now opens
  the AI Lab seeded with the chapter title and subject.
- **Theme transition animation** — CSS matched `.expanding`, the store added
  `theme-overlay-run`. Both now supported.
- **Admin sign-out** — was a `<button>` with no `onClick` nested inside a
  `<Link href="/home">`.
- **PWA manifest** is valid and actually linked; `icons/` moved into `public/`
  (every icon was 404ing).

## Settings that were fake

- **Notification toggles** were local `useState` — reset to "on" on every
  reload. Now persisted to the user document.
- **"Clear Downloads"** had no `onClick`. Now works, with a confirm step. The
  card is renamed "Saved Chapters" because nothing in the app ever cached PDF
  bytes.
- **Study Analytics** showed hardcoded `45h` and `120` to every student. Now
  reads real values; `studyMinutes` accrues from completed plan tasks.
- **Admin "AI Configuration"** card had API key fields, a model dropdown, a
  daily limit and a killswitch — none of them wired to anything. Now writes to
  Firestore, and the killswitch + per-student cap are enforced server-side in
  `/api/chat`, not just in the UI. The API key inputs are gone: `config/app` is
  read by every signed-in client, so a key stored there would ship to every
  student's device. The card says so.

## New

- **Maintenance mode** (`components/MaintenanceGate.tsx`) — students get an
  explanation instead of skeletons that never load. Admins keep access.
- **Account deletion** in Settings — wipes profile, todos, AI history and
  leaderboard entry, then removes the Auth record. There was previously no way
  for a student to remove their data.
- **Admin roles** — owner vs editor. `isAdmin` was binary, so anyone added to
  help with Content Hub also got Leads, student data and admin management. The
  last owner cannot demote themselves.
- **Reduced-effects toggle** — drives `html[data-perf="low"]`, which drops
  backdrop-filter on phones that can't afford a dozen blur layers.
- **Language preference** (English / हिंदी / मराठी) for notices and AI replies.
- **`components/Toast.tsx`** — glass toasts and a confirm dialog to replace the
  12 `alert()` calls, which render as "skcti-lyart.vercel.app says:" in a
  WebView.
- **`lib/haptics.ts`** — semantic haptics with real iOS support. Everything
  previously wrapped `navigator.vibrate`, which does not exist in a WKWebView,
  so every iPhone user had zero haptics. `vibrate()`/`triggerHaptic()` are
  re-exported from `lib/store.tsx` so existing call sites keep working.
- **`lib/queries.ts`** — `array-contains` helpers and the leaderboard
  projection writer.

## Performance

- **`MeshBackground` rewritten.** Was four 120vw orbs at `blur(100px)`, each
  spinning, inside a parent running `filter: hue-rotate()` — a parent filter
  forces the whole subtree to re-rasterise every frame. Now radial gradients on
  one compositor-only transform, and it suspends when backgrounded.
- **Duplicate `<MeshBackground />` removed** from the admin layout, landing,
  login and onboarding pages. Two to three copies were running at once.
- **Firestore offline persistence** enabled, plus long-polling auto-detect for
  Android WebViews and school networks that break WebChannel streaming.
- **Nested `backdrop-filter` removed** from the bottom nav, and blur tiering
  added for low-end devices.
- **Bottom nav pill slides** via `layoutId` instead of teleporting, and tabs
  prefetch.
- **`font-geist` no longer falls back to monospace.** Fonts are self-hosted via
  `next/font` instead of a render-blocking external `<link>`.

---

## Still to do by hand

1. **Swap the six queries to `array-contains`** — helpers are in
   `lib/queries.ts`. Biggest remaining scaling win. Sites: `home/page.tsx`
   53/64/69, `learn/page.tsx` 58/68, `tests/page.tsx` 24. Give each listener a
   real error callback while you're there; all six currently pass `() => {}`.
2. **Call `syncLeaderboard()`** after each coin change in `lib/store.tsx`. The
   rank page reads `/leaderboard` now and will be empty until something writes
   it.
3. **Replace the remaining `alert()` calls** in the admin pages with
   `useToast()`. The student settings one is already migrated.
4. **Sweep `rounded-xl`** — promote genuine large cards to `rounded-card` or
   `rounded-glass`.
5. **Wire the AI Lab camera** to `/api/ai`, which already implements streaming
   multimodal Gemini and is called by nothing.
6. **Read `?seed=` in `ai/page.tsx`** so the reader's "Ask AI" lands in a
   pre-filled conversation.
7. **Stop storing base64 images in chat documents** — Firestore's limit is
   1 MiB and the failure surfaces as a network error.

## Build notes

- `npm install` needs `--legacy-peer-deps` until
  `@codetrix-studio/capacitor-google-auth` is replaced — it pins an `-rc`
  prerelease that peer-depends on Capacitor 6 against your Capacitor 8.
- `next/font` fetches Sora and Hanken Grotesk from Google Fonts **at build
  time**. Vercel has network access so this is fine there; if you build in a
  sandboxed CI, self-host the woff2 files with `next/font/local` instead.
- Deploy `firestore.rules` first and on its own. Deploy the secured
  `/api/chat` **before** the new `next.config.mjs`, since removing
  `output: 'export'` is what makes that route reachable for the first time.

---

## Image payload — found while packaging

The landing page (`app/page.tsx`) carried six onboarding images, all marked
`loading="eager"`. Both the light **and** dark variant of every slide was being
downloaded on every visit, because `dark:hidden` hides an element — it does not
stop the browser fetching its `src`. One file, `image3_dark.png`, was 7.3 MB on
its own.

Total landing-page image weight was **19.8 MB**. On the page you describe as
"where reels traffic lands", over Indian 4G, before a single word rendered.

Fixed:

| | Before | After |
|---|---|---|
| Welcome slides | 19.8 MB (PNG, up to 2304px) | 0.45 MB (WebP, 1000px) |
| `logo.png` (loaded on every page, 6 call sites) | 1.4 MB for a 56px render | 28 KB |
| `public/` total | 17 MB | 1.2 MB |

Also added explicit `width`/`height` to stop layout shift, and `loading="lazy"`
on slides 2 and 3 — only slide 1 is above the fold. Slide 1 keeps
`fetchPriority="high"`.

All references updated from `.png` to `.webp`. Originals are not kept in the
repo; regenerate from `assets/` if you need print-resolution versions.
