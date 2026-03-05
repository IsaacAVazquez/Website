import { StructuredData } from "@/components/StructuredData";
import { ModernHero } from "@/components/ModernHero";
import { FeaturedWorkSection } from "@/components/FeaturedWorkSection";
import { ThinkingPreview } from "@/components/ThinkingPreview";
import { ContactSection } from "@/components/ContactSection";

export { metadata } from "./metadata";

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

      {/* Featured Work */}
      <FeaturedWorkSection />

      {/* PM Thinking */}
      <ThinkingPreview />

      {/* Contact Section */}
      <ContactSection />

      {/* Structured Data for SEO */}
      <StructuredData type="ProfilePage" />
    </main>
  );
}
