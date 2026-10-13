import fs from "node:fs";
import path from "node:path";

// jsdom applies no stylesheet, so these read mba-jobs.css as text and hold the
// rules whose loss only shows in a browser: each one outranks or completes a
// rule the site frame ships, or keeps a pinned block inside the window.
const css = fs.readFileSync(path.join(__dirname, "..", "mba-jobs.css"), "utf8");

/** The text between the braces that open at `start`, nested blocks included. */
function block(start: string, source = css): string {
  const open = source.indexOf(start);
  if (open === -1) throw new Error(`no block starts with "${start}"`);
  let depth = 0;
  for (let i = open + start.length - 1; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(open + start.length, i);
  }
  throw new Error(`the block that starts with "${start}" never closes`);
}

/** Every `@media` block as its query and its body. */
function mediaBlocks(): { query: string; body: string }[] {
  return [...css.matchAll(/@media ([^{]+) \{/g)].map((match) => ({
    query: match[1],
    body: block(match[0], css.slice(match.index)),
  }));
}

describe("mba-jobs.css against the frame's rules", () => {
  it("tints a field without the background shorthand, which would clear a select's arrow", () => {
    const field = block(".mba-root .c97-field {");
    expect(field).toMatch(/background-color:\s*var\(--mba-card\)/);
    expect(field).not.toMatch(/background:/);
  });

  it("prints a pressed ghost toggle in ink", () => {
    expect(block('.mba-root .c97-btn-ghost[aria-pressed="true"] {')).toMatch(
      /[^-]color:\s*var\(--mba-ink\)/
    );
  });

  it("draws the view switch's focus ring inside the group that clips it", () => {
    expect(block(".mba-root .mba-switch > button:focus-visible {")).toMatch(
      /outline-offset:\s*-\d+px/
    );
  });

  it("reads its stacking order from the frame's tokens", () => {
    expect(css).not.toMatch(/z-index:\s*-?\d/);
  });
});

describe("mba-jobs.css pinned blocks", () => {
  const pinsSearchBar = /\.mba-searchbar \{[^}]*position:\s*sticky/;

  it("pins the search bar only from the width where it is one row", () => {
    const pinned = mediaBlocks().filter(({ body }) => pinsSearchBar.test(body));
    expect(pinned.map(({ query }) => query)).toEqual(["screen and (min-width: 768px)"]);
    // The three-track row and the pin arrive together.
    expect(block(".mba-searchbar {", pinned[0].body)).toMatch(/grid-template-columns:[^;]+auto;/);
  });

  it("scrolls a focused feed control out from under the pinned search bar", () => {
    const [pinned] = mediaBlocks().filter(({ body }) => pinsSearchBar.test(body));
    expect(block(".mba-feed > :not(.mba-searchbar) :is(a, button) {", pinned.body)).toMatch(
      /scroll-margin-top:/
    );
  });

  it("keeps the pinned to-do rail inside the window and lets it scroll", () => {
    const [desktop] = mediaBlocks().filter(
      ({ query, body }) => query.startsWith("screen") && body.includes(".mba-rail {")
    );
    const rail = block(".mba-rail {", desktop.body);
    expect(rail).toMatch(/position:\s*sticky/);
    expect(rail).toMatch(/max-height:\s*calc\(100dvh/);
    expect(rail).toMatch(/overflow-y:\s*auto/);
  });
});
