import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { SearchInterfaceClient } from "@/components/search/SearchInterface.client";

export const metadata: Metadata = constructMetadata({
  title: "Search",
  description: "Search across case studies, writing, and tools covering product strategy, QA engineering, fantasy football analytics, and fintech tooling.",
  canonicalUrl: "/search",
  dateModified: "2025-02-05",
  noIndex: true,
});

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
  }>;
}

const topicPills = [
  "PM workflows",
  "Agentic AI",
  "Fintech tools",
  "Quality systems",
  "Career",
];

const popularQueries = [
  '"Agentic AI for product managers"',
  '"Investment research platform"',
  '"Writing better PRDs with AI"',
];

const indexedContent = [
  "Curated PM and AI writing",
  "Fintech and analytics tools",
  "Case studies, resume, and contact",
];

const sectionTitleStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
} as const;

const bodyStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink-muted)",
} as const;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type, category } = await searchParams;

  return (
    <section className="home-page home-section min-h-screen" aria-label="Search">
      <div className="home-shell home-shell-tight space-y-10">
        <header className="space-y-4">
          <p className="home-kicker mb-0">Search · Portfolio, writing, tools</p>
          <h1
            className="mb-0"
            style={{
              fontFamily: "var(--font-home-sans)",
              fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
              fontWeight: 600,
              lineHeight: 0.95,
              letterSpacing: "-0.06em",
              color: "var(--home-ink)",
            }}
          >
            Search my portfolio, writing, and tools.
          </h1>
          <p className="home-body max-w-[52rem]">
            This is a lightweight search layer for core case studies, writing, and tools. It is useful for navigation, not a comprehensive site index.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {topicPills.map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
                  color: "var(--home-ink)",
                  border: "1px solid var(--home-rule)",
                  letterSpacing: "0.02em",
                }}
              >
                {topic}
              </span>
            ))}
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="home-card p-6 sm:p-7 space-y-3">
            <p className="home-kicker mb-0">Popular queries</p>
            <ul className="mb-0 space-y-1.5 text-sm leading-6" style={bodyStyle}>
              {popularQueries.map((query) => (
                <li key={query}>• {query}</li>
              ))}
            </ul>
          </article>
          <article className="home-card p-6 sm:p-7 space-y-3">
            <p className="home-kicker mb-0">Indexed content</p>
            <ul className="mb-0 space-y-1.5 text-sm leading-6" style={bodyStyle}>
              {indexedContent.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        </div>

        <SearchInterfaceClient
          initialQuery={q}
          initialType={type}
          initialCategory={category}
        />
      </div>
    </section>
  );
}
