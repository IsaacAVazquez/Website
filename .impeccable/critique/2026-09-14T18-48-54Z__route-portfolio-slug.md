---
target: /portfolio/[slug]
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/isaacvazquez/Website/route:/portfolio/[slug]"
timestamp: 2026-09-14T18-48-54Z
slug: route-portfolio-slug
---
Method: re-score after remediation. A: design review subagent (post-fix) · B: computed-value sweep subagent (post-fix), synthesized in the parent. Run 2026-09-14 on branch design/catalog97-loop.

Mode: Read, all ten heuristics scored (unchanged). Baseline for this run is `2026-09-14T18-34-43Z__route-portfolio-slug.md`, scored 19/40 before remediation.

Scope note. Sampled from the "Investment Analytics Platform" lead card at 1440. The click landed on `/investments`, h1 "Investments", header links "Home, About, Projects, Writing, Investments, Fantasy, Resume, Contact", with no "Back to" or "Work" link, and the build-note link at 3,746px of a 4,380px page. A second click on the first ledger row landed on `/frontier-models`, but its capture caught a loading skeleton and was not scored. No 390 or dark landing was viewed.

Storage note. The pre-fix snapshot for this target was marked closed on 2026-09-14 by `critique-storage latest`, which closes any snapshot whose `file:` target identity no longer resolves, and a `route:` target never resolves to a file. Its two P1s were not cleared. This snapshot carries them forward as the live backlog.

## Design health score

| # | Heuristic | Score | Key issue now |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Nothing says the visitor was redirected, and `aria-current` lands on "Investments". |
| 2 | Match system / real world | 1 | Clicked for the decisions, got "$0.00" and "No positions yet". |
| 3 | User control and freedom | 1 | No return to Work. |
| 4 | Consistency and standards | 1 | Full world change and nav vocabulary change. |
| 5 | Error prevention | 3 | Unchanged. |
| 6 | Recognition rather than recall | 2 | "Investment Analytics Platform" becomes "Investments". |
| 7 | Flexibility and efficiency | 2 | No next or previous project. |
| 8 | Aesthetic and minimalist design | 2 | Reasoning sits at 3,746 of 4,380px. |
| 9 | Error recovery | 3 | Empty states explain themselves. |
| 10 | Help and documentation | 2 | Only the bottom aside explains the project. |
| Total | | 19/40 | Poor (48%) |

## Resolved since the pre-fix snapshot

[P2] The route's metadata overstated the Investment Analytics Platform data source. Resolved at source. `caseStudies.ts` now describes committed snapshots of a Yahoo Finance dataset with Finnhub quotes and lists "Finnhub API" in tools, which feeds this route's metadata and structured data and agrees with the destination's "Market quotes via Finnhub".

The index-side mitigation (lead-card "How I built it" links) shortens the path to the reasoning for four projects, and it does not change this route.

## Priority issues

[P1] The route is a redirect, so no project has a readable case study.
Every record has a `link`, and `src/app/portfolio/[slug]/page.tsx` redirects to it. Kept on purpose on 2026-09-14, so this stays open as a known P1 and should not be reopened as a new finding.
Suggested command: /impeccable shape

[P1] The click drops the visitor into another design world with no bridge or return path.
Verified again at 1440 as above. Kept on purpose on 2026-09-14 together with the redirect.
Suggested command: /impeccable layout

[P2] The link name and the landing h1 disagree.
"Investment Analytics Platform" on the index, "Investments" on the landing.
Suggested command: /impeccable clarify

[P2] The template would render empty sections if the redirect went away.
Not re-checked, since the template file is not in the diff.
Suggested command: /impeccable harden

[P2] Build-note copy uses compressions the voice spec replaces.
`src/components/projectBuildNoteContent.ts` is not in the diff, so "spreadsheet maze" and "invented precision" are presumably still there. The file was not reopened.
Suggested command: /impeccable clarify

## New issues

None introduced on this route.

## Applied after measurement

Nothing in the post-measurement cleanups touches this route.

## Deliberate decisions (do not re-litigate)

/portfolio/[slug] keeps redirecting into the Working Instrument world, and Work cards keep opening the live tool.

## Not checked

The template's empty sections, `projectBuildNoteContent.ts` copy, 390 and dark captures of the landing, and the destination tool's own contrast findings from the pre-fix sweep.
