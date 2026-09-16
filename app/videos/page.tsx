import type { Metadata } from "next";
import Header from "@/components/Header";
import VideoSection from "@/components/VideoSection";
import SiteFooter from "@/components/SiteFooter";
import SocialFloat from "@/components/SocialFloat";

export const metadata: Metadata = {
  title: "Videos",
  description: "Recent videos from Dinesh A Pathum's treks and travels.",
};

export default function VideosPage() {
  return (
    <>
      <SocialFloat />
      <Header />
      <main className="pt-24">
        <VideoSection variant="full" />
      </main>
      <SiteFooter />
    </>
  );
}
