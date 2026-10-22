import LandingHeader from "@/components/studio/landing/LandingHeader";
import LandingHero from "@/components/studio/landing/LandingHero";
import PlatformSection from "@/components/studio/landing/PlatformSection";
import CampaignsSection from "@/components/studio/landing/CampaignsSection";
import LearningSection from "@/components/studio/landing/LearningSection";
import OperationsSection from "@/components/studio/landing/OperationsSection";
import AnalyticsSection from "@/components/studio/landing/AnalyticsSection";
import HowItWorksSection from "@/components/studio/landing/HowItWorksSection";
import { CtaSection, LandingFooter } from "@/components/studio/landing/CtaFooter";
import { FONT } from "@/components/studio/auth/tokens";

export default function NexuraStudioLanding() {
  return (
    <div className="min-h-screen scroll-smooth bg-[#f7f5ff] text-[#1c2533]" style={{ fontFamily: FONT }}>
      <LandingHeader />
      <LandingHero />
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-[32px]">
        <PlatformSection />
        <CampaignsSection />
        <LearningSection />
        <OperationsSection />
        <AnalyticsSection />
        <HowItWorksSection />
        <CtaSection />
        <LandingFooter />
      </div>
    </div>
  );
}
