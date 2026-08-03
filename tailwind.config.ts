import type { Config } from "tailwindcss";

/** SKCTI Core — every color resolves through a CSS variable so light/dark
 *  are swapped by toggling the `dark` class on <html>. */
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
        sora: ["var(--font-sora)", "system-ui", "sans-serif"],
        hanken: ["var(--font-hanken)", "system-ui", "sans-serif"],
        // WAS: ["var(--font-geist)", "monospace", "sans-serif"]
        // The monospace fallback sat BEFORE sans-serif, so any time the Google
        // Fonts request failed — offline cold start in the native app, slow
        // network, blocked CDN — every `font-geist` element in the app rendered
        // in Courier. Every coin count, every label, every nav item.
        geist: ["var(--font-geist)", "ui-sans-serif", "system-ui", "sans-serif"],
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

      /* ====================================================================
         THE BIG ONE.

         The old config did this:

             borderRadius: {
               sm: "0.5rem", DEFAULT: "1rem", md: "1.5rem",
               lg: "2rem",   xl: "3rem",
               glass: "32px", input: "12px",
             }

         Those keys are not new names — they OVERWRITE Tailwind's built-ins.
         Result across the whole app:

             rounded-sm   0.125rem  ->  0.5rem   (4x)
             rounded      0.25rem   ->  1rem     (4x)
             rounded-md   0.375rem  ->  1.5rem   (4x)
             rounded-lg   0.5rem    ->  2rem     (4x)
             rounded-xl   0.75rem   ->  3rem     (4x)

         `rounded-xl` appears 78 times in this codebase. Every one of them is
         rendering at 48px instead of 12px. That is why small elements look
         like blobs: the 56px admin logo tile with `rounded-xl` is a perfect
         circle, the profile-menu rows are lozenges, the badge chips are pills.
         It is the single most visible cosmetic defect in the app and it is
         one config block.

         Fixed below: Tailwind's scale is restored, and the oversized values
         are kept under their own names so nothing that genuinely wanted a
         32px corner has to change.

         MIGRATION: after this change, anything that really did want the big
         corner becomes `rounded-glass` (32px) or `rounded-squircle` (28px).
         Sweep with:
             grep -rn "rounded-xl" app components
         and swap the ones that were large cards. Everything else was already
         wrong and now looks the way it was written to look.
         ==================================================================== */
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        glass: "32px",
        squircle: "28px",
        card: "24px",
        input: "12px",
        pill: "9999px",
      },

      spacing: {
        gutter: "32px",
        "margin-desktop": "64px",
        "margin-mobile": "20px",
        stack: "24px",
        // Safe-area aware spacing so nothing has to hardcode bottom-28 again.
        "safe-top": "env(safe-area-inset-top, 0px)",
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
        "nav-clear": "calc(5rem + env(safe-area-inset-bottom, 0px))",
      },
      maxWidth: { container: "1440px" },
      transitionTimingFunction: {
        pop: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        portal: "cubic-bezier(0.7, 0, 0.3, 1)",
        // iOS UIKit's default easing — worth having for native-feeling motion.
        ios: "cubic-bezier(0.25, 0.1, 0.25, 1)",
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
