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
  "Agentic AI",
  "Fantasy football rankings",
  "Investment research",
];

const indexedContent = [
  "Curated PM and AI writing",
  "Fintech and analytics tools",
  "Case studies, resume, and contact",
];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type, category } = await searchParams;

  return (
    <>
      <section className="c97-band" data-c97-surface="paper" aria-label="Search">
        <div className="c97-shell">
          <p className="c97-kicker">Search · Portfolio, writing, tools</p>
          <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-2)" }}>
            Search my portfolio, writing, and tools.
          </h1>
          <p className="c97-lead" style={{ marginTop: "var(--c97-sp-3)" }}>
            This is a lightweight search layer for core case studies, writing, and tools. It is useful for navigation, not a full site index.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--c97-sp-1)",
              marginTop: "var(--c97-sp-3)",
            }}
          >
            {topicPills.map((topic) => (
              <span key={topic} className="c97-chip">
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div className="c97-shell c97-columns">
          <div className="c97-panel">
            <p className="c97-kicker">Popular queries</p>
            <ul className="c97-list" style={{ marginTop: "var(--c97-sp-2)" }}>
              {popularQueries.map((query) => (
                <li key={query}>{query}</li>
              ))}
            </ul>
          </div>
          <div className="c97-panel">
            <p className="c97-kicker">Indexed content</p>
            <ul className="c97-list" style={{ marginTop: "var(--c97-sp-2)" }}>
              {indexedContent.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div className="c97-shell">
          <SearchInterfaceClient
            initialQuery={q}
            initialType={type}
            initialCategory={category}
          />
        </div>
      </section>
    </>
  );
}
