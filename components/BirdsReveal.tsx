"use client";

import { motion } from "framer-motion";

// Small flock silhouette, drawn once and reused per bird. Simple double-arc
// "M" shape reads as a bird in flight at any size.
function Bird({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 12" width="26" height="13" className={className} fill="none" aria-hidden="true">
      <path
        d="M0 6 Q 6 0 12 6 Q 18 0 24 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const flock = [
  { top: "6%", scale: 0.6, delay: 0, duration: 1.5, opacity: 0.35 },
  { top: "22%", scale: 0.95, delay: 0.1, duration: 1.3, opacity: 0.6 },
  { top: "0%", scale: 0.5, delay: 0.2, duration: 1.7, opacity: 0.3 },
  { top: "34%", scale: 0.8, delay: 0.06, duration: 1.4, opacity: 0.45 },
  { top: "14%", scale: 0.7, delay: 0.28, duration: 1.6, opacity: 0.4 },
];

// Absolutely-positioned flock that sweeps left-to-right across whatever it's
// layered over. Pair with RevealCard below so cards look like they're being
// uncovered in the birds' wake instead of just fading in.
//
// trigger "scroll" (default) plays once when the flock scrolls into view.
// "mount" plays immediately on mount/remount instead - use that for content
// that swaps in place (e.g. a tab panel), since scrolling into view won't
// happen again there.
export function BirdsOverlay({
  className = "text-dark/50",
  trigger = "scroll",
}: {
  className?: string;
  trigger?: "scroll" | "mount";
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20" aria-hidden="true">
      {flock.map((b, i) => {
        const flight = {
          x: "115vw",
          y: [0, -16, 8, -10, 0],
          opacity: [0, b.opacity, b.opacity, b.opacity, 0],
        };
        return (
          <motion.div
            key={i}
            className={`absolute ${className}`}
            style={{ top: b.top }}
            initial={{ x: "-15vw", opacity: 0, scale: b.scale }}
            {...(trigger === "scroll"
              ? { whileInView: flight, viewport: { once: true, margin: "-100px" } }
              : { animate: flight })}
            transition={{ duration: b.duration, delay: b.delay, ease: "easeInOut" }}
          >
            <Bird />
          </motion.div>
        );
      })}
    </div>
  );
}

// Fades a card up into place. Pair one per card in a grid, passing its index
// so they reveal in sequence. Used to be a clip-path "wipe" effect, but that
// left cards permanently invisible (clipped to zero width) on tall,
// auto-height mobile layouts where whileInView's IntersectionObserver trigger
// didn't fire reliably. Switched to opacity/transform since that's already
// working elsewhere in these sections (the heading blocks above these
// grids) instead of digging further into the clip-path/observer bug.
export function RevealCard({
  index,
  className,
  trigger = "scroll",
  children,
}: {
  index: number;
  className?: string;
  trigger?: "scroll" | "mount";
  children: React.ReactNode;
}) {
  const revealed = { opacity: 1, y: 0 };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      {...(trigger === "scroll"
        ? { whileInView: revealed, viewport: { once: true, margin: "-60px" } }
        : { animate: revealed })}
      transition={{ duration: 0.7, delay: 0.25 + index * 0.14, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
