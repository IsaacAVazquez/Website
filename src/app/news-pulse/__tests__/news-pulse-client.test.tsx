import type { HTMLAttributes } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SOURCE_META } from "@/lib/news-pulse-sources";
import type { NewsArticle } from "@/lib/news-pulse-utils";
import { NewsPulseClient } from "../news-pulse-client";
import { DEFAULT_NEWS_PULSE_STATE } from "../news-pulse-state";

const mockPush = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const sampleArticles: NewsArticle[] = [
  {
    title: "Central banks brace for a new inflation test",
    link: "https://example.com/central-banks",
    description: "Policymakers are watching energy prices and labor data for fresh pressure.",
    pubDate: "2026-04-08T16:00:00.000Z",
    category: "Economy",
    source: "atlantic",
    sourceName: SOURCE_META.atlantic.name,
    sourceColor: SOURCE_META.atlantic.color,
  },
  {
    title: "Technology exports keep reshaping regional politics",
    link: "https://example.com/technology-exports",
    description: "Trade officials are navigating a more openly strategic technology market.",
    pubDate: "2026-04-08T15:30:00.000Z",
    category: "World",
    source: "guardian",
    sourceName: SOURCE_META.guardian.name,
    sourceColor: SOURCE_META.guardian.color,
  },
];

const clusteredArticles: NewsArticle[] = [
  {
    title: "Trump tariffs hit auto market as China tensions rise",
    link: "https://example.com/trump-tariffs-atlantic",
    description: "Automakers are weighing China exposure after the latest tariff move.",
    pubDate: "2026-04-08T16:20:00.000Z",
    category: "Business",
    source: "atlantic",
    sourceName: SOURCE_META.atlantic.name,
    sourceColor: SOURCE_META.atlantic.color,
  },
  {
    title: "China tariff tensions hit auto market after Trump move",
    link: "https://example.com/trump-tariffs-guardian",
    description: "Trade desks are watching automaker shares after Trump's tariff push.",
    pubDate: "2026-04-08T16:10:00.000Z",
    category: "Business",
    source: "guardian",
    sourceName: SOURCE_META.guardian.name,
    sourceColor: SOURCE_META.guardian.color,
  },
  {
    title: "Auto market rattled by Trump tariff tensions with China",
    link: "https://example.com/trump-tariffs-bbc",
    description: "Manufacturers face another round of China tariff pressure.",
    pubDate: "2026-04-08T16:05:00.000Z",
    category: "Business",
    source: "bbc",
    sourceName: SOURCE_META.bbc.name,
    sourceColor: SOURCE_META.bbc.color,
  },
];

const baseResponse = {
  articles: sampleArticles,
  fetchedAt: "2026-04-08T16:30:00.000Z",
  errors: [] as string[],
};

function makeOkResponse(payload: object) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  };
}

describe("NewsPulseClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockFetch.mockReset();
  });

  it("renders the editorial shell with one visible h1 after feeds load", async () => {
    mockFetch.mockResolvedValue(makeOkResponse(baseResponse));

    const { container } = render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    expect(screen.getByRole("heading", { level: 1, name: "News Pulse" })).toBeVisible();
    expect(container.querySelectorAll("h1")).toHaveLength(1);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 2, name: sampleArticles[0].title }),
      ).toBeVisible(),
    );

    expect(screen.getByText(/I built News Pulse to get a fast read/i)).toBeVisible();
    expect(screen.getByText("6 outlets tracked")).toBeVisible();
    expect(
      screen.getByRole("button", { name: /Source selector: All Sources/i }),
    ).toBeVisible();
    expect(screen.queryByText(/Story clusters across outlets/i)).not.toBeInTheDocument();
  });

  it("renders server-provided headlines before the browser refresh resolves", () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(() => {
          return undefined;
        }),
    );

    const { unmount } = render(
      <NewsPulseClient
        initialFeed={{
          ...baseResponse,
          dataStatus: "fresh",
        }}
        initialState={DEFAULT_NEWS_PULSE_STATE}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: sampleArticles[0].title }),
    ).toBeVisible();
    expect(screen.queryByText("Refreshing live feeds")).not.toBeInTheDocument();

    unmount();
  });

  it("clears a stale source filter when switching away from headlines", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams("source=guardian");
    mockFetch.mockResolvedValue(makeOkResponse(baseResponse));

    render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 2, name: sampleArticles[1].title }),
      ).toBeVisible(),
    );

    await user.click(screen.getByRole("tab", { name: "Coverage Map" }));

    expect(mockPush).toHaveBeenCalledWith("/news-pulse?view=coverage", {
      scroll: false,
    });
  });

  it("only shows the source dropdown on the headlines view", async () => {
    currentSearchParams = new URLSearchParams("view=coverage&source=guardian");
    mockFetch.mockResolvedValue(makeOkResponse(baseResponse));

    render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Coverage Map" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );

    expect(
      screen.queryByRole("button", { name: /Source selector:/i }),
    ).not.toBeInTheDocument();
  });

  it("ignores stale source params on deep-linked non-headline views", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams("view=analysis&source=guardian");
    mockFetch.mockResolvedValue(makeOkResponse(baseResponse));

    render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Analysis" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );

    await user.click(screen.getByRole("tab", { name: "Headlines" }));

    expect(mockPush).toHaveBeenCalledWith("/news-pulse", {
      scroll: false,
    });
  });

  it("updates the route when a source is selected from the dropdown", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(makeOkResponse(baseResponse));

    render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 2, name: sampleArticles[0].title }),
      ).toBeVisible(),
    );

    await user.click(screen.getByRole("button", { name: /Source selector: All Sources/i }));
    await user.click(screen.getByRole("menuitemradio", { name: "The Guardian" }));

    expect(mockPush).toHaveBeenCalledWith("/news-pulse?source=guardian", {
      scroll: false,
    });
  });

  it("shows the loading state before feeds resolve", () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(() => {
          return undefined;
        }),
    );

    const { unmount } = render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    expect(screen.getByRole("status")).toHaveTextContent("Refreshing live feeds");

    unmount();
  });

  it("surfaces partial feed issues without hiding the digest", async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse({
        ...baseResponse,
        errors: ["BBC: timeout"],
      }),
    );

    render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    await waitFor(() =>
      expect(screen.getByText(/Some feeds did not come through/i)).toBeVisible(),
    );

    expect(screen.getByText("BBC: timeout")).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 2, name: sampleArticles[0].title }),
    ).toBeVisible();
  });

  it("renders the route-level error state when the API reports a total outage", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        articles: [],
        fetchedAt: "2026-04-08T16:30:00.000Z",
        errors: ["BBC: timeout", "NPR: timeout"],
        message: "No usable headlines came through on this refresh.",
      }),
    });

    render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /No usable headlines came through on this refresh/i,
      ),
    );

    expect(screen.queryByText(/No headlines match this filter/i)).not.toBeInTheDocument();
  });

  it("renders story clusters on the coverage view", async () => {
    currentSearchParams = new URLSearchParams("view=coverage");
    mockFetch.mockResolvedValue(
      makeOkResponse({
        articles: clusteredArticles,
        fetchedAt: "2026-04-08T16:30:00.000Z",
        errors: [],
      }),
    );

    render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    await waitFor(() =>
      expect(screen.getByText("Story clusters across outlets")).toBeVisible(),
    );

    expect(screen.getByRole("columnheader", { name: "Story cluster" })).toBeVisible();
    expect(
      screen.getByRole("columnheader", { name: "Representative headline" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: clusteredArticles[0].title }),
    ).toBeVisible();
  });
});
