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
    // A September date, since that is the month engines abbreviate differently.
    publishedAt: "2026-09-25",
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

    const filterButtons = within(
      screen.getByRole("group", { name: "Filter articles" })
    ).getAllByRole("button");

    expect(
      filterButtons.map((button) =>
        button.textContent?.replace(/\s+/g, " ").trim(),
      ),
    ).toEqual([
      "All7",
      "PM Workflows1",
      "Agentic AI1",
      "Fintech Product & Pricing1",
      "Systems & Quality1",
      "Sports & Fantasy1",
      "Signals & Commentary1",
      "Space & Experiments1",
    ]);
    expect(filterButtons[0]).toHaveAttribute("aria-pressed", "true");
    expect(
      filterButtons.slice(1).map((button) => button.getAttribute("aria-pressed")),
    ).toEqual(Array(filterButtons.length - 1).fill("false"));
  });

  // This component renders on the server and again in the browser. Node prints
  // an en-GB September as "Sept" and WebKit on macOS prints "Sep", so a dateline
  // that skips `sep` fails hydration there for as long as September is featured.
  it("dates the featured pair with Sep, whichever way the engine spelled it", () => {
    render(<WritingPage />);

    expect(screen.getByText("Featured · 25 Sep 2026")).toBeInTheDocument();
    expect(screen.getByText("Featured · 9 Apr 2026")).toBeInTheDocument();
  });

  it("keeps curated and archive-only posts separated by the active filter", () => {
    render(<WritingPage />);

    // The featured pair only renders on the default view, so once a filter,
    // search, or sort is on, every match is an archive row (an h3).
    const filterControls = within(
      screen.getByRole("group", { name: "Filter articles" }),
    );

    fireEvent.click(filterControls.getByRole("button", { name: /PM Workflows/i }));

    expect(
      screen.getByRole("heading", { level: 3, name: "Lead Workflow Essay" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Weekly Tech Note" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Weekly Tech Note" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      filterControls.getByRole("button", { name: /Signals & Commentary/i }),
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Weekly Tech Note" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Lead Workflow Essay" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Lead Workflow Essay" }),
    ).not.toBeInTheDocument();
  });

  // Length used to be two more buttons in the topic row, which mixed two axes.
  it("filters by length from its own control, on top of the topic filter", () => {
    render(<WritingPage />);
    const length = screen.getByRole("combobox", { name: "Length" });

    expect(
      within(length).getAllByRole("option").map((option) => option.textContent),
    ).toEqual([
      "Any length",
      "Notes, five minutes or under (5)",
      "Essays, over five minutes (2)",
    ]);

    fireEvent.change(length, { target: { value: "essays" } });
    const essays = screen.getAllByRole("heading", { level: 3 }).length;
    fireEvent.change(length, { target: { value: "notes" } });
    const notes = screen.getAllByRole("heading", { level: 3 }).length;

    // The mocked index holds seven posts, and every one is a note or an essay.
    expect(essays).toBeGreaterThan(0);
    expect(notes).toBeGreaterThan(0);
    expect(essays + notes).toBe(7);
    // A length filter is not the default view, so the featured pair is gone.
    expect(screen.queryByText(/^Featured · /)).not.toBeInTheDocument();
  });

  it("puts the featured pair ahead of the filters", () => {
    render(<WritingPage />);

    const featured = screen.getByText("Featured · 25 Sep 2026");
    const search = screen.getByRole("searchbox", { name: "Search writing" });

    expect(
      featured.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("searches and sorts the archive while keeping canonical topic links", () => {
    render(<WritingPage />);

    const search = screen.getByRole("searchbox", { name: "Search writing" });
    fireEvent.change(search, { target: { value: "weekly commentary" } });

    expect(
      screen.getByRole("heading", { level: 3, name: "Weekly Tech Note" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Lead Workflow Essay" }),
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Sort writing" }), {
      target: { value: "longest" },
    });

    expect(
      screen.getByRole("heading", { level: 3, name: "Lead Systems Essay" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "PM Workflows" }),
    ).toHaveAttribute("href", "/writing/topics/pm-workflows");
    expect(
      screen.getByRole("link", { name: "Sports & Fantasy" }),
    ).toHaveAttribute("href", "/writing/topics/sports-fantasy");
  });
});
