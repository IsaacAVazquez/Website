import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SOURCE_META } from "@/lib/news-pulse-sources";
import type { NewsArticle } from "@/lib/news-pulse-utils";
import { NewsPulseClient } from "../news-pulse-client";

let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
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
    mockFetch.mockReset();
  });

  it("renders the editorial shell with one visible h1 after feeds load", async () => {
    mockFetch.mockResolvedValue(makeOkResponse(baseResponse));

    const { container } = render(<NewsPulseClient />);

    expect(screen.getByRole("heading", { level: 1, name: "News Pulse" })).toBeVisible();
    expect(container.querySelectorAll("h1")).toHaveLength(1);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 3, name: sampleArticles[0].title }),
      ).toBeVisible(),
    );

    expect(screen.getByText(/What 6 newsrooms are leading with right now/i)).toBeVisible();
    // The dateline carries the pull and the outlet count that the readouts used to repeat.
    expect(screen.getByText("2 headlines from 2 of 6 outlets")).toBeVisible();
    expect(
      screen.getByRole("combobox", { name: /Source/i }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Headlines" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Tone and density" })).toBeVisible();
  });

  it("prints one front page with no view tabs", () => {
    mockFetch.mockResolvedValue(makeOkResponse(baseResponse));
    render(<NewsPulseClient />);
    // The Headlines, Coverage map, and Analysis tabs merged into sections in the 2026-10-12 redesign.
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.queryByRole("link", { name: "Jump to the desk" })).toBeNull();
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
      />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: sampleArticles[0].title }),
    ).toBeVisible();
    expect(screen.queryByText("Refreshing live feeds")).not.toBeInTheDocument();

    unmount();
  });

  it("keeps the source filter from an old view link and filters the headlines", async () => {
    currentSearchParams = new URLSearchParams("view=coverage&source=guardian");
    mockFetch.mockResolvedValue(makeOkResponse(baseResponse));

    render(<NewsPulseClient />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 3, name: sampleArticles[1].title }),
      ).toBeVisible(),
    );
    expect(
      screen.queryByRole("heading", { level: 3, name: sampleArticles[0].title }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Source/i })).toHaveValue("guardian");
  });

  it("writes the picked source to the address as a history entry, with no server navigation", async () => {
    const user = userEvent.setup();
    const pushState = jest.spyOn(window.history, "pushState").mockImplementation(() => undefined);
    mockFetch.mockResolvedValue(makeOkResponse(baseResponse));

    render(<NewsPulseClient />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 3, name: sampleArticles[0].title }),
      ).toBeVisible(),
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Source/i }),
      "guardian",
    );

    expect(pushState).toHaveBeenCalledWith(null, "", "/news-pulse?source=guardian");
    pushState.mockRestore();
  });

  it("shows the loading state before feeds resolve", () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(() => {
          return undefined;
        }),
    );

    const { unmount } = render(<NewsPulseClient />);

    expect(screen.getByRole("status")).toHaveTextContent("Refreshing live feeds");
    // The dateline counts the tracked outlets from the source list, not a hard-coded six.
    expect(screen.getByText("6 outlets tracked")).toBeInTheDocument();

    unmount();
  });

  it("surfaces partial feed issues without hiding the digest", async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse({
        ...baseResponse,
        errors: ["BBC: timeout"],
      }),
    );

    render(<NewsPulseClient />);

    await waitFor(() =>
      expect(screen.getByText(/Some feeds did not come through/i)).toBeVisible(),
    );

    expect(screen.getByText("BBC: timeout")).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 3, name: sampleArticles[0].title }),
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

    render(<NewsPulseClient />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /No usable headlines came through on this refresh/i,
      ),
    );

    expect(screen.queryByText(/No headlines match this filter/i)).not.toBeInTheDocument();
  });

  it("prints tone, length, and readability as one ruled table by outlet", async () => {
    mockFetch.mockResolvedValue(makeOkResponse(baseResponse));

    render(<NewsPulseClient />);

    const table = await screen.findByRole("table", { name: "Tone and density by outlet" });
    for (const name of ["Outlet", "Headlines", "Positive", "Neutral", "Negative", "Words per headline", "Readability"]) {
      expect(within(table).getByRole("columnheader", { name })).toBeInTheDocument();
    }
    expect(within(table).getByRole("rowheader", { name: SOURCE_META.atlantic.name })).toBeInTheDocument();
    expect(
      screen.getByText(/I read this as directional framing pressure, not article-level sentiment\./),
    ).toBeVisible();
  });

  it("draws each outlet's words-per-headline bar to scale against the longest", async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse({
        ...baseResponse,
        articles: [
          { ...sampleArticles[0], title: "one two three four five six seven eight nine ten" },
          { ...sampleArticles[1], title: "one two three four five" },
        ],
      }),
    );

    const { container } = render(<NewsPulseClient />);

    await screen.findByRole("table", { name: "Tone and density by outlet" });
    const bars = Array.from(container.querySelectorAll<HTMLElement>(".np-length-bar"));
    expect(bars.map((bar) => bar.style.width)).toEqual(["4rem", "2rem"]);
  });

  it("runs the other cross-outlet stories down the front page with their outlet counts", async () => {
    const floods: NewsArticle[] = [
      {
        title: "Coastal flood warnings widen as hurricane storm surge nears Gulf",
        link: "https://example.com/floods-npr",
        description: "Forecasters extend hurricane storm surge flood warnings along the Gulf coast.",
        pubDate: "2026-04-08T15:00:00.000Z",
        category: "Weather",
        source: "npr",
        sourceName: SOURCE_META.npr.name,
        sourceColor: SOURCE_META.npr.color,
      },
      {
        title: "Hurricane storm surge prompts wider Gulf coast flood warnings",
        link: "https://example.com/floods-nyt",
        description: "Gulf coast flood warnings widen as the hurricane storm surge nears.",
        pubDate: "2026-04-08T14:50:00.000Z",
        category: "Weather",
        source: "nyt",
        sourceName: SOURCE_META.nyt.name,
        sourceColor: SOURCE_META.nyt.color,
      },
    ];
    mockFetch.mockResolvedValue(
      makeOkResponse({
        articles: [...clusteredArticles, ...floods],
        fetchedAt: "2026-04-08T16:30:00.000Z",
        errors: [],
      }),
    );

    render(<NewsPulseClient />);

    const stories = await screen.findByRole("list", { name: "Story clusters" });
    const story = within(stories).getAllByRole("listitem")[0];
    expect(story).toHaveTextContent("2 headlines across 2 outlets. NYT 1 · NPR 1");
    const all = within(story).getByText("Show all 2 headlines").closest("details") as HTMLElement;
    expect(all).not.toHaveAttribute("open");
    for (const article of floods) {
      expect(within(all).getByRole("link", { name: article.title, hidden: true })).toHaveAttribute(
        "href",
        article.link,
      );
    }
  });

  it("prints the front page as a story card with its coverage one action away", async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse({
        articles: clusteredArticles,
        fetchedAt: "2026-04-08T16:30:00.000Z",
        errors: [],
      }),
    );

    render(<NewsPulseClient />);

    const summary = await screen.findByText("Show 3 headlines from 3 outlets");
    const outlets = summary.closest("details") as HTMLElement;
    expect(outlets).not.toHaveAttribute("open");
    expect(
      within(outlets).getByRole("link", { name: clusteredArticles[2].title, hidden: true }),
    ).toHaveAttribute("href", clusteredArticles[2].link);

    // The matrix's counts print as a list by topic where the table is hidden.
    const topics = within(
      screen.getByRole("list", { name: "Coverage by topic", hidden: true }),
    ).getAllByRole("listitem", { hidden: true });
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0]).toHaveTextContent(/\w+ \d+/);
  });
});
