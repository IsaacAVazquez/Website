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
    <div className="min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#FFFCF7] dark:bg-gradient-to-br dark:from-[#1C1410] dark:via-[#2D1B12] dark:to-[#1C1410]">
      <div className="max-w-4xl mx-auto">
        <SearchInterface 
          initialQuery={q}
          initialType={type}
          initialCategory={category}
        />
      </div>
    </div>
  );
}