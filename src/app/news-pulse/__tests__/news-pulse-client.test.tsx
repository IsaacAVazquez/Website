import type { HTMLAttributes } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    sourceName: "The Atlantic",
    sourceColor: "#B22234",
  },
  {
    title: "Technology exports keep reshaping regional politics",
    link: "https://example.com/technology-exports",
    description: "Trade officials are navigating a more openly strategic technology market.",
    pubDate: "2026-04-08T15:30:00.000Z",
    category: "World",
    source: "guardian",
    sourceName: "The Guardian",
    sourceColor: "#052962",
  },
];

const baseResponse = {
  articles: sampleArticles,
  fetchedAt: "2026-04-08T16:30:00.000Z",
  errors: [] as string[],
};

describe("NewsPulseClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockFetch.mockReset();
  });

  it("renders the editorial shell with one visible h1 after feeds load", async () => {
    mockFetch.mockResolvedValue({
      json: async () => baseResponse,
    });

    const { container } = render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    expect(screen.getByRole("heading", { level: 1, name: "News Pulse" })).toBeVisible();
    expect(container.querySelectorAll("h1")).toHaveLength(1);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 2, name: sampleArticles[0].title })
      ).toBeVisible()
    );

    expect(screen.getByText(/I built News Pulse to get a fast read/i)).toBeVisible();
    expect(screen.getByText("6 outlets tracked")).toBeVisible();
    expect(
      screen.getByRole("button", { name: /Source selector: All Sources/i })
    ).toBeVisible();
    expect(screen.queryByText(/The coverage map shows me/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Start broad, then narrow/i)).not.toBeInTheDocument();
  });

  it("keeps tab navigation shareable with scroll disabled", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      json: async () => baseResponse,
    });

    render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 2, name: sampleArticles[0].title })
      ).toBeVisible()
    );

    await user.click(screen.getByRole("tab", { name: "Coverage Map" }));

    expect(mockPush).toHaveBeenCalledWith("/news-pulse?view=coverage", {
      scroll: false,
    });
  });

  it("only shows the source dropdown on the headlines view", async () => {
    currentSearchParams = new URLSearchParams("view=coverage");
    mockFetch.mockResolvedValue({
      json: async () => baseResponse,
    });

    render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Coverage Map" })).toHaveAttribute(
        "aria-selected",
        "true"
      )
    );

    expect(
      screen.queryByRole("button", { name: /Source selector:/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/The coverage map shows me/i)).not.toBeInTheDocument();
  });

  it("updates the route when a source is selected from the dropdown", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      json: async () => baseResponse,
    });

    render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 2, name: sampleArticles[0].title })
      ).toBeVisible()
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
        })
    );

    const { unmount } = render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    expect(screen.getByRole("status")).toHaveTextContent("Refreshing live feeds");

    unmount();
  });

  it("surfaces partial feed issues without hiding the digest", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        ...baseResponse,
        errors: ["BBC: timeout"],
      }),
    });

    render(<NewsPulseClient initialState={DEFAULT_NEWS_PULSE_STATE} />);

    await waitFor(() =>
      expect(screen.getByText(/Some feeds did not come through/i)).toBeVisible()
    );

    expect(screen.getByText("BBC: timeout")).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 2, name: sampleArticles[0].title })
    ).toBeVisible();
  });
});
