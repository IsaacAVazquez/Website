import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(__dirname, "..", "github-trending-pulse.css"), "utf8");

/** The declarations of the first rule whose selector list is exactly `selector`. */
function rule(selector: string, source = css): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`(?:^|[}/])\\s*${escaped}\\s*\\{([^}]*)\\}`, "m"));
  if (!match) throw new Error(`No rule for ${selector}`);
  return match[1];
}

/** The body of the first @media block that holds `needle`, with the query it sits under. */
function mediaBlockWith(needle: string): { query: string; body: string } {
  for (const match of css.matchAll(/@media([^{]+)\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)) {
    if (match[2].includes(needle)) return { query: match[1].trim(), body: match[2] };
  }
  throw new Error(`No media block holds ${needle}`);
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function token(block: string, name: string): string {
  const match = block.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`No ${name}`);
  return match[1];
}

describe("github-trending-pulse.css", () => {
  it("outlines the strip's colours in an ink that clears 3:1 on the paper in both themes", () => {
    // Linguist's JavaScript yellow is 1.3:1 on the light paper, so the outline carries the edge.
    expect(rule(".gt-strip-swatch")).toMatch(/border:\s*1px solid var\(--gt-ink-2\)/);
    expect(rule(".gt-root .gt-key--other")).toMatch(/border:\s*1px solid var\(--gt-ink-2\)/);

    for (const selector of [".gt-root", ".dark .gt-root"]) {
      const block = rule(selector);
      expect(contrast(token(block, "--gt-ink-2"), token(block, "--gt-bg"))).toBeGreaterThan(3);
    }
  });

  it("sticks the toolbar only in a window tall enough to spare the room", () => {
    const sticky = mediaBlockWith("position: sticky");
    expect(sticky.query).toMatch(/min-width:\s*768px/);
    expect(sticky.query).toMatch(/min-height:\s*600px/);
    expect(rule(".gt-toolbar", sticky.body)).toMatch(/z-index:\s*var\(--c97-z-sticky\)/);
  });

  it("keeps a row focused from the keyboard clear of the stuck toolbar", () => {
    // Only the window's own scroll padding moves a row the browser already counts as on screen.
    const sticky = mediaBlockWith("position: sticky");
    expect(rule("html:has(.gt-list:focus-within)", sticky.body)).toMatch(
      /scroll-padding-top:\s*\d+rem/
    );
  });

  it("leaves the phone segment scroller room for the focus ring", () => {
    const scroller = rule(".gt-switch--scroll", mediaBlockWith(".gt-switch--scroll").body);
    expect(scroller).toMatch(/overflow-x:\s*auto/);
    expect(scroller).toMatch(/margin:\s*-5px/);
    expect(scroller).toMatch(/padding:\s*5px/);
  });

  it("keeps a sort from dragging the window after the row it reorders", () => {
    // The rows keep their nodes through a sort, so scroll anchoring would follow one.
    expect(rule(".gt-list")).toMatch(/overflow-anchor:\s*none/);
  });
});
