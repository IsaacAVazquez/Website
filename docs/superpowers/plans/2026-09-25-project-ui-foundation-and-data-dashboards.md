# Project UI foundation and data dashboards implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship PR 0 (six-ink riso set, per-route press, project hero, contrast tooling) and PR 1 (the nine data dashboards rebuilt around their signatures and moved onto Catalog 97 tokens).

**Architecture:** Inks are CSS surfaces in `src/app/catalog97.css`, measured by a Jest test that parses the stylesheet. A route's ink pair lives in one map, `src/constants/projectPress.ts`, which `ConditionalLayout` hands to `Catalog97ToolShell` as a `press` prop that writes `data-c97-press-second`. Each dashboard renders `Catalog97ProjectHero` with its lead ink and passes its signature visual as children. Signature geometry lives in pure, unit-tested helper modules beside each route, and the SVG components only draw what the helpers return.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, D3 7 (already installed), Jest with Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-25-project-specific-ui-design.md`

## Global Constraints

- No new runtime dependency. D3 is the only charting library.
- No hex literal in any component. Data colours that arrive as hex in a snapshot go through inline `style` from the data.
- The repo has no land geometry, so maps are points on a bare graticule.
- `HomeStatsPanel`, duplicated stat rows, and the jump-link chip rows come out of every route this plan touches.
- At most three readouts per hero, enforced by the `Catalog97ProjectHero` prop type.
- The h1 is `.c97-poster`, section h2s are `.c97-poster-sm`, and item names stay in Newsreader (`.c97-serif`).
- Each route has one page-level h1 and no nested `main`.
- Touch targets are at least 44px, pages don't scroll horizontally at 390px, and any Framer Motion uses `useReducedMotion()`.
- The test ids, roles, and exact strings in `e2e/product-surfaces.spec.ts` stay, unless a task changes the spec in the same commit.
- Every PR 1 task renames tokens with `node scripts/migrateHomeTokens.mjs <files>`, which rewrites `var(--home-*)` to the `--c97-*` equivalent. After it runs, `grep -c "var(--home-" <files>` must print 0 for each file.
- In every file a task touches, remove Tailwind `rounded-*` and `shadow-*` utilities by hand. They paint nothing while the bridge is up, and they would come back when the close-out deletes it.
- Copy follows `WRITING_VOICE.md`: no em dashes, no colons as connectors, no bold labels.
- Commits carry no Claude attribution.
- Every new file under `scripts/` gets a `DESCRIPTIONS` row in `scripts/generateAutomationInventory.mjs`, and then `npm run docs:automation` runs.
- Merging needs Isaac. PR 1's branch stacks on PR 0's branch, and PR 1 retargets to `main` once PR 0 merges.

## Review Focus

- A dashboard whose snapshot is empty, stale, or partly failed still renders its hero and an explanatory empty signature, never a blank or zero-width SVG. Each signature task tests its empty input.
- One outlier doesn't flatten every other mark in a signature, whether it's a magnitude 8 quake, OpenAI's valuation, or one repository with 50k stars. Each helper test includes an outlier case.
- Every signature stays legible in dark mode. The contrast test covers the ink tokens, and the screenshot step in Task 15 covers the marks.
- A reader on a 390px phone reads the signature without horizontal page scroll. Signatures use a `viewBox` with `width: 100%`, and Task 15's sweep checks overflow.
- Deep links (`?view=`, `?tab=`, `?station=`, `?quake=`) still land on the same state after the restructure. Each route's existing state tests stay green, and each task re-runs them.

---

## PR 0, foundation (branch `design/project-specific-ui`)

### Task 1: The six-ink riso set

**Files:**
- Modify: `src/app/catalog97.css`. The riso constants are near line 172, the light ink surfaces near lines 295 to 370, the plate and overprint defaults near lines 405 to 450, the dark ink surfaces near lines 487 to 560, and the dark plates near line 590.
- Create: `src/app/__tests__/catalog97-inks.test.ts`

**Interfaces:**
- Produces: the surfaces `ink-green`, `ink-teal`, and `ink-pink`, and the constants `--c97-riso-green`, `--c97-riso-teal`, and `--c97-riso-pink`. It also adds two generic tokens to the `.c97-page [data-c97-surface]` block, `--c97-accent-soft` and `--c97-overlay`, so the token rename has somewhere to point `--home-signal-soft` and `--home-overlay`.

- [ ] **Step 1: Write the failing test.** It parses the stylesheet, reads each ink surface's tokens in both themes, and asserts that body ink clears 4.5:1 against the surface.

```ts
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(process.cwd(), "src/app/catalog97.css"), "utf8");
const INKS = ["ink-blue", "ink-saffron", "ink-vermilion", "ink-peach", "ink-green", "ink-teal", "ink-pink"];

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`missing block ${selector}`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/(--c97-[a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe.each(INKS)("%s", (ink) => {
  for (const theme of ["light", "dark"] as const) {
    const selector = `${theme === "dark" ? ".dark " : ""}.c97-page [data-c97-surface="${ink}"]`;
    it(`${theme}: ink, ink-2, label, and action clear 4.5:1 on the surface`, () => {
      const t = block(selector);
      for (const token of ["--c97-ink", "--c97-ink-2", "--c97-label", "--c97-action"]) {
        expect({ token, ratio: contrast(t[token], t["--c97-surface"]) >= 4.5 }).toEqual({ token, ratio: true });
      }
    });
  }
});

it("declares a riso constant for every ink", () => {
  for (const name of ["blue", "saffron", "vermilion", "peach", "green", "teal", "pink"]) {
    expect(css).toMatch(new RegExp(`--c97-riso-${name}:\\s*#[0-9a-f]{6}`, "i"));
  }
});
```

- [ ] **Step 2: Run it** with `npx jest src/app/__tests__/catalog97-inks.test.ts`. Expect it to fail on the missing `ink-green` block. If an existing ink fails in dark mode because a token is not a literal hex, adjust `block()` to fall back to the light value only for that token and note it in a comment.

- [ ] **Step 3: Measure the candidate values** with a throwaway Node script that uses the same `contrast` math. Start from Riso Green `#00a95c`, Teal `#00838a`, and Fluorescent Pink `#ff48b0`, and tone each one toward the warmth of the existing inks until its surface ink clears 4.5:1. In light mode, green and pink take `#17110d` and teal takes `#f1ebdf`. Each dark surface is its light hex darkened until `#f7f2e8` clears 4.5:1, the way dark vermilion is `#b23a16`.

- [ ] **Step 4: Add the CSS.** Add three constants beside the existing four (`--c97-riso-green`, `--c97-riso-teal`, `--c97-riso-pink`). Each light surface copies the full token list of its template, `ink-vermilion` for green and pink and `ink-blue` for teal. The surface value is a literal hex so the test can read it, and a comment above it gives the measured ratios. Green in light mode looks like this:

```css
/* Green takes the darkest print ink; #17110d on <hex> measures <n>:1. Status colour is large-text-or-mark only, so status tokens resolve to the ink. */
.c97-page [data-c97-surface="ink-green"] {
  --c97-surface: <hex>;
  --c97-ink: #17110d;
  --c97-ink-2: #17110d;
  --c97-label: #17110d;
  --c97-action: #17110d;
  --c97-accent: #17110d;
  --c97-rule: rgba(23, 17, 13, 0.32);
  --c97-field: #f1ebdf;
  --c97-positive: #17110d;
  --c97-negative: #17110d;
  --c97-warning: #17110d;
}
```

Next, add the matching `.dark .c97-page [data-c97-surface="ink-*"]` blocks and the plate token for each ink in both themes, `#17110d` on dark-ink surfaces and `#f7f2e8` on light-ink ones. Each ink also gets a default overprint, where green takes blue, teal takes saffron, and pink takes blue. Finally, add these two lines to the generic `.c97-page [data-c97-surface]` block and point `--home-signal-soft` and `--home-overlay` at them:

```css
  --c97-accent-soft: color-mix(in srgb, var(--c97-accent) 16%, var(--c97-surface));
  --c97-overlay: color-mix(in srgb, var(--c97-ink) 8%, transparent);
```

- [ ] **Step 5: Run the test.** It should pass for all seven inks in both themes.

- [ ] **Step 6: Commit** with `git add src/app/catalog97.css src/app/__tests__/catalog97-inks.test.ts && git commit -m "feat: add green, teal, and pink riso inks"`.

### Task 2: Per-route press

**Files:**
- Create: `src/constants/projectPress.ts` and `src/constants/__tests__/projectPress.test.ts`
- Modify: `src/components/catalog97/Catalog97ToolShell.tsx`, `src/components/ConditionalLayout.tsx`, and `src/app/catalog97.css` (after the dark overprint overrides)
- Test: `src/components/catalog97/__tests__/Catalog97ToolShell.test.tsx`

**Interfaces:**
- Produces: `type RisoInk = "blue" | "saffron" | "vermilion" | "green" | "teal" | "pink"`, `interface ProjectPress { lead: RisoInk; second: RisoInk }`, `PROJECT_PRESS: Readonly<Record<string, ProjectPress>>`, and `getProjectPress(route: string): ProjectPress | undefined`. `Catalog97ToolShell` gains an optional `press?: ProjectPress` prop.

- [ ] **Step 1: Write the failing tests.** Append this to `Catalog97ToolShell.test.tsx`:

```tsx
it("prints the page's second ink when given a press", () => {
  const { container } = render(
    <Catalog97ToolShell route="/earthquake-pulse" press={{ lead: "teal", second: "vermilion" }}>
      <p>body</p>
    </Catalog97ToolShell>,
  );
  expect(container.querySelector('[data-c97-press-second="vermilion"]')).toContainHTML("<p>body</p>");
});

it("leaves the default overprint when no press is given", () => {
  const { container } = render(<Catalog97ToolShell route="/now"><p>body</p></Catalog97ToolShell>);
  expect(container.querySelector("[data-c97-press-second]")).toBeNull();
});
```

Then create `src/constants/__tests__/projectPress.test.ts`:

```ts
import { PROJECT_PRESS, getProjectPress } from "../projectPress";

it("never pairs an ink with itself", () => {
  for (const [route, press] of Object.entries(PROJECT_PRESS)) {
    expect({ route, same: press.lead === press.second }).toEqual({ route, same: false });
  }
});

it("looks routes up exactly", () => {
  expect(getProjectPress("/earthquake-pulse")).toEqual({ lead: "teal", second: "vermilion" });
  expect(getProjectPress("/earthquake-pulse/extra")).toBeUndefined();
});
```

- [ ] **Step 2: Run both** with `npx jest src/components/catalog97/__tests__/Catalog97ToolShell.test.tsx src/constants/__tests__/projectPress.test.ts`. Expect them to fail on the missing module and the missing prop.

- [ ] **Step 3: Implement.** `projectPress.ts` carries the nine PR 1 routes from the spec's table, and later PRs add their own rows.

```ts
/** A route's two riso inks. The lead prints the hero sheet and the second is the overprint on every sheet below it. */
export type RisoInk = "blue" | "saffron" | "vermilion" | "green" | "teal" | "pink";

export interface ProjectPress {
  lead: RisoInk;
  second: RisoInk;
}

export const PROJECT_PRESS: Readonly<Record<string, ProjectPress>> = {
  "/earthquake-pulse": { lead: "teal", second: "vermilion" },
  "/news-pulse": { lead: "blue", second: "saffron" },
  "/github-trending-pulse": { lead: "green", second: "blue" },
  "/frontier-models": { lead: "pink", second: "blue" },
  "/ai-dev-tools": { lead: "teal", second: "saffron" },
  "/tech-startup-tracker": { lead: "green", second: "saffron" },
  "/polling-aggregator": { lead: "saffron", second: "teal" },
  "/bay-area-transit": { lead: "teal", second: "saffron" },
  "/spacex-mission-control": { lead: "blue", second: "vermilion" },
};

export function getProjectPress(route: string): ProjectPress | undefined {
  return PROJECT_PRESS[route];
}
```

In `Catalog97ToolShell`, add `press?: ProjectPress` to the props and render the body wrapper as `<div data-c97-surface="paper" data-c97-press-second={press?.second}>`. In `ConditionalLayout`, pass `press={getProjectPress(pathname)}`. In `catalog97.css`, add the rules below after the dark overprint overrides, so they win on source order when specificity ties:

```css
/* A route's press sets the second ink for every sheet inside the tool shell. */
.c97-page [data-c97-press-second="blue"] [data-c97-surface] { --c97-overprint: var(--c97-riso-blue); }
.c97-page [data-c97-press-second="saffron"] [data-c97-surface] { --c97-overprint: var(--c97-riso-saffron); }
.c97-page [data-c97-press-second="vermilion"] [data-c97-surface] { --c97-overprint: var(--c97-riso-vermilion); }
.c97-page [data-c97-press-second="green"] [data-c97-surface] { --c97-overprint: var(--c97-riso-green); }
.c97-page [data-c97-press-second="teal"] [data-c97-surface] { --c97-overprint: var(--c97-riso-teal); }
.c97-page [data-c97-press-second="pink"] [data-c97-surface] { --c97-overprint: var(--c97-riso-pink); }
/* A blue offset vanishes on near-black dark paper, so it prints saffron there. */
.dark .c97-page [data-c97-press-second="blue"] [data-c97-surface="paper"],
.dark .c97-page [data-c97-press-second="blue"] [data-c97-surface="bone"] { --c97-overprint: var(--c97-riso-saffron); }
```

- [ ] **Step 4: Run the two suites** plus `src/components/__tests__/ConditionalLayout.test.tsx`. Expect all of them to pass.

- [ ] **Step 5: Commit** with `git commit -m "feat: give each project route its own ink pair"`.

### Task 3: The project hero

**Files:**
- Create: `src/components/catalog97/Catalog97ProjectHero.tsx` and `src/components/catalog97/__tests__/Catalog97ProjectHero.test.tsx`
- Modify: `src/app/catalog97.css` (append a short "Project hero" block)

**Interfaces:**
- Consumes: `RisoInk` from Task 2.
- Produces: `Catalog97ProjectHero` and `interface Catalog97Readout { label: string; value: ReactNode; detail?: ReactNode }`.

- [ ] **Step 1: Write the failing test.**

```tsx
import { render, screen } from "@testing-library/react";
import { Catalog97ProjectHero } from "../Catalog97ProjectHero";

it("prints the title as the page's one poster h1 on the lead ink", () => {
  const { container } = render(
    <Catalog97ProjectHero ink="teal" title="Earthquake Pulse" standfirst="Standfirst." meta="Snapshot Sep 24">
      <svg aria-label="signature" />
    </Catalog97ProjectHero>,
  );
  const h1 = screen.getByRole("heading", { level: 1, name: "Earthquake Pulse" });
  expect(h1).toHaveClass("c97-poster");
  expect(container.querySelector('[data-c97-surface="ink-teal"]')).toContainElement(h1);
  expect(screen.getByLabelText("signature")).toBeInTheDocument();
  expect(screen.getByText("Snapshot Sep 24")).toBeInTheDocument();
});

it("renders each readout as a label and value pair", () => {
  render(<Catalog97ProjectHero ink="blue" title="T" readouts={[{ label: "Strongest", value: "M5.3", detail: "Papua New Guinea" }]} />);
  expect(screen.getByText("Strongest")).toHaveClass("c97-stat-label");
  expect(screen.getByText("M5.3")).toHaveClass("c97-stat-value");
});

it("renders no readout list when there are none", () => {
  const { container } = render(<Catalog97ProjectHero ink="blue" title="T" />);
  expect(container.querySelector("dl")).toBeNull();
});
```

- [ ] **Step 2: Run it** with `npx jest src/components/catalog97/__tests__/Catalog97ProjectHero.test.tsx`. Expect it to fail because the module doesn't exist yet.

- [ ] **Step 3: Implement.**

```tsx
import type { ReactNode } from "react";
import type { RisoInk } from "@/constants/projectPress";

export interface Catalog97Readout {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

type AtMostThree<T> = [] | [T] | [T, T] | [T, T, T];

interface Catalog97ProjectHeroProps {
  ink: RisoInk;
  title: string;
  standfirst?: ReactNode;
  /** The as-of, source, or disclosure line the route already shows. */
  meta?: ReactNode;
  readouts?: AtMostThree<Catalog97Readout>;
  /** The route's signature visual. */
  children?: ReactNode;
}

/**
 * A project route's headline sheet. It prints only the headline, the numbers
 * that matter, and a slot, because the signature each route passes in is what
 * makes the page its own.
 */
export function Catalog97ProjectHero({ ink, title, standfirst, meta, readouts = [], children }: Catalog97ProjectHeroProps) {
  return (
    <section data-c97-surface={`ink-${ink}`} className="c97-band c97-sheet c97-project-hero">
      <div className="c97-shell">
        <h1 className="c97-poster">{title}</h1>
        {standfirst ? <p className="c97-lead" style={{ marginTop: "var(--c97-sp-3)" }}>{standfirst}</p> : null}
        {meta ? <p className="c97-meta" style={{ marginTop: "var(--c97-sp-2)" }}>{meta}</p> : null}
        {readouts.length > 0 ? (
          <dl className="c97-project-hero-readouts">
            {readouts.map((r) => (
              <div key={r.label} className="c97-stat">
                <dt className="c97-stat-label">{r.label}</dt>
                <dd className="c97-stat-value">{r.value}</dd>
                {r.detail ? <dd className="c97-stat-delta">{r.detail}</dd> : null}
              </div>
            ))}
          </dl>
        ) : null}
        {children ? <div className="c97-project-hero-signature">{children}</div> : null}
      </div>
    </section>
  );
}
```

Append this CSS:

```css
/* Project hero: the headline sheet of a project route. */
.c97-project-hero-readouts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--c97-sp-4);
  margin: var(--c97-sp-5) 0 0;
  max-width: 48rem;
}
.c97-project-hero-signature {
  margin-top: var(--c97-sp-5);
}
.c97-project-hero-signature svg {
  display: block;
  width: 100%;
  height: auto;
}
```

- [ ] **Step 4: Run the test** and expect it to pass. Then run `npx tsc --noEmit` to prove the readout tuple compiles. Passing four readouts should be a type error, so check that once with a throwaway line and remove it.

- [ ] **Step 5: Commit** with `git commit -m "feat: add the project hero sheet"`.

### Task 4: Token codemod and contrast sweep

**Files:**
- Create: `scripts/migrateHomeTokens.mjs`, its test (match whatever `scripts/__tests__` already uses for extension and import style), and `scripts/contrastSweep.mjs`
- Modify: `scripts/generateAutomationInventory.mjs` (add `DESCRIPTIONS` rows) and `docs/AUTOMATION_SCRIPTS.md` (regenerated)

**Interfaces:**
- Produces: `migrateHomeTokens(source: string): string`, exported and also runnable as a CLI over file paths. `contrastSweep.mjs` is a CLI, `node scripts/contrastSweep.mjs <baseUrl> <route...>`. It prints each failure as `route theme ratio selector text` and exits 1 if there is any failure.

- [ ] **Step 1: Write the failing codemod test.**

```js
import { migrateHomeTokens } from "../migrateHomeTokens.mjs";

it("maps every bridged token onto its Catalog 97 name", () => {
  const input =
    "text-[var(--home-ink-muted)] bg-[var(--home-paper-alt)] border-[var(--home-control-rule)] text-[var(--home-ink)] bg-[var(--home-paper)] text-[var(--home-signal-ink)] bg-[var(--home-signal-soft)]";
  expect(migrateHomeTokens(input)).toBe(
    "text-[var(--c97-ink-2)] bg-[var(--c97-field)] border-[var(--c97-ink-2)] text-[var(--c97-ink)] bg-[var(--c97-surface)] text-[var(--c97-accent)] bg-[var(--c97-accent-soft)]",
  );
});

it("leaves unknown --home tokens alone so the grep check catches them", () => {
  expect(migrateHomeTokens("var(--home-dark-paper)")).toBe("var(--home-dark-paper)");
});
```

- [ ] **Step 2: Run it** and confirm it fails.

- [ ] **Step 3: Implement the codemod.** The mapping is the bridge block in `catalog97.css`, verbatim. The regex captures the whole token name and looks it up exactly, so no ordering is needed.

```js
#!/usr/bin/env node
// Rewrites Working Instrument token references onto their Catalog 97 names,
// using the same mapping as the bridge block in src/app/catalog97.css.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const MAP = {
  "paper-raised": "field", "paper-alt": "field", "elev-mix": "field", paper: "surface",
  "ink-muted": "ink-2", "ink-soft": "label", ink: "ink",
  "signal-soft": "accent-soft", "signal-ink": "accent", signal: "accent",
  "control-rule": "ink-2", stone: "rule", rule: "rule", overlay: "overlay",
  positive: "positive", negative: "negative", warning: "warning",
};

export function migrateHomeTokens(source) {
  return source.replace(/var\(--home-([a-z-]+)\)/g, (whole, name) =>
    name in MAP ? `var(--c97-${MAP[name]})` : whole,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const file of process.argv.slice(2)) {
    const before = fs.readFileSync(file, "utf8");
    const after = migrateHomeTokens(before);
    if (after !== before) fs.writeFileSync(file, after);
    console.log(`${file}: ${(after.match(/var\(--home-/g) ?? []).length} --home references left`);
  }
}
```

- [ ] **Step 4: Write `contrastSweep.mjs`.** It launches Playwright Chromium and visits each route in both light and dark, setting `localStorage.theme` and the context `colorScheme`. For every visible element that has a direct text node, it computes the contrast of `color` against the effective background. To find that background it walks up the ancestors until it reaches a non-transparent `background-color`. Colours come back in several serialisations (`rgb(`, `rgba(`, `color(srgb …)`, `oklab(…)`), so it normalises all of them by painting the colour onto a 1×1 canvas inside the page and reading back the RGBA. The threshold is 4.5:1, or 3:1 when the computed font size is at least 24px, or at least 18.66px at weight 700 or more. It skips `aria-hidden` subtrees and anything with `visibility: hidden` or `opacity: 0`.

- [ ] **Step 5: Add inventory rows** for both scripts, then run `npm run docs:automation && npm run docs:automation -- --check`.

- [ ] **Step 6: Run the codemod test** and do a smoke run of the sweep against `/now` on the worktree dev server (`http://localhost:3100`), noting whatever it reports. Commit with `git commit -m "chore: add the token codemod and a contrast sweep"`.

### Task 5: Open PR 0

- [ ] Run `npx jest src/app src/components src/constants scripts`, `npx tsc --noEmit`, and `npx eslint src/components/catalog97 src/constants scripts`.
- [ ] Merge `origin/main`, run `npm run generate:sitemap`, and commit if anything changed.
- [ ] Push and open "feat: project UI foundation (six inks, press, project hero)". The body lists each new ink's measured ratios and says which CI failures were already on `main`.
- [ ] Hand the merge to Isaac.

---

## PR 1, data dashboards (branch `design/data-dashboard-signatures`, stacked on `design/project-specific-ui`)

Every route task below follows the same five moves, in this order, inside the route's own files:

1. Write the helper test, watch it fail, and then write the helper.
2. Build the signature component from the helper.
3. Restructure the client. Replace the old hero and the `HomeStatsPanel` block with `<Catalog97ProjectHero ink={PROJECT_PRESS[route].lead} …>{signature}</Catalog97ProjectHero>`, and delete the duplicated stat row and the chip row. Wrap each following section in a `c97-band c97-sheet`, alternating `data-c97-surface` between `paper` and `bone`, with `data-seam="torn"` wherever the surface changes. Set section h2s in `.c97-poster-sm`.
4. Run `node scripts/migrateHomeTokens.mjs` on every `.tsx` in the route, then strip `rounded-*` and `shadow-*`.
5. Run the route's Jest suites and the e2e specs its task lists, fix the tests the restructure changes, and commit.

### Task 6: Earthquake Pulse

**Files:**
- Create: `src/app/earthquake-pulse/seismogram.ts`, `src/app/earthquake-pulse/__tests__/seismogram.test.ts`, and `src/app/earthquake-pulse/EarthquakeSignature.tsx`
- Modify: `src/app/earthquake-pulse/earthquake-client.tsx`, plus every other `.tsx` in the route for the token rename

**Interfaces:**
- Consumes: `QuakeEvent` from `src/types/earthquake.ts` (`id`, `time`, `magnitude`, `latitude`, `longitude`, `depthKm`, `place`), `Catalog97ProjectHero`, and `PROJECT_PRESS`.
- Produces: `seismogramSpikes(quakes, windowEnd: Date, hours = 24): Spike[]`, where `Spike = { id: string; x: number; height: number; magnitude: number }` and both `x` and `height` fall in [0, 1]. Also `epicentres(quakes): Epicentre[]`, where `Epicentre = { id: string; x: number; y: number; r: number; depthBand: "shallow" | "intermediate" | "deep" }` and `x` and `y` fall in [0, 1] on an equirectangular projection.

- [ ] **Step 1: Test.**

```ts
import { seismogramSpikes, epicentres } from "../seismogram";

const end = new Date("2026-09-24T12:00:00Z");
const q = (id: string, hoursAgo: number, magnitude: number, lat = 0, lon = 0, depthKm = 10) => ({
  id,
  time: new Date(end.getTime() - hoursAgo * 3600e3).toISOString(),
  magnitude,
  latitude: lat,
  longitude: lon,
  depthKm,
});

it("places each quake at its time across the window and scales height by magnitude", () => {
  const [a, b] = seismogramSpikes([q("a", 12, 2.5), q("b", 0, 5)], end);
  expect(a.x).toBeCloseTo(0.5);
  expect(b.x).toBeCloseTo(1);
  expect(b.height).toBe(1);
  expect(a.height).toBeGreaterThan(0);
  expect(a.height).toBeLessThan(b.height);
});

it("drops quakes outside the window", () => {
  expect(seismogramSpikes([q("old", 30, 4)], end)).toEqual([]);
});

it("keeps small quakes visible beside a great one", () => {
  const spikes = seismogramSpikes([q("small", 1, 2.5), q("great", 2, 8.2)], end);
  expect(spikes.find((s) => s.id === "small")!.height).toBeGreaterThanOrEqual(0.08);
});

it("projects coordinates and bands depth", () => {
  expect(epicentres([q("p", 0, 5, 90, -180, 400)])[0]).toMatchObject({ x: 0, y: 0, depthBand: "deep" });
  expect(epicentres([q("c", 0, 5, 0, 0, 5)])[0]).toMatchObject({ x: 0.5, y: 0.5, depthBand: "shallow" });
});

it("returns nothing for an empty feed", () => {
  expect(seismogramSpikes([], end)).toEqual([]);
  expect(epicentres([])).toEqual([]);
});
```

- [ ] **Step 2: Implement.** Height is each quake's magnitude over the strongest quake's magnitude. Magnitude is already logarithmic in energy, and the 0.08 floor keeps an M2.5 visible beside an M8. The USGS depth bands are shallow under 70km, intermediate from 70 to 300km, and deep past that.

```ts
import type { QuakeEvent } from "@/types/earthquake";

type QuakePoint = Pick<QuakeEvent, "id" | "time" | "magnitude" | "latitude" | "longitude" | "depthKm">;
export interface Spike { id: string; x: number; height: number; magnitude: number }
export interface Epicentre { id: string; x: number; y: number; r: number; depthBand: "shallow" | "intermediate" | "deep" }

const FLOOR = 0.08;

export function seismogramSpikes(quakes: QuakePoint[], windowEnd: Date, hours = 24): Spike[] {
  const end = windowEnd.getTime();
  const start = end - hours * 3600e3;
  const inWindow = quakes.filter((quake) => {
    const t = Date.parse(quake.time);
    return t >= start && t <= end;
  });
  if (inWindow.length === 0) return [];
  const max = Math.max(...inWindow.map((quake) => quake.magnitude));
  return inWindow.map((quake) => ({
    id: quake.id,
    x: (Date.parse(quake.time) - start) / (end - start),
    magnitude: quake.magnitude,
    height: max <= 0 ? FLOOR : Math.max(FLOOR, quake.magnitude / max),
  }));
}

export function epicentres(quakes: QuakePoint[]): Epicentre[] {
  return quakes.map((quake) => ({
    id: quake.id,
    x: (quake.longitude + 180) / 360,
    y: (90 - quake.latitude) / 180,
    r: Math.max(1.5, quake.magnitude * 1.2),
    depthBand: quake.depthKm < 70 ? "shallow" : quake.depthKm <= 300 ? "intermediate" : "deep",
  }));
}
```

- [ ] **Step 3: Build `EarthquakeSignature`.** It is one SVG with `viewBox="0 0 1000 420"`.
  - The top 180 units hold the seismogram: a baseline rule in `var(--c97-ink)`, with each spike drawn as a vertical line of `height × 150` from the baseline. The strongest spike is labelled `M{magnitude} {place}` in `.c97-mono`.
  - The bottom 220 units hold the epicentre plot, with graticule lines every 30° in `var(--c97-rule)`, and one circle per quake filled with `var(--c97-ink)` at 0.9, 0.6, or 0.35 opacity for shallow, intermediate, and deep.
  - The SVG gets a `<title>` and an `aria-label` that give the count and the strongest quake.
  - When there are no spikes, render a `.c97-meta` line instead of the SVG: "No quakes of magnitude 2.5 or more in the past 24 hours."
  - Each circle and spike sits in a focusable `<g role="button" tabIndex={0}>` that calls the client's existing quake-select handler on click and Enter, so the detail panel stays the source of truth.

- [ ] **Step 4: Restructure** `earthquake-client.tsx`.
  - The hero gets three readouts, all computed from values the old panel already had, which are the strongest quake in 24 hours (magnitude as the value, place as the detail), the number of quakes in 24 hours, and felt reports in 24 hours.
  - Delete the `HomeStatsPanel` import and block.
  - The tabs, the list, `DistributionBars`, and the detail panel stay, in paper and bone sheets, and each Recent row reads as a log line of time, magnitude, place, and depth.
  - Run the token rename.

- [ ] **Step 5: Verify** with `npx jest src/app/earthquake-pulse` and `npx tsc --noEmit`.

- [ ] **Step 6: Commit** with `git commit -m "feat: rebuild Earthquake Pulse around a seismogram and epicentre plot"`.

### Task 7: News Pulse

**Files:**
- Create: `src/app/news-pulse/front-page.ts`, `src/app/news-pulse/__tests__/front-page.test.ts`, and `src/app/news-pulse/NewsFrontPage.tsx`
- Modify: `src/app/news-pulse/news-pulse-client.tsx`, `src/app/news-pulse/__tests__/news-pulse-client.test.tsx`, and every route `.tsx` for the token rename

**Interfaces:**
- Consumes: the story-cluster and topic-cluster types from `src/lib/news-pulse-utils.ts` (confirm the exact exported names first), and `NewsFeedId`.
- Produces: `leadStory(clusters): StoryCluster | null`, which picks the cluster covered by the most outlets and breaks ties on `totalCount`. Also `coverageMatrix(topics, outlets: NewsFeedId[]): { topics: string[]; rows: { outlet: NewsFeedId; counts: number[] }[]; max: number }`.

- [ ] **Step 1: Test.**

```ts
import { leadStory, coverageMatrix } from "../front-page";

const cluster = (id: string, sources: Record<string, number>, totalCount: number) =>
  ({ id, topic: id, sources, totalCount, articles: [] }) as never;

it("leads with the story the most outlets carried", () => {
  const wide = cluster("wide", { bbc: 1, nyt: 1, npr: 1 }, 3);
  const loud = cluster("loud", { bbc: 9 }, 9);
  expect(leadStory([loud, wide])).toBe(wide);
});

it("breaks outlet ties on total count", () => {
  const a = cluster("a", { bbc: 1, nyt: 1 }, 2);
  const b = cluster("b", { bbc: 3, nyt: 2 }, 5);
  expect(leadStory([a, b])).toBe(b);
});

it("fills zeros and keeps outlet order in the matrix", () => {
  const m = coverageMatrix([{ topic: "fed", count: 3, sources: { nyt: 3 } }] as never, ["bbc", "nyt"] as never);
  expect(m.rows).toEqual([{ outlet: "bbc", counts: [0] }, { outlet: "nyt", counts: [3] }]);
  expect(m.max).toBe(3);
});

it("handles an empty pull", () => {
  expect(leadStory([])).toBeNull();
  expect(coverageMatrix([], ["bbc"] as never)).toEqual({ topics: [], rows: [{ outlet: "bbc", counts: [] }], max: 0 });
});
```

- [ ] **Step 2: Implement** the two functions.

- [ ] **Step 3: Build `NewsFrontPage`.**
  - The masthead line carries the pull time as its dateline, in `.c97-meta`.
  - The lead story's representative headline is set in `.c97-serif` at `--c97-fs-h2`. Under it, each outlet's headline for that cluster, with the outlet name in its `sourceColor` chip, then the headline as a link.
  - Below that is the coverage matrix, a `.c97-table` with outlets as rows and topics as columns. Each cell is a square whose opacity is `count / max` in `var(--c97-ink)`, with the number printed inside. Zero cells stay empty. The caption reads "Coverage by outlet and topic".

- [ ] **Step 4: Restructure.**
  - The hero readouts are headlines in the pull, outlets reporting, and the size of the largest story cluster.
  - The Headlines view groups articles into columns by outlet (`grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr))`), each column headed by the outlet name.
  - `data-testid="news-pulse-shell"`, the tabs, the source dropdown, the feed-error banner, and the story-cluster table columns "Story cluster" and "Representative headline" all stay.
  - Run the token rename.

- [ ] **Step 5: Verify** with `npx jest src/app/news-pulse` and `npx playwright test e2e/product-surfaces.spec.ts -g "News"`.

- [ ] **Step 6: Commit** with `git commit -m "feat: set News Pulse as a front page with a coverage matrix"`.

### Task 8: GitHub Trending Pulse

**Files:**
- Create: `src/app/github-trending-pulse/star-log.ts`, `src/app/github-trending-pulse/__tests__/star-log.test.ts`, and `src/app/github-trending-pulse/StarLogBoard.tsx`
- Modify: `src/app/github-trending-pulse/github-trending-client.tsx`, and every route `.tsx` for the token rename

**Interfaces:**
- Consumes: `GitHubTrendingClientRepository` (`id`, `fullName`, `language`, `weeklyStars`, `weeklyStarsStatus`).
- Produces: `starBars(repos): { id: string; share: number; status: WeeklyStarsStatus }[]`, where `share` is `weeklyStars / max` clamped to [0, 1], with a 0.02 floor for any positive value. Also `languageShares(repos): { language: string; share: number }[]`, sorted descending, summing to 1, and leaving out zero or negative deltas.

- [ ] **Step 1: Test.**

```ts
import { starBars, languageShares } from "../star-log";

const repo = (id: string, weeklyStars: number, language: string | null = "TypeScript", weeklyStarsStatus = "measured") =>
  ({ id, fullName: id, weeklyStars, language, weeklyStarsStatus }) as never;

it("scales bars to the biggest week and floors small positive ones", () => {
  const [big, small] = starBars([repo("big", 50000), repo("small", 300)]);
  expect(big.share).toBe(1);
  expect(small.share).toBeGreaterThanOrEqual(0.02);
});

it("gives no bar to flat or negative weeks", () => {
  expect(starBars([repo("a", 10), repo("flat", 0), repo("neg", -5)]).map((b) => b.share)).toEqual([1, 0, 0]);
});

it("shares the week's stars by language and folds unknowns into Other", () => {
  expect(languageShares([repo("a", 30, "Go"), repo("b", 10, null)])).toEqual([
    { language: "Go", share: 0.75 },
    { language: "Other", share: 0.25 },
  ]);
});

it("handles an empty snapshot", () => {
  expect(starBars([])).toEqual([]);
  expect(languageShares([])).toEqual([]);
});
```

- [ ] **Step 2: Implement.**

- [ ] **Step 3: Build `StarLogBoard`.**
  - Each row shows `+{weeklyStars}` in `.c97-mono`, then a bar `share × 100%` wide, then the repository name in `.c97-serif` linking to GitHub, then total stars.
  - The bar is solid `var(--c97-ink)` when the delta is measured, a `repeating-linear-gradient` hatch in the same ink when partial, and an outline when it's only a baseline. A visible legend names the three.
  - Above the rows is the language strip, one flex row of segments sized by share and filled from `--c97-chart-1` to `--c97-chart-6`. Segments wider than 8% get a label underneath.
  - The board shows the top 12 of the current filter. `RepositoryTable` stays below it for sorting and filtering.

- [ ] **Step 4: Restructure.**
  - The hero readouts are repositories tracked, the 7-day star delta, and the leading language.
  - Delete the four `MetricCard`s and the `HomeStatsPanel`.
  - The snapshot ledger `dl` becomes one line in the hero's `meta`.
  - The degraded-source banner and the confidence badges stay.
  - Run the token rename.

- [ ] **Step 5: Verify** with `npx jest src/app/github-trending-pulse` and `npx playwright test e2e/product-surfaces.spec.ts -g "GitHub"`.

- [ ] **Step 6: Commit** with `git commit -m "feat: rebuild GitHub Trending Pulse as a star log"`.

### Task 9: Frontier Model Tracker

**Files:**
- Create: `src/app/frontier-models/readouts.ts` and `src/app/frontier-models/__tests__/readouts.test.ts`
- Modify: `src/app/frontier-models/frontier-models-client.tsx`, `components/FrontierCostContextChart.tsx` (tokens only), and `components/FrontierModelsTable.tsx` (mono numerals and tokens)

**Interfaces:**
- Consumes: the frontier model type in `src/types/frontierModels.ts`. Confirm the exact field names for input price, context window, name, and provider first.
- Produces: `frontierReadouts(models): { count: number; cheapest: Model | null; largestContext: Model | null }`.

- [ ] **Step 1: Test** the count; the cheapest model by input price, with ties broken on name; the largest context window; and nulls for empty input.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Restructure.**
  - `FrontierCostContextChart` goes into the hero as its children, for the filtered set.
  - The List and Chart toggle stays only in the lower section, which becomes the table.
  - The readouts are models tracked, the cheapest input price per million tokens (model name as detail), and the largest context window (model name as detail).
  - The stale-review warning goes directly under the hero as a `.c97-disclosure`.
  - Delete the panel and run the token rename.
- [ ] **Step 4: Verify** with `npx jest src/app/frontier-models`. It asserts `data-testid="frontier-table"`, so that id stays.
- [ ] **Step 5: Commit** with `git commit -m "feat: lead Frontier Model Tracker with its cost and context chart"`.

### Task 10: AI Dev Tool Ecosystem

**Files:**
- Create: `src/app/ai-dev-tools/surface-map.ts`, `src/app/ai-dev-tools/__tests__/surface-map.test.ts`, and `src/app/ai-dev-tools/SurfaceMap.tsx`
- Modify: `src/app/ai-dev-tools/ai-dev-tools-client.tsx`, and every route `.tsx` for the token rename

**Interfaces:**
- Consumes: `AiDevTool` (`id`, `name`, `category`, `pricingModel`) from `ai-dev-tools-data.ts`, plus the category and pricing option lists the filters already use.
- Produces: `surfaceMap(tools, categories: string[], pricing: string[]): { category: string; cells: { pricing: string; tools: AiDevTool[] }[] }[]`. It keeps the given order and puts any tool outside the lists in an "Other" row or column, which only appears when it has something in it.

- [ ] **Step 1: Test** the grouping; the order; the Other row, and that it appears only when needed; and that empty input returns rows with empty cells.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Build `SurfaceMap`.**
  - It is a CSS grid with the pricing models across the top as `.c97-kicker` headers and the categories down the side in `.c97-poster-sm`.
  - Each cell stacks tool names as small printed plates, and each plate is a `button` with `aria-pressed` that calls the existing select handler. A plate takes `.c97-offset` on hover and when selected, and `ToolCategoryIcon` stays on it.
  - At 390px the grid becomes a list of categories with their pricing groups underneath.
- [ ] **Step 4: Restructure.**
  - The hero readouts are tools tracked, open-source tools, and the most recent release.
  - The filters and the directory stay below the map, and the detail rail stays.
  - Delete the panel and run the token rename.
- [ ] **Step 5: Verify** with `npx jest src/app/ai-dev-tools`.
- [ ] **Step 6: Commit** with `git commit -m "feat: map AI dev tools by surface and pricing"`.

### Task 11: Tech Startup Tracker

**Files:**
- Create: `src/app/tech-startup-tracker/treemap.ts`, `src/app/tech-startup-tracker/__tests__/treemap.test.ts`, and `src/app/tech-startup-tracker/ValuationTreemap.tsx`
- Modify: `src/app/tech-startup-tracker/tech-startup-client.tsx`, and every route `.tsx` for the token rename

**Interfaces:**
- Consumes: the startup type in `src/types/techStartup.ts` (`id`, `name`, `sector`, `valuation`).
- Produces: `valuationTreemap(startups, width, height)`, which returns `{ sector, x0, y0, x1, y1, tiles: { id, name, valuation, x0, y0, x1, y1 }[] }[]`. It is built with `hierarchy` and `treemap().tile(treemapSquarify).paddingInner(2)` from `d3`, and leaves out startups whose valuation is missing, zero, or negative.

- [ ] **Step 1: Test** that each tile's area is proportional to its valuation within 1%, that tiles sit inside their sector's rectangle, that a zero-valuation startup is dropped, and that empty input returns `[]`.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Build `ValuationTreemap`.**
  - It is an SVG with `viewBox="0 0 1000 520"`.
  - Each sector group carries its name in `.c97-kicker`. Its tiles are filled from `--c97-chart-{n}` by sector index.
  - A tile prints its name and formatted valuation only when it is wider than 90 units and taller than 40. Every tile has a `<title>` with the full name and valuation.
  - The SVG's `aria-label` reads "Disclosed valuations by sector" and names the largest startup.
- [ ] **Step 4: Restructure.**
  - The hero readouts are startups tracked, combined valuation, and unicorns.
  - Delete the four `MetricCard`s and the panel. This route is the only consumer of `@/components/football/MetricCard` outside football.
  - The unverified disclosure goes under the hero as a `.c97-disclosure`.
  - Run the token rename.
- [ ] **Step 5: Verify** with `npx jest src/app/tech-startup-tracker`.
- [ ] **Step 6: Commit** with `git commit -m "feat: show startup valuations as a treemap"`.

### Task 12: Polling Aggregator

**Files:**
- Create: `src/app/polling-aggregator/state-tiles.ts`, `src/app/polling-aggregator/__tests__/state-tiles.test.ts`, and `src/app/polling-aggregator/StateTileGrid.tsx`
- Modify: `src/app/polling-aggregator/polling-aggregator-client.tsx`, and every route `.tsx` for the token rename

**Interfaces:**
- Consumes: `Race` (`stateAbbr`, `state`, `rating`) from `src/types/polling.ts`, plus the existing `TrendChart` and `GenericBallotBar`.
- Produces: `STATE_TILES: Readonly<Record<string, { col: number; row: number }>>`, the common 50-state tile cartogram plus DC on an 11 by 8 grid. Also `raceTiles(races): { abbr, col, row, race }[]`, which drops any race whose abbreviation isn't on the grid.

- [ ] **Step 1: Test** that all 50 states plus DC are present, that no two share a cell, that `raceTiles` returns only the races it was given, and that an unknown abbreviation is dropped.
- [ ] **Step 2: Implement** the constant by hand and write a short mapper.
- [ ] **Step 3: Build `StateTileGrid`.**
  - It is an 11-column CSS grid of square tiles for the races present. Each tile shows the abbreviation and the rating.
  - Tiles are filled in the rating's party colour, at the strength the rating implies. The party colours come from the tokens the route already uses for the approval chart, never a new hex.
  - When the snapshot has no races with metadata, the grid doesn't render, and the existing note that explains why stays.
- [ ] **Step 4: Restructure.**
  - `TrendChart` goes into the hero at full width with `GenericBallotBar` under it. The readouts are net approval, the generic ballot margin, and days to the election.
  - The Senate and Governors views keep their tables, with the tile grid added above them.
  - The VoteHub attribution, the metadata note, the Senate e2e heading "Senate Races", and the table name "Senate race ratings" all stay.
  - Run the token rename.
- [ ] **Step 5: Verify** with `npx jest src/app/polling-aggregator` and `npx playwright test e2e/product-surfaces.spec.ts -g "Polling"`.
- [ ] **Step 6: Commit** with `git commit -m "feat: lead Polling Aggregator with the approval trend and a state grid"`.

### Task 13: Bay Area Transit Pulse

**Files:**
- Create: `src/app/bay-area-transit/station-map.ts`, `src/app/bay-area-transit/__tests__/station-map.test.ts`, and `src/app/bay-area-transit/TransitSignature.tsx`
- Modify: `src/app/bay-area-transit/bay-area-transit-client.tsx`, and every route `.tsx` for the token rename

**Interfaces:**
- Consumes: `TransitStation` (`abbr`, `name`, `latitude`, `longitude`, `lines`), `TransitLine` (its id field and `hexColor`), and `TransitDeparture` (`minutes`, `hexColor`, destination). Confirm the exact field names in `src/types/bayAreaTransit.ts` first.
- Produces: `projectStations(stations, lines, width, height, pad = 16): { abbr: string; x: number; y: number; rings: string[] }[]`. It fits the stations' bounding box into the frame with an equirectangular projection, corrected by `cos(meanLatitude)` so the Bay doesn't stretch. `rings` holds the hex colours of the lines that serve each station, in line order.

- [ ] **Step 1: Test** that the westernmost station lands at x = pad and the northernmost at y = pad; that the aspect ratio holds within 1%; that a single station is centred; that a line missing from `lines` adds no ring; and that an empty list returns `[]`.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Build `TransitSignature`.**
  - On the left is the platform board for the selected station: a `.c97-panel` on the espresso surface, with the station name in `.c97-poster-sm` and up to eight departures. Each departure row is a bar in the line's colour, the destination, and the minutes in `.c97-mono` at `--c97-fs-h2`.
  - On the right is the station map, an SVG of dots ringed in their line colours, with the selected station drawn larger and labelled.
  - Each station dot sits in a focusable `<g role="button" tabIndex={0}>` that calls the existing select handler (which updates `?station=`) on click and Enter.
  - When departures are unavailable, the board shows the route's existing "unavailable" badge and copy.
- [ ] **Step 4: Restructure.**
  - The hero readouts are lines, stations, and active alerts, and the system card moves into the hero's `meta`.
  - The Lines, Departures, and Alerts views stay below, with their fresh, stale-fallback, and unavailable badges.
  - Delete the panel and run the token rename.
- [ ] **Step 5: Verify** with `npx jest src/app/bay-area-transit`.
- [ ] **Step 6: Commit** with `git commit -m "feat: give Bay Area Transit a platform board and station map"`.

### Task 14: SpaceX Mission Control

**Files:**
- Modify: `src/app/spacex-mission-control/spacex-mission-control-client.tsx` and `src/components/spacex/*.tsx` (token rename plus sheets)

- [ ] **Step 1: Restructure.** The existing hero banner becomes `Catalog97ProjectHero` with a blue lead, and `MissionControlHero` and the countdown become its children. `MissionLaunchTape` stays directly under it. `MissionStatFascia` and `MissionCadenceStrip` sit in the first paper sheet, and the board and drawer follow in bone and paper sheets.
- [ ] **Step 2: Rename tokens** on the route and on `src/components/spacex/*.tsx`, which holds 406 `--home-*` references, and strip the radius and shadow utilities.
- [ ] **Step 3: Verify** with `npx jest src/app/spacex-mission-control` and `npx playwright test e2e/product-surfaces.spec.ts -g "SpaceX"`. The ids `mission-hero`, `mission-board`, `mission-card-*`, and `mission-detail-panel`, and the `status=past` tab state, must pass unchanged.
- [ ] **Step 4: Commit** with `git commit -m "feat: print SpaceX Mission Control in the house inks"`.

### Task 15: PR 1 verification and review

- [ ] Run the full `npx jest`, `npx tsc --noEmit`, `npx eslint src/app src/components`, and `npx playwright test e2e/product-surfaces.spec.ts`.
- [ ] Run `node scripts/contrastSweep.mjs http://localhost:3100` over the nine routes and fix every failure.
- [ ] Screenshot the nine routes at 1440px and 390px in light and dark, 36 images in all. Look at each one, and fix any overflow, clipped labels, or marks that can't be read.
- [ ] Run the lighter loop, where one review agent reads the branch diff against the spec's PR 1 table and `DESIGN_CHECKLIST.md`, with refuters only on P1 findings. Apply the fixes in one batch, then do one post-fix sweep.
- [ ] Do a voice pass over every user-facing string that changed.
- [ ] Update `CLAUDE.md` and `STYLING.md` where they describe the ink set (three inks becomes six) and the tool routes, and add the `projectPress.ts` map to `CLAUDE.md`'s shell section.
- [ ] Merge `origin/main`, run `npm run generate:sitemap`, and commit if anything changed. Push and open "feat: data dashboards rebuilt around their signatures", noting which CI failures were already on `main`. Hand the merge to Isaac.
