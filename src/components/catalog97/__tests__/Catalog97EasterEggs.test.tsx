import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Catalog97EasterEggs } from "@/components/catalog97/Catalog97EasterEggs";
import {
  KONAMI_SEQUENCE,
  isKonami,
  pushKonamiKey,
  shouldIgnoreKey,
} from "@/components/catalog97/konami";

function typeKeys(keys: readonly string[], history: string[] = []) {
  return keys.reduce((acc, key) => pushKonamiKey(acc, key), history);
}

function pressKonami() {
  act(() => {
    KONAMI_SEQUENCE.forEach((key) => fireEvent.keyDown(window, { key }));
  });
}

/** Hides or shows the tab, the way switching tabs does. */
function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

/** The page root the toast portals into, and a footer with the wordmark. */
function renderOnPage() {
  const page = document.createElement("div");
  page.className = "c97-page";
  page.innerHTML =
    '<footer class="c97-footer"><div class="c97-footer-colophon"><svg class="c97-wordmark"></svg></div></footer>';
  document.body.appendChild(page);
  const view = render(<Catalog97EasterEggs />, { container: page.appendChild(document.createElement("div")) });
  return { page, view };
}

describe("Konami matcher", () => {
  it("matches the full sequence, with B and A in either case", () => {
    expect(isKonami(typeKeys(KONAMI_SEQUENCE))).toBe(true);
    expect(isKonami(typeKeys([...KONAMI_SEQUENCE.slice(0, 8), "B", "A"]))).toBe(true);
  });

  it("matches after stray keys and an extra leading up arrow", () => {
    expect(isKonami(typeKeys(["x", "ArrowUp", ...KONAMI_SEQUENCE]))).toBe(true);
  });

  it("rejects a partial or broken sequence", () => {
    expect(isKonami(typeKeys(KONAMI_SEQUENCE.slice(0, 9)))).toBe(false);
    expect(isKonami(typeKeys([...KONAMI_SEQUENCE.slice(0, 9), "x"]))).toBe(false);
    expect(isKonami(typeKeys([...KONAMI_SEQUENCE.slice(0, 5), "x", ...KONAMI_SEQUENCE.slice(5)]))).toBe(false);
  });

  it("ignores typing in fields and modifier combos", () => {
    const input = document.createElement("input");
    expect(shouldIgnoreKey({ target: input } as unknown as KeyboardEvent)).toBe(true);
    expect(shouldIgnoreKey({ target: document.body, ctrlKey: true } as unknown as KeyboardEvent)).toBe(true);
    expect(shouldIgnoreKey({ target: document.body } as unknown as KeyboardEvent)).toBe(false);
  });

  it("counts Shift, and skips auto-repeats and keys already handled", () => {
    const key = (init: Partial<KeyboardEvent>) =>
      shouldIgnoreKey({ target: document.body, ...init } as unknown as KeyboardEvent);
    expect(key({ shiftKey: true })).toBe(false);
    expect(key({ repeat: true })).toBe(true);
    expect(key({ defaultPrevented: true })).toBe(true);
    expect(key({ altKey: true })).toBe(true);
    expect(key({ metaKey: true })).toBe(true);
  });
});

describe("Catalog97EasterEggs", () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    log = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    log.mockRestore();
    cleanup();
    document.body.innerHTML = "";
  });

  it("logs the console note once, even under strict mode and a remount", () => {
    const { unmount } = render(
      <StrictMode>
        <Catalog97EasterEggs />
      </StrictMode>,
    );
    unmount();
    render(<Catalog97EasterEggs />);
    const notes = log.mock.calls.filter(([text]) => String(text).includes("Civitech"));
    expect(notes).toHaveLength(1);
    expect(notes[0][0]).toContain("https://github.com/IsaacAVazquez/Website");
  });

  it("throws the page out of register and offers the arcade", () => {
    renderOnPage();
    pressKonami();

    expect(document.documentElement).toHaveClass("misregistered");
    expect(screen.getByRole("status")).toHaveTextContent("Out of register");
    expect(screen.getByRole("link", { name: "Go to the arcade" })).toHaveAttribute("href", "/arcade");

    act(() => jest.advanceTimersByTime(6000));
    expect(document.documentElement).not.toHaveClass("misregistered");
  });

  it("closes the toast with Esc and with the button", () => {
    renderOnPage();
    pressKonami();
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByText("Out of register")).not.toBeInTheDocument();

    pressKonami();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Out of register")).not.toBeInTheDocument();
  });

  it("leaves the toast open when Esc closes a dialog instead", () => {
    renderOnPage();
    pressKonami();
    const dialog = document.body.appendChild(document.createElement("div"));
    dialog.setAttribute("role", "dialog");
    const search = dialog.appendChild(document.createElement("input"));
    act(() => {
      fireEvent.keyDown(search, { key: "Escape" });
    });
    expect(screen.getByText("Out of register")).toBeInTheDocument();
  });

  it("fires with Shift+B and Shift+A, but not on repeats or handled keys", () => {
    renderOnPage();
    const arrows = KONAMI_SEQUENCE.slice(0, 8);
    act(() => {
      arrows.forEach((key) => fireEvent.keyDown(window, { key }));
      fireEvent.keyDown(window, { key: "B", shiftKey: true });
      fireEvent.keyDown(window, { key: "A", shiftKey: true });
    });
    expect(screen.getByText("Out of register")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    act(() => {
      arrows.forEach((key) => fireEvent.keyDown(window, { key }));
      fireEvent.keyDown(window, { key: "b" });
      fireEvent.keyDown(window, { key: "a", repeat: true });
    });
    expect(screen.queryByText("Out of register")).not.toBeInTheDocument();

    // A game that handles its keys first (a capture listener here) keeps them.
    const handled = (event: KeyboardEvent) => event.preventDefault();
    window.addEventListener("keydown", handled, true);
    pressKonami();
    window.removeEventListener("keydown", handled, true);
    expect(screen.queryByText("Out of register")).not.toBeInTheDocument();
  });

  it("does nothing on the arcade", () => {
    window.history.pushState({}, "", "/arcade");
    try {
      renderOnPage();
      pressKonami();
      expect(screen.queryByText("Out of register")).not.toBeInTheDocument();
    } finally {
      window.history.pushState({}, "", "/");
    }
  });

  it("holds the auto-close while hovered or focused, and restarts it after", () => {
    renderOnPage();
    pressKonami();
    const toast = screen.getByText("Out of register").parentElement!;

    // Hovered past the 12s, then 12s more once the pointer leaves.
    fireEvent.mouseEnter(toast);
    act(() => jest.advanceTimersByTime(20_000));
    expect(screen.getByText("Out of register")).toBeInTheDocument();
    fireEvent.mouseLeave(toast);
    act(() => jest.advanceTimersByTime(11_000));
    expect(screen.getByText("Out of register")).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1_000));
    expect(screen.queryByText("Out of register")).not.toBeInTheDocument();

    // Focus inside holds it too, and the pointer leaving does not release it.
    pressKonami();
    const close = screen.getByRole("button", { name: "Close" });
    const link = screen.getByRole("link", { name: "Go to the arcade" });
    act(() => close.focus());
    fireEvent.mouseLeave(close.closest("[data-c97-surface]")!);
    act(() => link.focus());
    act(() => jest.advanceTimersByTime(20_000));
    expect(screen.getByText("Out of register")).toBeInTheDocument();
    act(() => link.blur());
    act(() => jest.advanceTimersByTime(12_000));
    expect(screen.queryByText("Out of register")).not.toBeInTheDocument();
  });

  it("does not fire while typing in an input", () => {
    renderOnPage();
    const input = document.body.appendChild(document.createElement("input"));
    act(() => {
      KONAMI_SEQUENCE.forEach((key) => fireEvent.keyDown(input, { key }));
    });
    expect(screen.queryByText("Out of register")).not.toBeInTheDocument();
  });

  it("shows proof marks only while Alt is held on its own", () => {
    const { page } = renderOnPage();
    const proof = () => page.querySelector(".proof");

    act(() => {
      fireEvent.keyDown(window, { key: "Alt", altKey: true });
    });
    expect(proof()).toHaveAttribute("aria-hidden", "true");
    act(() => {
      fireEvent.keyUp(window, { key: "Alt" });
    });
    expect(proof()).toBeNull();

    // A combo like Alt+Tab clears it, and so does the window losing focus.
    act(() => {
      fireEvent.keyDown(window, { key: "Alt", altKey: true });
      fireEvent.keyDown(window, { key: "Tab", altKey: true });
    });
    expect(proof()).toBeNull();
    act(() => {
      fireEvent.keyDown(window, { key: "Alt", altKey: true });
      fireEvent.blur(window);
    });
    expect(proof()).toBeNull();

    const input = document.body.appendChild(document.createElement("input"));
    act(() => {
      fireEvent.keyDown(input, { key: "Alt", altKey: true });
    });
    expect(proof()).toBeNull();
  });

  it("reads the night shift title from midnight until 5am", () => {
    renderOnPage();
    document.title = "About | Isaac Vazquez";
    const awayTitleAt = (hour: number, minute: number) => {
      jest.setSystemTime(new Date(2026, 8, 28, hour, minute));
      setHidden(true);
      const title = document.title;
      setHidden(false);
      return title;
    };
    try {
      expect(awayTitleAt(23, 59)).toBe("Still on the press…");
      expect(awayTitleAt(0, 0)).toBe("Running the night shift…");
      expect(awayTitleAt(4, 59)).toBe("Running the night shift…");
      expect(awayTitleAt(5, 0)).toBe("Still on the press…");
      expect(document.title).toBe("About | Isaac Vazquez");

      // Left before 5am and back after it, the page's own title still returns.
      jest.setSystemTime(new Date(2026, 8, 28, 4, 59));
      setHidden(true);
      jest.setSystemTime(new Date(2026, 8, 28, 5, 1));
      setHidden(false);
      expect(document.title).toBe("About | Isaac Vazquez");
    } finally {
      Object.defineProperty(document, "hidden", { configurable: true, value: false });
    }
  });

  it("swaps the tab title while hidden and restores it on return", () => {
    renderOnPage();
    document.title = "About | Isaac Vazquez";
    jest.setSystemTime(new Date(2026, 8, 28, 12, 0));
    try {
      setHidden(true);
      expect(document.title).toBe("Still on the press…");
      setHidden(false);
      expect(document.title).toBe("About | Isaac Vazquez");

      // A title the page set while hidden is left alone.
      setHidden(true);
      document.title = "Writing | Isaac Vazquez";
      setHidden(false);
      expect(document.title).toBe("Writing | Isaac Vazquez");
    } finally {
      Object.defineProperty(document, "hidden", { configurable: true, value: false });
    }
  });

  it("knocks the press out of register on the sixth stamp inside three seconds", () => {
    const { page } = renderOnPage();
    const mark = page.querySelector(".c97-wordmark")!;

    for (let i = 0; i < 5; i += 1) fireEvent.click(mark);
    expect(document.documentElement).not.toHaveClass("misregistered");
    expect(screen.queryByText("Out of register")).not.toBeInTheDocument();

    fireEvent.click(mark);
    expect(document.documentElement).toHaveClass("misregistered");
    expect(screen.getByRole("status")).toHaveTextContent(
      "You stamped hard enough to knock the press out of line.",
    );
    expect(screen.getByRole("link", { name: "Go to the arcade" })).toHaveAttribute("href", "/arcade");

    act(() => jest.advanceTimersByTime(6000));
    expect(document.documentElement).not.toHaveClass("misregistered");
  });

  it("leaves the press alone when the stamps come slowly", () => {
    const { page } = renderOnPage();
    const mark = page.querySelector(".c97-wordmark")!;

    // Six stamps take 3.5 seconds at this pace, which is outside the window.
    for (let i = 0; i < 12; i += 1) {
      fireEvent.click(mark);
      expect(document.documentElement).not.toHaveClass("misregistered");
      act(() => jest.advanceTimersByTime(700));
    }
  });

  it("needs six fresh stamps to knock the press a second time", () => {
    const { page } = renderOnPage();
    const mark = page.querySelector(".c97-wordmark")!;

    for (let i = 0; i < 6; i += 1) fireEvent.click(mark);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    for (let i = 0; i < 5; i += 1) fireEvent.click(mark);
    expect(screen.queryByText("Out of register")).not.toBeInTheDocument();
    fireEvent.click(mark);
    expect(screen.getByText("Out of register")).toBeInTheDocument();
  });

  it("stamps on the arcade without knocking the press", () => {
    window.history.pushState({}, "", "/arcade");
    try {
      const { page } = renderOnPage();
      const mark = page.querySelector(".c97-wordmark")!;

      for (let i = 0; i < 6; i += 1) fireEvent.click(mark);
      expect(page.querySelectorAll(".imprint")).toHaveLength(5);
      expect(document.documentElement).not.toHaveClass("misregistered");
      expect(screen.queryByText("Out of register")).not.toBeInTheDocument();
    } finally {
      window.history.pushState({}, "", "/");
    }
  });

  describe("darkroom safelight", () => {
    /** One flip of the theme, delivered to the observer before the next. */
    const flip = async (times = 1) => {
      for (let i = 0; i < times; i += 1) {
        await act(async () => {
          document.documentElement.classList.toggle("dark");
        });
      }
    };
    const safelight = (page: HTMLElement) => page.querySelector(".safelight");

    afterEach(() => document.documentElement.classList.remove("dark"));

    it("comes on at the fifth flip of the theme inside four seconds", async () => {
      const { page } = renderOnPage();

      await flip(4);
      expect(safelight(page)).toBeNull();
      expect(screen.queryByText("Safelight on")).not.toBeInTheDocument();

      await flip();
      expect(safelight(page)).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByRole("status")).toHaveTextContent(
        "You flipped the lights enough times to trip the safelight.",
      );
      expect(screen.queryByRole("link", { name: "Go to the arcade" })).not.toBeInTheDocument();

      act(() => jest.advanceTimersByTime(6000));
      expect(safelight(page)).toBeNull();
    });

    it("stays off when the flips come slowly", async () => {
      const { page } = renderOnPage();

      // Five flips take five seconds at this pace, which is outside the window.
      for (let i = 0; i < 10; i += 1) {
        await flip();
        expect(safelight(page)).toBeNull();
        act(() => jest.advanceTimersByTime(1250));
      }
    });

    it("ignores the other classes this component puts on the root", async () => {
      const { page } = renderOnPage();

      for (let i = 0; i < 6; i += 1) {
        await act(async () => {
          document.documentElement.classList.toggle("some-other-class");
        });
      }
      expect(safelight(page)).toBeNull();
    });

    it("does not count flips made while it is on", async () => {
      const { page } = renderOnPage();

      await flip(5);
      act(() => jest.advanceTimersByTime(5000));
      await flip(4);
      act(() => jest.advanceTimersByTime(1000));
      expect(safelight(page)).toBeNull();

      // The four made under the light are a second old and inside the window,
      // and they still don't count, so one more is only the first.
      await flip();
      expect(safelight(page)).toBeNull();
    });

    it("turns off early when the toast is closed", async () => {
      const { page } = renderOnPage();

      await flip(5);
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(safelight(page)).toBeNull();

      await flip(5);
      act(() => {
        fireEvent.keyDown(window, { key: "Escape" });
      });
      expect(safelight(page)).toBeNull();
    });
  });

  it("stamps the footer wordmark, caps the impressions, and clears them", () => {
    const { page, view } = renderOnPage();
    const footer = page.querySelector(".c97-footer")!;
    const mark = page.querySelector(".c97-wordmark")!;

    for (let i = 0; i < 7; i += 1) fireEvent.click(mark);
    expect(footer.querySelectorAll(".imprint")).toHaveLength(5);
    expect(footer.querySelector(".imprint")).toHaveAttribute("aria-hidden", "true");

    act(() => jest.advanceTimersByTime(2400));
    expect(footer.querySelectorAll(".imprint")).toHaveLength(0);

    fireEvent.click(mark);
    view.unmount();
    expect(footer.querySelectorAll(".imprint")).toHaveLength(0);
    expect(document.documentElement).not.toHaveClass("stampable");
  });
});
