"use client";

import { SOCIALS } from "@/lib/socials";

export default function SocialFloat() {
  return (
    <a
      href={SOCIALS.youtube}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Subscribe on YouTube"
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full
                 bg-white/15 border border-white/40 overflow-hidden select-none
                 shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)]
                 transition-all duration-300 ease-out hover:scale-105 hover:bg-white/25
                 active:scale-95 active:duration-100 active:shadow-[0_2px_10px_rgba(0,0,0,0.3),inset_0_2px_8px_rgba(0,0,0,0.25)]"
      style={{
        backdropFilter: "blur(6px) url(#glass-distortion) saturate(160%) brightness(1.05)",
        WebkitBackdropFilter: "blur(10px) saturate(160%) brightness(1.05)",
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(120% 100% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 55%)",
          mixBlendMode: "overlay",
        }}
      />
      <svg viewBox="0 0 24 24" className="relative z-10 w-7 h-7 fill-[#FF0000]" aria-hidden="true">
        <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
      </svg>
    </a>
  );
}
