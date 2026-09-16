"use client";

import Link from "next/link";
import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";

// "onDark" = sitting over the hero photo, light text on clear glass.
// "onLight" = sitting over the cream sections, dark text on clear glass.
type Variant = "onDark" | "onLight";
type Size = "md" | "sm";

const base =
  "relative inline-flex items-center justify-center font-sans font-semibold overflow-hidden select-none " +
  "rounded-full border transition-all duration-300 ease-out " +
  "active:scale-[0.96] active:duration-100";

const sizes: Record<Size, string> = {
  md: "text-[0.85rem] px-8 py-3.5",
  sm: "text-[0.75rem] px-6 py-2.5",
};

// Background stays a near-clear white sheen either way, only the text/border/glow tone shifts.
const variants: Record<Variant, string> = {
  onDark:
    "bg-white/10 text-cream border-white/40 " +
    "shadow-[0_8px_28px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)] " +
    "hover:bg-white/20 hover:border-white/60 " +
    "active:bg-white/25 active:shadow-[0_2px_10px_rgba(0,0,0,0.3),inset_0_2px_8px_rgba(0,0,0,0.25)]",
  onLight:
    "bg-white/15 text-dark border-dark/15 " +
    "shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.6)] " +
    "hover:bg-white/30 hover:border-dark/25 " +
    "active:bg-white/35 active:shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_2px_8px_rgba(0,0,0,0.08)]",
};

// Real backdrop-filter with the SVG lensing filter for engines that support url()
// filters chained with blur/saturate (Chromium). Safari ignores the url() term
// gracefully and falls back to -webkit-backdrop-filter (blur + saturate only).
const glassFilterStyle: CSSProperties = {
  backdropFilter: "blur(6px) url(#glass-distortion) saturate(160%) brightness(1.05)",
  WebkitBackdropFilter: "blur(10px) saturate(160%) brightness(1.05)",
};

function GlassHighlight() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-full"
      style={{
        background: "radial-gradient(120% 100% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 55%)",
        mixBlendMode: "overlay",
      }}
    />
  );
}

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type LinkVariant = BaseProps & { href: string; external?: false };
type ExternalVariant = BaseProps & { href: string; external: true };

export default function GlassButton(props: LinkVariant | ExternalVariant) {
  const { href, variant = "onLight", size = "md", className, children } = props;
  const cls = clsx(base, sizes[size], variants[variant], className);

  const inner = (
    <>
      <GlassHighlight />
      <span className="relative z-10">{children}</span>
    </>
  );

  if (props.external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={glassFilterStyle}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} style={glassFilterStyle}>
      {inner}
    </Link>
  );
}
