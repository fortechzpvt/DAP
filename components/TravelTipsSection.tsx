"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { getTravelTips, type TripTips } from "@/lib/travelTips";
import VideoBackground from "@/components/VideoBackground";
import { BirdsOverlay, RevealCard } from "@/components/BirdsReveal";

export default function TravelTipsSection() {
  const [travelTips, setTravelTips] = useState<TripTips[] | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTravelTips()
      .then((tips) => {
        if (cancelled) return;
        setTravelTips(tips);
        if (tips.length) setActiveSlug(tips[0].slug);
      })
      .catch(() => {
        if (!cancelled) setTravelTips([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!travelTips) {
    return (
      <section className="relative px-[7%] py-24 min-h-[100svh] flex items-center justify-center" aria-label="Travel tips">
        <VideoBackground src="/assets/clip-2.mp4" overlay="light" scrollScrub fadeTop={false} />
        <p className="relative z-10 font-sans text-dark/60 text-sm">Loading trip notes…</p>
      </section>
    );
  }

  if (travelTips.length === 0) {
    return (
      <section className="relative px-[7%] py-24 min-h-[100svh] flex items-center justify-center" aria-label="Travel tips">
        <VideoBackground src="/assets/clip-2.mp4" overlay="light" scrollScrub fadeTop={false} />
        <p className="relative z-10 font-sans text-dark/60 text-sm">Trip notes are coming soon.</p>
      </section>
    );
  }

  const activeTrip = travelTips.find((trip) => trip.slug === activeSlug) ?? travelTips[0];

  return (
    <section className="relative px-[7%] py-24 min-h-[100svh] flex items-center" aria-label="Travel tips">
      <VideoBackground src="/assets/clip-2.mp4" overlay="light" scrollScrub fadeTop={false} />
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 mx-auto max-w-2xl rounded-3xl border border-dark/15 bg-white/50 shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 md:p-9"
          style={{ backdropFilter: "blur(6px) saturate(160%)", WebkitBackdropFilter: "blur(10px) saturate(160%)" }}
        >
          <span className="font-sans text-[0.65rem] font-bold tracking-[3px] uppercase text-forest mb-3 block">
            Travel tips
          </span>
          <h1 className="font-display font-black text-dark text-3xl md:text-4xl leading-tight mb-5">
            Trip Notes
          </h1>
          <p className="font-sans text-dark/85 text-base leading-relaxed max-w-xl mx-auto">
            Gear, prep, permits, and cost breakdowns from the road. Pick a trip.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-12" role="tablist" aria-label="Select a trip">
          {travelTips.map((trip) => (
            <button
              key={trip.slug}
              role="tab"
              aria-selected={trip.slug === activeSlug}
              onClick={() => setActiveSlug(trip.slug)}
              className={clsx(
                "font-sans text-[0.75rem] font-semibold tracking-[1px] uppercase px-5 py-2.5 rounded-full border transition-all duration-200",
                trip.slug === activeSlug
                  ? "bg-forest text-cream border-forest"
                  : "bg-cream/60 text-dark/70 border-dark/15 hover:bg-cream/80 hover:text-dark"
              )}
            >
              {trip.title}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTrip.slug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={
              activeTrip.categories.length ? "relative grid sm:grid-cols-2 gap-6" : "relative text-center"
            }
          >
            <BirdsOverlay className="text-dark/45" trigger="mount" />
            {activeTrip.categories.length === 0 ? (
              <p className="inline-block rounded-sm bg-cream/70 backdrop-blur-sm px-6 py-4 font-sans text-dark/70 text-sm">
                Tips for this trip are coming soon.
              </p>
            ) : (
              activeTrip.categories.map((category, i) => (
                <RevealCard
                  key={category.title}
                  index={i}
                  trigger="mount"
                  className="rounded-sm bg-cream/70 backdrop-blur-sm p-6"
                >
                  <h2 className="font-display font-bold text-dark text-lg mb-4">{category.title}</h2>
                  <ul className="space-y-3.5">
                    {category.items.map((item) => (
                      <li key={item.label} className="font-sans text-sm leading-relaxed">
                        <span className="font-semibold text-dark">{item.label}: </span>
                        <span className="text-dark/75">{item.detail}</span>
                      </li>
                    ))}
                  </ul>
                </RevealCard>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
