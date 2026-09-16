import Link from "next/link";
import { SOCIALS } from "@/lib/socials";

const links = [
  { label: "YouTube", href: SOCIALS.youtube },
  { label: "Instagram", href: SOCIALS.instagram },
  { label: "TikTok", href: SOCIALS.tiktok },
  { label: "Facebook", href: SOCIALS.facebook },
];

export default function SiteFooter() {
  return (
    <footer className="relative z-10 bg-dark px-[7%] py-12 snap-start" aria-label="Site footer">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="font-display font-bold text-cream text-lg">
          Dinesh A Pathum
        </Link>

        <div className="flex flex-wrap justify-center gap-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-[0.7rem] font-semibold tracking-[1.5px] uppercase text-cream/60 hover:text-amber transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        <p className="font-sans text-[0.65rem] text-cream/35 tracking-[1px]">
          © {new Date().getFullYear()} Dinesh A Pathum
        </p>
      </div>

      <p className="mt-4 text-center font-sans text-[0.55rem] text-cream/20 tracking-[1px]">
        Made by Fortechz
      </p>
    </footer>
  );
}
