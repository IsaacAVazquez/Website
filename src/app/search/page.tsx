import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { SearchInterface } from "@/components/search/SearchInterface";

export const metadata: Metadata = constructMetadata({
  title: "Search - Find Content Across the Site",
  description: "Search through blog posts, projects, and documentation. Find QA engineering insights, fantasy football analytics, and software development resources.",
  canonicalUrl: "https://isaacavazquez.com/search",
});

interface SearchPageProps {
  searchParams: {
    q?: string;
    type?: string;
    category?: string;
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type, category } = searchParams;

  return (
    <div className="min-h-screen py-12 md:py-20 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0A0A0B] dark:via-[#0F172A] dark:to-[#1E293B]">
      <div className="max-w-4xl mx-auto px-6">
        <SearchInterface 
          initialQuery={q}
          initialType={type}
          initialCategory={category}
        />
      </div>
    </div>
  );
}