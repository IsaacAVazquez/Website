import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { SearchInterfaceClient } from "@/components/search/SearchInterface.client";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = constructMetadata({
  title: "Search - Find Content Across the Site",
  description: "Search through blog posts, projects, and documentation. Find QA engineering insights, fantasy football analytics, and software development resources.",
  canonicalUrl: "https://isaacavazquez.com/search",
  dateModified: "2025-02-05",
});

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type, category } = await searchParams;

  return (
    <div className="min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--surface-secondary)]">
      <div className="max-w-4xl mx-auto">
        <section className="mb-12 space-y-6 text-center">
          <Heading level={1} className="text-4xl md:text-5xl">
            Search my portfolio, writing, and tools
          </Heading>
          <Paragraph size="lg" className="text-[var(--text-secondary)]">
            This search covers every public case study, blog post, and fantasy football tool.
            Use it to surface product management experience, QA engineering playbooks, or data-driven content in seconds.
          </Paragraph>
          <div className="flex flex-wrap justify-center gap-3">
            {["Product Strategy", "QA Engineering", "Fantasy Football", "Career Playbooks", "AI & Analytics"].map((topic) => (
              <Badge key={topic} variant="electric">
                {topic}
              </Badge>
            ))}
          </div>
          <div className="grid gap-4 text-left md:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Popular queries</p>
              <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                <li>• "Product manager case studies"</li>
                <li>• "QA automation frameworks"</li>
                <li>• "Fantasy football tier lists"</li>
              </ul>
            </div>
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Indexed content</p>
              <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                <li>• 20+ product & QA articles</li>
                <li>• Live fantasy football tools</li>
                <li>• Contact, resume, and more</li>
              </ul>
            </div>
          </div>
        </section>
        <SearchInterfaceClient
          initialQuery={q}
          initialType={type}
          initialCategory={category}
        />
      </div>
    </div>
  );
}
