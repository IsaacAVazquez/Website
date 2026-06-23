import React from "react";
import { render, screen } from "@testing-library/react";
import { SearchResults } from "../SearchResults";
import type { SearchResult } from "../SearchInterface";

// Render Link as a plain anchor so the component can be tested in isolation.
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const postResult: SearchResult = {
  id: "post-quantum",
  title: "Quantum Writing",
  excerpt: "An article excerpt about search.",
  url: "/writing/quantum-writing",
  type: "post",
  category: "Agentic AI",
  tags: ["AI"],
  publishedAt: "2026-06-01",
};

describe("SearchResults", () => {
  it("labels writing (post) results 'Writing' and renders the result", () => {
    render(
      <SearchResults
        query=""
        results={[postResult]}
        isLoading={false}
        hasSearched
        totalResults={1}
        searchTime={5}
      />
    );

    expect(screen.getByRole("heading", { name: /1 result found/i })).toBeVisible();
    // The type pill maps 'post' -> 'Writing' (it previously rendered 'Post').
    expect(screen.getByText("Writing")).toBeInTheDocument();
    expect(screen.getByText(/Quantum Writing/)).toBeInTheDocument();
  });

  it("shows a truncated 'Showing N of M' count and no 'Load more' button when capped", () => {
    render(
      <SearchResults
        query="ai"
        results={[postResult]}
        isLoading={false}
        hasSearched
        totalResults={5}
        searchTime={5}
      />
    );

    expect(
      screen.getByRole("heading", { name: /showing 1 of 5 results/i })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /load more/i })
    ).not.toBeInTheDocument();
  });

  it("renders the empty-results heading as an h2 (no h1 -> h3 skip)", () => {
    render(
      <SearchResults
        query="zzz-no-match"
        results={[]}
        isLoading={false}
        hasSearched
        totalResults={0}
        searchTime={5}
      />
    );

    const heading = screen.getByRole("heading", { name: /no results found/i });
    expect(heading.tagName).toBe("H2");
  });
});
