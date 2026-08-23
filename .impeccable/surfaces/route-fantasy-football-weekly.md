---
version: 1
slug: "route-fantasy-football-weekly"
primary_target: "route:/fantasy-football/weekly"
related_targets: ["src/app/fantasy-football/weekly/weekly-client.tsx","src/app/fantasy-football/weekly/page.tsx","src/lib/fantasyWeeklySnapshot.ts","src/hooks/useFantasyWeeklySnapshot.ts"]
---

# Fantasy Football Weekly Board

## Mode

Operate. The visitor is deciding a lineup or a waiver claim on a Tuesday, so scanability and
a stable, predictable table outrank expression. This is the one fantasy board that stays true
after the season opens, and the copy says so directly.

## Audience

Isaac, plus fantasy players arriving from search in season. Same standing as the rest of the
tool fleet in PRODUCT.md, meaning credible and available rather than staged as the pitch.

## First critique, 2026-08-23

This surface shipped without ever being critiqued and had no brief until today. It scored
25/40, the lowest of the seven fantasy surfaces, which is a function of never having had a
pass rather than of being badly built.

## Decisions not to re-litigate

The preseason empty state is deliberate and correct. `useFantasyWeeklySnapshot.ts` documents
it in a comment, and the builder refuses to publish before Week 1, so between now and kickoff
`/data/fantasy/weekly.json` legitimately does not exist and the 404 resolves to
`notPublished` rather than to `error`. The browser still logs the 404 as a console error,
which is unavoidable for a fetch that 404s and is not a defect. Do not treat that console
line as a finding, and do not weaken the empty-state copy, which explains that rostered
percentages before leagues have drafted describe the preseason rather than a waiver wire.
It already links "draft rankings" through to `/fantasy-football`.

FantasyPros publishes no single overall board in season, so FLEX stands in for the Overall
tab. Flex and quarterback ranks live in separate rank spaces, because a flex rank of 12 and a
quarterback rank of 12 are not comparable. No UI here may let a visitor read them as one list.

The waiver reading is a published rank percentile minus a published rostered percentage. It
models no bid, no projection and no points total, and copy must never imply otherwise.

## Two findings the verifiers refuted, 2026-08-23

Do not re-raise. "The board toggle changes nothing in the panel directly beneath it" and
"the scoring toggle is inert on the quarterback board" were both refuted 2 to 0 by
independent verification against the source.

## Verified state, 2026-08-23

Mechanical sweep in both themes at 390, 768, 1024 and 1440, with the parser sanity gate
reproducing ink on paper at 16.29:1 light and 15.28:1 dark: zero AA contrast failures, zero
horizontal overflow, zero non-exempt sub-44px targets, exactly one `main`, exactly one `h1`,
and zero unnamed `section` landmarks. The one flagged target is the site footer's "Now" link
at 34.8px, which is shared shell code rather than weekly code.

## Passes landed, 2026-08-23

A `layout` pass gave the rankings table a sticky header row so the column meanings survive a
150-row scroll, and put it in its own scroll container. A second `layout` step grouped the
scoring and board choices, which had been rendering as six loose pills separated only by a
4px gap, and gave each group a real accessible name. A `clarify` pass named the denominator
behind the waiver percentile, since the copy invites hand-checking rows and the reader could
not previously reproduce the number. A `harden` pass moved scoring and board selection into
the URL, matching every sibling board, so a weekly view can be linked and restored. An
`optimize` pass preloaded the snapshot so its fetch no longer waits on the JS bundle.

## Deliberately deferred

Search and a position filter on the table are product work rather than remediation, and were
left alone on purpose. Both weekly panels use `.home-card`, which carries an always-on
treatment that may not suit this surface; that is a visual decision for whoever owns the
card, not a defect with a threshold.

## One stale doc line

`CLAUDE.md` still says of the weekly snapshot that "No route renders this snapshot yet."
That is false. The route exists at `/fantasy-football/weekly`, returns 200, and renders
`weekly-client.tsx`. Code wins; the doc line needs correcting whenever CLAUDE.md is next
touched.
