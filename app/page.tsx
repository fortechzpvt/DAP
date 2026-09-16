import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import JourneysSection from "@/components/JourneysSection";
import VideoSection from "@/components/VideoSection";
import ContactSection from "@/components/ContactSection";
import SiteFooter from "@/components/SiteFooter";
import SocialFloat from "@/components/SocialFloat";
import SnapScrollScope from "@/components/SnapScrollScope";

export default function HomePage() {
  return (
    <>
      <SnapScrollScope />
      <SocialFloat />
      <Header />
      <main>
        <HeroSection />
        <AboutSection variant="home" />
        <JourneysSection limit={3} variant="home" />
        <VideoSection variant="home" />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
