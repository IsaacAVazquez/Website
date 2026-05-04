import { fireEvent, render, screen, within } from "@testing-library/react";

jest.mock("@/components/StructuredData", () => ({
  StructuredData: () => null,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const mockPmWorkflowsPosts = [
  {
    slug: "lead-workflow-essay",
    title: "Lead Workflow Essay",
    excerpt: "A PM workflow piece.",
    publishedAt: "2026-04-10",
    category: "Product Management",
    tags: ["PM", "Workflow"],
    featured: false,
    readingTime: "4 min read",
    wordCount: 800,
    author: "Isaac Vazquez",
    coverImage: "/writing/lead-workflow-essay/opengraph-image",
    cluster: "PM Workflows" as const,
  },
];

const mockAgenticAiPosts = [
  {
    slug: "lead-agentic-essay",
    title: "Lead Agentic Essay",
    excerpt: "An agentic AI piece.",
    publishedAt: "2026-04-09",
    category: "Agentic AI",
    tags: ["AI", "Agents"],
    featured: false,
    readingTime: "5 min read",
    wordCount: 900,
    author: "Isaac Vazquez",
    coverImage: "/writing/lead-agentic-essay/opengraph-image",
    cluster: "Agentic AI" as const,
  },
];

const mockFintechPosts = [
  {
    slug: "lead-fintech-essay",
    title: "Lead Fintech Essay",
    excerpt: "A fintech product piece.",
    publishedAt: "2026-04-08",
    category: "Fintech Product",
    tags: ["Fintech", "Pricing"],
    featured: false,
    readingTime: "6 min read",
    wordCount: 1100,
    author: "Isaac Vazquez",
    coverImage: "/writing/lead-fintech-essay/opengraph-image",
    cluster: "Fintech Product & Pricing" as const,
  },
];

const mockSystemsPosts = [
  {
    slug: "lead-systems-essay",
    title: "Lead Systems Essay",
    excerpt: "A systems and quality piece.",
    publishedAt: "2026-04-07",
    category: "Systems Design",
    tags: ["Systems", "Quality"],
    featured: false,
    readingTime: "7 min read",
    wordCount: 1200,
    author: "Isaac Vazquez",
    coverImage: "/writing/lead-systems-essay/opengraph-image",
    cluster: "Systems & Quality" as const,
  },
];

const mockArchiveByBucket = {
  "Sports & Fantasy": [
    {
      slug: "sports-archive-essay",
      title: "Sports Archive Essay",
      excerpt: "A sports archive piece.",
      publishedAt: "2026-03-17",
      category: "Sports Analytics",
      tags: ["Sports"],
      featured: false,
      readingTime: "4 min read",
      wordCount: 700,
      author: "Isaac Vazquez",
      coverImage: "/writing/sports-archive-essay/opengraph-image",
      archiveBucket: "Sports & Fantasy" as const,
    },
  ],
  "Signals & Commentary": [
    {
      slug: "weekly-tech-note",
      title: "Weekly Tech Note",
      excerpt: "A weekly commentary piece.",
      publishedAt: "2026-04-06",
      category: "Technology",
      tags: ["Commentary"],
      featured: false,
      readingTime: "3 min read",
      wordCount: 600,
      author: "Isaac Vazquez",
      coverImage: "/writing/weekly-tech-note/opengraph-image",
      archiveBucket: "Signals & Commentary" as const,
    },
  ],
  "Space & Experiments": [
    {
      slug: "space-product-note",
      title: "Space Product Note",
      excerpt: "A space and experiments piece.",
      publishedAt: "2026-04-02",
      category: "Space Exploration",
      tags: ["Space"],
      featured: false,
      readingTime: "4 min read",
      wordCount: 650,
      author: "Isaac Vazquez",
      coverImage: "/writing/space-product-note/opengraph-image",
      archiveBucket: "Space & Experiments" as const,
    },
  ],
};

jest.mock("@/lib/blog", () => {
  const allPosts = [
    ...mockPmWorkflowsPosts,
    ...mockAgenticAiPosts,
    ...mockFintechPosts,
    ...mockSystemsPosts,
    ...mockArchiveByBucket["Sports & Fantasy"],
    ...mockArchiveByBucket["Signals & Commentary"],
    ...mockArchiveByBucket["Space & Experiments"],
  ];

  return {
    getAllBlogPostPreviews: jest.fn(() => allPosts),
    getCuratedBlogPostPreviewsByCluster: jest.fn(() => ({
      "PM Workflows": mockPmWorkflowsPosts,
      "Agentic AI": mockAgenticAiPosts,
      "Fintech Product & Pricing": mockFintechPosts,
      "Systems & Quality": mockSystemsPosts,
    })),
    getArchiveBlogPostPreviewsByBucket: jest.fn(() => mockArchiveByBucket),
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let WritingPage: any;

describe("WritingPage", () => {
  beforeAll(async () => {
    const mod = await import("../page");
    WritingPage = mod.default;
  });

  it("renders the archive controls with curated filters before archive buckets", () => {
    render(<WritingPage />);

    const filterTabs = within(
      screen.getByRole("tablist", { name: "Filter articles" })
    ).getAllByRole("tab");

    expect(filterTabs.map((tab) => tab.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      "All7",
      "PM Workflows1",
      "Agentic AI1",
      "Fintech Product & Pricing1",
      "Systems & Quality1",
      "Notes (short)5",
      "Essays (long)2",
      "Sports & Fantasy1",
      "Signals & Commentary1",
      "Space & Experiments1",
    ]);
  });

  it("keeps curated and archive-only posts separated by the active filter", () => {
    render(<WritingPage />);

    const articleGrid = screen.getByRole("heading", { name: "All articles" }).closest("section");
    expect(articleGrid).not.toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: /PM Workflows/i }));

    expect(within(articleGrid as HTMLElement).getByText("Lead Workflow Essay")).toBeVisible();
    expect(within(articleGrid as HTMLElement).queryByText("Weekly Tech Note")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Signals & Commentary/i }));

    expect(within(articleGrid as HTMLElement).getByText("Weekly Tech Note")).toBeVisible();
    expect(within(articleGrid as HTMLElement).queryByText("Lead Workflow Essay")).not.toBeInTheDocument();
  });
});
