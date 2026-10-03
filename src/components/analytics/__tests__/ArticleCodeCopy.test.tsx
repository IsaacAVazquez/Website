import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { trackCodeCopy } from "@/lib/analytics";
import { ArticleCodeCopy } from "../ArticleCodeCopy";

jest.mock("@/lib/analytics", () => ({ trackCodeCopy: jest.fn() }));

const writeText = jest.fn<Promise<void>, [string]>();

function mountArticle(html: string) {
  const article = document.createElement("div");
  article.className = "article-body";
  article.innerHTML = html;
  document.body.appendChild(article);
  return article;
}

beforeAll(() => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
});

beforeEach(() => {
  jest.useFakeTimers();
  writeText.mockReset();
  (trackCodeCopy as jest.Mock).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  document.body.innerHTML = "";
});

describe("ArticleCodeCopy", () => {
  it("adds one copy button per code block and anchors it to a static block", () => {
    const article = mountArticle(
      '<pre><code class="language-ts">const a = 1;</code></pre><p>text</p><pre class="sticky">plain block</pre>',
    );
    // jsdom computes no layout, so stand in the positions a browser would report.
    const realGetComputedStyle = window.getComputedStyle;
    const spy = jest
      .spyOn(window, "getComputedStyle")
      .mockImplementation((el) =>
        ({ ...realGetComputedStyle(el), position: (el as HTMLElement).classList.contains("sticky") ? "sticky" : "static" }) as CSSStyleDeclaration,
      );
    render(<ArticleCodeCopy containerSelector=".article-body" />);
    spy.mockRestore();
    expect(within(article).getAllByRole("button", { name: "Copy code" })).toHaveLength(2);
    const [first, second] = Array.from(article.querySelectorAll("pre"));
    expect(first.style.position).toBe("relative");
    expect(second.style.position).toBe("");
    expect(first.style.paddingTop).toBe("var(--c97-sp-6)");
  });

  it("copies the code, announces it, records the event, and resets", async () => {
    writeText.mockResolvedValue(undefined);
    const article = mountArticle(
      '<pre><code class="language-ts">one</code></pre><pre><code class="language-python">print("hi")</code></pre>',
    );
    render(<ArticleCodeCopy containerSelector=".article-body" location="writing" />);
    const second = within(article).getAllByRole("button", { name: "Copy code" })[1];

    await act(async () => {
      fireEvent.click(second);
    });
    expect(writeText).toHaveBeenCalledWith('print("hi")');
    expect(second).toHaveTextContent("Copied");
    const status = within(second.parentElement as HTMLElement).getByRole("status");
    expect(status).toHaveTextContent("Code copied to clipboard");
    expect(trackCodeCopy).toHaveBeenCalledWith({
      code_location: "writing",
      code_language: "python",
      snippet_id: "block-2",
      char_count: 11,
    });

    act(() => {
      jest.advanceTimersByTime(1600);
    });
    expect(second).toHaveTextContent("Copy code");
    expect(status).toHaveTextContent("");
  });

  it("says the copy failed and still records the attempt", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const article = mountArticle("<pre>no code element here</pre>");
    render(<ArticleCodeCopy containerSelector=".article-body" />);
    const button = within(article).getByRole("button", { name: "Copy code" });

    await act(async () => {
      fireEvent.click(button);
    });
    expect(button).toHaveTextContent("Copy failed");
    expect(within(article).getByRole("status")).toHaveTextContent(
      "Could not copy the code. Select it and copy it by hand.",
    );
    expect(trackCodeCopy).toHaveBeenCalledWith(
      expect.objectContaining({ code_location: "article", code_language: undefined, snippet_id: "block-1" }),
    );

    act(() => {
      jest.advanceTimersByTime(1600);
    });
    expect(button).toHaveTextContent("Copy code");
  });

  it("removes its buttons and restores the block on unmount", () => {
    const article = mountArticle('<pre style="padding-top: 4px"><code>x</code></pre>');
    const { unmount } = render(<ArticleCodeCopy containerSelector=".article-body" />);
    const pre = article.querySelector("pre") as HTMLElement;
    expect(pre.dataset.copyEnhanced).toBe("true");
    unmount();
    expect(within(article).queryByRole("button")).not.toBeInTheDocument();
    expect(within(article).queryByRole("status")).not.toBeInTheDocument();
    expect(pre.style.paddingTop).toBe("4px");
    expect(pre.dataset.copyEnhanced).toBeUndefined();
  });

  it("does not add a second button to a block that already has one", () => {
    const article = mountArticle("<pre><code>x</code></pre>");
    render(<ArticleCodeCopy containerSelector=".article-body" />);
    render(<ArticleCodeCopy containerSelector=".article-body" location="other" />);
    expect(within(article).getAllByRole("button")).toHaveLength(1);
  });

  it("does nothing without a container or code blocks", () => {
    mountArticle("<p>No code</p>");
    render(<ArticleCodeCopy containerSelector=".article-body" />);
    render(<ArticleCodeCopy containerSelector=".missing" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
