import type { Metadata, Viewport } from "next";
import { Sora, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import MeshBackground from "@/components/MeshBackground";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "next-themes";

/**
 * ============================================================================
 * FONTS — was a render-blocking external <link>
 * ============================================================================
 * The old layout put a <link href="https://fonts.googleapis.com/css2?..."> in
 * <head>. In a Capacitor WebView that is a blocking third-party request on
 * every cold start, before any text can paint. On a slow connection you get a
 * visibly blank app; on no connection you get the fallback font — and because
 * tailwind.config listed `monospace` first in the geist stack, that fallback
 * was Courier across the entire UI.
 *
 * next/font self-hosts the files into your own bundle: zero external requests,
 * zero layout shift, works offline.
 *
 * Geist is not on Google Fonts. Either `npm i geist` and import from
 * "geist/font/sans", or drop it and let --font-geist fall through to the
 * system UI font — which on both iOS and Android is exactly what a native app
 * uses anyway, and is the single fastest way to make this feel native.
 * ============================================================================
 */
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SKCTI",
  description: "Elite preparation for MHT-CET, JEE, and NEET",
  // WAS MISSING ENTIRELY. Without this the manifest is never fetched, so the
  // PWA is not installable and "Add to Home Screen" never appears.
  manifest: "/manifest.webmanifest",
  applicationName: "SKCTI",
  appleWebApp: {
    capable: true,
    title: "SKCTI",
    statusBarStyle: "black-translucent", // required for edge-to-edge on iOS
  },
  formatDetection: {
    // Stops iOS auto-linking every 10-digit number in the app (coin counts,
    // marks, durations) into a blue "call this" link.
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.webp", sizes: "192x192", type: "image/webp" },
      { url: "/icons/icon-512.webp", sizes: "512x512", type: "image/webp" },
    ],
    apple: "/icons/icon-192.webp",
  },
};

/**
 * WAS ENTIRELY ABSENT. Two consequences on every phone:
 *
 *  1. No `viewport-fit=cover`, so env(safe-area-inset-*) always returned 0px.
 *     Every safe-area calc in the codebase (TitleBar, the landing page) was
 *     silently resolving to its fallback. That is why content sits under the
 *     notch even though the CSS looks correct.
 *
 *  2. No maximumScale, so double-tap pinch-zooms the whole UI. Nothing reads
 *     as "this is a web page in a wrapper" faster than accidentally zooming
 *     the nav bar.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#050508" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${hanken.variable}`}
    >
      <body className="antialiased min-h-[100dvh] overflow-x-hidden bg-transparent text-black dark:text-white">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/*
            MeshBackground belongs here and ONLY here. It is currently also
            mounted in app/admin/layout.tsx, app/page.tsx, app/login/page.tsx
            and app/onboarding/page.tsx — so on those screens two or three
            copies of the full-screen animated background run simultaneously.
            Delete those other <MeshBackground /> usages.
          */}
          <MeshBackground />
          <AppProvider>
            <ToastProvider>{children}</ToastProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
