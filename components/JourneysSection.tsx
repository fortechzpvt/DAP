"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { journeys } from "@/lib/journeys";
import VideoBackground from "@/components/VideoBackground";
import { BirdsOverlay, RevealCard } from "@/components/BirdsReveal";
import { withBasePath } from "@/lib/basePath";

export default function JourneysSection({
  limit,
  overlapPrev = false,
  variant = "full",
}: {
  limit?: number;
  overlapPrev?: boolean;
  variant?: "home" | "full";
}) {
  const items = limit ? journeys.slice(0, limit) : journeys;

  return (
    <section
      id="journeys"
      className={`relative px-[7%] flex items-center ${
        variant === "home"
          ? "py-16 md:py-20 lg:py-0 lg:overflow-hidden lg:h-[100svh] snap-start"
          : "min-h-[100svh] py-24"
      }`}
      style={overlapPrev ? { marginTop: -70 } : undefined}
      aria-label="Featured journeys"
    >
      <VideoBackground src="/assets/clip-4.mp4" overlay="dark" fadeTop={variant === "home"} />
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 md:mb-8 max-w-2xl"
        >
          <span className="font-sans text-[0.65rem] font-bold tracking-[3px] uppercase text-amber mb-3 block">
            Journeys
          </span>
          <h2 className="font-display font-black text-cream text-3xl md:text-4xl leading-tight">
            International Trails
          </h2>
        </motion.div>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <BirdsOverlay className="text-cream/60" />
          {items.map((journey, i) => (
            <RevealCard key={journey.slug} index={i} className="group relative overflow-hidden rounded-sm h-[46svh]">
              {journey.videoUrl && (
                <a
                  href={journey.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Watch ${journey.title} (opens in a new window)`}
                  className="absolute inset-0 z-10"
                />
              )}
              <Image
                src={withBasePath(journey.image)}
                alt={journey.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(15,20,26,0.9) 0%, rgba(15,20,26,0.2) 55%, transparent 100%)" }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-sans text-[0.65rem] font-bold tracking-[2px] uppercase text-amber mb-1.5">
                  {journey.location}
                </p>
                <h3 className="font-display font-bold text-cream text-xl mb-1.5">
                  {journey.title}
                </h3>
                {journey.elevation && (
                  <p className="font-sans text-cream/60 text-xs mb-2">{journey.elevation}</p>
                )}
                <p className="font-sans text-cream/70 text-sm leading-relaxed">
                  {journey.summary}
                </p>
              </div>
            </RevealCard>
          ))}
        </div>
      </div>
    </section>
  );
}
