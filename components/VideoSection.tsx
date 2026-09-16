"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SOCIALS } from "@/lib/socials";
import GlassButton from "@/components/GlassButton";
import VideoBackground from "@/components/VideoBackground";
import { BirdsOverlay } from "@/components/BirdsReveal";

const CHANNEL_NAME = "Dinesh A Pathum";
const CHANNEL_AVATAR =
  "https://yt3.ggpht.com/3l3wOvCUG_5YULr614DBnQs57NFWZx-c3VFjs2mvbv2rIvzu-kZcH4gLbWFGAGxboYffxJWO1aY=s176-c-k-c0x00ffffff-no-rj";

const recentVideos = [
  {
    id: "UACX8Wr5HL0",
    title: "Where the River Leads | Into Sri Lanka's Hidden Wilderness",
    durationSeconds: 4641,
    views: 17428,
    uploadDate: "2026-08-20",
  },
  {
    id: "AFJ0WrxkZ9M",
    title: "Into the Wild Heart of Sri Lanka | A Hidden Village in Paradise",
    durationSeconds: 2455,
    views: 36004,
    uploadDate: "2026-08-13",
  },
  {
    id: "4fNOF-AoJ_Y",
    title: "Into the Wild Heart of Sri Lanka | Kodi Gala Kanda Hike",
    durationSeconds: 2191,
    views: 40335,
    uploadDate: "2026-08-06",
  },
];

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatViews(views: number) {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K views`;
  return `${views} views`;
}

function formatTimeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export default function VideoSection({
  overlapPrev = false,
  variant = "full",
}: {
  overlapPrev?: boolean;
  variant?: "home" | "full";
}) {
  return (
    <section
      id="videos"
      className={`relative px-[7%] flex items-center ${
        variant === "home"
          ? "py-16 md:py-20 lg:py-0 lg:overflow-hidden lg:h-[100svh] snap-start"
          : "min-h-[100svh] py-24"
      }`}
      style={overlapPrev ? { marginTop: -70 } : undefined}
      aria-label="Latest videos"
    >
      <VideoBackground src="/assets/clip-3.mp4" overlay="light" fadeTop={variant === "home"} />
      <div
        className="relative z-10 max-w-6xl mx-auto w-full rounded-3xl border border-dark/15 bg-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 md:p-9"
        style={{ backdropFilter: "blur(6px) saturate(160%)", WebkitBackdropFilter: "blur(10px) saturate(160%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-end justify-between gap-6 mb-6 md:mb-8"
        >
          <div className="max-w-xl">
            <span
              className="font-sans text-[0.65rem] font-bold tracking-[3px] uppercase text-forest mb-3 block"
              style={{ textShadow: "0 1px 10px rgba(245,241,232,0.9)" }}
            >
              Watch
            </span>
            <h2
              className="font-display font-black text-dark text-3xl md:text-4xl leading-tight"
              style={{ textShadow: "0 1px 14px rgba(245,241,232,0.9)" }}
            >
              Latest on YouTube
            </h2>
          </div>
          <GlassButton href={SOCIALS.youtube} external variant="onLight" className="shrink-0">
            Subscribe on YouTube
          </GlassButton>
        </motion.div>

        <div className="relative grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-9">
          <BirdsOverlay className="text-dark/45" />
          {recentVideos.map((video, i) => (
            <motion.a
              key={video.id}
              href={`https://youtu.be/${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.25 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="group block"
            >
              <div className="relative overflow-hidden rounded-xl h-[26svh] bg-dark">
                <Image
                  src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                  alt={video.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[0.7rem] font-medium text-white">
                  {formatDuration(video.durationSeconds)}
                </span>
              </div>

              <div className="mt-3 flex gap-3">
                <Image
                  src={CHANNEL_AVATAR}
                  alt={CHANNEL_NAME}
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <h3
                    className="font-sans text-[0.95rem] font-semibold text-dark leading-snug line-clamp-2"
                    style={{ textShadow: "0 1px 10px rgba(245,241,232,0.9)" }}
                  >
                    {video.title}
                  </h3>
                  <p
                    className="mt-1 font-sans text-[0.8rem] text-dark/60"
                    style={{ textShadow: "0 1px 10px rgba(245,241,232,0.9)" }}
                  >
                    {CHANNEL_NAME}
                  </p>
                  <p
                    className="font-sans text-[0.8rem] text-dark/60"
                    style={{ textShadow: "0 1px 10px rgba(245,241,232,0.9)" }}
                  >
                    {formatViews(video.views)} · {formatTimeAgo(video.uploadDate)}
                  </p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
