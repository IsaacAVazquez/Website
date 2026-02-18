import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { ModernHero } from "@/components/ModernHero";
import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";

export const metadata: Metadata = constructMetadata();

export default function Home() {
  return (
    <main
      className="min-h-screen w-full bg-neutral-50 dark:bg-[#1A0F0C] scroll-smooth"
      id="main-content"
      role="main"
      aria-label="Isaac Vazquez - Product Manager Portfolio"
    >
      {/* Hero Section */}
      <header>
        <ModernHero />
      </header>

      {/* About Section */}
      <AboutSection />

      {/* Contact Section */}
      <ContactSection />

      {/* Structured Data for SEO */}
      <StructuredData type="ProfilePage" />
    </main>
  );
}
