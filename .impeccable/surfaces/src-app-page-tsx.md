---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Home surface brief

**Scope.** The `/` home page only. Site header and footer stay Working Instrument; the new world lives between them and is built to be able to propagate site-wide later.

**Visitor mode.** Persuade. A professional peer (VC, PM, MBA, Haas) who already has a reason to look Isaac up, deciding in 20-60 seconds whether he is a credible builder worth remembering and reconnecting with.

**Job / action.** Read the scale of what he has built at a glance, believe he is a serious builder who also thinks clearly, and take a next step (open the work, read the writing, reach out). Building-first: shipped work leads, the writing gives it depth.

**Proof / content on hand.** Real featured projects (`src/constants/caseStudies.ts`) with real metrics; real long-form writing (`content/blog/`); the live production data feed already wired into the hero (earthquake, SpaceX, markets); the real career record and Berkeley coordinates.

**Constraints.** Keep the H1 claim "I build tools that make hard problems easier to act on" and the "See the work" / "Read the writing" CTAs (test + voice anchors). Keep `home-projects` and `home-writing` at exactly three links. Keep `home-tools` present but demoted (tools are personal work, not the pitch). Preserve light and dark, 44px targets, reduced-motion, one h1/main. Copy stays in Isaac's plain first-person voice; no salesy or templated energy.

**Chosen direction: The Atlas.** Home is a surveyed chart of Isaac's body of built work. It evolves Working Instrument (limestone paper, graphite ink, hairlines, one signal accent, mono readouts) into the survey-chart tradition: graticule linework, plate numbers, coordinate readouts, a legend, a scale bar. Every map element carries real information; regions are real domains and stations are real projects. Nothing cartographic is decorative.

**Memorable moment.** The first viewport is a chart plate, not a hero sentence: a graticule field carrying the title cartouche (name, claim, real Berkeley coordinates) and live "field readings," so a peer sees the work instrumented as surveyed territory immediately.

**Settled 2026-08-02 (critique).** The map plots from real data rather than shedding its marks. `TERRITORY` and `PROJECT_PLOTS` stop being hand-authored constant arrays and derive position from each project's real category and ship date, so grid refs decode, the two Fintech projects cluster, the missing "News & data" region appears, and the remaining tools can render as faint dots behind the featured three. Do not re-open this as "cut the cartography" on a later pass. The schematic-layout comment in `HomeInstrument.tsx` is the thing being replaced, not a standing decision.

**Unresolved.** Whether the Atlas propagates site-wide (promote into DESIGN.md then) or stays home-only (keep it recorded here). Exact cartographic tokens settle on first build.
