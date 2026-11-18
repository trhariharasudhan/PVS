import { HeroExperience } from "@/components/home/hero3d/HeroExperience";
import {
  AudienceSection,
  CraftMarquee,
  FounderTeaser,
  IntroSection,
  JourneySection,
  ProblemsSection,
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
        {/* Real buyer worries and how PVS answers them */}
        <ProblemsSection />
        {/* Families (retail) vs boutiques & wholesale */}
        <AudienceSection />
        {/* Founder journey teaser (unconfirmed facts hidden in production) */}
        <FounderTeaser />
      </div>
    </>
  );
}
