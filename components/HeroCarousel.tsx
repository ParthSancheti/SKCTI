"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { BannerDoc as Banner } from "@/lib/types";
import { vibrate } from "@/lib/store";

/* Swipeable, auto-advancing masterclass carousel with merging-pill dots and
 * layoutId shared-element expansion to fullscreen. */
export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState<Banner | null>(null);

  useEffect(() => {
    if (expanded || banners.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => window.clearInterval(id);
  }, [expanded, banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[index % banners.length];

  return (
    <>
      <motion.div
        layoutId={`hero-${banner.id}`}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) setIndex((i) => (i + 1) % banners.length);
          if (info.offset.x > 60) setIndex((i) => (i - 1 + banners.length) % banners.length);
        }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          vibrate(20);
          setExpanded(banner);
        }}
        className="relative h-52 md:h-64 rounded-glass overflow-hidden glassy-elite cursor-pointer select-none"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <Image
              src={banner.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover opacity-40 mix-blend-luminosity"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="font-geist text-label-sm uppercase text-primary mb-1">Masterclass</p>
              <h3 className="font-sora text-headline-lg leading-tight">{banner.title}</h3>
              <p className="font-hanken text-body-md text-on-surface/60 mt-1">{banner.subtitle}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* merging-pill dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {banners.map((b, i) => (
          <motion.button
            key={b.id}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
            animate={{ width: i === index ? 32 : 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className={`h-2 rounded-full ${i === index ? "bg-primary" : "bg-on-surface/20"}`}
          />
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            layoutId={`hero-${expanded.id}`}
            className="fixed inset-0 z-[110] bg-surface-container-lowest overflow-hidden"
          >
            <Image src={expanded.image} alt="" fill className="object-cover opacity-30 mix-blend-luminosity" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent" />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpanded(null)}
              className="absolute top-6 right-6 z-10 w-11 h-11 rounded-full glassy-strong flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} />
            </motion.button>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-3xl"
            >
              <p className="font-geist text-label-sm uppercase text-primary mb-2">Masterclass</p>
              <h2 className="font-sora text-display-lg-mobile md:text-display-lg">{expanded.title}</h2>
              <p className="font-hanken text-body-lg text-on-surface/70 mt-4">{expanded.subtitle}</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="mt-8 rounded-full bg-primary-container text-white font-geist text-label-md px-10 py-4 hover:shadow-glow-primary transition-shadow"
              >
                Explore →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
