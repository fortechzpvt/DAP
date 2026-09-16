"use client";

import { motion } from "framer-motion";
import GlassButton from "@/components/GlassButton";
import { withBasePath } from "@/lib/basePath";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full flex flex-col justify-end overflow-hidden snap-start"
      style={{ height: "100svh", minHeight: 560, background: "#0f141a" }}
      aria-label="Hero for Dinesh A Pathum, travel and trekking creator"
    >
      <div
        className="absolute inset-0"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, black 0, black calc(100% - 100px), transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 0, black calc(100% - 100px), transparent 100%)",
        }}
      >
        {/* Plain <picture>, not next/image: images.unoptimized is already set
            (static export), and next/image has no clean art-direction API.
            A <source media> swap is the only way to serve a different crop to
            phones, instead of cropping the desktop photo's baked-in text into
            unreadable fragments. Swap in a portrait-cropped hero-mobile.jpg
            whenever one's ready, this <picture> already routes phones to it. */}
        <picture>
          <source media="(max-width: 767px)" srcSet={withBasePath("/assets/hero-mobile.jpg")} />
          <img
            src={withBasePath("/assets/hero.jpg")}
            alt="Dinesh A Pathum in the Everest region, Nepal. Those who protect nature are protected by nature."
            fetchPriority="high"
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ animation: "bgSlowZoomSubtle 30s ease-in-out infinite alternate" }}
          />
        </picture>
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(15,20,26,0.55) 0%, rgba(15,20,26,0.1) 35%, transparent 60%)" }}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full px-[7%] pb-40 flex justify-center">
        <motion.div
          className="flex gap-3 flex-wrap justify-center"
          initial={{ y: 14 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <GlassButton href="/#journeys" variant="onDark">
            See the Journeys
          </GlassButton>
        </motion.div>
      </div>
    </section>
  );
}
