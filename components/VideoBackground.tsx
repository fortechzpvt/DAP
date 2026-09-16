"use client";

import { useEffect, useRef } from "react";

// Each section owns its own full-bleed video background instead of sharing
// one crossfading layer (that caused messy blur bleed-through). Each section
// plays its clip directly and continuously, so there's never a restart/flash
// when scrolling past. The scroll-linked transform below gives it the
// "scroll sensitive" 3D depth: the video drifts and scales slightly as the
// section moves through the viewport, independent of the content on top.
export default function VideoBackground({
  src,
  overlay = "dark",
  scrollScrub = false,
  fadeTop = true,
}: {
  src: string;
  overlay?: "dark" | "light";
  // When true, the clip doesn't autoplay. Scrolling scrubs through its
  // frames directly instead, so playback speed and direction track scroll
  // speed and direction (reversing on scroll-up too).
  scrollScrub?: boolean;
  // The top dissolve only reads correctly when there's a previous section's
  // video for it to fade in over (the homepage's stacked sections). On a
  // standalone page where this is the first thing, there's nothing above it
  // but the plain page background, so the fade just shows up as a stray light
  // band under the header. Set false to start this clip fully opaque instead.
  fadeTop?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !scrollScrub) return;
    video.pause();
    const onLoaded = () => {
      durationRef.current = video.duration || 0;
    };
    video.addEventListener("loadedmetadata", onLoaded);
    if (video.readyState >= 1) onLoaded();
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [scrollScrub]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const wrap = wrapRef.current;
        const video = videoRef.current;
        if (!wrap || !video) return;
        const rect = wrap.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // -1 when the section is a full screen above, 0 when centered, 1 when a full screen below.
        const progress = (rect.top + rect.height / 2 - vh / 2) / (vh + rect.height);
        const clamped = Math.max(-1, Math.min(1, progress));
        const drift = clamped * 70; // px of parallax travel
        video.style.transform = `translate3d(0, ${drift}px, 0) scale(1.18)`;

        if (scrollScrub && durationRef.current) {
          // 0 as the section's top reaches the bottom of the viewport, 1 as
          // its bottom reaches the top. Clip plays out over the section's
          // full scroll traversal, forward or backward with scroll direction.
          const scrubProgress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
          const target = scrubProgress * durationRef.current;
          if (Math.abs(video.currentTime - target) > 0.03) {
            video.currentTime = target;
          }
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [scrollScrub]);

  // The dissolve between sections needs real scroll distance to read as smooth
  // instead of a quick cut, and that distance can't come from the section's
  // own padding (touching that risks clipping text). So this layer bleeds
  // BEYOND its section's box on both edges and fades out over that bled
  // region. Safe to do since it's an absolutely-positioned, pointer-events-none
  // decoration that never affects layout. Later sections paint over earlier
  // ones in normal DOM order, so the next section's video dissolves in on top
  // of the previous one's tail (faint at first, fully opaque by its own true
  // edge) for a long, soft handoff.
  const BLEED = 220;
  const edgeMask = fadeTop
    ? "linear-gradient(to bottom, transparent 0, black 260px, black calc(100% - 260px), transparent 100%)"
    : "linear-gradient(to bottom, black 0, black calc(100% - 260px), transparent 100%)";

  return (
    <div
      ref={wrapRef}
      className="absolute overflow-hidden pointer-events-none"
      style={{
        top: -BLEED,
        bottom: -BLEED,
        left: 0,
        right: 0,
        perspective: 1000,
        WebkitMaskImage: edgeMask,
        maskImage: edgeMask,
      }}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay={!scrollScrub}
        muted
        loop={!scrollScrub}
        playsInline
        preload={scrollScrub ? "auto" : undefined}
        className="w-full h-full object-cover"
        style={{ willChange: "transform", transform: "scale(1.18)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            overlay === "dark"
              ? "linear-gradient(180deg, rgba(15,20,26,0.88) 0%, rgba(15,20,26,0.62) 40%, rgba(15,20,26,0.88) 100%)"
              : "linear-gradient(180deg, rgba(245,241,232,0.45) 0%, transparent 18%, transparent 82%, rgba(245,241,232,0.45) 100%)",
        }}
      />
    </div>
  );
}
