import { fireEvent, render, screen } from "@testing-library/react";
import { ArticleEndMark, describeTimeOnPage } from "@/components/editorial/ArticleEndMark";

describe("describeTimeOnPage", () => {
  it.each([
    [20_000, "under a minute"],
    [60_000, "about a minute"],
    [4.6 * 60_000, "about 5 minutes"],
    [60 * 60_000, "about an hour"],
    [150 * 60_000, "about 3 hours"],
  ])("reads %i ms as %s", (ms, text) => {
    expect(describeTimeOnPage(ms)).toBe(text);
  });
});

describe("ArticleEndMark", () => {
  it("prints the mark, and opens the note with the next post on a press", () => {
    jest.spyOn(performance, "now").mockReturnValue(3 * 60_000);
    render(<ArticleEndMark next={{ href: "/writing/next-one", title: "The next one" }} />);

    const mark = screen.getByRole("button", { name: "What the end mark means" });
    expect(mark).toHaveTextContent("‑30‑");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    fireEvent.click(mark);
    expect(screen.getByRole("status")).toHaveTextContent("about 3 minutes after the page loaded");
    expect(screen.getByRole("link", { name: "The next one" })).toHaveAttribute("href", "/writing/next-one");

    fireEvent.click(screen.getByRole("button", { name: "Close the note on the end mark" }));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("says so when the post is the newest", () => {
    render(<ArticleEndMark next={null} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("status")).toHaveTextContent("nothing after it yet");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
