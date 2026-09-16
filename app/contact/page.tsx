import type { Metadata } from "next";
import Header from "@/components/Header";
import TravelTipsSection from "@/components/TravelTipsSection";
import SiteFooter from "@/components/SiteFooter";
import SocialFloat from "@/components/SocialFloat";

export const metadata: Metadata = {
  title: "Travel Tips",
  description: "Everest Base Camp trek travel tips from Dinesh A Pathum.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SocialFloat />
      <Header />
      <main className="pt-24 flex-1">
        <TravelTipsSection />
      </main>
      <SiteFooter />
    </div>
  );
}
