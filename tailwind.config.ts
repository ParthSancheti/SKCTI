import type { Config } from "tailwindcss";

/** SKCTI Core — every color resolves through a CSS variable so light/dark
 *  are swapped by toggling the `dark` class on <html>. Dark values match
 *  DESIGN.md exactly; light values are the tonal counterparts. */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const tokenNames = [
  "surface","surface-dim","surface-bright",
  "surface-container-lowest","surface-container-low","surface-container",
  "surface-container-high","surface-container-highest",
  "on-surface","on-surface-variant","inverse-surface","inverse-on-surface",
  "outline","outline-variant","surface-tint",
  "primary","on-primary","primary-container","on-primary-container","inverse-primary",
  "secondary","on-secondary","secondary-container","on-secondary-container",
  "tertiary","on-tertiary","tertiary-container","on-tertiary-container",
  "error","on-error","error-container","on-error-container",
  "primary-fixed","primary-fixed-dim","on-primary-fixed","on-primary-fixed-variant",
  "secondary-fixed","secondary-fixed-dim","on-secondary-fixed","on-secondary-fixed-variant",
  "tertiary-fixed","tertiary-fixed-dim","on-tertiary-fixed","on-tertiary-fixed-variant",
  "background","on-background","surface-variant",
  "glass","glass-strong","glass-border","glass-border-strong",
] as const;

const colors = Object.fromEntries(tokenNames.map((n) => [n, v(n)]));

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors,
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        hanken: ["var(--font-hanken)", "sans-serif"],
        geist: ["var(--font-geist)", "monospace", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["64px", { lineHeight: "72px", letterSpacing: "-0.04em", fontWeight: "800" }],
        "display-lg-mobile": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-xl": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["28px", { lineHeight: "36px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.1em", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        glass: "32px",
        input: "12px",
      },
      spacing: {
        gutter: "32px",
        "margin-desktop": "64px",
        "margin-mobile": "20px",
        stack: "24px",
      },
      maxWidth: { container: "1440px" },
      transitionTimingFunction: {
        pop: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        portal: "cubic-bezier(0.7, 0, 0.3, 1)",
      },
      boxShadow: {
        "glow-primary": "0 0 24px rgba(168, 85, 247, 0.4)",
        "glow-primary-soft": "0 0 40px rgba(168, 85, 247, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
