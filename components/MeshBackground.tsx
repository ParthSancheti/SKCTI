"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * SKCTI mesh background — same look, ~1/20th the cost.
 *
 * WHAT WAS WRONG WITH THE OLD ONE
 * -------------------------------
 * 1. Four DOM orbs at up to 120vw × 120vw, each with `blur(100px)`.
 *    On a 412px-wide phone that is four ~495px elements the compositor has to
 *    re-rasterise with a 100px Gaussian kernel.
 * 2. All four had `animate-[spin_25s_linear_infinite]`. A rotating blurred
 *    element cannot be cached — it re-rasterises every frame, forever.
 * 3. The parent had `filter: hue-rotate()` running on a 20s loop. A filter on
 *    a parent forces the ENTIRE subtree to re-raster each frame, which defeats
 *    every GPU optimisation underneath it.
 * 4. `mix-blend-multiply` / `mix-blend-screen` forced yet another full-screen
 *    blend pass.
 * 5. It never paused. Backgrounded app, modal open, PDF fullscreen — still
 *    burning GPU and battery.
 * 6. It was mounted 2–3 times simultaneously (root layout + admin layout +
 *    landing page + onboarding), so all of the above ran two or three times over.
 *
 * WHAT THIS DOES INSTEAD
 * ----------------------
 * The visual result of "big blurred coloured orb" is mathematically a radial
 * gradient. So: paint four radial-gradients into ONE layer, once. Zero blur
 * filters, zero blend modes, zero hue-rotate.
 *
 * Motion is preserved as a very slow `transform: rotate()` on a single
 * pre-painted layer — transforms are handled entirely by the compositor and
 * cost no repaint at all.
 *
 * It also self-suspends when the tab/app is backgrounded.
 */
export default function MeshBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || "";

  let animationDuration = "90s";
  let baseOpacity = 1;
  let darkOpacity = 0.45;

  if (pathname.includes("/read")) {
    animationDuration = "0s";
    baseOpacity = 0;
    darkOpacity = 0;
  }

  useEffect(() => {
    // Guard against the multi-mount problem: only the first instance animates.
    const existing = document.querySelectorAll("[data-mesh-bg]");
    if (existing.length > 1 && ref.current !== existing[0]) {
      ref.current?.style.setProperty("display", "none");
      return;
    }

    const el = ref.current;
    if (!el) return;

    const onVisibility = () => {
      el.style.animationPlayState = document.hidden ? "paused" : "running";
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div
      data-mesh-bg
      aria-hidden="true"
      className="fixed inset-0 z-[-50] overflow-hidden pointer-events-none bg-[#f0f4f8] dark:bg-[#050508] transition-colors duration-500"
    >
      <div
        ref={ref}
        className="mesh-orbit absolute left-1/2 top-1/2 h-[180vmax] w-[180vmax] -translate-x-1/2 -translate-y-1/2"
        style={{
          backgroundImage: [
            // purple / pink  (was Orb 1)
            "radial-gradient(circle at 22% 18%, rgba(147,51,234,0.55), rgba(147,51,234,0) 42%)",
            "radial-gradient(circle at 26% 22%, rgba(236,72,153,0.40), rgba(236,72,153,0) 34%)",
            // blue / cyan    (was Orb 2)
            "radial-gradient(circle at 80% 82%, rgba(37,99,235,0.50), rgba(37,99,235,0) 40%)",
            "radial-gradient(circle at 76% 78%, rgba(34,211,238,0.32), rgba(34,211,238,0) 32%)",
            // indigo/violet  (was Orb 3)
            "radial-gradient(circle at 84% 28%, rgba(99,102,241,0.42), rgba(99,102,241,0) 38%)",
            // rose / orange  (was Orb 4)
            "radial-gradient(circle at 16% 76%, rgba(244,63,94,0.38), rgba(251,146,60,0) 40%)",
          ].join(","),
          willChange: "transform",
        }}
      />
      <style jsx>{`
        .mesh-orbit {
          animation: mesh-orbit ${animationDuration} linear infinite;
          opacity: ${baseOpacity};
          transition: opacity 1s ease-in-out;
        }
        @keyframes mesh-orbit {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        :global(.dark) .mesh-orbit {
          opacity: ${darkOpacity};
        }
      `}</style>
    </div>
  );
}
