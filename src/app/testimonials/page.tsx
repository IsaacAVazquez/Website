import { Metadata } from 'next';
import { TestimonialsSection } from '@/components/testimonials/TestimonialsSection';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...constructMetadata({
    title: 'Client Testimonials - Isaac Vazquez',
    description: 'Read testimonials from clients and colleagues about Isaac Vazquez\'s QA engineering expertise, fantasy football analytics, and software development work in Austin, TX.',
    canonicalUrl: 'https://isaacavazquez.com/testimonials'
  }),
  robots: {
    index: false,
    follow: false
  }
};

export default function TestimonialsPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Client Testimonials - Isaac Vazquez',
    description: 'Testimonials from clients about Isaac Vazquez\'s QA engineering and analytics work',
    url: 'https://isaacavazquez.com/testimonials',
    mainEntity: {
      '@type': 'Person',
      name: 'Isaac Vazquez',
      jobTitle: 'QA Engineer',
      worksFor: {
        '@type': 'Organization',
        name: 'Freelance QA Engineering & Analytics'
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Austin',
        addressRegion: 'TX',
        addressCountry: 'US'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 5.0,
        reviewCount: 8,
        bestRating: 5,
        worstRating: 5
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="container mx-auto px-4 py-12">
          <TestimonialsSection
            title="Client Testimonials & Reviews"
            subtitle="Hear from clients, colleagues, and collaborators about working with Isaac on QA engineering, fantasy football analytics, and software development projects"
            category="all"
            variant="default"
            showFilters={true}
            maxItems={9}
            showStats={true}
          />
        </div>
      </main>
    </>
  );
}