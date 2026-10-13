import fs from "node:fs";
import path from "node:path";

// Jest cannot lay these sheets out, so the rules that only hold through
// specificity or a media type are pinned as text.
const sheet = (name: string) => fs.readFileSync(path.join(__dirname, "..", name), "utf8");
const drawer = sheet("detail-drawer.css");
const board = sheet("sports-board.css");
const league = sheet("league-table.css");
const printBlock = (css: string) => css.slice(css.lastIndexOf("@media print"));

describe("detail-drawer.css", () => {
  it.each(["dd-section", "dd-label", "dd-tags", "dd-note"])(
    "spaces .%s from under the panel, so a route root's :where() reset cannot tie with it",
    (name) => {
      // Each route root resets p, ul, and dl at one class of weight, and the
      // order the two sheets load in changes from route to route.
      expect(drawer).toMatch(new RegExp(`^\\.dd-panel \\.${name} \\{`, "m"));
      expect(drawer).not.toMatch(new RegExp(`^\\.${name} \\{`, "m"));
    }
  );
});

describe("the football sheets", () => {
  it.each(["detail-drawer.css", "league-table.css", "points-ladder.css", "seed-ladder.css", "sports-board.css"])(
    "%s names screen or print on every width query",
    (name) => {
      // Safari answers a bare width query with the window's width on paper.
      const widthQueries = [...sheet(name).matchAll(/@media([^{]+)\{/g)]
        .map((match) => match[1])
        .filter((query) => query.includes("width"));
      for (const query of widthQueries) expect(query).toMatch(/screen|print/);
    }
  );

  it("stack the sticky toolbars on the shared token", () => {
    expect(board).not.toMatch(/z-index:\s*\d/);
    expect(league).not.toMatch(/z-index:\s*\d/);
  });

  it.each([
    ["sports-board.css", board, "sb", "button, a"],
    // The points ladder's marks take focus as SVG groups.
    ["league-table.css", league, "lt", 'button, a, \\[tabindex="0"\\]'],
  ])("%s keeps a focused board control clear of the sticky toolbar", (_name, css, prefix, controls) => {
    expect(css).toMatch(
      new RegExp(`\\.${prefix}-board > :not\\(\\.${prefix}-toolbar\\) :is\\(${controls}\\) \\{\\s*scroll-margin-top:`)
    );
  });

  it.each([
    ["sports-board.css", board, "sb"],
    ["league-table.css", league, "lt"],
  ])("%s leaves the phone's scrolling switch row room for a focus ring", (_name, css, prefix) => {
    // A scroll box clips an outline drawn outside it.
    const phone = css.slice(css.indexOf("@media screen and (max-width: 639px)"));
    const rule = phone.match(new RegExp(`\\.${prefix}-board \\.${prefix}-switch \\{([^}]*)\\}`))?.[1] ?? "";
    expect(rule).toContain("margin: -5px;");
    expect(rule).toContain("padding: 5px;");
  });

  it("league-table.css keeps its dark palette and its dark crest chips to the screen", () => {
    // Paper is white whichever theme the site is in.
    expect(league).toMatch(/@media screen \{\s*\.dark \.lt-root \{/);
    expect(league).toMatch(/@media screen \{\s*\.dark \.lt-crest,\s*\.dark \.lt-detail-panel img \{/);
    expect(league).not.toMatch(/^\.dark /m);
  });

  it.each([
    ["sports-board.css", board, "sb"],
    ["league-table.css", league, "lt"],
  ])("%s prints the pressed switch as ink on paper, with no fill to lose", (_name, css, prefix) => {
    expect(printBlock(css)).toMatch(
      new RegExp(
        `\\.${prefix}-switch > button:is\\(\\[aria-pressed="true"\\], \\[aria-selected="true"\\]\\) \\{\\s*background: none;\\s*color: var\\(--`
      )
    );
  });
});

describe("sports-board.css club logos", () => {
  it("sit on a pale chip on a dark board, at a weight any route's own chip outranks", () => {
    expect(board).toMatch(
      /:where\(\.dark \.sb-root\) \.sb-detail img,\s*:where\(\.dark \.sb-root\) \.dd-panel img \{\s*background: var\(--sb-ink\);/
    );
    // Two classes here tied with a route's `.x-root .dd-panel img`.
    expect(board).not.toMatch(/\.dd-panel \.sb-games img/);
  });
});
