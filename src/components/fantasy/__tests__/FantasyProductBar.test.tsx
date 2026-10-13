import { fireEvent, render, screen, within } from "@testing-library/react";

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

  it("moves the list until a link that is partly off screen sits whole at its left edge", () => {
    const { link, list } = renderWithBoxes({ left: 260, right: 360 });
    expect(list.scrollLeft).toBe(0);

    fireEvent.focus(link);

    // The item starts at 260 and ends at 360 in a 300px list, so it goes 4px in from the left edge.
    expect(list.scrollLeft).toBe(256);
  });

  it("leaves the list alone for a link that is already whole on screen", () => {
    const { link, list } = renderWithBoxes({ left: 120, right: 220 });

    fireEvent.focus(link);

    expect(list.scrollLeft).toBe(0);
  });
});
