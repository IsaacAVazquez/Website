import { render, screen, within } from "@testing-library/react";

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

  it("brings the current link into view by moving the list, never the page", () => {
    mockPathname.mockReturnValue("/fantasy-football/waivers");
    const scrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const rects = new Map<string, Partial<DOMRect>>([
      ["UL", { left: 0, right: 300 }],
      ["A", { left: 520, right: 600 }],
    ]);
    const rectSpy = jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return (rects.get(this.tagName) ?? { left: 0, right: 0 }) as DOMRect;
    });
    const widths = { scrollWidth: 640, clientWidth: 300 };
    const scrollWidth = jest.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => widths.scrollWidth);
    const clientWidth = jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => widths.clientWidth);

    render(<FantasyProductBar />);

    // The link's right edge (600) is past the list's (300) less the 12px margin.
    expect(screen.getByRole("list").scrollLeft).toBe(312);
    expect(scrollIntoView).not.toHaveBeenCalled();

    rectSpy.mockRestore();
    scrollWidth.mockRestore();
    clientWidth.mockRestore();
  });
});
