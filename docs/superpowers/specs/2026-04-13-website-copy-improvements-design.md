# Website Copy Improvements

## Context

The site has a distinctive, opinion-forward voice on core pages (homepage hero, About, Contact, News Pulse) but drops into generic feature-list copy on most dashboard and tool pages. The gap undermines the portfolio's cohesion. A visitor who reads the homepage manifesto ("I don't think product work gets stronger when it sounds more abstract") then lands on the Investments page and gets "Curated company snapshots, valuation panels, price history, and browser-saved portfolio tracking" experiences a tonal break. The dashboards are instances of your product thinking, but the copy doesn't position them that way.

This pass brings every page-level and component-level string up to the voice ceiling already established on the best pages. No metadata, no caseStudies.ts, no SEO fields.

## Guiding Principles

Drawn from WRITING_VOICE.md and UX writing best practices (NN/g 3 C's framework, Smashing Magazine microcopy guidelines):

1. **Problem before feature.** Every tool description answers "why does this exist?" before "what does it do?"
2. **First person when it's your work.** "I built this because..." not "This tool provides..."
3. **Front-load meaning.** NN/g research shows the first 2 words of a headline carry the most scanning weight. Cut lead-ins ("That shows up here as...").
4. **One idea per copy block.** Don't stack features in comma lists. One clear sentence per concept.
5. **No em dashes, no colons as connectors.** Per voice guide, these are banned.
6. **Every sentence earns its place.** If it's padding, cut it.
7. **News Pulse is the template.** Its copy is first-person, problem-first, mechanism-aware, and outcome-driven.

## Approach: Three Waves

### Wave 1: Core Pages + Template Dashboard

Establish the voice floor by tightening the highest-traffic pages and creating one rewritten dashboard as the pattern for all others.

### Wave 2: Dashboard Rewrites by Domain Cluster

Apply the Investments template to all remaining dashboards, grouped by domain so related pages (PL + La Liga, Budget Planner + Interchange IQ) are written back-to-back for differentiation.

### Wave 3: Minor Polish

Light touch on pages that are already strong. Update any test assertions that break.

---

## Wave 1: Core Pages + Template Dashboard

### 1.1 Homepage Hero (HomePageContent.tsx)

**File:** `src/components/home/HomePageContent.tsx`

**Kicker (line 102)**
- Current: `Product work, writing, and working tools`
- Revised: `Product work, writing, and live tools`
- Rationale: "working tools" is vague. "live tools" is concrete and implies they're real, running things.

**Hero body (lines 114-117)**
- Current: `That shows up here as case studies, writing, and working tools across reliability, fintech, media, and sports data.`
- Revised: `Case studies, writing, and interactive tools I built across fintech, sports analytics, aerospace, and civic technology.`
- Rationale: Cuts the filler lead-in "That shows up here as." Replaces vague "reliability" and "media" with the actual domains. Front-loads the content types per NN/g scanning research.

### 1.2 Homepage Sections (HomePageContent.tsx)

**Selected work section (lines 155-159)**
- Current H2: `A few projects that show how I think about product work.`
- Revised H2: `Projects that show how I think about product work.`
- Rationale: "A few" is a filler qualifier. The grid shows exactly how many there are.

- Current body: `Each one covers the role, the problem, and what actually changed once it shipped.`
- Revised body: `Each one covers the role, the problem, and what changed once it shipped.`
- Rationale: "actually" is filler here. The sentence is stronger without it.

**Writing section (lines 226-233)**
- Current H2: `I use the writing to unpack the reasoning behind the work.`
- Revised H2: `I write to unpack the reasoning behind the work.`
- Rationale: "use the writing" is indirect. "write" is the verb.

- Current body: `Product strategy, analytics-heavy decisions, and the parts of the job that usually matter more than the framework language around them.`
- Keep as-is. This is sharp and on-voice.

### 1.3 Portfolio Page H1 (portfolio/page.tsx)

**File:** `src/app/portfolio/page.tsx`

- Current H1: `Product work across SaaS, analytics, and tooling.`
- Revised H1: `Product work across fintech, analytics, and civic technology.`
- Rationale: "SaaS" and "tooling" are vague industry labels. The actual domains (fintech, analytics, civic tech) are more specific and match the homepage language.

### 1.4 Resume Intro (resume-client.tsx)

**File:** `src/app/resume/resume-client.tsx`

- Current: `My background spans QA, analytics, and client strategy across six years in civic tech. I'm an MBA candidate at Berkeley Haas pursuing roles in product, growth, strategy, and operations where data-driven execution and cross-functional range are an asset and measurement and execution both matter.`
- Revised: `Six years across QA, analytics, and client strategy in civic tech. I'm an MBA candidate at Berkeley Haas looking for product and growth roles where analytical rigor and delivery speed feed each other.`
- Rationale: Cuts redundancy ("data-driven execution" and "measurement and execution" said the same thing twice). Removes the vague "cross-functional range are an asset" qualifier. The new version is half the length and says the same thing once, clearly.

### 1.5 Writing Page Empty State (writing/page.tsx)

**File:** `src/app/writing/page.tsx`

Note: The empty state ("Articles Coming Soon" / "I'm working on more pieces...") is a fallback that only shows when no posts exist. The actual posts are populated from `content/blog/`. Verify whether this renders in production before editing. If posts exist, this block is dead code for live visitors. Still worth cleaning up.

- Current heading: `Articles Coming Soon`
- Revised heading: `More on the way`

- Current body: `I'm working on more pieces about product thinking, analytics, and the decisions behind the tools I build.`
- Revised body: `More writing about product thinking, analytics, and the decisions behind the tools I build.`
- Rationale: "I'm working on more pieces" sounds like a placeholder excuse. "More on the way" is shorter and doesn't apologize.

### 1.6 Investments Page (investments-client.tsx) — Template Dashboard Rewrite

**File:** `src/app/investments/investments-client.tsx`

- Current kicker: `Equity Research Workspace`
- Revised kicker: `Investment Research`

- Current H1: `Investment Research`
- Revised H1: `Investment Research`
- Keep as-is. Short, clear.

- Current body: `Curated company snapshots, valuation panels, price history, and browser-saved portfolio tracking.`
- Revised body: `I built this to stress-test investment theses in one place. Company snapshots, valuation history, and a portfolio tracker that lives in your browser with no logins or cloud sync.`
- Rationale: Follows the News Pulse pattern. Opens with first-person "why," then describes the mechanism concretely. Replaces the comma-separated feature list with a sentence that has personality. "No logins or cloud sync" is a specific design decision, not a feature.

---

## Wave 2: Dashboard Rewrites by Domain Cluster

### 2.1 Sports Cluster

#### Premier League (premier-league-client.tsx)

**File:** `src/app/premier-league/premier-league-client.tsx`

- Current body: `Title race, European qualification gaps, and relegation fight. Updated weekly from football-data.org.`
- Revised body: `Where does the title race actually stand? Points gaps to the top four, European qualification line, and relegation pressure, refreshed weekly from live data.`
- Rationale: Opens with a question (conversational, per voice guide). Replaces the noun-phrase list with a sentence. Drops the source name from the body (the chips already show metadata like "Updated [date]").

#### La Liga (la-liga-client.tsx)

**File:** `src/app/la-liga/la-liga-client.tsx`

- Current body: `Title race, European cutoff, and relegation pressure. Updated weekly from football-data.org.`
- Revised body: `La Liga's title race compressed into one view. Top-four gaps, European qualification pressure, and relegation context, updated weekly.`
- Rationale: Differentiates from PL copy explicitly. Positions the page as a compression tool ("one view"), which is what it actually does. No shared sentences with the PL page.

#### Fantasy Football (fantasy-football-client.tsx)

**File:** `src/app/fantasy-football/fantasy-football-client.tsx`

- Current H1: `Rankings first. Draft utility second.`
- Keep as-is. This is punchy and opinionated.

- Current body: `Published fantasy snapshots power the public board and the draft tracker, so the rankings, timestamps, and best-available lists stay aligned.`
- Revised body: `I publish weekly snapshots that power both the public board and the draft tracker. Your rankings, best-available lists, and timestamps always agree because they come from the same source.`
- Rationale: First person ("I publish"). Explains the benefit (agreement) before the mechanism (same source). Removes "stay aligned" which is vague.

#### March Madness (march-madness-client.tsx + march-madness-data.ts)

**File:** `src/app/march-madness-2026/march-madness-client.tsx` (lines 843-847)

- Current body: `Best upset picks, Final Four predictions, and a full 2026 March Madness bracket built from KenPom consensus metrics, S-curve seed errors, injury context, and a custom travel-penalty model.`
- Revised body: `A full 2026 bracket built from KenPom consensus metrics, S-curve seed errors, injury context, and a custom time-zone travel penalty model. Best upset picks and Final Four predictions included.`
- Rationale: Front-loads the methodology (what makes this different) before the outputs (picks/predictions). The thesis line above already hooks the reader. Minor change, mostly reordering.

Note: `MARCH_MADNESS_THESIS` in `march-madness-data.ts` ("The edge in this bracket is time zones plus seed errors, not just chalk.") is strong and on-voice. Keep as-is. However, this constant is also used in metadata/structured data in `page.tsx`. Since we're scoping to page + component copy only and this constant is shared, we leave it untouched.

### 2.2 Data/Civic Cluster

#### Polling Aggregator (polling-aggregator-client.tsx)

**File:** `src/app/polling-aggregator/polling-aggregator-client.tsx`

- Current body: `Aggregated presidential approval, generic ballot averages, and key 2026 Senate and governor race polls — updated from public pollsters.`
- Revised body: `Presidential approval, generic ballot averages, and key 2026 Senate and governor race polls aggregated from public pollsters.`
- Rationale: Removes the em dash (banned by voice guide). Restructures to avoid the passive "aggregated...updated from" construction. Simpler.

#### SpaceX Mission Control (spacex-mission-control-client.tsx)

**File:** `src/app/spacex-mission-control/spacex-mission-control-client.tsx`

- Current H1: `A launch board built like an operations room, not a brochure.`
- Keep as-is. Strong, opinionated.

- Current body: `Track the next mission, scan the queue, and inspect rockets, payloads, crew, capsules, and pads without losing context.`
- Revised body: `Next mission, launch queue, and a detail panel for rockets, crew, payloads, capsules, and pads. Everything stays connected so you don't lose the thread when you drill in.`
- Rationale: Replaces the imperative verb list ("Track... scan... inspect...") with noun-phrase structure that's easier to scan. Makes "without losing context" concrete ("don't lose the thread when you drill in").

### 2.3 Fintech Cluster

#### Budget Planner (budget-planner-client.tsx)

**File:** `src/app/fintech-tools/budget-planner/budget-planner-client.tsx`

- Current body: `Plan one month at a time with an editorial-style ledger for income, savings, category targets, and manual expenses. Everything stays in your browser.`
- Revised body: `Monthly budgeting in a single editorial-style ledger. Income, savings targets, category budgets, and manual expenses all in one place, saved in your browser.`
- Rationale: Front-loads "monthly budgeting" (what it is). "Everything stays in your browser" becomes "saved in your browser" (shorter, same meaning). Removes the imperative "Plan one month at a time" which reads like instructions.

#### Interchange IQ (page.tsx)

**File:** `src/app/fintech-tools/interchange-iq/page.tsx`

- Current body 1: `Most merchants don't know what they're actually paying for payment processing, or why. Adjust the sliders to see how volume, average ticket size, and card mix affect total fees across major processors.`
- Revised body 1: `Most merchants don't know what they're actually paying for payment processing, or why. Move the sliders to see how volume, ticket size, and card mix change your total fees across seven processors.`
- Rationale: Minor tightening. "Adjust" to "Move" (more direct verb). "average ticket size" to "ticket size" (unnecessary qualifier). Adds "seven" to make the processor count concrete. Already has strong problem-first framing.

- Current body 2: `Interchange economics are at the core of every payments product. I modeled the real cost structure behind flat-rate and interchange+ pricing using published rate data.`
- Keep as-is. First-person, specific, on-voice.

---

## Wave 3: Minor Polish

### 3.1 Footer (Footer.tsx)

**File:** `src/components/Footer.tsx`

- Current heading: `Thanks for taking a look.`
- Keep as-is. Warm, personal.

- Current body: `If a project stands out, I'd be happy to share more about the work or my background.`
- Keep as-is. Good.

- Current tagline: `Building products where clear thinking and reliable execution actually move the needle.`
- Revised tagline: `Building products where clear thinking and reliable execution move the needle.`
- Rationale: "actually" is filler. The sentence is tighter without it.

**Test impact:** `Footer.test.tsx` asserts on `"Thanks for taking a look."` which is unchanged. No test update needed for the footer.

### 3.2 About Page (About.tsx)

**File:** `src/components/About.tsx`

The About page is the strongest copy on the site. Only one minor tightening:

- Current (paragraph 2, partial): `...I lean on them because they keep my product decisions connected to how things actually work rather than how I imagine they do.`
- Revised: `...I lean on them because they keep my product decisions connected to how things work rather than how I imagine they do.`
- Rationale: "actually" is filler again. The contrast ("work" vs. "imagine") already carries the meaning.

### 3.3 Contact Page (ContactContent.tsx)

**File:** `src/components/ContactContent.tsx`

- Current CTA body: `I'm especially interested in analytics, fintech, and workflow products, along with teams where clear strategy and reliable delivery are actually connected.`
- Revised CTA body: `I'm especially interested in analytics, fintech, and workflow products, along with teams where clear strategy and reliable delivery are connected.`
- Rationale: Same "actually" filler pattern.

- Current "Best conversations" copy: `I'm most engaged when the problem involves analytics, fintech, platform reliability, or anywhere that clear product thinking changes the actual outcome, not just the roadmap.`
- Revised: `I'm most engaged when the problem involves analytics, fintech, or platform reliability. Places where clear product thinking changes the outcome, not just the roadmap.`
- Rationale: Splits one overlong sentence into two. "actual outcome" to "outcome" (the contrast with "roadmap" already implies "actual").

---

## Test Assertions to Update

| Test File | Current Assertion | Change Needed |
|---|---|---|
| `src/components/__tests__/Footer.test.tsx:33` | `"Thanks for taking a look."` | None (unchanged) |
| `src/app/__tests__/portfolio-shell.test.tsx:33` | `<h2>Selected work</h2>` | None (kicker unchanged) |
| `src/app/news-pulse/__tests__/news-pulse-client.test.tsx:83` | `I built News Pulse to get a fast read` | None (unchanged) |

No test updates required. All copy changes are in strings that are not asserted in tests.

## Files Modified (Complete List)

| # | File | Wave | Change Type |
|---|---|---|---|
| 1 | `src/components/home/HomePageContent.tsx` | 1 | Tighten hero + sections |
| 2 | `src/app/portfolio/page.tsx` | 1 | Tighten H1 |
| 3 | `src/app/resume/resume-client.tsx` | 1 | Rewrite intro |
| 4 | `src/app/writing/page.tsx` | 1 | Tighten empty state |
| 5 | `src/app/investments/investments-client.tsx` | 1 | Rewrite body |
| 6 | `src/app/premier-league/premier-league-client.tsx` | 2 | Rewrite body |
| 7 | `src/app/la-liga/la-liga-client.tsx` | 2 | Rewrite body |
| 8 | `src/app/fantasy-football/fantasy-football-client.tsx` | 2 | Rewrite body |
| 9 | `src/app/march-madness-2026/march-madness-client.tsx` | 2 | Reorder body |
| 10 | `src/app/polling-aggregator/polling-aggregator-client.tsx` | 2 | Fix em dash + rewrite |
| 11 | `src/app/spacex-mission-control/spacex-mission-control-client.tsx` | 2 | Rewrite body |
| 12 | `src/app/fintech-tools/budget-planner/budget-planner-client.tsx` | 2 | Tighten body |
| 13 | `src/app/fintech-tools/interchange-iq/page.tsx` | 2 | Tighten body |
| 14 | `src/components/Footer.tsx` | 3 | Remove "actually" from tagline |
| 15 | `src/components/About.tsx` | 3 | Remove "actually" from one sentence |
| 16 | `src/components/ContactContent.tsx` | 3 | Remove filler + split long sentence |

## Verification

After each wave:
1. `npm run build` to confirm no build-time breakage
2. `npm test` to catch any broken assertions
3. `npm run dev` and visually check each changed page in the browser
4. Confirm no line-break or overflow issues from longer/shorter strings
5. Confirm PL and La Liga copy are clearly differentiated
