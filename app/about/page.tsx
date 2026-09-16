import type { Metadata } from "next";
import Header from "@/components/Header";
import AboutSection from "@/components/AboutSection";
import SiteFooter from "@/components/SiteFooter";
import SocialFloat from "@/components/SocialFloat";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Dinesh A Pathum's travel and trekking journeys.",
};

export default function AboutPage() {
  return (
    <>
      <SocialFloat />
      <Header />
      <main className="pt-24">
        <AboutSection variant="full" />
      </main>
      <SiteFooter />
    </>
  );
}
