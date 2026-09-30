import { render } from "@testing-library/react";
import { FragmentScrollOnLoad } from "../FragmentScrollOnLoad";

const LINK = "/investments?symbol=V&section=chart#research-section";
const VIEWPORT_HEIGHT = 720;

// The page as the component sees it. jsdom lays nothing out, so each section
// carries the offset it would have, and scrolling to one puts the page there.
let pageY = 0;
let pageHeight = 10_000;
let reachedBy: string | null = "navigate";
let tabHidden = false;
let frames: Array<{ id: number; draw: FrameRequestCallback }> = [];
let lastFrameId = 0;

const scrollIntoView = jest.fn(function (this: HTMLElement) {
  const landing = Number(this.dataset.top) - Number(this.dataset.margin);
  pageY = Math.max(0, Math.min(landing, pageHeight - VIEWPORT_HEIGHT));
});

function section(
  top: number,
  { id = "research-section", margin = 0, hidden = false } = {},
) {
  const element = document.createElement("section");
  element.id = id;
  element.dataset.top = String(top);
  element.dataset.margin = String(margin);
  element.hidden = hidden;
  element.getBoundingClientRect = () =>
    ({ top: Number(element.dataset.top) - pageY }) as DOMRect;
  element.getClientRects = () =>
    (element.hidden ? [] : [element.getBoundingClientRect()]) as unknown as DOMRectList;
  document.body.appendChild(element);
  return element;
}

function move(element: HTMLElement, top: number) {
  element.dataset.top = String(top);
}

// The browser draws a frame, which it only does for a tab that is showing.
function frame(ms = 16) {
  jest.advanceTimersByTime(ms);
  if (tabHidden) return;
  const due = frames;
  frames = [];
  for (const { draw } of due) draw(performance.now());
}

function wait(ms: number) {
  for (let drawn = 0; drawn < ms; drawn += 16) frame();
}

// Renders the component some seconds into the load, as on a slow connection.
function renderLate() {
  wait(4000);
  return render(<FragmentScrollOnLoad />);
}

// A scroll by anyone, the visitor or the browser's own landing, and the frame
// the component next sees the page in.
function scrollPageTo(y: number) {
  pageY = y;
  frame();
}

const anchoring = () => document.documentElement.style.overflowAnchor;

describe("FragmentScrollOnLoad", () => {
  const realRequestFrame = window.requestAnimationFrame;
  const realCancelFrame = window.cancelAnimationFrame;

  beforeEach(() => {
    jest.useFakeTimers();
    pageY = 0;
    pageHeight = 10_000;
    reachedBy = "navigate";
    tabHidden = false;
    frames = [];
    scrollIntoView.mockClear();
    document.body.innerHTML = "";
    document.documentElement.style.overflowAnchor = "";
    window.history.replaceState(null, "", LINK);
    window.requestAnimationFrame = (draw) => {
      lastFrameId += 1;
      frames.push({ id: lastFrameId, draw });
      return lastFrameId;
    };
    window.cancelAnimationFrame = (id) => {
      frames = frames.filter((request) => request.id !== id);
    };
    Element.prototype.scrollIntoView = scrollIntoView;
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => pageY });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: VIEWPORT_HEIGHT });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      get: () => pageHeight,
    });
    Object.defineProperty(window.performance, "getEntriesByType", {
      configurable: true,
      value: (kind: string) =>
        kind === "navigation" && reachedBy ? [{ type: reachedBy }] : [],
    });
    jest.spyOn(window, "getComputedStyle").mockImplementation(
      (element) =>
        ({ scrollMarginTop: `${(element as HTMLElement).dataset.margin ?? 0}px` }) as CSSStyleDeclaration,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    window.requestAnimationFrame = realRequestFrame;
    window.cancelAnimationFrame = realCancelFrame;
  });

  describe("landing", () => {
    it("lands on the section the fragment names", () => {
      section(2082);

      render(<FragmentScrollOnLoad />);

      expect(pageY).toBe(2082);
    });

    // React reveals a streamed page after this component has mounted.
    it("lands once the section is on the page", () => {
      render(<FragmentScrollOnLoad />);
      frame();
      expect(pageY).toBe(0);

      section(2082);
      frame();

      expect(pageY).toBe(2082);
    });

    // A streamed section sits in a hidden container until React reveals it.
    it("waits while the section is hidden", () => {
      const streamed = section(2082, { hidden: true });
      render(<FragmentScrollOnLoad />);
      frame();
      expect(pageY).toBe(0);

      streamed.hidden = false;
      frame();

      expect(pageY).toBe(2082);
    });

    // A Suspense fallback carries the same id, and React swaps it for the
    // section it stood in for.
    it("lands on the section that replaced the one it found first", () => {
      const fallback = section(2082);
      render(<FragmentScrollOnLoad />);

      fallback.remove();
      const loaded = section(2300);
      frame();

      expect(pageY).toBe(2300);
      expect(scrollIntoView.mock.contexts.at(-1)).toBe(loaded);
    });

    // An animation in flight ends where the section used to be when the page
    // changes under it.
    it("jumps to the section without an animation", () => {
      section(2082);

      render(<FragmentScrollOnLoad />);

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "instant" });
    });

    it("stops short of the section by its scroll margin", () => {
      section(2082, { margin: 48 });

      render(<FragmentScrollOnLoad />);

      expect(pageY).toBe(2034);
    });

    it("goes as far as the page goes, and the rest of the way once the page is longer", () => {
      pageHeight = 3000;
      section(2500);
      render(<FragmentScrollOnLoad />);
      expect(pageY).toBe(2280);

      pageHeight = 4000;
      frame();

      expect(pageY).toBe(2500);
    });
  });

  describe("holding the section while the page settles", () => {
    it("follows the section when the page changes above it", () => {
      const target = section(2082);
      render(<FragmentScrollOnLoad />);

      wait(4000);
      move(target, 2300);
      frame();
      wait(4000);
      move(target, 2500);
      frame();

      expect(pageY).toBe(2500);
    });

    // A column that grows beside a taller one moves the section and leaves the
    // page the height it was.
    it("follows the section when the page stays the same height", () => {
      const target = section(2082);
      render(<FragmentScrollOnLoad />);

      move(target, 2101);
      frame();

      expect(pageY).toBe(2101);
    });

    // The browser began its landing before the page changed, and the change
    // came before this mounted, so the page is somewhere this never saw.
    it("lands from wherever the browser's own landing left the page", () => {
      section(3396);
      pageY = 2162;

      render(<FragmentScrollOnLoad />);

      expect(pageY).toBe(3396);
    });

    it("cuts short a landing the browser still has in flight", () => {
      section(2082);
      pageY = 61;

      render(<FragmentScrollOnLoad />);

      expect(pageY).toBe(2082);
    });

    it("follows a section the browser landed on by itself", () => {
      const target = section(2082, { margin: 48 });
      pageY = 2034;
      render(<FragmentScrollOnLoad />);
      expect(scrollIntoView).not.toHaveBeenCalled();

      move(target, 2430);
      frame();

      expect(pageY).toBe(2382);
    });

    it("follows a section the browser landed on at the end of the page", () => {
      pageHeight = 3000;
      section(2500);
      pageY = 2280;
      render(<FragmentScrollOnLoad />);
      expect(scrollIntoView).not.toHaveBeenCalled();

      pageHeight = 4000;
      frame();

      expect(pageY).toBe(2500);
    });

    // The browser animates its own landing toward where the section was when
    // the animation began, and does not aim again when the section moves.
    it("finishes a landing the browser began before the page changed, when it mounts late", () => {
      const target = section(2082);
      pageY = 61;
      renderLate();

      move(target, 2430);
      scrollPageTo(1214);
      expect(pageY).toBe(1214);

      scrollPageTo(2082);

      expect(pageY).toBe(2430);
    });

    // The animation is aimed at a spot the page no longer reaches, so it ends
    // at the end of the page instead.
    it("finishes a landing the browser aimed past the end of a page that got shorter, when it mounts late", () => {
      pageHeight = 7114;
      const target = section(6388);
      pageY = 2;
      renderLate();

      pageHeight = 6034;
      move(target, 5307);
      scrollPageTo(9);
      expect(pageY).toBe(9);

      scrollPageTo(5314);

      expect(pageY).toBe(5307);
    });

    it("takes a position within a pixel of where it left the page as its own", () => {
      const target = section(2082);
      render(<FragmentScrollOnLoad />);
      wait(300);

      pageY = 2082.5;
      move(target, 2300);
      frame();

      expect(pageY).toBe(2300);
    });

    it("stops once the page has been still for five seconds", () => {
      const target = section(2082);
      render(<FragmentScrollOnLoad />);

      wait(5100);
      move(target, 2300);
      frame();

      expect(pageY).toBe(2082);
      expect(frames).toEqual([]);
    });

    // Data that loads inside the section leaves the section where it is, and
    // the page has still not settled.
    it("keeps waiting while the page changes below the section", () => {
      const target = section(2082);
      render(<FragmentScrollOnLoad />);

      wait(4000);
      pageHeight = 11_000;
      frame();
      wait(4000);
      move(target, 2300);
      frame();

      expect(pageY).toBe(2300);
    });

    // A tab opened in the background draws no frames, so React reveals nothing
    // in it until the visitor turns to it.
    it("waits for a tab that was opened in the background", () => {
      tabHidden = true;
      const streamed = section(2082, { hidden: true });
      render(<FragmentScrollOnLoad />);

      wait(60_000);
      tabHidden = false;
      frame();
      streamed.hidden = false;
      frame();

      expect(pageY).toBe(2082);
    });

    it("counts the five seconds from when a background tab is shown", () => {
      tabHidden = true;
      const target = section(2082);
      render(<FragmentScrollOnLoad />);

      wait(60_000);
      tabHidden = false;
      wait(4000);
      move(target, 2200);
      frame();
      expect(pageY).toBe(2200);

      wait(5100);
      move(target, 2300);
      frame();
      expect(pageY).toBe(2200);
    });

    it("stops when it unmounts", () => {
      const { unmount } = render(<FragmentScrollOnLoad />);

      unmount();
      section(2082);
      frame();

      expect(pageY).toBe(0);
      expect(frames).toEqual([]);
    });
  });

  // Chromium ends its own animated landing when this one lands, and adds what
  // the animation had covered to where this one put the page.
  describe("a landing the browser's animation nudges", () => {
    it("is made again when the page shifts right after it", () => {
      section(120);
      render(<FragmentScrollOnLoad />);
      expect(pageY).toBe(120);

      scrollPageTo(138);

      expect(pageY).toBe(120);
    });

    it("is made again after a landing that followed a change to the page", () => {
      const target = section(2082);
      render(<FragmentScrollOnLoad />);
      wait(2000);

      move(target, 2300);
      frame();
      scrollPageTo(2318);

      expect(pageY).toBe(2300);
    });

    // The moment is counted from the landing, not from the mount before it.
    it("is made again after a landing that came a little after the mount", () => {
      const streamed = section(2082, { hidden: true });
      render(<FragmentScrollOnLoad />);
      wait(150);
      streamed.hidden = false;
      frame();
      expect(pageY).toBe(2082);

      wait(100);
      scrollPageTo(2095);

      expect(pageY).toBe(2082);
    });

    it("is left alone once a moment has passed, since that is the visitor", () => {
      section(120);
      render(<FragmentScrollOnLoad />);

      wait(300);
      scrollPageTo(138);

      expect(pageY).toBe(138);
    });

    it("stops answering a visitor who scrolls through the landing", () => {
      section(120);
      render(<FragmentScrollOnLoad />);

      for (let drawn = 1; drawn <= 25; drawn += 1) scrollPageTo(120 + drawn);

      expect(pageY).toBe(145);
    });
  });

  // Chromium and Firefox scroll by themselves to keep what is on screen still
  // when the page changes. On /la-liga that moved the page up 10px while the
  // section moved down 9px, and nothing had scrolled it but the browser.
  describe("the browser's own scroll anchoring", () => {
    it("is off while the page sits on a landing", () => {
      section(2082);

      render(<FragmentScrollOnLoad />);

      expect(anchoring()).toBe("none");
    });

    it("is off for a landing the browser made", () => {
      section(2082);
      pageY = 2082;

      renderLate();

      expect(anchoring()).toBe("none");
    });

    it("is left on while there is no landing to hold", () => {
      section(2082, { hidden: true });

      render(<FragmentScrollOnLoad />);
      frame();

      expect(anchoring()).toBe("");
    });

    it("is back on once the visitor has moved the page", () => {
      section(2082);
      render(<FragmentScrollOnLoad />);
      wait(300);

      scrollPageTo(640);

      expect(anchoring()).toBe("");
    });

    it("is back on once the page has been still for five seconds", () => {
      section(2082);
      render(<FragmentScrollOnLoad />);

      wait(5100);

      expect(anchoring()).toBe("");
    });

    it("is back on when the component unmounts", () => {
      section(2082);

      render(<FragmentScrollOnLoad />).unmount();

      expect(anchoring()).toBe("");
    });
  });

  // A visitor scrolls a moment after the landing at the soonest, and a shift
  // that comes sooner than that is the browser's.
  describe("a page the visitor has moved", () => {
    it("stays where the visitor put it after a landing", () => {
      const target = section(2082);
      render(<FragmentScrollOnLoad />);
      wait(300);

      scrollPageTo(640);
      move(target, 2300);
      frame();

      expect(pageY).toBe(640);
    });

    it("stays where the visitor put it before a late mount", () => {
      const target = section(2082);
      pageY = 640;
      renderLate();

      move(target, 2300);
      frame();

      expect(pageY).toBe(640);
    });

    it("stays at the top when the visitor went back there after a landing", () => {
      const target = section(2082);
      render(<FragmentScrollOnLoad />);
      wait(300);

      scrollPageTo(640);
      scrollPageTo(0);
      move(target, 2300);
      frame();

      expect(pageY).toBe(0);
    });

    it("stays at the top when the visitor jumped straight there after a landing", () => {
      const target = section(2082);
      render(<FragmentScrollOnLoad />);
      wait(300);

      scrollPageTo(0);
      move(target, 2300);
      frame();

      expect(pageY).toBe(0);
    });

    it("stays at the top when the visitor went back there before the section appeared", () => {
      const streamed = section(2082, { hidden: true });
      render(<FragmentScrollOnLoad />);
      wait(300);

      scrollPageTo(300);
      scrollPageTo(0);
      streamed.hidden = false;
      frame();

      expect(pageY).toBe(0);
    });
  });

  describe("loads it leaves to the browser", () => {
    it.each(["reload", "back_forward"])(
      "leaves a %s alone, since the browser puts the page back where it was",
      (type) => {
        reachedBy = type;
        section(2082);

        render(<FragmentScrollOnLoad />);
        frame();

        expect(pageY).toBe(0);
        expect(frames).toEqual([]);
      },
    );

    it("lands when the browser has no record of how the page was reached", () => {
      Object.defineProperty(window.performance, "getEntriesByType", {
        configurable: true,
        value: undefined,
      });
      section(2082);

      render(<FragmentScrollOnLoad />);

      expect(pageY).toBe(2082);
    });
  });

  describe("reading the fragment", () => {
    it("does nothing for a link with no fragment", () => {
      window.history.replaceState(null, "", "/investments?symbol=V&section=chart");
      section(2082);

      render(<FragmentScrollOnLoad />);
      frame();

      expect(pageY).toBe(0);
      expect(frames).toEqual([]);
    });

    it("does nothing when the fragment names nothing on the page", () => {
      section(2082, { id: "retirement" });

      render(<FragmentScrollOnLoad />);
      frame();

      expect(pageY).toBe(0);
    });

    it("reads a fragment that carries an escape", () => {
      window.history.replaceState(null, "", "/writing#caf%C3%A9");
      section(900, { id: "café" });

      render(<FragmentScrollOnLoad />);

      expect(pageY).toBe(900);
    });

    it("reads a fragment whose escape is broken as it is written", () => {
      window.history.replaceState(null, "", "/investments#100%");
      section(900, { id: "100%" });

      render(<FragmentScrollOnLoad />);

      expect(pageY).toBe(900);
    });
  });
});
