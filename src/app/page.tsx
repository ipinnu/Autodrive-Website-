import PlateCheckSection from "@/components/PlateCheckSection";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import WhoSection from "@/components/WhoSection";
import IntroSection from "@/components/IntroSection";
import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <PlateCheckSection />
      <ProblemSection />
      <WhoSection />
      <div className="bg-navy">
        <IntroSection />
        <CTASection showLaunchBadges={false} compact />
      </div>
    </>
  );
}
