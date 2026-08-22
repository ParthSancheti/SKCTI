import type { CapacitorConfig } from '@capacitor/cli';

/**
 * ============================================================================
 * WHAT WAS WRONG
 * ============================================================================
 *
 * 1. allowNavigation: [..., "*"]
 *    The wildcard means ANY url can be loaded as a top-level page inside the
 *    app's own WebView. A phishing link in an announcement, a redirect from a
 *    Drive share, a compromised banner CTA — all of it renders full-screen
 *    inside SKCTI, with the real app chrome around it, and the student has no
 *    address bar to check. Every other entry in that array is redundant once
 *    "*" is present, which suggests it was added to make something work and
 *    never taken out.
 *
 * 2. cleartext: true
 *    Permits plain http://. On school/cafe wifi that is a trivial MITM: an
 *    attacker downgrades a request and serves modified JS into the WebView,
 *    which then has access to the student's Firebase session in IndexedDB.
 *    There is no reason for this in a Vercel-hosted app — everything is https.
 *
 * 3. webDir: 'public'
 *    Wrong directory. For a Next build the static bundle is `out/`. `public/`
 *    contains only images and the manifest, so if `server.url` is ever
 *    unreachable the app has literally nothing to fall back to — it shows a
 *    blank white WebView, which is the classic "app won't open" bug report.
 *
 * 4. server.url pointing at the live site is why this feels like a webapp.
 *    Every cold start is a full network round trip before the first pixel.
 *    See the note at the bottom for the fix.
 * ============================================================================
 */

const config: CapacitorConfig = {
  appId: 'com.skcti.app',
  appName: 'SKCTI OS',

  // Next static export lands in `out/`, not `public/`.
  webDir: 'out',

  server: {
    url: 'https://skcti-lyart.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: [
      'skcti-lyart.vercel.app',
      'accounts.google.com',
      'drive.google.com',
      'docs.google.com',
      '*.googleusercontent.com',
      'www.youtube.com',
      '*.firebaseapp.com',
    ],
  },

  android: {
    // Stops the WebView from flashing white before first paint.
    backgroundColor: '#131313',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false, // set true only in dev builds
  },

  ios: {
    backgroundColor: '#131313',
    contentInset: 'never',
    // Required so `env(safe-area-inset-*)` reports real values.
    limitsNavigationsToAppBoundDomains: true,
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: false,      // hide it yourself once auth resolves
      backgroundColor: '#131313',
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#00000000',
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '142521151624-cuv2orimqc8jn9gtjcsl9ga5cindv4j8.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;

/* ============================================================================
 * MAKING IT AN ACTUAL NATIVE APP RATHER THAN A BOOKMARK
 * ============================================================================
 * Right now `server.url` makes this a remote-loaded WebView. Consequences:
 *   - Cold start = DNS + TLS + HTML + JS download before anything renders.
 *     On Indian 4G that is 2-4 seconds of white screen. Native apps render in
 *     under 400ms because the bundle is already on the device.
 *   - No network, no app. Not even a shell, not even cached notes.
 *   - Google Play review flags "app is a wrapper for a website" under
 *     Minimum Functionality. This is a real rejection risk for a paid listing.
 *
 * THE FIX — bundle locally, call the API remotely:
 *
 *   1. Keep `output: 'export'` OFF for the Vercel deploy (see next.config.mjs)
 *      so /api/* works there.
 *   2. Add a second build for the shell:
 *        "build:native": "NEXT_PUBLIC_API_BASE=https://skcti-lyart.vercel.app next build"
 *      with a separate next.config that sets output:'export'.
 *   3. In the app, call `${process.env.NEXT_PUBLIC_API_BASE}/api/chat` instead
 *      of the relative `/api/chat`.
 *   4. Delete the `server` block above entirely. Capacitor then serves `out/`
 *      from the device.
 *
 * You keep one codebase, the UI is instant and works offline, and Firestore's
 * own offline persistence covers the data layer. This is the difference
 * between "smooth native app" and "website in a box".
 * ============================================================================ */
