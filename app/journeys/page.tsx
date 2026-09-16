import type { Metadata } from "next";
import Header from "@/components/Header";
import JourneysSection from "@/components/JourneysSection";
import SiteFooter from "@/components/SiteFooter";
import SocialFloat from "@/components/SocialFloat";

export const metadata: Metadata = {
  title: "Journeys",
  description: "Trekking and travel journeys documented by Dinesh A Pathum.",
};

export default function JourneysPage() {
  return (
    <>
      <SocialFloat />
      <Header />
      <main className="pt-24">
        <JourneysSection variant="full" />
      </main>
      <SiteFooter />
    </>
  );
}
