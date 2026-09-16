"use client";

import { motion } from "framer-motion";
import GlassButton from "@/components/GlassButton";
import VideoBackground from "@/components/VideoBackground";

export default function ContactSection({ overlapPrev = false }: { overlapPrev?: boolean }) {
  return (
    <section
      id="contact"
      className="relative overflow-hidden px-[7%] h-[100svh] snap-start flex items-center justify-center"
      style={overlapPrev ? { marginTop: -70 } : undefined}
      aria-label="Travel tips"
    >
      <VideoBackground src="/assets/clip-2.mp4" overlay="dark" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-2xl mx-auto text-center"
      >
        <h2
          className="font-display font-black text-cream text-4xl md:text-6xl leading-tight mb-8"
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
        >
          Travel Tips
        </h2>

        <GlassButton href="/contact" variant="onDark">
          View Travel Tips
        </GlassButton>
      </motion.div>
    </section>
  );
}
