import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import MeshBackground from "@/components/MeshBackground";

export const metadata: Metadata = {
  title: "SKCTI — Elite Command Center",
  description: "Premium learning platform for JEE / NEET / 11th / 12th",
};

/* Sets the theme class before paint: manual override cookie first,
 * else device preference. */
const themeScript = `
(function () {
  try {
    var m = document.cookie.match(/(?:^|; )skcti-theme=([^;]+)/);
    var pref = m ? m[1] : "device";
    var dark = pref === "dark" || (pref !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;500;600&family=Geist:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen overflow-x-hidden bg-transparent">
        <MeshBackground />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
