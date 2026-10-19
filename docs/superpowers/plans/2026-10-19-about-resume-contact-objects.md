# About, Résumé, and Contact as three objects. Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/about` as a proofread document, `/resume` as a letter sheet on a press bed, and `/contact` as a reply card, replacing the 2026-10-18 build on `design/about-resume-contact`.

**Architecture:** Each page keeps `Catalog97Shell` and one `c97-band` section, and the object inside it is laid out by the page's own CSS module reading `--c97-*` tokens. The existing data arrays, `Catalog97Slot`, `Catalog97CompanyMark`, `ABOUT_FAQ`, and `profile` are reused unchanged. A new Playwright spec pins the three objects, and the print spec loses the `/about` checks the proof makes false.

**Tech Stack:** Next.js 16 App Router, React 19, CSS Modules, Playwright (Chromium), Jest, `scripts/layoutSweep.mjs`, `scripts/contrastSweep.mjs`.

**Spec:** `docs/superpowers/specs/2026-10-19-about-resume-contact-objects-design.md`

## Global constraints

- Worktree `/Users/isaacvazquez/Website-pages`, branch `design/about-resume-contact`. Commits stack on `855761fb1`. No "Claude", "AI", or Co-Authored-By anywhere. Commit messages `<type>: <description>`, terse.
- Every user-facing string follows `WRITING_VOICE.md`. The spec fixes the copy; where it quotes a sentence, that sentence is used verbatim.
- No hex in components or modules. Modules alias tokens (`--x: var(--c97-…)`). `catalog97.css` does not change.
- Every text mark on the proof takes `--c97-accent`. Blue (`--c97-riso-blue`) and vermilion (`--c97-riso-vermilion`) appear only as `--c97-overprint` set on the offset's wrapper, never on the object's root.
- One `h1` per page. Links and buttons at least 44px tall. Contrast at least 4.5:1 in both themes. No horizontal scroll at 320 to 1920.
- Build is `/usr/local/bin/node node_modules/next/dist/bin/next build --webpack`. Serve with `next start -p 3900`, restart through a script using `lsof -ti :3900`, and `grep` the served HTML for the new markup before any e2e run. Run e2e with `E2E_PORT=3900 PLAYWRIGHT_OUTPUT_DIR=<scratch>/pw` and `CI` unset.
- Text pins that must keep passing: "Download PDF" link to `/Isaac_Vazquez_Resume.pdf` (résumé spec), "Get in touch" link in `main` whose previous sibling shares its left edge in print (résumé spec), heading matching `/like to hear from you/i` on `/contact` (footer CTA spec), `img.c97-slot-img` with a filter in print on `/about` (print spec).

## Review focus

1. Dark mode on all three pages. The offsets and the stamp read `--c97-overprint`, which the system flips on dark bone, and the highlight wash is a `color-mix` on the accent. Pinned by the contrast sweep in Task 5 on both themes and by Task 5's dark-theme screenshots.
2. Keyboard users on the proof. A superscript is a real link to `#note-n`, and each note has that id. Pinned in Task 1's spec.
3. The résumé on paper. The bed must print white, the download rail must not print, and the rail paragraph above "Get in touch" must share its left edge. Pinned by the existing résumé spec, rerun in Task 2.
4. The reply card at 320px. The halves stack and the email, which cannot wrap inside a word, must not push the card past the viewport. Pinned by Task 3's spec at a 320 viewport.
5. Structured data on `/about`. The FAQ schema and the specimen strip read the same `ABOUT_FAQ`, which is untouched, so any edit to the strip's copy must stay in the component. Pinned by Task 1's spec comparing the strip's question count to the JSON-LD.

---

### Task 1: About, the proof

**Files:**
- Modify: `src/components/catalog97/Catalog97About.tsx` (whole file)
- Modify: `src/components/catalog97/Catalog97About.module.css` (whole file)
- Modify: `e2e/print.spec.ts:124-128` (remove the `/about` entry from `NARROW_GRIDS`), `:199-211` (delete the stacked-gaps loop, now empty), `:247-249` (open `/dashboards` instead of `/about`)
- Create: `e2e/designed-pages.spec.ts`

**Interfaces:**
- Produces: `e2e/designed-pages.spec.ts` with a `test.describe("About")` block that Tasks 2 and 3 add their own blocks to.

- [ ] **Step 1: Write the failing spec**

```ts
import { expect, test } from "@playwright/test";

test.describe("About", () => {
  test("marks four claims and links each to its checked note", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1")).toHaveCount(1);
    const marks = page.locator("main a[href^='#note-']");
    await expect(marks).toHaveCount(4);
    for (const n of [1, 2, 3, 4]) {
      await expect(page.locator(`#note-${n}`)).toHaveCount(1);
    }
    await expect(page.locator(".c97-columns")).toHaveCount(0);
    await expect(page.locator(".c97-sheet[data-seam]")).toHaveCount(0);
  });

  test("prints the same questions the FAQ schema carries", async ({ page }) => {
    await page.goto("/about");
    const schema = await page.locator("script[type='application/ld+json']").allTextContents();
    const faqPage = schema.some((s) => s.includes('"FAQPage"'));
    expect(faqPage).toBe(true);
    await expect(page.locator("[data-specimen] h3")).toHaveCount(4);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `E2E_PORT=3900 npx playwright test e2e/designed-pages.spec.ts --project=chromium`
Expected: FAIL, `a[href^='#note-']` count 0 and `.c97-sheet[data-seam]` count 2.

- [ ] **Step 3: Rewrite `Catalog97About.tsx`**

One `section.c97-band` with `data-c97-surface="paper"` and `data-c97-monet`. Inside `.c97-shell`, a `div.proof` grid: `div.plate` (`data-c97-paint="portrait"`, the existing `Catalog97Slot` call unchanged, then `p.caption` with the span "Plate 1 · portrait" and nothing on the right), and `div.document` holding the `h1.c97-poster.headline`, `div.body` (the four paragraphs from the mockup, with the four marked claims as `<mark className={styles.claim}>…</mark><a className={styles.ref} href="#note-n" aria-label="Note n">n</a>`), `aside.margin` with `aria-label="Checked notes"` holding four `div.note` with `id="note-n"`, a `p.noteLabel` "n · checked", the note text, and `p.source` "Source · " plus a `Link` (Civitech write-up `/writing/civitech-quality-and-product-work`, Résumé `/resume`, Juno write-up `/writing/juno-mba-growth-internship`, Dashboards `/dashboards`). Then `section.specimen` with `data-specimen` and `aria-label="Frequently asked questions"`, `p.specimenTitle` with "Specimen" and "Questions I get asked" on two lines in Anton, and `ABOUT_FAQ.map` to `div` with `h3.c97-serif` question and `p` answer. Before writing a note, open the cited write-up and match its facts; the third note is one sentence. Delete `principles`.

- [ ] **Step 4: Rewrite `Catalog97About.module.css`**

`.proof` grid `260px minmax(0, 1fr)`, gap `var(--c97-sp-5)`; under 881px one column with `.plate { width: min(72%, 300px) }`. `.plate` sets `--c97-overprint: var(--c97-riso-vermilion)` on its own wrapper only. `.headline` font-size `clamp(36px, 4.2vw, 56px)`, `text-wrap: balance`, max-width `20ch`. `.document` grid `minmax(0, 1fr) 230px`, gap `var(--c97-sp-4)`, collapsing to one column under 881px with `.margin` after `.body`. `.claim { background: linear-gradient(transparent 60%, color-mix(in srgb, var(--c97-accent) 18%, transparent) 60%); color: inherit }`. `.ref { color: var(--c97-accent); font-family: var(--c97-font-serif); font-style: italic; vertical-align: 0.55em; font-size: 0.72em; padding: var(--c97-touch-y) 2px; margin-block: calc(-1 * var(--c97-touch-y)) }`. `.margin { border-left: 1px solid var(--c97-rule); padding-left: var(--c97-sp-3) }`, `.note { position: relative }`, `.note::before` the 7px rotated square in `var(--c97-accent)` at `left: calc(-1 * var(--c97-sp-3) - 4px)`. `.noteLabel`, `.source a` in `var(--c97-accent)`. `.specimen { grid-column: 1 / -1; border-top: 1px solid var(--c97-ink); border-bottom: 1px solid var(--c97-ink); display: grid; grid-template-columns: 150px repeat(4, minmax(0, 1fr)) }`, one column under 881px. Print: `.document` keeps two columns at `@media print and (min-width: 150mm)`, one column below. Confirm the serif and poster font tokens' names in `catalog97.css` before using them.

- [ ] **Step 5: Edit `e2e/print.spec.ts`**

Remove the `/about` object from `NARROW_GRIDS`. Delete the `for (const route of ["/about"])` stacked-gaps loop and its comment. In "tears the seams with a clip path on paper", change `open(page, "/about")` to `open(page, "/dashboards")` with the comment `// /about became one sheet on 2026-10-19; /dashboards still carries a deckle.`

- [ ] **Step 6: Build, restart, verify served HTML, run the specs**

Run the build, restart port 3900, `curl -s localhost:3900/about | grep -c 'href="#note-1"'` expecting `1`, then `E2E_PORT=3900 npx playwright test e2e/designed-pages.spec.ts e2e/print.spec.ts --project=chromium`.
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/catalog97/Catalog97About.tsx src/components/catalog97/Catalog97About.module.css e2e/print.spec.ts e2e/designed-pages.spec.ts
git commit -m "design: set About as a proof with checked margin notes"
```

### Task 2: Résumé, the sheet on the press bed

**Files:**
- Modify: `src/components/catalog97/Catalog97Resume.tsx:180-419` (the component; the data arrays above line 180 stay)
- Modify: `src/components/catalog97/Catalog97Resume.module.css` (screen rules at lines 1-47 replaced; print block at 65-217 edited)
- Modify: `e2e/designed-pages.spec.ts`

- [ ] **Step 1: Add the failing spec**

```ts
test.describe("Résumé", () => {
  test("sets the sheet on the bed with the rails beside it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/resume");
    await expect(page.locator("h1")).toHaveText("Isaac Vazquez");
    const sheet = page.locator("[data-sheet]");
    const bed = page.locator("[data-c97-surface='bone']").first();
    await expect(sheet).toBeVisible();
    const [s, b] = await Promise.all([sheet.boundingBox(), bed.boundingBox()]);
    expect(s!.width).toBeLessThanOrEqual(680);
    expect(s!.height).toBeGreaterThanOrEqual(s!.width * 11 / 8.5 - 1);
    expect(Math.abs((s!.x + s!.width / 2) - (b!.x + b!.width / 2))).toBeLessThan(2);
    await expect(page.locator("[data-sheet] h2")).toHaveCount(4);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `E2E_PORT=3900 npx playwright test e2e/designed-pages.spec.ts --project=chromium -g "Résumé"`
Expected: FAIL, `h1` text is "Résumé".

- [ ] **Step 3: Rewrite the component from line 180**

Drop `Rule` (the sheet's headings carry their own hairline). One `section.c97-band` with `data-c97-surface="bone"`, inside `.c97-shell` a `div.bed` grid with `aside.rail` (kicker "Press bed · one sheet", the spec's sentence, a `span.offset` wrapper setting the blue overprint around `a.c97-btn.c97-offset[download]` "Download PDF"), `div.offset` (blue overprint wrapper) around `article.sheet` (`data-sheet`, `data-c97-surface="paper"`) holding `h1.c97-poster.name` "Isaac Vazquez", `p.contact` 2x2 ("Berkeley, California", `profile.email`, "linkedin/isaac-vazquez", "github/IsaacAVazquez"), `h2` Experience and `experience.map` as `article.entry` (`div.when` date, `h3` role, `p.c97-meta` company with `Catalog97CompanyMark` and kind, `p` description, no `writeUp` paragraph), `h2` Education likewise, `h2` Capabilities as `dl.ledger` over all seven groups, `h2` Outside work with `interests`, and `p.foot` with the pressman's line now visible. Then `aside.rail` (kicker "Also on this site", the sentence that the Juno and Civitech entries each have a write-up, two `Link.c97-btn-ghost` to the write-ups, kicker "References", `p` "I'm happy to walk through any project on this site line by line.", `Link.c97-btn-ghost` "Get in touch" as that paragraph's next sibling). Remove `styles.mark` and `styles.screenOnly`. Import `profile` from `@/lib/profile`.

- [ ] **Step 4: Rewrite the module's screen rules and edit the print block**

Screen: `.bed { display: grid; grid-template-columns: 180px minmax(0, 680px) 180px; gap: var(--c97-sp-5); justify-content: center; align-items: start }`, `.rail { display: grid; gap: var(--c97-sp-3); font-size: var(--c97-fs-small); justify-items: start }`, `.offset { --c97-overprint: var(--c97-riso-blue); box-shadow: 10px 10px 0 var(--c97-overprint) }`, `.sheet { aspect-ratio: 8.5 / 11; padding: 40px 44px; font-size: var(--c97-fs-label); line-height: 1.4 }`, `.name` Anton with the overprint text-shadow at `clamp(28px, 3vw, 36px)`, `.contact` grid `1fr 1fr` kicker-styled with an ink bottom rule, `.sheet h2` Anton 14px uppercase over a hairline, `.entry { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: var(--c97-sp-2) }`, `.when { white-space: nowrap; font-family: var(--c97-font-serif); color: var(--c97-label) }`, `.ledger` grid `112px 1fr`, `.foot` italic serif right-aligned over a hairline. Under 881px `.bed` is one column (source order already puts the download rail first and the links rail last), `.sheet { padding: 24px }`, and under 600px `.entry` is one column. Print block: keep the ink and chrome rules, add `.rail:first-of-type { display: none !important }`, `.bed { grid-template-columns: 1fr !important }`, `.sheet { aspect-ratio: auto; padding: 0 !important }`, `.offset { box-shadow: none !important }`, keep the `a[href^="/"]` padding reset and the `17ch 1fr` entry columns, and move the old `.mark` print rules onto `.foot`.

- [ ] **Step 5: Build, restart, verify, run the specs**

`curl -s localhost:3900/resume | grep -c 'data-sheet'` expecting `1`, then `E2E_PORT=3900 npx playwright test e2e/designed-pages.spec.ts e2e/resume.spec.ts --project=chromium`.
Expected: all pass, including "starts the contact link on its column when the page prints".

- [ ] **Step 6: Commit**

```bash
git add src/components/catalog97/Catalog97Resume.tsx src/components/catalog97/Catalog97Resume.module.css e2e/designed-pages.spec.ts
git commit -m "design: set the résumé as one sheet on the press bed"
```

### Task 3: Contact, the reply card

**Files:**
- Modify: `src/components/catalog97/Catalog97Contact.tsx` (whole file)
- Create: `src/components/catalog97/Catalog97Contact.module.css`
- Modify: `src/app/contact/page.tsx:10` (import the date)
- Modify: `e2e/designed-pages.spec.ts`

**Interfaces:**
- Produces: `export const CONTACT_DATE_MODIFIED = "2026-10-19"` from `Catalog97Contact.tsx`, read by `contact/page.tsx` for `dateModified` and by the stamp for its year.

- [ ] **Step 1: Add the failing spec**

```ts
test.describe("Contact", () => {
  test("is one reply card with the address lines as targets", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("h1")).toHaveText(/like to hear from you/i);
    await expect(page.locator("[data-card]")).toHaveCount(1);
    await expect(page.locator("[data-c97-surface='ink-blue']")).toHaveCount(0);
    for (const name of [/berkeley\.edu/i, /linkedin/i, /github/i]) {
      const box = await page.locator("[data-card]").getByRole("link", { name }).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.locator("[data-stamp]")).toContainText("2026");
  });

  test("keeps the card inside a 320px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/contact");
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(wide).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `E2E_PORT=3900 npx playwright test e2e/designed-pages.spec.ts --project=chromium -g "Contact"`
Expected: FAIL, `[data-card]` count 0.

- [ ] **Step 3: Rewrite `Catalog97Contact.tsx`**

One `section.c97-band` `data-c97-surface="paper"`. Inside `.c97-shell`, `div.post` (grid, `justify-items: center`, gap `var(--c97-sp-4)`), `div.offset` wrapper setting `--c97-overprint: var(--c97-riso-vermilion)` around `div.card` (`data-card`) with `div.message` (`h1.c97-poster` "I'd like to hear from you.", the spec's two paragraphs, `p.c97-kicker.reply` "Reply within two working days · if it's been longer, send it again"), `div.rule` (`aria-hidden`), `div.address` with `div.stamp` (`data-stamp`, `aria-hidden`, inner `div.stampInk` "Isaac Vazquez" and `small` `Berkeley · CA · ${CONTACT_DATE_MODIFIED.slice(0, 4)}`), and `dl.lines` with four `div.line` (`dt` label, `dd` value): To "Isaac Vazquez, Berkeley, CA"; Email `a[href=mailto:${profile.email}]` with `touchTarget`; LinkedIn `a` to `profile.sameAs.linkedin` "isaac-vazquez" `target="_blank" rel="noopener noreferrer"` `aria-label="LinkedIn, isaac-vazquez, opens in a new tab"` with `touchTarget`; GitHub likewise "IsaacAVazquez". Under the card the existing sentence with the two `Link`s. Export `CONTACT_DATE_MODIFIED` and have `contact/page.tsx` import it for `dateModified`.

- [ ] **Step 4: Write `Catalog97Contact.module.css`**

`.offset { --c97-overprint: var(--c97-riso-vermilion); width: min(100%, 740px) }`, `.card { aspect-ratio: 6 / 4; border: 1px solid var(--c97-ink); box-shadow: 10px 10px 0 var(--c97-overprint); display: grid; grid-template-columns: 1fr 1px 1.15fr; gap: 0 var(--c97-sp-4); padding: var(--c97-sp-4) var(--c97-sp-5) }`, `.rule { background: var(--c97-ink) }`, `.message { display: flex; flex-direction: column; min-width: 0 }`, `.message h1 { font-size: clamp(28px, 3vw, 36px) }`, `.reply { margin-top: auto; padding-top: var(--c97-sp-3) }`, `.address { display: grid; grid-template-rows: auto 1fr; min-width: 0 }`, `.stamp { justify-self: end; width: 84px; height: 98px; border: 1px dashed var(--c97-ink); display: grid; place-items: center }`, `.stampInk { background: var(--c97-riso-blue); color: var(--c97-surface); transform: rotate(-6deg); font-family: var(--c97-font-poster) }` (decoration, so blue in both themes), `.lines { align-self: end; display: grid; gap: var(--c97-sp-2); margin: 0 }`, `.line { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: var(--c97-sp-1); align-items: baseline; border-bottom: 1px solid var(--c97-ink) }`, `.line dd { margin: 0; font-family: var(--c97-font-serif); font-size: var(--c97-fs-body); overflow-wrap: anywhere }`, `.email dd { font-size: var(--c97-fs-lead); text-decoration: underline }`. Under 700px `.card { aspect-ratio: auto; grid-template-columns: 1fr }`, `.rule { height: 1px; margin: var(--c97-sp-3) 0 }`. Confirm the surface token name used for the stamp text reads as the paper colour on dark paper too, and if it does not, use `--c97-paper`'s real name from `catalog97.css`.

- [ ] **Step 5: Build, restart, verify, run the specs**

`curl -s localhost:3900/contact | grep -c 'data-card'` expecting `1`, then `E2E_PORT=3900 npx playwright test e2e/designed-pages.spec.ts e2e/footer-cta.spec.ts --project=chromium`.
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/catalog97/Catalog97Contact.tsx src/components/catalog97/Catalog97Contact.module.css src/app/contact/page.tsx e2e/designed-pages.spec.ts
git commit -m "design: set Contact as a reply card"
```

### Task 4: Dates and docs

**Files:**
- Modify: `src/app/about/page.tsx:12,37`, `src/app/resume/page.tsx:12,41`, `src/lib/sitemap.js:17,23,25`, `public/sitemap.xml` (regenerated)
- Modify: `COMPONENTS.md:55-57`, `STYLING.md` ("Sections are sheets" paragraph), `docs/ai-context/COMPONENTS.md:34-36`

- [ ] **Step 1: Move every date to 2026-10-19 and regenerate the sitemap**

Run: `/usr/local/bin/node scripts/generatePublicSitemap.mjs && git diff --stat public/sitemap.xml`
Expected: the three `<lastmod>` lines change.

- [ ] **Step 2: Rewrite the three COMPONENTS.md rows and the STYLING.md paragraph**

Each row names the object in one sentence (proof with checked notes and a specimen strip; letter sheet on the bone bed with two rails; reply card with stamp and address lines). STYLING.md's paragraph says the three pages are one object each as of 2026-10-19 and points at the spec.

- [ ] **Step 3: Run the Jest suites that read these files**

Run: `npx jest src/app/__tests__ src/constants src/lib --silent`
Expected: PASS, `component-docs.test.ts` included.

- [ ] **Step 4: Commit**

```bash
git add src/app/about/page.tsx src/app/resume/page.tsx src/lib/sitemap.js public/sitemap.xml COMPONENTS.md STYLING.md docs/ai-context/COMPONENTS.md docs/superpowers/specs docs/superpowers/plans
git commit -m "docs: date the three objects and record the superseded direction"
```

### Task 5: Gates and the review set

**Files:**
- No source changes expected. Fixes found here go into the owning task's files with their own commit.

- [ ] **Step 1: Full build and fresh server**

Run the build, restart 3900, and `curl` each of the three routes for `href="#note-1"`, `data-sheet`, and `data-card`.
Expected: `1` each.

- [ ] **Step 2: Layout and contrast sweeps**

Run: `/usr/local/bin/node scripts/layoutSweep.mjs http://localhost:3900 /about /resume /contact` and `/usr/local/bin/node scripts/contrastSweep.mjs http://localhost:3900 /about /resume /contact`
Expected: `0 fail` from each, both themes in the contrast sweep.

- [ ] **Step 3: The Chromium specs**

Run: `E2E_PORT=3900 PLAYWRIGHT_OUTPUT_DIR=<scratch>/pw npx playwright test e2e/designed-pages.spec.ts e2e/print.spec.ts e2e/resume.spec.ts e2e/footer-cta.spec.ts e2e/portfolio-shell.spec.ts e2e/navigation.spec.ts --project=chromium`
Expected: all pass.

- [ ] **Step 4: Screenshots for Isaac**

Capture the three routes at 1440 and 390 in light and dark into `<scratch>/review2/img/` as JPEG, and republish the review artifact at https://claude.ai/artifact/Rb54AqSexShzEiaHdH3UxL with the new captures as the "after" set and the facts line updated.

- [ ] **Step 5: Push and update PR #613**

```bash
git push
gh pr edit 613 --title "design: About as a proof, the résumé as a sheet on the press bed, Contact as a reply card" --body-file <scratch>/pr-body.md
```

The body names the spec, the three objects in one sentence each, the print spec changes and why, and the gates' results.
