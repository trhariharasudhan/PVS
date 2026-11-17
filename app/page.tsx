import React from "react";
import { HeroExperience } from "@/components/home/hero3d/HeroExperience";
import { BrandIntro } from "@/components/home/BrandIntro";
import { GrandeurCollections } from "@/components/home/GrandeurCollections";
import { FeaturedCollections } from "@/components/home/FeaturedCollections";
import { WholesaleTeaser } from "@/components/home/WholesaleTeaser";
import { ProcessPreview } from "@/components/home/ProcessPreview";
import { AboutPreview } from "@/components/home/AboutPreview";
import { LocationSection } from "@/components/home/LocationSection";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      {/* 1. Hero: cinematic 3D scroll story (loom → saree → PVS bag), static fallback built in */}
      <HeroExperience />

      <div id="after-hero" className="scroll-mt-20">

      {/* 2. Brand Introduction: PVS — Where Tradition Meets Craft */}
      <BrandIntro />

      {/* 3. Collections: Explore Our Collections */}
      <GrandeurCollections />

      {/* 4. Featured Products: Featured Sarees */}
      <FeaturedCollections />

      {/* 5. Wholesale Section: Built for Wholesale */}
      <WholesaleTeaser />

      {/* 6. Manufacturing Story: From Thread to Saree */}
      <ProcessPreview />

      {/* 7. About Preview: The Story Behind PVS (Sathish Kumar) */}
      <AboutPreview />

      {/* 8. Location: Visit Our Manufacturing Unit (Panjakalipatti, Kalipatti) */}
      <LocationSection />

      {/* 9. Final CTA: Looking for Pattu Sarees? */}
      <FinalCTA />
      </div>
    </>
  );
}
