/** @type {import('next').NextConfig} */

/**
 * ============================================================================
 * THE SILENT KILLER
 * ============================================================================
 * The old config was:
 *
 *     const nextConfig = { output: 'export', images: {...} };
 *
 * `output: 'export'` produces a purely static bundle. Next 14 does not error
 * on this — it just DROPS anything that needs a server. Verified against a
 * fresh build of this repo: `out/` contains no `api/` directory at all.
 *
 * So the following have never worked in production:
 *
 *   app/api/plan/route.ts          -> 404. Today's Focus / AI day planner.
 *   app/api/chat/route.ts          -> 404. The entire AI Lab doubt-solver.
 *   app/api/ai/route.ts            -> 404. (also never called by any page)
 *   app/api/cron/check-tasks       -> 404.
 *   middleware.ts                  -> not emitted. All route protection gone.
 *
 * In app/(student)/home/page.tsx the planner fetch resolves against the 404
 * HTML page, `r.json()` throws a SyntaxError, it lands in the catch, sets
 * `planErr` — and `planErr` is never rendered anywhere. So the flagship
 * feature fails completely silently on every device.
 *
 * FIX: drop `output: 'export'`. Vercel then deploys the API routes as
 * functions and the middleware at the edge. Capacitor already points at the
 * live URL via `server.url`, so the native app picks this up with no other
 * change.
 * ============================================================================
 */

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "i.ytimg.com" },               // YouTube thumbs
    ],
  },

  // Ship less JS to the phone. lucide-react in particular was pulling in far
  // more than the ~30 icons actually used.
  experimental: {
    optimizePackageImports: ["lucide-react", "firebase"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Locks down what the app is allowed to talk to and, critically,
            // what an injected <script> could exfiltrate to.
            // NOTE: 'unsafe-inline'/'unsafe-eval' are required by Next's
            // hydration + Firebase. Tighten with a nonce once you have time.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "frame-src 'self' https://drive.google.com https://docs.google.com https://www.youtube.com https://*.firebaseapp.com https://accounts.google.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // Never let a proxy or CDN cache an authenticated API response.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
