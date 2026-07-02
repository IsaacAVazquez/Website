# Redesign Brief

Handoff brief for a full visual redesign of the site, driven by Fable. Phase one
establishes a new design direction on the flagship portfolio surfaces; phase two
propagates that language to every project and tool.

---

You are working in Isaac Vazquez's personal website repo, a Next.js 16 / React 19 /
TypeScript / Tailwind v4 codebase deployed on Netlify. Your job is to lead a genuine
redesign. Modernize the visual language and interaction quality across the whole site,
starting with the flagship portfolio surfaces and then refreshing every project and
tool. This is portfolio-first, so the homepage and portfolio should read as the work of
a senior practitioner and set a bar the rest of the site lives up to.

**Read first, and treat as context rather than cage.** Read `STYLING.md`,
`DESIGN_CHECKLIST.md`, `WRITING_VOICE.md`, and the "Styling Rules" and "Platform
Overview" sections of `CLAUDE.md` so you understand the current system and why it's
built the way it is. You have license to break the current visual language. Reinvent the
type scale, layout ideas, color usage, hero and section treatments, motion, and
component vocabulary. What you may not break is the engineering discipline underneath it:
keep everything token-driven (evolve or replace the `--home-*` palette rather than
scattering raw hex through components), never use `color-mix(…, white)` (it breaks dark
mode), and keep full light/dark parity, semantic landmarks, one `h1` per portfolio-shell
page, visible focus states, 44px touch targets, and `prefers-reduced-motion` support.
Framer Motion entrances must honor `useReducedMotion()`. If you retire tokens or
checklist rules, update `STYLING.md` and `DESIGN_CHECKLIST.md` to match so the docs stay
true.

**What I want it to feel like.** Current, confident, distinctive, and fast, not a
generic AI template. Push hard on a deliberate type scale and vertical rhythm, generous
intentional whitespace, a strong visual hierarchy that guides the eye, tactile
components with considered hover/focus/active states, and tasteful motion that rewards
scrolling without getting noisy. Editorial magazine meets modern product site.
Distinctive over safe, but always legible.

**Work in two phases.**

Phase one is the redesign direction and the flagship surfaces (`/`, `/about`,
`/portfolio`, `/resume`, `/contact`). Start by auditing the current state and telling me,
briefly, the three or four things most holding the design back. Then propose a concrete
new direction (type, color system, spacing, motion language, component treatments) and
show me two or three real options for the homepage hero before you build. Once I pick a
direction, implement these surfaces first and establish the new shared primitives and
tokens that the rest of the site will inherit.

Phase two is refreshing and refining every project and tool to the new language: the
roughly twenty experimental dashboards (sports, civic, space, news, markets), fantasy
football, investments and seasonal pages, the fintech calculators, the MBA internship
tracker, and the browser-persisted personal tools. Reuse the shared components
(`src/components/football/*` back several dashboards) so the refresh propagates cleanly
instead of being redone per page. Keep every route, all data wiring, the snapshot-driven
fetch pattern, and each page's `error.tsx` intact. Preserve required compliance
disclosures, unverified-data flags, and the retirement planner's educational disclaimer.
Go surface by surface, run `DESIGN_CHECKLIST.md` after each, and give me a short list of
what changed and anything that needed an accessibility or reduced-motion accommodation.

**Ground rules throughout.** Preserve routes, content, and functionality. Don't add
heavy dependencies. Keep diffs reviewable and match the idioms of the surrounding code.
Any user-facing copy you write or revise must follow `WRITING_VOICE.md`. Confirm routes
from `src/app/**/page.tsx` and behavior from the components, not from older docs.

---

## Kickoff prompts

Short prompts to hand Fable. The substance lives in the brief above; these just start
each phase in the right place.

### Phase one — direction and flagship surfaces

> Read `docs/REDESIGN_BRIEF.md` and lead the redesign it describes. Start with phase one:
> audit the current homepage and portfolio surfaces, tell me the three or four things
> most holding the design back, then propose a new direction and show me two or three
> homepage hero options before building anything. Don't start implementing until I pick a
> direction.

Run this on **Max** (max reasoning effort). Direction-setting is judgment-heavy and
sequential with human review gates, so it doesn't parallelize well.

### Phase two — projects and tools rework

Feed this once phase one is merged and the new tokens and shared primitives are locked.

> Read `docs/REDESIGN_BRIEF.md` and execute phase two: refresh every project and tool to
> the new design language established in phase one. Before touching anything, confirm the
> new tokens and shared primitives from phase one are final, then give me an inventory of
> every surface you're going to touch grouped by how much rework each needs (mechanical
> token swap, moderate component refresh, or full redesign). Work through them surface by
> surface, reusing the shared components so the refresh propagates instead of being redone
> per page. Keep every route, all data wiring, the snapshot-driven fetch pattern, and each
> `error.tsx` intact, and preserve all compliance disclosures, unverified-data flags, and
> the retirement planner disclaimer. Run `DESIGN_CHECKLIST.md` after each surface and give
> me a short changelog per surface.

Phase two is genuine fan-out work (many independent surfaces applying the same
primitives), so it's a good fit for **ultracode**. Lock the phase-one foundation first —
if the shared tokens are still moving you'll get inconsistent refreshes across ~20 pages.
