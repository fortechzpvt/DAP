"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "About",       href: "/#about"    },
  { label: "Journeys",    href: "/#journeys" },
  { label: "Videos",      href: "/#videos"   },
  { label: "Travel Tips", href: "/#contact"  },
];

const sectionIds = navItems.map(({ href }) => href.slice(2));

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Force-reset scroll on every route change. Each page mounts its own fresh
  // Header instance, so this fires once the new page's content is in the DOM
  // (with its real, possibly much shorter height). Without this, whatever
  // carries over the old scroll position just gets clamped to the new
  // shorter page's max scroll, landing at the bottom instead of the top.
  // Skip when the URL already has a hash - that's an intentional anchor
  // target (e.g. "/#about") and should be respected.
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // Only the homepage contains the anchor sections, so the nav's
  // active-link highlighting only applies there.
  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection(null);
      return;
    }
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        setActiveSection(mostVisible ? mostVisible.target.id : null);
      },
      { threshold: 0.6 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  // Smooth-scrolls in-page anchor links by hand instead of using global
  // `scroll-behavior: smooth`. That CSS also hijacks scroll-to-top on route
  // changes, clamping short pages to the bottom instead of the top. If we're
  // not already on "/", just let the Link navigate normally.
  function handleAnchorClick(e: React.MouseEvent, href: string) {
    setMenuOpen(false);
    if (pathname !== "/") return;
    const id = href.slice(2);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", href);
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-[7%] ${
          scrolled
            ? "bg-dark/95 backdrop-blur-md shadow-[0_1px_24px_rgba(0,0,0,0.18)] py-3"
            : "py-5"
        }`}
        style={
          scrolled
            ? undefined
            : { background: "linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, transparent 100%)" }
        }
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link
            href="/#hero"
            onClick={(e) => handleAnchorClick(e, "/#hero")}
            className="font-display font-black text-cream text-xl tracking-[-0.01em]"
            style={{ textShadow: "0 1px 10px rgba(0,0,0,0.9)" }}
          >
            Dinesh A Pathum
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
            {navItems.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={(e) => handleAnchorClick(e, href)}
                className={`font-sans text-[0.73rem] font-bold tracking-[1.5px] uppercase transition-colors duration-200 ${
                  activeSection === href.slice(2) ? "text-amber" : "text-white hover:text-amber"
                }`}
                style={{ textShadow: "0 1px 10px rgba(0,0,0,0.9)" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="flex flex-col justify-center gap-[5px] w-11 h-11 px-1.5 -mr-1.5 cursor-pointer md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className={`block h-[1.5px] bg-cream transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[3.25px] w-5" : "w-5"}`} />
            <span className={`block h-[1.5px] bg-cream transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[3.25px] w-5" : "w-3.5 ml-auto"}`} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ opacity: 1, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-dark/97 backdrop-blur-lg flex flex-col justify-between px-8 pt-24 pb-12"
          >
            <nav aria-label="Mobile navigation">
              <ul className="space-y-6">
                {navItems.map(({ label, href }, i) => (
                  <motion.li
                    key={label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={href}
                      onClick={(e) => handleAnchorClick(e, href)}
                      className="font-display font-bold text-4xl tracking-[-0.03em] text-cream/70 hover:text-amber transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <p className="font-sans text-[0.6rem] text-cream/25 tracking-[2px] uppercase">
              Dinesh A Pathum · Travel &amp; Trekking
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
