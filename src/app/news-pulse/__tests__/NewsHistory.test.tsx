import { fireEvent, render, screen, within } from "@testing-library/react";
import { NewsHistory } from "../NewsHistory";
import { NEWS_LAST_VISIT_KEY, observeNews } from "@/lib/newsHistory";
import type { NewsArticle } from "@/lib/news-pulse-utils";

it("compares with the previous visit while retaining the baseline through a refresh", () => {
  localStorage.clear();
  localStorage.setItem(NEWS_LAST_VISIT_KEY, "2026-10-23T09:30:00Z");
  const article: NewsArticle = { source: "bbc", sourceName: "BBC", sourceColor: "", title: "Historic bridge opens in London", link: "https://example.org/bridge", description: "", pubDate: "", category: "" };
  const initial = observeNews([], [article], "2026-10-23T09:00:00Z");
  const history = observeNews(initial, [{ ...article, title: "Historic bridge opens in London today" }], "2026-10-23T10:00:00Z");
  const { rerender } = render(<NewsHistory history={history} fetchedAt="2026-10-23T10:00:00Z" />);
  expect(screen.getByLabelText("Changes since last visit (1)")).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Changes since last visit (1)"));
  fireEvent.click(screen.getByText("Historic bridge opens in London today", { selector: "summary span" }));
  const changes = screen.getByRole("list", { name: "Observed headline changes" });
  expect(within(changes).getByText(/Historic bridge opens in London$/)).toBeInTheDocument();
  expect(localStorage.getItem(NEWS_LAST_VISIT_KEY)).toBe("2026-10-23T10:00:00Z");
  rerender(<NewsHistory history={history} fetchedAt="2026-10-23T10:05:00Z" />);
  expect(screen.getByLabelText("Changes since last visit (1)")).toBeInTheDocument();
});
