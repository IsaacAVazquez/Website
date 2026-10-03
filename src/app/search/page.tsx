import { Metadata } from "next";
import Link from "next/link";
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

// Each chip runs that search. The popular queries that used to sit in their
// own panel joined this row, and the coverage list lives once, in the search
// tips under the field.
const topicSearches = [
  "PM workflows",
  "Agentic AI",
  "Fintech tools",
  "Quality systems",
  "Career",
  "Fantasy football rankings",
  "Investment research",
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
          <p className="c97-lead" style={{ marginTop: "var(--c97-sp-3)", maxWidth: "var(--c97-measure-wide)" }}>
            This is a lightweight search layer for core case studies, writing, and tools. It is useful for navigation, not a full site index.
          </p>
          <p className="c97-kicker" id="search-topics-label" style={{ marginTop: "var(--c97-sp-3)" }}>
            Try a topic
          </p>
          <ul
            aria-labelledby="search-topics-label"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--c97-sp-1)",
              marginTop: "var(--c97-sp-1)",
              listStyle: "none",
              padding: 0,
            }}
          >
            {topicSearches.map((topic) => (
              <li key={topic}>
                {/* A prefetch of this dynamic page streams and never closes, so the page never went idle. */}
                <Link
                  href={`/search?q=${encodeURIComponent(topic)}`}
                  prefetch={false}
                  className="c97-chip c97-link"
                  style={{ minHeight: 44 }}
                >
                  {topic}
                </Link>
              </li>
            ))}
          </ul>
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
