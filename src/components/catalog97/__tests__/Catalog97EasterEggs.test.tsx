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

  it("swaps the tab title while hidden and restores it on return", () => {
    renderOnPage();
    document.title = "About | Isaac Vazquez";
    const setHidden = (hidden: boolean) => {
      Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
    };
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
