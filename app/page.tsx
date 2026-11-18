import { HeroExperience } from "@/components/home/hero3d/HeroExperience";
import {
  AudienceSection,
  CraftMarquee,
  FaqTeaser,
  FounderTeaser,
  IntroSection,
  JourneySection,
  ProblemsSection,
  TrendsSection,
} from "@/components/sections/HomeSections";

export default function HomePage() {
  return (
    <>
      {/* Cinematic 3D scroll story: loom → saree → PVS bag (static fallback built in) */}
      <HeroExperience />

      <div id="after-hero" className="scroll-mt-20">
        {/* Who we are + the three ways to order (visit / call-WhatsApp / design online) */}
        <IntroSection />
        <CraftMarquee />
        {/* Five-step made-to-order journey */}
        <JourneySection />
        {/* Trending designs people ask for — opens the designer with that design */}
        <TrendsSection />
        {/* Real buyer worries and how PVS answers them */}
        <ProblemsSection />
        {/* Families (retail) vs boutiques & wholesale */}
        <AudienceSection />
        {/* Founder journey teaser (unconfirmed facts hidden in production) */}
        <FounderTeaser />
        {/* Quick answers to the most common questions */}
        <FaqTeaser />
      </div>
    </>
  );
}
