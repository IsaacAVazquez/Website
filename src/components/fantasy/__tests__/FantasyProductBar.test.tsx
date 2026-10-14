import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { FantasyProductBar } from "../FantasyProductBar";

const mockPathname = jest.fn<string, []>();
jest.mock("next/navigation", () => ({ usePathname: () => mockPathname() }));

const LINKS: Array<[string, string]> = [
  ["Rankings", "/fantasy-football"],
  ["Draft tracker", "/fantasy-football/draft-tracker"],
  ["Mock draft", "/fantasy-football/mock-draft"],
  ["Trade calculator", "/fantasy-football/trade-calculator"],
  ["Best ball", "/fantasy-football/best-ball"],
  ["Best ball tracker", "/fantasy-football/best-ball/draft-tracker"],
  ["Weekly", "/fantasy-football/weekly"],
  ["Waivers", "/fantasy-football/waivers"],
];

describe("FantasyProductBar", () => {
  it("is one navigation landmark with the eight tools in order, each by the name the pages link it with", () => {
    mockPathname.mockReturnValue("/fantasy-football");
    render(<FantasyProductBar />);

    const nav = screen.getByRole("navigation", { name: "Fantasy football" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual(LINKS);
    // The product name is a label, so it adds no heading and no ninth link.
    expect(within(nav).getByText("Fantasy Football").closest("a, h1, h2, h3")).toBeNull();
  });

  it.each(LINKS)("marks %s as the current page on its own route and nothing else", (label, href) => {
    mockPathname.mockReturnValue(href);
    render(<FantasyProductBar />);

    const current = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName(label);
  });

  it("splits the tools into three groups, with a divider before the best ball pair and the in-season pair", () => {
    mockPathname.mockReturnValue("/fantasy-football");
    render(<FantasyProductBar />);

    const starts = screen
      .getAllByRole("listitem")
      .filter((item) => item.classList.contains("ffb-bar-gap"))
      .map((item) => item.textContent);
    expect(starts).toEqual(["Best ball", "Weekly"]);
  });

  it("puts a current link that is off screen at the list's left edge by moving the list, never the page", () => {
    mockPathname.mockReturnValue("/fantasy-football/waivers");
    const scrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const rects = new Map<string, Partial<DOMRect>>([
      ["UL", { left: 0, right: 300 }],
      ["LI", { left: 520, right: 600 }],
    ]);
    const rectSpy = jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return (rects.get(this.tagName) ?? { left: 0, right: 0 }) as DOMRect;
    });
    const widths = { scrollWidth: 640, clientWidth: 300 };
    const scrollWidth = jest.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => widths.scrollWidth);
    const clientWidth = jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => widths.clientWidth);

    render(<FantasyProductBar />);

    // The item starts at 520 and the list at 0, so the list moves until the item sits 4px in,
    // which is the list's own start padding and where the phone's scroll snapping rests.
    expect(screen.getByRole("list").scrollLeft).toBe(516);
    expect(scrollIntoView).not.toHaveBeenCalled();

    rectSpy.mockRestore();
    scrollWidth.mockRestore();
    clientWidth.mockRestore();
  });
});

describe("FantasyProductBar on a phone", () => {
  const desktop = window.matchMedia;
  afterEach(() => {
    window.matchMedia = desktop;
    jest.restoreAllMocks();
  });

  it("brings the current link in with as many neighbours before it as fit, at a link's start where the snapping rests", () => {
    mockPathname.mockReturnValue("/fantasy-football/waivers");
    const phone = jest.fn((query: string) => ({ matches: query === "(max-width: 767.98px)", media: query }) as MediaQueryList);
    window.matchMedia = phone;
    // The list shows 300px. Waivers ends at 600, Weekly starts at 440, Best ball tracker at 300.
    const left = new Map([["Waivers", 520], ["Weekly", 440], ["Best ball tracker", 300]]);
    jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      if (this.tagName === "UL") return { left: 0, right: 300, width: 300 } as DOMRect;
      const at = left.get(this.textContent ?? "") ?? 0;
      return { left: at, right: this.textContent === "Waivers" ? 600 : at + 80, width: 80 } as DOMRect;
    });
    jest.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => 640);
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 300);

    render(<FantasyProductBar />);

    // Weekly and Waivers take 160px of the 292 a link can start in, and Best ball tracker would need 300,
    // so Weekly starts 4px in, which is the list's own start padding.
    expect(phone).toHaveBeenCalledWith("(max-width: 767.98px)");
    expect(screen.getByRole("list").scrollLeft).toBe(436);
  });
});

describe("FantasyProductBar edge cue", () => {
  afterEach(() => jest.restoreAllMocks());

  it("marks the bar while more links sit past the list's right edge, and clears it at the end", () => {
    mockPathname.mockReturnValue("/fantasy-football");
    jest.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => 640);
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 300);
    render(<FantasyProductBar />);
    const nav = screen.getByRole("navigation", { name: "Fantasy football" });
    const list = screen.getByRole("list");

    expect(nav).toHaveAttribute("data-more", "end");

    list.scrollLeft = 340;
    fireEvent.scroll(list);
    expect(nav).not.toHaveAttribute("data-more");

    list.scrollLeft = 200;
    fireEvent.scroll(list);
    expect(nav).toHaveAttribute("data-more", "end");
  });

  it("carries no mark when every link fits", () => {
    mockPathname.mockReturnValue("/fantasy-football");
    jest.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => 300);
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 300);
    render(<FantasyProductBar />);

    expect(screen.getByRole("navigation", { name: "Fantasy football" })).not.toHaveAttribute("data-more");
  });
});

describe("FantasyProductBar when the current link is already on screen", () => {
  it("leaves the list where it is", () => {
    mockPathname.mockReturnValue("/fantasy-football/draft-tracker");
    const rects = new Map<string, Partial<DOMRect>>([
      ["UL", { left: 0, right: 300 }],
      ["LI", { left: 90, right: 200 }],
    ]);
    const rectSpy = jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return (rects.get(this.tagName) ?? { left: 0, right: 0 }) as DOMRect;
    });
    const scrollWidth = jest.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => 640);
    const clientWidth = jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 300);

    render(<FantasyProductBar />);

    expect(screen.getByRole("list").scrollLeft).toBe(0);

    rectSpy.mockRestore();
    scrollWidth.mockRestore();
    clientWidth.mockRestore();
  });
});

describe("FantasyProductBar when a link takes focus", () => {
  afterEach(() => jest.restoreAllMocks());

  // The current link sits on screen at mount, and the link that takes focus is given its own box.
  function renderWithBoxes(focusedBox: Partial<DOMRect>) {
    mockPathname.mockReturnValue("/fantasy-football");
    render(<FantasyProductBar />);
    const link = screen.getByRole("link", { name: "Mock draft" });
    const item = link.closest("li") as HTMLElement;
    jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      if (this === item) return focusedBox as DOMRect;
      return (this.tagName === "UL" ? { left: 0, right: 300 } : { left: 0, right: 0 }) as DOMRect;
    });
    jest.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => 640);
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 300);
    return { link, list: screen.getByRole("list") };
  }

  it("moves the list until a link that keyboard focus lands on, partly off screen, sits whole at its left edge", () => {
    const { link, list } = renderWithBoxes({ left: 260, right: 360 });
    expect(list.scrollLeft).toBe(0);

    act(() => link.focus());

    // A focus the keyboard gives. The item starts at 260 and ends at 360 in a 300px list, so it goes 4px in from the left edge.
    expect(link).toHaveFocus();
    expect(link).toHaveProperty("matches");
    expect(link.matches(":focus-visible")).toBe(true);
    expect(list.scrollLeft).toBe(256);
  });

  it("leaves the list alone for a link that is already whole on screen", () => {
    const { link, list } = renderWithBoxes({ left: 120, right: 220 });

    act(() => link.focus());

    expect(link).toHaveFocus();
    expect(list.scrollLeft).toBe(0);
  });

  it("does not move the list when a pointer press focuses a cut link, so the press lands on that link", () => {
    const { link, list } = renderWithBoxes({ left: 260, right: 360 });
    // A pointer press focuses a link in Chromium and Firefox without :focus-visible.
    const matches = Element.prototype.matches;
    jest.spyOn(link, "matches").mockImplementation((selector: string) =>
      selector === ":focus-visible" ? false : matches.call(link, selector)
    );

    fireEvent.pointerDown(link);
    act(() => link.focus());

    expect(link).toHaveFocus();
    expect(list.scrollLeft).toBe(0);
  });
});
