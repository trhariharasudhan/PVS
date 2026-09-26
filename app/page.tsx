import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { HeritageTrustStrip } from "@/components/home/HeritageTrustStrip";
import { BrandIntro } from "@/components/home/BrandIntro";
import { GrandeurCollections } from "@/components/home/GrandeurCollections";
import { LoomShowcase } from "@/components/home/LoomShowcase";
import { ProcessPreview } from "@/components/home/ProcessPreview";
import { FeaturedCollections } from "@/components/home/FeaturedCollections";
import { EditorialShowcase } from "@/components/home/EditorialShowcase";
import { QualityPhilosophy } from "@/components/home/QualityPhilosophy";
import { WholesaleTeaser } from "@/components/home/WholesaleTeaser";
import { InstagramFeed } from "@/components/home/InstagramFeed";

export default function HomePage() {
  return (
    <>
      {/* 1. Cinematic Hero Section */}
      <HeroSection />

      {/* 2. Heritage Trust Strip */}
      <HeritageTrustStrip />

      {/* 3. Brand Introduction & Heritage Statement */}
      <BrandIntro />

      {/* 4. The Grandeur of South Indian Silk (4 Iconic Collections) */}
      <GrandeurCollections />

      {/* 5. The Loom & Manufacturing Story (From Loom to Legacy) */}
      <LoomShowcase />

      {/* 6. Saree Craft Journey (7 Stages) */}
      <ProcessPreview />

      {/* 7. Featured Saree Catalogue Grid */}
      <FeaturedCollections />

      {/* 8. The Art of the Drape (Editorial Showcase) */}
      <EditorialShowcase />

      {/* 9. Quality Philosophy (We do not simply weave sarees. We preserve a tradition.) */}
      <QualityPhilosophy />

      {/* 10. B2B Wholesale Trade Partnership (For Those Who Carry the Tradition Forward) */}
      <WholesaleTeaser />

      {/* 11. Follow The Weaving Journey (Instagram Feed) */}
      <InstagramFeed />
    </>
  );
}
