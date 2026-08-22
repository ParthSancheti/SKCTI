"use client";

import { useEffect, useRef } from "react";

/* R3 — global portal layer. Fire with firePortal(x, y, color, emoji). */
export default function PortalEffect() {
  const circleRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPortal = (e: Event) => {
      const { x, y, color, emoji } = (e as CustomEvent).detail as {
        x: number; y: number; color: string; emoji: string;
      };
      const circle = circleRef.current;
      const em = emojiRef.current;
      if (!circle || !em) return;

      circle.style.left = `${x}px`;
      circle.style.top = `${y}px`;
      circle.style.setProperty("--portal-color", color);
      em.textContent = emoji;

      circle.classList.remove("active");
      em.classList.remove("active");
      void circle.offsetWidth;
      circle.classList.add("active");
      em.classList.add("active");

      window.setTimeout(() => {
        circle.classList.remove("active");
        em.classList.remove("active");
      }, 800);
    };
    window.addEventListener("skcti:portal", onPortal);
    return () => window.removeEventListener("skcti:portal", onPortal);
  }, []);

  return (
    <div className="portal-overlay" aria-hidden="true">
      <div ref={circleRef} className="portal-circle" />
      <div ref={emojiRef} className="portal-emoji">🪙</div>
    </div>
  );
}
