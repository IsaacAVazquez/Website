import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { SOURCE_META } from "@/lib/news-pulse-sources";
import type { NewsArticle } from "@/lib/news-pulse-utils";
import { NewsPulseClient } from "../news-pulse-client";
import { DEFAULT_NEWS_PULSE_STATE } from "../news-pulse-state";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Never resolves, so the client-side refresh effect can't repaint mid-test
// and mask the hydration pass we're actually checking.
global.fetch = jest.fn(() => new Promise(() => undefined)) as unknown as typeof fetch;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const article: NewsArticle = {
  title: "Central banks brace for a new inflation test",
  link: "https://example.com/central-banks",
  description: "Policymakers are watching energy prices and labor data for fresh pressure.",
  pubDate: "2026-04-08T16:29:00.000Z",
  category: "Economy",
  source: "atlantic",
  sourceName: SOURCE_META.atlantic.name,
  sourceColor: SOURCE_META.atlantic.color,
};

function makeElement() {
  return (
    <NewsPulseClient
      initialFeed={{
        articles: [article],
        fetchedAt: "2026-04-08T16:30:00.000Z",
        errors: [],
        dataStatus: "fresh",
      }}
      initialState={DEFAULT_NEWS_PULSE_STATE}
    />
  );
}

describe("NewsPulseClient hydration", () => {
  it("hydrates the relative-age text across a minute boundary without a mismatch", async () => {
    // Server render happens at :00. Client hydration happens a minute later,
    // the same gap that produced the intermittent "14m ago" vs "13m ago"
    // mismatch (timeAgo() used to read Date.now() during render on both
    // sides instead of going through useClientNow()).
    const serverNow = new Date("2026-04-08T16:30:00.000Z").getTime();
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(serverNow);

    const html = renderToString(makeElement());
    // Old code (git show origin/main:src/app/news-pulse/news-pulse-client.tsx)
    // called Date.now() straight from timeAgo() during render, so this server
    // HTML would have baked in "1m ago" (serverNow minus the article's pubDate).

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    nowSpy.mockReturnValue(serverNow + 60_000);
    // With the old code, hydration's first render would recompute timeAgo()
    // with the advanced clock and get "2m ago", a text mismatch the old code
    // only suppressed with suppressHydrationWarning rather than fixed. The
    // fix threads useClientNow() through instead: useSyncExternalStore's
    // first client render reuses the server snapshot (null), so both sides
    // render the same pinned absolute time until the minute-tick effect
    // resolves "now" client-side, after hydration has already settled.

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const recoverable: unknown[] = [];

    await act(async () => {
      hydrateRoot(container, makeElement(), {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });

    expect(recoverable).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
    nowSpy.mockRestore();
    container.remove();
  });
});
