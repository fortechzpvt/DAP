"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import VideoBackground from "@/components/VideoBackground";
import {
  SOCIALS,
  YOUTUBE_SUBSCRIBERS,
  INSTAGRAM_FOLLOWERS,
  FACEBOOK_FOLLOWERS,
  TIKTOK_FOLLOWERS,
} from "@/lib/socials";

const bio = [
  "Dinesh A. Pathum is a popular Sri Lankan travel content creator, vlogger, and nature explorer based in Colombo.",
  "He is widely known for his YouTube channel, Dinesh A Pathum, where he documents scenic road trips, deep-wilderness trekking, and off-the-beaten-path explorations across Sri Lanka and international destinations such as Ladakh.",
];

const philosophy = {
  sinhala: "සොබාදහම රකින්නා සොබාදහම විසින් රකිනු ලබයි",
  english: "He who protects nature is protected by nature.",
};

function formatCount(n: number) {
  if (n < 1000) return String(n);
  const k = Math.round(n / 100) / 10;
  return `${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}K`;
}

const YouTubeIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <rect width="24" height="24" rx="6" fill="#FF0000" />
    <path d="M9.5 7.5v9l7-4.5-7-4.5z" fill="white" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <defs>
      <radialGradient id="igGrad" cx="0.3" cy="1" r="1.2">
        <stop offset="0%" stopColor="#FFDD55" />
        <stop offset="35%" stopColor="#FF543E" />
        <stop offset="70%" stopColor="#C837AB" />
        <stop offset="100%" stopColor="#3051F3" />
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#igGrad)" />
    <rect x="6" y="6" width="12" height="12" rx="3.5" stroke="white" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="3.1" stroke="white" strokeWidth="1.6" />
    <circle cx="16" cy="8" r="0.9" fill="white" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <rect width="24" height="24" rx="6" fill="#1877F2" />
    <path d="M14.5 8.5h1.8V6h-2c-2 0-3.1 1.3-3.1 3.2v1.6H9.6v2.6h1.6V19h2.8v-5.6h1.9l.3-2.6h-2.2V9.4c0-.6.2-.9.9-.9z" fill="white" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <rect width="24" height="24" rx="6" fill="#010101" />
    <path
      d="M15.6 6.2c.4 1.4 1.4 2.4 2.9 2.6v1.9c-1 .1-1.9-.2-2.9-.8v4.4c0 2.2-1.8 4-4 4-2.2 0-4-1.8-4-4s1.8-4 4-4c.2 0 .5 0 .7.1v2c-.2-.1-.5-.1-.7-.1-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2V6.2h2z"
      fill="white"
    />
  </svg>
);

function useCountUp(target: number, active: boolean, duration = 1600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);
  return count;
}

function SocialStat({
  href,
  icon,
  count,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  count: number;
  label: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const value = useCountUp(count, inView);

  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 group"
    >
      {icon}
      <span>
        <span
          className="block font-display font-black text-dark text-2xl md:text-3xl leading-none tabular-nums"
          style={{ textShadow: "0 1px 10px rgba(245,241,232,0.9)" }}
        >
          {formatCount(value)}+
        </span>
        <span
          className="block font-sans text-dark/60 text-xs mt-0.5 group-hover:text-forest transition-colors duration-200"
          style={{ textShadow: "0 1px 10px rgba(245,241,232,0.9)" }}
        >
          {label}
        </span>
      </span>
    </a>
  );
}

function SocialStats() {
  return (
    <div className="flex flex-wrap gap-x-7 gap-y-4 mb-6">
      <SocialStat href={SOCIALS.youtube} icon={<YouTubeIcon />} count={YOUTUBE_SUBSCRIBERS} label="YouTube subscribers" />
      <SocialStat href={SOCIALS.instagram} icon={<InstagramIcon />} count={INSTAGRAM_FOLLOWERS} label="Instagram followers" />
      <SocialStat href={SOCIALS.facebook} icon={<FacebookIcon />} count={FACEBOOK_FOLLOWERS} label="Facebook followers" />
      <SocialStat href={SOCIALS.tiktok} icon={<TikTokIcon />} count={TIKTOK_FOLLOWERS} label="TikTok followers" />
    </div>
  );
}

export default function AboutSection({
  variant = "full",
  overlapPrev = false,
}: {
  variant?: "home" | "full";
  overlapPrev?: boolean;
}) {
  const paragraphs = variant === "home" ? bio.slice(0, 1) : bio;

  return (
    <section
      id="about"
      className={`relative px-[7%] flex items-center ${
        variant === "home"
          ? "py-16 md:py-20 lg:py-0 lg:overflow-hidden lg:h-[100svh] snap-start"
          : "min-h-[100svh] py-24"
      }`}
      style={overlapPrev ? { marginTop: -70 } : undefined}
      aria-label="About Dinesh A Pathum"
    >
      <VideoBackground src="/assets/clip-6.mp4" overlay="light" fadeTop={variant === "home"} />
      <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center w-full">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[42svh] md:h-[50svh] aspect-[4/5] rounded-3xl overflow-hidden order-2 md:order-1 justify-self-center border border-white/30 shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
        >
          <Image
            src="/assets/gallery/thorong-la-pass.jpg"
            alt="Dinesh A Pathum at Thorong La Pass, 5,416m, Annapurna Circuit, Nepal"
            fill
            className="object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 md:order-2 rounded-3xl border border-dark/15 bg-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 md:p-9"
          style={{ backdropFilter: "blur(6px) saturate(160%)", WebkitBackdropFilter: "blur(10px) saturate(160%)" }}
        >
          <SocialStats />
          <span
            className="font-sans text-[0.65rem] font-bold tracking-[3px] uppercase text-forest mb-3 block"
            style={{ textShadow: "0 1px 10px rgba(245,241,232,0.9)" }}
          >
            About
          </span>
          <h2
            className="font-display font-black text-dark text-3xl md:text-4xl leading-tight mb-5"
            style={{ textShadow: "0 1px 14px rgba(245,241,232,0.9)" }}
          >
            A Sri Lankan Explorer on the Trail
          </h2>
          {paragraphs.map((p) => (
            <p
              key={p}
              className="font-sans text-dark/85 text-base leading-relaxed mb-4"
              style={{ textShadow: "0 1px 10px rgba(245,241,232,0.9)" }}
            >
              {p}
            </p>
          ))}
          <blockquote className="border-l-2 border-forest/50 pl-4 mt-2">
            <p className="font-display font-bold text-dark text-lg leading-snug">
              {philosophy.sinhala}
            </p>
            <p className="font-sans text-dark/70 text-sm italic mt-1">
              &ldquo;{philosophy.english}&rdquo;
            </p>
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
