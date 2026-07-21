import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import MeshBackground from "@/components/MeshBackground";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "SKCTI — Elite MHT CET Platform",
  description: "Premium learning platform for MHT CET",
  icons: {
    icon: "/src/logo.png",
  },
};



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;500;600&family=Geist:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen overflow-x-hidden bg-transparent text-black dark:text-white">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MeshBackground />
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
