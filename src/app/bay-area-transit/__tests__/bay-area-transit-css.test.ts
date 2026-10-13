import fs from "node:fs";
import path from "node:path";

// Rules that no unit render can see. Each one holds a state the page prints
// in words, or a ring or a selection that has to stay readable.
const css = fs.readFileSync(path.join(__dirname, "..", "bay-area-transit.css"), "utf8");

/** The declarations of the one rule that opens with this selector. */
function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("}", start));
}

describe("bay-area-transit.css", () => {
  it("gives the dark board its own ink, so text selected on it stays readable in the light theme", () => {
    expect(block(".c97-transit-board-inner")).toMatch(/--c97-ink:\s*var\(--bt-board-ink\)/);
  });

  it("marks a saved copy with the hollow ring and not the live dot", () => {
    expect(css).toMatch(/\.bt-badge\[data-status="saved"\] \.bt-badge-mark[^{]*\{[^}]*background:\s*transparent/);
  });

  it("draws a station row's focus ring inside the row, since the list clips at its edges", () => {
    expect(block(".bt-root .c97-transit-station-row:focus-visible")).toMatch(/outline-offset:\s*-\d/);
  });

  it("holds a station row to the list's width, so a long name cuts short and the swatches stay in view", () => {
    expect(block(".c97-transit-station-list")).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });
});
