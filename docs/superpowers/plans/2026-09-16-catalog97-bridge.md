# Catalog 97 Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the Catalog 97 header, footer, tokens, and type on every route except the seven that already have them, extend the language with the status, chart, mono, and component vocabulary the dashboards need, and delete the Working Instrument header and footer, without touching any page component.

**Architecture:** `ConditionalLayout` wraps every non-designed route in a new `Catalog97ToolShell`, which is `Catalog97Shell` plus an optional title band and the build-note aside. A bridge block in `catalog97.css` redeclares every `--home-*` token as an alias of the `--c97-*` value for the enclosing surface, so the several thousand Tailwind `var(--home-*)` utilities repaint through one rule. New status tokens, a chart ramp, and five component classes land in the same stylesheet.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Jest with Testing Library, Playwright. Test commands are `npm run typecheck`, `npm run lint`, `npx jest <path>`, `npx playwright test <spec>`.

**Spec:** `docs/superpowers/specs/2026-09-16-catalog97-unification-design.md`. This plan covers the spec's part one and part two only. Families 0 through 8 and the close-out get their own plans once this PR is on main.

## Global Constraints

- Every `--c97-*` value is declared under `[data-c97]` or `[data-c97-surface]`, never under a class selector.
- The frozen scales do not grow: nine type steps, `--c97-sp-1` through `--c97-sp-7` plus `--c97-gutter`, four line heights, three measures, eight surfaces.
- No radius, no shadow, and no `color-mix(…, white)` anywhere in Catalog 97 CSS.
- The anchor reset stays exactly `:where(.c97-page) a { color: inherit; }`.
- Tobacco carries text at `--c97-fs-h2` and above only. The same rule applies to status colour on light-mode camel, light-mode stone, and dark-mode stone, per the measurements in Task 1.
- Anton is never used for anything but `--c97-fs-plate` numerals. The new `.c97-stat` value uses the body face.
- No new font downloads. `--c97-font-mono` reuses `--font-fragment-mono` from `src/app/layout.tsx`.
- Commit messages follow `<type>: <description>` with no attribution trailer. Branch is `design/catalog97-unification`.
- Prose in the surface brief and doc edits follows `WRITING_VOICE.md`. Sentence-case headings, no em dashes, no bold-label bullets.
- `/admin` gets the Catalog 97 chrome and the bridge like every other route, because the only alternative is keeping the Working Instrument header alive for one private page. No family PR will restyle its internals.

---

## File map

| File | Action | Responsibility |
| --- | --- | --- |
| `src/app/catalog97.css` | Modify | Status tokens, chart ramp, mono face, the `--home-*` bridge, five component classes, form controls |
| `src/app/globals.css` | Modify | Delete `--home-haze`, `--home-acid`, `--home-acid-soft`, `--home-moss`, `--color-secondary` |
| `src/app/investments/investments.module.css` | Modify | Delete the same four legacy tokens from `.terminalScope` |
| `tailwind.config.ts` | Modify | Delete the `secondary` colour entry |
| `src/app/__tests__/catalog97-bridge.test.ts` | Create | Parses both stylesheets and asserts the bridge covers every `:root` `--home-*` token and the legacy tokens are gone |
| `src/components/catalog97/Catalog97ToolShell.tsx` | Create | Shell plus optional title band plus build-note aside |
| `src/components/catalog97/__tests__/Catalog97ToolShell.test.tsx` | Create | Renders the shell with and without the band and the note |
| `src/components/ConditionalLayout.tsx` | Modify | Two branches: designed seven pass through, everything else wraps in `Catalog97ToolShell` |
| `src/components/__tests__/ConditionalLayout.test.tsx` | Modify | Rewritten for the two branches |
| `src/app/layout.tsx` | Modify | Remove `StaticHeader` |
| `src/app/__tests__/layout.test.tsx` | Modify | Remove the `StaticHeader` mock |
| `src/components/StaticHeader.tsx`, `src/components/Footer.tsx`, `src/components/ContactCta.tsx`, `src/components/ContactCta.module.css`, `src/constants/navlinks.tsx` | Delete | Working Instrument chrome |
| `src/components/__tests__/StaticHeader.test.tsx`, `src/components/__tests__/Footer.test.tsx` | Delete | Tests for the deleted chrome |
| `e2e/footer-cta.spec.ts` | Modify | Writing-detail test expects the Catalog 97 footer |
| `e2e/investments.spec.ts` | Modify | Discoverability test goes through the Dashboards link |
| `.impeccable/surfaces/src-components-catalog97-catalog97toolshell-tsx.md` | Create | Surface brief for the tool shell |
| `CLAUDE.md`, `AGENTS.md` | Modify | Shell paragraph reflects the new wiring |

---

### Task 1: Status tokens, chart ramp, and mono face

**Files:**
- Modify: `src/app/catalog97.css` (token block at lines 44–120, surface blocks at lines 159–260 and 294–380)

**Interfaces:**
- Produces: `--c97-positive`, `--c97-negative`, `--c97-warning` on every surface in both themes; `--c97-chart-1` through `--c97-chart-6`, `--c97-chart-up`, `--c97-chart-down`; `--c97-font-mono`. Task 2 aliases `--home-positive` and friends onto these.

- [ ] **Step 1: Save the contrast checker to the scratchpad**

Write this to `<scratchpad>/c97-contrast.py`. It is the check for this task and Task 2 and is not committed.

```python
import sys
def lum(h):
    h = h.lstrip('#'); r, g, b = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
def cr(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

light = {'paper': '#f1ebdf', 'bone': '#e4dbc9', 'camel': '#c09461', 'stone': '#a79e8f',
         'tobacco': '#8a6642', 'chocolate': '#4a3728', 'pine': '#0d3531', 'espresso': '#2b211a'}
dark = {'paper': '#14100c', 'bone': '#1e1811', 'camel': '#6e4e2e', 'stone': '#6e655a',
        'tobacco': '#573d26', 'chocolate': '#3a2b1f', 'pine': '#0e3833', 'espresso': '#0c0907'}
dark_ink = {'positive': '#1b4d2c', 'negative': '#7a1c1c', 'warning': '#5c3600'}
light_ink = {'positive': '#a8e0b4', 'negative': '#fbcdc7', 'warning': '#f5cf7a'}
large_only = {('light', 'camel'), ('light', 'stone'), ('light', 'tobacco'), ('dark', 'stone')}

failures = []
for theme, surfaces in (('light', light), ('dark', dark)):
    for name, bg in surfaces.items():
        ink_is_dark = theme == 'light' and name in ('paper', 'bone', 'camel', 'stone')
        toks = dark_ink if ink_is_dark else light_ink
        floor = 3.0 if (theme, name) in large_only else 4.5
        for tok, hexv in toks.items():
            ratio = cr(hexv, bg)
            print(f"{theme:5} {name:9} {tok:8} {hexv} {ratio:5.2f} floor {floor}")
            if ratio < floor:
                failures.append((theme, name, tok, ratio))

light_ramp = ['#0d3531', '#8a6642', '#6e2b36', '#4a3728', '#6e4e2e', '#2b211a']
dark_ramp = ['#5a9a8c', '#c09461', '#c2707c', '#a79e8f', '#e4dbc9', '#8a6642']
for label, ramp, bg in (('light', light_ramp, light['paper']), ('dark', dark_ramp, dark['paper'])):
    for i, c in enumerate(ramp, 1):
        ratio = cr(c, bg)
        print(f"{label} chart-{i} {c} on paper {ratio:5.2f}")
        if ratio < 3.0:
            failures.append((label, f'chart-{i}', c, ratio))

print("FAIL" if failures else "OK", failures)
sys.exit(1 if failures else 0)
```

- [ ] **Step 2: Run it to see the values pass before they go into CSS**

Run: `python3 <scratchpad>/c97-contrast.py`
Expected: last line `OK []`. The measured floors are 3.57 for positive on light camel, 3.81 for positive on dark stone, 3.45 for positive on light tobacco, all against a 3.0 floor on those large-only surfaces, and at least 4.5 everywhere else.

- [ ] **Step 3: Add the mono face and the chart ramps to the `[data-c97]` token block**

In `src/app/catalog97.css`, directly after the `--c97-font-script` declaration (around line 67), add:

```css
  /*
   * Mono face for readouts, code, and tabular data. Fragment Mono is already
   * loaded by layout.tsx for the Working Instrument, so this costs no download.
   */
  --c97-font-mono: var(--font-fragment-mono), ui-monospace, SFMono-Regular, monospace;

  /*
   * Categorical chart ramp. Six steps from the palette itself, each measured
   * at 3:1 or better against paper: pine 11.26, tobacco 4.36, oxblood 8.58,
   * chocolate 9.47, dark camel 6.34, espresso 13.25. Steps are separated by
   * hue rather than by luminance, so do not expect adjacent steps to contrast
   * with each other; a chart that needs that uses up and down instead.
   * Charts resolve these at render time through getComputedStyle.
   */
  --c97-chart-1: #0d3531;
  --c97-chart-2: #8a6642;
  --c97-chart-3: #6e2b36;
  --c97-chart-4: #4a3728;
  --c97-chart-5: #6e4e2e;
  --c97-chart-6: #2b211a;
```

Then in the existing `.dark [data-c97]` rule (around line 128, the one that sets `--c97-paper-base: #14100c;`), add:

```css
  /*
   * Dark ramp, measured against dark paper: 5.80, 6.90, 5.32, 7.15, 13.77,
   * 3.66. Same hue order as light so a series keeps its colour across themes.
   */
  --c97-chart-1: #5a9a8c;
  --c97-chart-2: #c09461;
  --c97-chart-3: #c2707c;
  --c97-chart-4: #a79e8f;
  --c97-chart-5: #e4dbc9;
  --c97-chart-6: #8a6642;
```

- [ ] **Step 4: Add status tokens to every light-mode surface**

The four light-ink surfaces get the dark set. Add these three lines to each of `[data-c97-surface="paper"]`, `"bone"`, `"camel"`, and `"stone"` in the light block (after each block's `--c97-field` line):

```css
  --c97-positive: #1b4d2c;
  --c97-negative: #7a1c1c;
  --c97-warning: #5c3600;
```

The four dark-ink surfaces get the light set. Add to `"tobacco"`, `"chocolate"`, `"pine"`, and `"espresso"` in the light block:

```css
  --c97-positive: #a8e0b4;
  --c97-negative: #fbcdc7;
  --c97-warning: #f5cf7a;
```

Add this comment above the camel block, since camel and stone share tobacco's constraint for status colour:

```css
/*
 * Status colour on camel and stone is LARGE-TEXT-OR-MARK ONLY, the same rule
 * tobacco already carries for all text. The darkest usable greens, reds, and
 * ambers measure 3.57 to 4.00 on these two mid-tones, which clears 3:1 for a
 * dot, a bar, or text at --c97-fs-h2 and up, and never clears 4.5:1 for body
 * copy. Body-size status text on camel or stone uses --c97-ink instead.
 */
```

- [ ] **Step 5: Add status tokens to every dark-mode surface**

Every dark-mode surface carries light ink, so all eight `.dark .c97-page [data-c97-surface="…"]` blocks get the light set:

```css
  --c97-positive: #a8e0b4;
  --c97-negative: #fbcdc7;
  --c97-warning: #f5cf7a;
```

Add this comment above the dark stone block:

```css
/* Dark stone is a mid-tone: status colour measures 3.81 to 3.99 here, so it is large-text-or-mark only, like light camel and stone. */
```

Also add `--c97-chart-up: var(--c97-positive);` and `--c97-chart-down: var(--c97-negative);` to the generic `.c97-page [data-c97-surface]` rule at line 154, so they follow the surface:

```css
.c97-page [data-c97-surface] {
  background: var(--c97-surface);
  color: var(--c97-ink);
  --c97-chart-up: var(--c97-positive);
  --c97-chart-down: var(--c97-negative);
}
```

- [ ] **Step 6: Lint pass, then commit**

Run: `npm run lint && npx jest src/app/__tests__ src/components/catalog97 2>&1 | tail -5`
Expected: lint clean, existing suites pass.

```bash
git add src/app/catalog97.css
git commit -m "feat(catalog97): add status tokens, chart ramp, and mono face"
```

---

### Task 2: The `--home-*` bridge

**Files:**
- Modify: `src/app/catalog97.css` (new block after the dark surface block, before `Layout primitives` around line 400)
- Modify: `src/app/globals.css`, `src/app/investments/investments.module.css`, `tailwind.config.ts`
- Create: `src/app/__tests__/catalog97-bridge.test.ts`

**Interfaces:**
- Consumes: Task 1's status tokens and `--c97-font-mono`.
- Produces: every `--home-*`, `--radius-*`, `--shadow-*`, and `--font-*` token from `globals.css` `:root` redeclared inside the Catalog 97 scope. Nothing else in this PR depends on specific alias values, but the whole site does.

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
import path from "node:path";

const globals = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
const catalog = readFileSync(path.join(process.cwd(), "src/app/catalog97.css"), "utf8");

/** Every custom property declared inside the first `:root {` block of globals.css. */
function rootTokens(css: string, prefix: string): string[] {
  const start = css.indexOf(":root {");
  const end = css.indexOf("\n}", start);
  const block = css.slice(start, end);
  return Array.from(new Set(block.match(new RegExp(`--${prefix}-[a-z0-9-]+(?=:)`, "g")) ?? []));
}

/** Custom properties declared anywhere between the bridge markers in catalog97.css. */
function bridgeTokens(): Set<string> {
  const start = catalog.indexOf("/* BRIDGE START */");
  const end = catalog.indexOf("/* BRIDGE END */");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const block = catalog.slice(start, end);
  return new Set(block.match(/--(?:home|radius|shadow|font)-[a-z0-9-]+(?=:)/g) ?? []);
}

describe("Catalog 97 bridge", () => {
  const bridged = bridgeTokens();

  it.each(["home", "radius", "shadow"])("aliases every :root --%s-* token", (prefix) => {
    const missing = rootTokens(globals, prefix).filter((token) => !bridged.has(token));
    expect(missing).toEqual([]);
  });

  it("aliases the font tokens components read", () => {
    for (const token of [
      "--font-body",
      "--font-heading",
      "--font-display",
      "--font-mono",
      "--font-inter",
      "--font-jetbrains-mono",
      "--font-home-sans",
      "--font-home-serif",
    ]) {
      expect(bridged.has(token)).toBe(true);
    }
  });

  it("has retired the legacy accents everywhere", () => {
    for (const legacy of ["--home-haze", "--home-acid", "--home-acid-soft", "--home-moss", "--color-secondary"]) {
      expect(globals).not.toContain(legacy);
      expect(catalog).not.toContain(legacy);
    }
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest src/app/__tests__/catalog97-bridge.test.ts`
Expected: FAIL. The first `expect(start).toBeGreaterThan(-1)` fails because the markers do not exist, and the legacy test fails because `globals.css` still declares `--home-haze`.

- [ ] **Step 3: Write the bridge block**

Insert into `src/app/catalog97.css` immediately before the `/* ---- Layout primitives` comment (around line 400):

```css
/* --------------------------------------------------------------------------
 * Working Instrument bridge
 * ------------------------------------------------------------------------ */

/*
 * Every route except the seven designed ones still renders components written
 * against the Working Instrument's --home-* palette, mostly through Tailwind
 * utilities of the shape text-[var(--home-ink)]. Rather than touch each of
 * those, the tokens are redeclared here as aliases of the Catalog 97 value for
 * the enclosing surface, so one rule repaints the whole site and a nested
 * surface re-resolves them on its own element. The :root declarations in
 * globals.css stay until the last family migrates and this block is deleted.
 *
 * The test in src/app/__tests__/catalog97-bridge.test.ts reads the two
 * markers below and asserts that every :root --home-*, --radius-*, and
 * --shadow-* token is redeclared between them. Keep the markers.
 */
/* BRIDGE START */
[data-c97] {
  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;
  --radius-xl: 0;
  --radius-2xl: 0;
  --radius-3xl: 0;
  --radius-pill: 0;

  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --shadow-xl: none;

  --font-body: var(--c97-font-body);
  --font-heading: var(--c97-font-body);
  --font-display: var(--c97-font-display);
  --font-inter: var(--c97-font-body);
  --font-home-sans: var(--c97-font-body);
  --font-home-serif: var(--c97-font-display);
  --font-mono: var(--c97-font-mono);
  --font-jetbrains-mono: var(--c97-font-mono);

  /* Dark-section overrides map onto espresso. */
  --home-dark-paper: #2b211a;
  --home-dark-panel: #3a2b1f;
  --home-dark-ink: #f1ebdf;
  --home-dark-muted: #dcd2bf;
  --home-dark-rule: rgba(241, 235, 223, 0.18);
}

.dark [data-c97] {
  --home-dark-paper: #0c0907;
  --home-dark-panel: #1e1811;
  --home-dark-ink: #f1ebdf;
  --home-dark-muted: #dcd2bf;
  --home-dark-rule: rgba(241, 235, 223, 0.16);
}

/*
 * Surface-relative aliases. Declared on the surface element so that a nested
 * [data-c97-surface] re-resolves every one of them against its own tokens.
 * Specificity (0,2,0) ties the surface blocks above and wins on order.
 */
.c97-page [data-c97-surface] {
  --home-paper: var(--c97-surface);
  --home-paper-alt: var(--c97-field);
  --home-paper-raised: var(--c97-field);
  --home-elev-mix: var(--c97-field);
  --home-ink: var(--c97-ink);
  --home-ink-muted: var(--c97-ink-2);
  --home-ink-soft: var(--c97-label);
  --home-signal: var(--c97-accent);
  --home-signal-ink: var(--c97-accent);
  /* 16% accent on paper is #dcccc4: accent text on it 6.54:1, ink 10.09:1. */
  --home-signal-soft: color-mix(in srgb, var(--c97-accent) 16%, var(--c97-surface));
  --home-stone: var(--c97-rule);
  --home-rule: var(--c97-rule);
  /* Control boundaries want 3:1; ink-2 clears that on every surface. */
  --home-control-rule: var(--c97-ink-2);
  --home-overlay: color-mix(in srgb, var(--c97-ink) 8%, transparent);
  --home-positive: var(--c97-positive);
  --home-negative: var(--c97-negative);
  --home-warning: var(--c97-warning);
}
/* BRIDGE END */
```

- [ ] **Step 4: Delete the legacy accents**

In `src/app/globals.css`:
- Delete the four lines `--home-acid: #D7E74F;`, `--home-acid-soft: #EEF49D;`, `--home-moss: #B8C793;`, `--home-haze: #5672F8;` from `:root` (around lines 267–270) and the matching four from the `.dark` block (around lines 380–383).
- Delete `--color-secondary: var(--home-haze); /* @kind color */` (line 174).
- Rewrite the palette comment above `--home-paper` so it no longer mentions the three legacy accents. Replace the sentence beginning `--home-acid,` through `do not use them in new work.` with `The legacy accents were deleted on 2026-09-16 once they had no consumers.`

In `src/app/investments/investments.module.css`, delete the four lines `--home-acid: #A8B846;`, `--home-acid-soft: #596134;`, `--home-moss: #6F7A4F;`, `--home-haze: #6F85FF;` from `.terminalScope` (lines 35–38).

In `tailwind.config.ts`, delete the line `secondary: "var(--color-secondary)",` (line 28).

Then confirm nothing else reads them:

Run: `command grep -rn 'home-haze\|home-acid\|home-moss\|color-secondary\|bg-secondary\|text-secondary\b' src tailwind.config.ts --include='*.ts' --include='*.tsx' --include='*.css' | grep -v 'retires the last --home-moss'`
Expected: no output. The one surviving hit is a code comment in `best-ball-draft-board.tsx` that records history, which is fine.

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npx jest src/app/__tests__/catalog97-bridge.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add src/app/catalog97.css src/app/globals.css src/app/investments/investments.module.css tailwind.config.ts src/app/__tests__/catalog97-bridge.test.ts
git commit -m "feat(catalog97): bridge every Working Instrument token onto the Catalog 97 surface"
```

---

### Task 3: Component classes and form controls

**Files:**
- Modify: `src/app/catalog97.css` (after `textarea.c97-field`, around line 828)
- Modify: `src/app/__tests__/catalog97-bridge.test.ts`

**Interfaces:**
- Produces: `.c97-table`, `.c97-stat` with children `.c97-stat-label`, `.c97-stat-value`, `.c97-stat-delta`, `.c97-chip` with modifiers `.c97-chip-positive`, `.c97-chip-negative`, `.c97-chip-warning`, `.c97-segmented` with child buttons using `aria-pressed`, `.c97-panel`, `.c97-mono`, and `select.c97-field`, `.c97-check`, `.c97-range`. Family PRs migrate onto these names.

- [ ] **Step 1: Add the class-presence assertion to the bridge test**

Append to `src/app/__tests__/catalog97-bridge.test.ts` inside the `describe`:

```ts
  it("ships the tool vocabulary the family migrations move onto", () => {
    for (const cls of [
      ".c97-table",
      ".c97-stat",
      ".c97-stat-label",
      ".c97-stat-value",
      ".c97-stat-delta",
      ".c97-chip",
      ".c97-chip-positive",
      ".c97-chip-negative",
      ".c97-chip-warning",
      ".c97-segmented",
      ".c97-panel",
      ".c97-mono",
      ".c97-check",
      ".c97-range",
    ]) {
      expect(catalog).toMatch(new RegExp(`${cls.replace(".", "\\.")}[\\s,{]`));
    }
  });
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest src/app/__tests__/catalog97-bridge.test.ts -t vocabulary`
Expected: FAIL on `.c97-table`.

- [ ] **Step 3: Add the classes**

Insert after the `textarea.c97-field` rule in `src/app/catalog97.css`:

```css
select.c97-field {
  appearance: none;
  padding-right: calc(var(--c97-sp-2) + 1.25em);
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position:
    calc(100% - var(--c97-sp-2) - 0.5em) 50%,
    calc(100% - var(--c97-sp-2)) 50%;
  background-size: 0.5em 0.5em;
  background-repeat: no-repeat;
}

/* Checkbox and radio: a 20px ink-bordered square or circle, filled with accent when checked. */
.c97-check {
  appearance: none;
  width: 20px;
  height: 20px;
  margin: 0;
  border: 2px solid var(--c97-ink-2);
  border-radius: 0;
  background: var(--c97-field);
  display: inline-grid;
  place-content: center;
  cursor: pointer;
}

.c97-check[type="radio"] {
  border-radius: 50%;
}

.c97-check::before {
  content: "";
  width: 10px;
  height: 10px;
  background: var(--c97-accent);
  transform: scale(0);
  transition: transform 120ms ease;
}

.c97-check[type="radio"]::before {
  border-radius: 50%;
}

.c97-check:checked::before {
  transform: scale(1);
}

.c97-range {
  appearance: none;
  width: 100%;
  height: 44px;
  margin: 0;
  background: transparent;
  cursor: pointer;
}

.c97-range::-webkit-slider-runnable-track {
  height: 2px;
  background: var(--c97-ink-2);
}

.c97-range::-moz-range-track {
  height: 2px;
  background: var(--c97-ink-2);
}

.c97-range::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  margin-top: -9px;
  border: 0;
  border-radius: 0;
  background: var(--c97-accent);
}

.c97-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 0;
  background: var(--c97-accent);
}

/* --------------------------------------------------------------------------
 * Tool vocabulary
 * ------------------------------------------------------------------------ */

/* Readouts, code, and anything that needs a fixed pitch. */
.c97-mono {
  font-family: var(--c97-font-mono);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

/*
 * A standings or rankings table. Hairline rules only, tabular numerals, and a
 * sticky header so a long table keeps its column names. Column headings take
 * the label step, the same 11px tracked uppercase every kicker uses.
 */
.c97-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--c97-fs-small);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

.c97-table th,
.c97-table td {
  padding: var(--c97-sp-1) var(--c97-sp-2);
  text-align: left;
  border-bottom: 1px solid var(--c97-rule);
  vertical-align: baseline;
}

.c97-table th {
  position: sticky;
  top: 0;
  background: var(--c97-surface);
  font-size: var(--c97-fs-label);
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c97-label);
}

.c97-table [data-align="end"] {
  text-align: right;
}

.c97-table tbody tr:hover {
  background: color-mix(in srgb, var(--c97-surface) 92%, var(--c97-ink));
}

/*
 * The label, value, delta triplet. The value is set in the body face at the
 * h2 step, never Anton, which is reserved for plate numerals.
 */
.c97-stat {
  display: grid;
  gap: var(--c97-sp-1);
  align-content: start;
}

.c97-stat-label {
  font-size: var(--c97-fs-label);
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c97-label);
  margin: 0;
}

.c97-stat-value {
  font-size: var(--c97-fs-h2);
  line-height: var(--c97-lh-tight);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  color: var(--c97-ink);
  margin: 0;
}

.c97-stat-delta {
  font-size: var(--c97-fs-small);
  font-variant-numeric: tabular-nums;
  color: var(--c97-ink-2);
  margin: 0;
}

.c97-stat-delta[data-tone="positive"] {
  color: var(--c97-positive);
}

.c97-stat-delta[data-tone="negative"] {
  color: var(--c97-negative);
}

/*
 * A status or category tag. Label-step uppercase on the field tint, no
 * radius. The tone modifiers colour the text only; on camel, stone, and
 * tobacco the label step is under the large-text floor, so a chip there
 * stays in ink and signals tone through its text instead.
 */
.c97-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--c97-sp-1);
  min-height: 28px;
  padding: 0 var(--c97-sp-2);
  background: var(--c97-field);
  color: var(--c97-ink);
  font-size: var(--c97-fs-label);
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.c97-page [data-c97-surface="paper"] .c97-chip-positive,
.c97-page [data-c97-surface="bone"] .c97-chip-positive,
.c97-page [data-c97-surface="chocolate"] .c97-chip-positive,
.c97-page [data-c97-surface="pine"] .c97-chip-positive,
.c97-page [data-c97-surface="espresso"] .c97-chip-positive {
  color: var(--c97-positive);
}

.c97-page [data-c97-surface="paper"] .c97-chip-negative,
.c97-page [data-c97-surface="bone"] .c97-chip-negative,
.c97-page [data-c97-surface="chocolate"] .c97-chip-negative,
.c97-page [data-c97-surface="pine"] .c97-chip-negative,
.c97-page [data-c97-surface="espresso"] .c97-chip-negative {
  color: var(--c97-negative);
}

.c97-page [data-c97-surface="paper"] .c97-chip-warning,
.c97-page [data-c97-surface="bone"] .c97-chip-warning,
.c97-page [data-c97-surface="chocolate"] .c97-chip-warning,
.c97-page [data-c97-surface="pine"] .c97-chip-warning,
.c97-page [data-c97-surface="espresso"] .c97-chip-warning {
  color: var(--c97-warning);
}

/*
 * A pressed-button tab group, drawn the way the /dashboards category filter
 * already is. The gap is --c97-sp-3 on both axes because .c97-microlink buys
 * its 44px target with padding plus negative margin, and anything tighter
 * overlapped rows on a phone; see the dashboards surface brief.
 */
.c97-segmented {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--c97-sp-3);
  row-gap: var(--c97-sp-3);
  margin: 0;
  padding: 0;
  border: 0;
}

.c97-segmented > button {
  background: none;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: baseline;
  gap: var(--c97-sp-1);
  color: var(--c97-label);
  font: inherit;
}

.c97-segmented > button[aria-pressed="true"] {
  color: var(--c97-ink);
  box-shadow: inset 0 -2px 0 var(--c97-accent);
}

/*
 * A raised card, drawer, or sidebar. In this language elevation is a surface
 * change, so a panel is the field tint with no border and no shadow. Set
 * data-c97-surface on it instead when it needs its own ink.
 */
.c97-panel {
  background: var(--c97-field);
  padding: var(--c97-sp-3);
}
```

- [ ] **Step 4: Run the test and lint**

Run: `npx jest src/app/__tests__/catalog97-bridge.test.ts && npm run lint`
Expected: PASS, 6 tests; lint clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/catalog97.css src/app/__tests__/catalog97-bridge.test.ts
git commit -m "feat(catalog97): add table, stat, chip, segmented, panel, and form control classes"
```

---

### Task 4: `Catalog97ToolShell`

**Files:**
- Create: `src/components/catalog97/Catalog97ToolShell.tsx`
- Create: `src/components/catalog97/__tests__/Catalog97ToolShell.test.tsx`

**Interfaces:**
- Consumes: `Catalog97Shell` from `./Catalog97Shell` (props `children`, `wordmark?: boolean`), `ProjectBuildNote` from `@/components/ProjectBuildNote` (props `href: string`, `route: string`).
- Produces: `Catalog97ToolShell({ children, band?, buildNoteHref?, route })` where `band` is `{ kicker: string; title: string; standfirst?: string }`. Task 5 renders it from `ConditionalLayout` with `band` omitted, since every route already draws its own `h1`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { Catalog97ToolShell } from "@/components/catalog97/Catalog97ToolShell";

jest.mock("next/navigation", () => ({
  usePathname: () => "/nba",
}));

jest.mock("@/components/ui/DeferredThemeToggle", () => ({
  DeferredThemeToggle: () => <button type="button" aria-label="Theme" />,
}));

jest.mock("@/components/search/HeaderSearchPanel", () => ({
  HeaderSearchPanel: () => null,
}));

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => jest.requireActual("@/components/ProjectBuildNote").ProjectBuildNote,
}));

describe("Catalog97ToolShell", () => {
  it("owns the Catalog 97 chrome and the main landmark", () => {
    render(
      <Catalog97ToolShell route="/nba">
        <h1>NBA Pulse</h1>
      </Catalog97ToolShell>,
    );

    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("contentinfo", { name: "Site footer" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.querySelector(".c97-page[data-c97]")).not.toBeNull();
  });

  it("renders no band and no build note by default", () => {
    render(
      <Catalog97ToolShell route="/now">
        <h1>Now</h1>
      </Catalog97ToolShell>,
    );

    expect(screen.queryByText("Build notes")).toBeNull();
    expect(screen.queryByText("Project context")).toBeNull();
    expect(document.querySelector("[data-c97-band='title']")).toBeNull();
  });

  it("renders the title band as the only h1 when asked", () => {
    render(
      <Catalog97ToolShell
        route="/golf"
        band={{ kicker: "Sports", title: "PGA Tour", standfirst: "Leaderboards from a committed snapshot." }}
      >
        <p>Body</p>
      </Catalog97ToolShell>,
    );

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("PGA Tour");
    expect(screen.getByText("Sports")).toHaveClass("c97-kicker");
    expect(screen.getByText("Leaderboards from a committed snapshot.")).toHaveClass("c97-lead");
  });

  it("appends the build note aside inside main when a link exists", () => {
    render(
      <Catalog97ToolShell route="/nba" buildNoteHref="/writing/building-an-nba-dashboard">
        <h1>NBA Pulse</h1>
      </Catalog97ToolShell>,
    );

    const link = screen.getByRole("link", { name: /read the build notes/i });
    expect(link).toHaveAttribute("href", "/writing/building-an-nba-dashboard");
    expect(screen.getByRole("main")).toContainElement(link);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest src/components/catalog97/__tests__/Catalog97ToolShell.test.tsx`
Expected: FAIL with `Cannot find module '@/components/catalog97/Catalog97ToolShell'`.

- [ ] **Step 3: Write the component**

`.c97-lead` exists at line 515 of `catalog97.css`, so the standfirst uses it.

```tsx
import dynamic from "next/dynamic";
import { Catalog97Shell } from "./Catalog97Shell";

const ProjectBuildNote = dynamic(() =>
  import("@/components/ProjectBuildNote").then((mod) => mod.ProjectBuildNote),
);

export interface Catalog97ToolBand {
  /** Route family, rendered as the 11px kicker above the title. */
  kicker: string;
  /** The page h1. Only pass a band on a route that does not draw its own h1. */
  title: string;
  standfirst?: string;
}

interface Catalog97ToolShellProps {
  children: React.ReactNode;
  /** The current pathname, used by the build note to look up its prose. */
  route: string;
  /**
   * Optional paper band carrying the kicker, h1, and standfirst. Omitted by
   * default because every route on the site already renders its own h1; a
   * family migration opts in when it moves a route's hero into the shell.
   */
  band?: Catalog97ToolBand;
  /** Link to the build-note write-up, from `projectBuildNoteLinks`. */
  buildNoteHref?: string;
}

/**
 * The shell for every route that is not one of the seven designed Catalog 97
 * pages. It is `Catalog97Shell` (header, the only `main`, espresso footer)
 * plus an optional title band and the build-note aside that `ConditionalLayout`
 * used to append. Because it puts the `.c97-page` scope around the route, the
 * bridge in catalog97.css repaints the route's `--home-*` consumers.
 */
export function Catalog97ToolShell({
  children,
  route,
  band,
  buildNoteHref,
}: Catalog97ToolShellProps) {
  return (
    <Catalog97Shell>
      {band ? (
        <section
          data-c97-surface="paper"
          data-c97-band="title"
          className="c97-band"
          style={{ padding: "var(--c97-band-y) var(--c97-gutter)" }}
        >
          <div className="c97-shell">
            <p className="c97-kicker">{band.kicker}</p>
            <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-2)" }}>
              {band.title}
            </h1>
            {band.standfirst ? (
              <p className="c97-lead" style={{ marginTop: "var(--c97-sp-2)" }}>
                {band.standfirst}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
      {children}
      {buildNoteHref ? <ProjectBuildNote href={buildNoteHref} route={route} /> : null}
    </Catalog97Shell>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx jest src/components/catalog97/__tests__/Catalog97ToolShell.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/catalog97/Catalog97ToolShell.tsx src/components/catalog97/__tests__/Catalog97ToolShell.test.tsx
git commit -m "feat(catalog97): add the tool shell that wraps every non-designed route"
```

---

### Task 5: Route every non-designed page through the tool shell

**Files:**
- Modify: `src/components/ConditionalLayout.tsx` (whole file)
- Modify: `src/components/__tests__/ConditionalLayout.test.tsx` (whole file)

**Interfaces:**
- Consumes: `Catalog97ToolShell` from Task 4, `isCatalog97Route` from `@/constants/catalog97Nav` (unchanged, still true for the seven only), `projectBuildNoteLinks`.
- Produces: `ConditionalLayout` with two branches. The seven designed routes pass children through untouched. Every other route, `/admin` included, renders inside `Catalog97ToolShell`.

- [ ] **Step 1: Rewrite the test**

Replace the whole of `src/components/__tests__/ConditionalLayout.test.tsx` with:

```tsx
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { usePathname } from "next/navigation";
import { ConditionalLayout } from "@/components/ConditionalLayout";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@/components/catalog97/Catalog97ToolShell", () => ({
  Catalog97ToolShell: ({
    children,
    route,
    buildNoteHref,
  }: {
    children: React.ReactNode;
    route: string;
    buildNoteHref?: string;
  }) => (
    <div data-testid="tool-shell" data-route={route} data-build-note={buildNoteHref ?? ""}>
      {children}
    </div>
  ),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe("ConditionalLayout", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderAt(pathname: string) {
    mockUsePathname.mockReturnValue(pathname);
    act(() => {
      root.render(
        <ConditionalLayout>
          <p>Page content</p>
        </ConditionalLayout>,
      );
    });
  }

  it.each(["/", "/portfolio", "/writing", "/dashboards", "/about", "/resume", "/contact"])(
    "passes the designed route %s through untouched",
    (pathname) => {
      renderAt(pathname);
      expect(container.querySelector('[data-testid="tool-shell"]')).toBeNull();
      expect(container.textContent).toContain("Page content");
    },
  );

  it.each(["/nba", "/fantasy-football/waivers", "/writing/some-post", "/portfolio/some-project", "/admin", "/now"])(
    "wraps %s in the Catalog 97 tool shell",
    (pathname) => {
      renderAt(pathname);
      const shell = container.querySelector('[data-testid="tool-shell"]');
      expect(shell).not.toBeNull();
      expect(shell?.getAttribute("data-route")).toBe(pathname);
      expect(shell?.textContent).toContain("Page content");
    },
  );

  it("links canonical project routes to their build notes", () => {
    renderAt("/nba");
    expect(container.querySelector('[data-testid="tool-shell"]')?.getAttribute("data-build-note")).toBe(
      "/writing/building-an-nba-dashboard",
    );
  });

  it("passes no build note where none is registered", () => {
    renderAt("/now");
    expect(container.querySelector('[data-testid="tool-shell"]')?.getAttribute("data-build-note")).toBe("");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest src/components/__tests__/ConditionalLayout.test.tsx`
Expected: FAIL. The wrap tests find no `tool-shell` element because the current layout renders its own `main`.

- [ ] **Step 3: Rewrite the component**

Replace the whole of `src/components/ConditionalLayout.tsx` with:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { Catalog97ToolShell } from "@/components/catalog97/Catalog97ToolShell";
import { projectBuildNoteLinks } from "@/components/projectBuildNoteLinks";
import { isCatalog97Route } from "@/constants/catalog97Nav";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

/**
 * Decides which shell a route renders in.
 *
 * The seven designed Catalog 97 routes (`isCatalog97Route`) render their own
 * `Catalog97Shell` inside the page component, so they pass through untouched.
 * Every other route, `/admin` included, is wrapped in `Catalog97ToolShell`,
 * which supplies the same header, the only `main` landmark, the espresso
 * footer, and the build-note aside for routes registered in
 * `projectBuildNoteLinks`. The Working Instrument shell that used to live here
 * was deleted on 2026-09-16.
 */
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  if (isCatalog97Route(pathname)) {
    return <>{children}</>;
  }

  return (
    <Catalog97ToolShell route={pathname} buildNoteHref={projectBuildNoteLinks[pathname]}>
      {children}
    </Catalog97ToolShell>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx jest src/components/__tests__/ConditionalLayout.test.tsx`
Expected: PASS, 15 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ConditionalLayout.tsx src/components/__tests__/ConditionalLayout.test.tsx
git commit -m "feat(shell): route every non-designed page through the Catalog 97 tool shell"
```

---

### Task 6: Delete the Working Instrument chrome

**Files:**
- Modify: `src/app/layout.tsx` (lines 138–140, the `StaticHeader` import and render)
- Modify: `src/app/__tests__/layout.test.tsx` (the `StaticHeader` mock)
- Delete: `src/components/StaticHeader.tsx`, `src/components/Footer.tsx`, `src/components/ContactCta.tsx`, `src/components/ContactCta.module.css`, `src/constants/navlinks.tsx`, `src/components/__tests__/StaticHeader.test.tsx`, `src/components/__tests__/Footer.test.tsx`

**Interfaces:**
- Consumes: Task 5, which removed the last render of `Footer`.
- Produces: no module exports `StaticHeader`, `Footer`, `ContactCta`, or `navLinks`.

- [ ] **Step 1: Confirm the importers are exactly the files this task touches**

Run: `command grep -rln 'components/Footer"\|components/StaticHeader"\|components/ContactCta"\|constants/navlinks"' src e2e --include='*.ts' --include='*.tsx'`
Expected: exactly `src/app/__tests__/layout.test.tsx`, `src/app/layout.tsx`, `src/components/__tests__/Footer.test.tsx`, `src/components/__tests__/StaticHeader.test.tsx`, `src/components/StaticHeader.tsx`, `src/components/Footer.tsx`. If anything else appears, stop and update that importer first.

- [ ] **Step 2: Delete the files**

```bash
git rm src/components/StaticHeader.tsx src/components/Footer.tsx src/components/ContactCta.tsx src/components/ContactCta.module.css src/constants/navlinks.tsx src/components/__tests__/StaticHeader.test.tsx src/components/__tests__/Footer.test.tsx
```

- [ ] **Step 3: Remove `StaticHeader` from the root layout**

In `src/app/layout.tsx`, delete the line `import { StaticHeader } from "@/components/StaticHeader";` and the line `<StaticHeader />` inside `<Providers>`. The skip link keeps its inline `--home-ink` and `--home-paper` for now; it sits outside the `[data-c97]` scope and still resolves against `:root` until the close-out PR.

In `src/app/__tests__/layout.test.tsx`, delete the block:

```tsx
jest.mock("@/components/StaticHeader", () => ({
  StaticHeader: () => <header>Header</header>,
}));
```

- [ ] **Step 4: Typecheck, lint, and run the affected suites**

Run: `npm run typecheck && npm run lint && npx jest src/app/__tests__ src/components`
Expected: all clean. Anything that fails to resolve a name here is a consumer Step 1 missed.

- [ ] **Step 5: Commit**

```bash
git add -A src/app/layout.tsx src/app/__tests__/layout.test.tsx
git commit -m "refactor(shell): delete the Working Instrument header, footer, and nav constants"
```

---

### Task 7: Update the two e2e specs that pinned the old chrome

**Files:**
- Modify: `e2e/footer-cta.spec.ts` (lines 41–54)
- Modify: `e2e/investments.spec.ts` (lines 222–247)

- [ ] **Step 1: Rewrite the writing-detail footer test**

Replace the test `"uses the footer sign-off on writing detail pages"` with:

```ts
  test("uses the Catalog 97 footer on writing detail pages", async ({ page }) => {
    await page.goto("/writing/2026-march-madness-bracket-analysis");

    await expect(
      page.getByText(/interested in learning more about product management or working together\?/i)
    ).toHaveCount(0);

    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await expect(footer).toHaveCount(1);
    await expect(footer.getByRole("navigation", { name: "Pages" })).toBeVisible();
    await expect(footer).not.toHaveAttribute("data-footer-variant");
  });
```

- [ ] **Step 2: Rewrite the investments discoverability test**

The investments tile on `/dashboards` comes from the `link: "/investments"` entry in `src/constants/caseStudies.ts` through `getLiveToolGroups`. Replace the test `"is discoverable from the Working Instrument navigation"` with:

```ts
  test("is discoverable from the Catalog 97 navigation through the dashboards index", async ({ page }) => {
    await routeInvestmentsFixtures(page);
    await page.goto("/accessibility");

    const mainNav = page.getByRole("navigation", { name: "Main" });
    await expect(mainNav.getByRole("link", { name: /^Dashboards$/ })).toBeVisible();
    await mainNav.getByRole("link", { name: /^Dashboards$/ }).click();
    await expect(page).toHaveURL(/\/dashboards$/);

    const tile = page.getByRole("main").locator('a[href="/investments"]').first();
    await expect(tile).toBeVisible();
    await tile.click();
    await expectInvestmentsShell(page);
    await expect(page).toHaveURL(/.*investments/);
  });
```

- [ ] **Step 3: Run the two specs against the dev server**

Run: `npx playwright test e2e/footer-cta.spec.ts e2e/investments.spec.ts e2e/navigation.spec.ts`
Expected: all pass. `navigation.spec.ts` already targets the Catalog 97 header and should be unchanged; it is included to prove the header works on the seven routes after the layout change.

- [ ] **Step 4: Commit**

```bash
git add e2e/footer-cta.spec.ts e2e/investments.spec.ts
git commit -m "test(e2e): expect the Catalog 97 chrome on detail and dashboard routes"
```

---

### Task 8: Surface brief and doc corrections

**Files:**
- Create: `.impeccable/surfaces/src-components-catalog97-catalog97toolshell-tsx.md`
- Modify: `CLAUDE.md` (the "Routes, Navigation, and Shell" section, lines 63–84)
- Modify: `AGENTS.md` (the shell and header-link paragraphs; find them with `command grep -n 'StaticHeader\|navlinks\|self-shell' AGENTS.md`)

- [ ] **Step 1: Write the surface brief**

```markdown
---
version: 1
slug: "src-components-catalog97-catalog97toolshell-tsx"
primary_target: "src/components/catalog97/Catalog97ToolShell.tsx"
related_targets: ["src/components/ConditionalLayout.tsx","src/components/catalog97/Catalog97Shell.tsx","src/app/catalog97.css"]
---

# Catalog 97 tool shell surface brief

**Scope.** `src/components/catalog97/Catalog97ToolShell.tsx`, rendered by `ConditionalLayout` around every route that is not one of the seven designed Catalog 97 pages, `/admin` included. It is `Catalog97Shell` plus an optional title band and the build-note aside, so an edit here changes 57 routes at once.

**Visitor mode.** Operate. The shell is chrome around a working tool, so it should be quiet and let the dashboard or the calculator be the loudest thing on screen.

**Visual world: Catalog 97, not Working Instrument.** `DESIGN.md` still describes the Working Instrument as of 2026-09-16 and will until the close-out PR regenerates it. Judging this file or any route inside it against `DESIGN.md` manufactures false findings. Tokens live in `src/app/catalog97.css`.

**The bridge, and what it means for findings.** Every route inside this shell still renders components written against `--home-*` tokens. The bridge block in `catalog97.css` (between the `BRIDGE START` and `BRIDGE END` markers) aliases each of those onto the Catalog 97 value for the enclosing surface, zeroes the radii, removes the shadows, and swaps the fonts. So a finding that reads "this card uses `--home-paper-raised`" is not a defect on its own, since that token resolves to the bone field here. The defect to look for is a layout idea the bridge cannot repaint, meaning a signal-orange semantic that reads wrong as oxblood, a shadow drawn with a literal rgba, a raw hex, or a radius set in a Tailwind class like `rounded-xl` instead of through a `--radius-*` token. Those are what the family migrations exist to fix, and each family's PR is the place to record them.

**Status colour has a large-text-only rule on four surfaces.** Light camel, light stone, light tobacco, and dark stone are mid-tones, and the status tokens measure 3.45 to 4.00 on them. On those four the tokens are only used for marks or text at `--c97-fs-h2` and above, and body-size status text uses ink. The chip modifiers enforce this by only applying on the other surfaces.

**The band is opt-in and off by default.** Every route on the site already draws its own `h1`, so the shell adds none. A family migration passes `band` when it moves a route's hero into the shell, and at that point the route's own `h1` must go, because the sweep asserts exactly one per route.

**Commands worth running.** `critique` and `audit`, on a route rendered inside the shell and not on this file, since the file has no visual content of its own. Never `document` here.

**Verified state at creation (2026-09-16).** Recorded in Task 9 of `docs/superpowers/plans/2026-09-16-catalog97-bridge.md`.
```

- [ ] **Step 2: Correct the shell section in `CLAUDE.md`**

Replace the five bullets under "Routes, Navigation, and Shell" (from `- \`src/app/layout.tsx\` renders fonts` through the `Header links come from` bullet) with:

```markdown
- `src/app/layout.tsx` renders fonts, providers, the skip link, then
  `ConditionalLayout`.
- `src/components/ConditionalLayout.tsx` has two branches. The seven designed
  Catalog 97 routes (`/`, `/portfolio`, `/writing`, `/dashboards`, `/about`,
  `/resume`, `/contact`, listed in `src/constants/catalog97Nav.ts`) pass through
  untouched because their page components render `Catalog97Shell` themselves.
  Every other route, `/admin` included, is wrapped in
  `src/components/catalog97/Catalog97ToolShell.tsx`, which supplies the header,
  the only page-level `main`, the espresso footer, and the build-note aside.
  Leaf sections use `div`/`section`, never a nested `main`. Every route exposes
  exactly one page-level `h1`.
- Header links are the seven in `catalog97NavLinks`. The Working Instrument
  header, footer, and `navlinks.tsx` were deleted on 2026-09-16.
- `src/app/catalog97.css` holds the Catalog 97 tokens, scoped under
  `[data-c97]`, and the bridge block that aliases every `--home-*` token onto
  them so components written against the Working Instrument repaint without
  edits. The `:root` `--home-*` declarations in `globals.css` stay until the
  last family migration; see
  `docs/superpowers/specs/2026-09-16-catalog97-unification-design.md`.
```

Also delete the `Footer.tsx` bullet that says it is "always `full` now", and change the `**Last updated:**` line to `2026-09-16`.

- [ ] **Step 3: Correct `AGENTS.md`**

Run `command grep -n 'StaticHeader\|navlinks\|Footer.tsx\|self-shell' AGENTS.md` and rewrite each hit to match the `CLAUDE.md` text above. The header-link list becomes the seven Catalog 97 links. Any "self-shell route list" paragraph is replaced by one sentence: every route that is not one of the seven designed pages renders inside `Catalog97ToolShell`.

- [ ] **Step 4: Voice lint and commit**

Run: `~/.claude/scripts/voice-lint.sh .impeccable/surfaces/src-components-catalog97-catalog97toolshell-tsx.md`
Expected: read each candidate; fix any colon used as a sentence connector or any "rather than" reversal in prose. Reference tables and label lines are fine.

```bash
git add .impeccable/surfaces/src-components-catalog97-catalog97toolshell-tsx.md CLAUDE.md AGENTS.md
git commit -m "docs: record the Catalog 97 tool shell and the bridge in the shell docs"
```

---

### Task 9: Full verification and the live sweep

**Files:**
- No repo changes except fixes the sweep turns up. The sweep script stays in the scratchpad.

- [ ] **Step 1: Full local gates**

Run: `npm run typecheck && npm run lint && npx jest 2>&1 | tail -15`
Expected: typecheck clean, lint clean, Jest reports 0 failures. The memory file `fantasy-review-2026-08-31.md` records one pre-existing best-ball placeholder failure; if it still fails, confirm it fails identically on `main` with `git stash` before treating it as unrelated.

- [ ] **Step 2: Build**

Run: `npm run build 2>&1 | tail -20`
Expected: build succeeds. A CSS parse error here points at the bridge block or the new classes in `catalog97.css`.

- [ ] **Step 3: The live sweep**

Start the dev server in the background: `npm run dev` on port 3000. Save this to `<scratchpad>/sweep.mjs` and run it with `node <scratchpad>/sweep.mjs`:

```js
import { chromium } from "@playwright/test";

const routes = [
  "/nba", "/premier-league", "/bay-area-transit", "/investments", "/score-pools",
  "/fantasy-football", "/fantasy-football/waivers", "/fintech-tools/rent-vs-buy",
  "/travel", "/wine-cellar", "/writing/building-an-nba-dashboard",
  "/portfolio/fantasy-football-analytics", "/now", "/search", "/arcade", "/food-map", "/admin",
];
const viewports = [{ width: 390, height: 844 }, { width: 1440, height: 900 }];

function lum([r, g, b]) {
  const f = (c) => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const browser = await chromium.launch();
const problems = [];
for (const theme of ["light", "dark"]) {
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: theme });
    const page = await ctx.newPage();
    for (const route of routes) {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
      await page.evaluate((t) => document.documentElement.classList.toggle("dark", t === "dark"), theme);
      await page.waitForTimeout(150);
      const r = await page.evaluate(() => {
        const parse = (s) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const transparent = (s) => /rgba\(.*,\s*0\)$/.test(s) || s === "transparent";
        const bgOf = (el) => {
          for (let n = el; n; n = n.parentElement) {
            const s = getComputedStyle(n).backgroundColor;
            if (!transparent(s)) return parse(s);
          }
          return [255, 255, 255];
        };
        const out = {
          mains: document.querySelectorAll("main").length,
          h1s: document.querySelectorAll("h1").length,
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          contrast: [],
          radii: 0,
          shadows: 0,
          headerNav: !!document.querySelector('nav[aria-label="Main"]'),
          footer: !!document.querySelector('footer[aria-label="Site footer"]'),
        };
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const seen = new Set();
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const el = n.parentElement;
          if (!el || !n.textContent.trim() || seen.has(el)) continue;
          seen.add(el);
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.display === "none") continue;
          const rect = el.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;
          const size = parseFloat(cs.fontSize);
          const weight = parseInt(cs.fontWeight, 10);
          const large = size >= 24 || (size >= 18.66 && weight >= 700);
          out.contrast.push({ text: n.textContent.trim().slice(0, 40), fg: parse(cs.color), bg: bgOf(el), floor: large ? 3 : 4.5 });
        }
        for (const el of document.querySelectorAll(".c97-page *")) {
          const cs = getComputedStyle(el);
          if (parseFloat(cs.borderTopLeftRadius) > 2) out.radii += 1;
          if (cs.boxShadow !== "none") out.shadows += 1;
        }
        return out;
      });
      const fails = r.contrast.filter((c) => ratio(c.fg, c.bg) < c.floor);
      const line = `${theme} ${vp.width} ${route} main=${r.mains} h1=${r.h1s} overflow=${r.overflow} header=${r.headerNav} footer=${r.footer} contrastFails=${fails.length} radii>2px=${r.radii} shadows=${r.shadows}`;
      console.log(line);
      if (r.mains !== 1 || r.h1s !== 1 || r.overflow || !r.headerNav || !r.footer || fails.length) {
        problems.push({ line, fails: fails.slice(0, 5) });
      }
    }
    await ctx.close();
  }
}
await browser.close();
console.log(problems.length ? "PROBLEMS" : "CLEAN", JSON.stringify(problems, null, 1));
process.exit(problems.length ? 1 : 0);
```

Expected: every line shows `main=1 h1=1 overflow=false header=true footer=true contrastFails=0`. The `radii` and `shadows` counts are informational at this stage, since Tailwind classes like `rounded-xl` and literal `shadow-*` utilities bypass the bridge and belong to the family PRs; record the per-route counts in the surface brief's verified-state section. A `contrastFails` count above zero on a route is a real finding: read the five sampled nodes, and if the failure is a `--home-signal` consumer on a tinted plate, adjust the `--home-signal-soft` mix percentage in the bridge (Task 2 Step 3) and re-run; if it is a component-literal colour, note it in the brief for that route's family and move on. The sweep's parser is sanity-checked the same way the September audits were: the first paper-on-ink node on `/now` must read close to 10.9:1 (`#2b211a` on `#f1ebdf`) before any other reading is believed.

- [ ] **Step 4: Record the verified state**

Replace the last line of the surface brief (`**Verified state at creation (2026-09-16).** Recorded in Task 9…`) with the actual figures: the count of routes swept, the four states per route, the contrast result, and the informational radius and shadow counts per route. Write it in prose, one paragraph, no bold labels.

```bash
git add .impeccable/surfaces/src-components-catalog97-catalog97toolshell-tsx.md
git commit -m "docs: record the tool shell's verified state after the bridge sweep"
```

- [ ] **Step 5: E2E subset**

Run: `npx playwright test e2e/navigation.spec.ts e2e/footer-cta.spec.ts e2e/investments.spec.ts e2e/fantasy-football.spec.ts e2e/writing.spec.ts e2e/accessibility.spec.ts e2e/persisted-tools.spec.ts`
Expected: all pass. `fantasy-football.spec.ts` locates its shell by `data-testid` and is unaffected by the chrome change; a failure there is a real regression in the bridge, most likely a control whose Tailwind class read `--home-control-rule` and now gets ink-2.

- [ ] **Step 6: Sitemap and PR**

Per the sitemap drift memory: `git fetch origin && git merge origin/main`, then `node scripts/generatePublicSitemap.mjs` and commit any sitemap change. Push the branch and open the PR with a body that links the spec and states the interim quieter-accent and seven-link-nav facts from the spec's "Known interim state" section.

```bash
git push -u origin design/catalog97-unification
gh pr create --title "Bridge every route onto the Catalog 97 shell and tokens" --body-file <scratchpad>/pr-body.md
```

---

## Self-review

Spec coverage. Part one: the registry stays as it is because `isCatalog97Route` already names the seven and the new branch in `ConditionalLayout` inverts it (Task 5); header and footer deletion (Task 6); tool shell with opt-in band and build note (Task 4); bridge with every mapping row from the spec's table (Task 2); legacy accents deleted (Task 2 Step 4). Part two: status tokens per surface in both themes with measured values (Task 1), chart ramp with `up` and `down` (Task 1), mono face reusing Fragment Mono (Task 1), the five classes plus form controls (Task 3). Part four's bridge-PR items: the two Jest files rewritten (Tasks 5 and 6), `e2e/fantasy-football.spec.ts` checked and found to use test ids so no selector change was needed (Task 9 Step 5), the surface brief (Task 8), the sweep (Task 9).

Deviations from the spec worth naming. The spec said `--home-signal-soft` would be chosen for 3:1 against the surface; a background wash cannot reach 3:1 against its own surface without becoming a plate, so the bridge measures the text on it instead, accent at 6.54:1 and ink at 10.09:1 on paper. The spec's "adjacent steps 3:1" for the chart ramp is replaced by "every step 3:1 against paper in its theme", because a categorical ramp separates by hue and the measurements showed adjacent luminance contrast is unreachable with six warm colours. The spec put `/admin` out of scope; this plan gives it the shell and the bridge because deleting the Working Instrument header otherwise leaves it with none, and no family PR will restyle its internals. The investments `.terminalScope` in `investments.module.css` re-declares `--home-*` at module scope and will override the bridge on that route; that is family 6's job and is left alone here.

Type consistency. `Catalog97ToolShell` props are `children`, `route`, `band`, `buildNoteHref` in Task 4 and are consumed with those names in Task 5's mock and component. `Catalog97ToolBand` fields are `kicker`, `title`, `standfirst` in both the component and its test. Bridge markers are `/* BRIDGE START */` and `/* BRIDGE END */` in both the CSS and the test (Task 2). Class names in Task 3's CSS match the list in the Task 3 test.
