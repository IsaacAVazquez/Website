import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { ModernHero } from "@/components/ModernHero";
import { SocialProofStrip } from "@/components/SocialProofStrip";
import { FeaturedWorkSection } from "@/components/FeaturedWorkSection";
import { ThinkingPreview } from "@/components/ThinkingPreview";
import { WritingPreview } from "@/components/WritingPreview";
import { ContactSection } from "@/components/ContactSection";

export const metadata: Metadata = constructMetadata();

export default function Home() {
  return (
    <main
      className="min-h-screen w-full scroll-smooth bg-[var(--surface-primary)]"
      id="main-content"
      aria-label="Isaac Vazquez - Product Manager Portfolio"
    >
      {/* Hero Section */}
      <header>
        <ModernHero />
      </header>

      {/* Social Proof - hidden for now */}
      {/* <SocialProofStrip /> */}

      {/* Featured Work */}
      <FeaturedWorkSection />

      {/* PM Thinking */}
      <ThinkingPreview />

      {/* Writing Preview */}
      <WritingPreview />

      {/* Contact Section */}
      <ContactSection />

      {/* Structured Data for SEO */}
      <StructuredData type="ProfilePage" />
    </main>
  );
}
