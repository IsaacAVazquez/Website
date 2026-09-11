---
version: 1
slug: "route-fantasy-football-waivers"
primary_target: "route:/fantasy-football/waivers"
related_targets: ["src/app/fantasy-football/waivers/page.tsx","src/app/fantasy-football/weekly/weekly-client.tsx","src/lib/fantasyWeeklySnapshot.ts","src/hooks/useFantasyWeeklySnapshot.ts"]
---

# Fantasy Football Waiver Targets

## Mode

Operate. The visitor is deciding a waiver claim on a Tuesday, so the list has to be scannable,
honest about what the gap number is, and usable on a phone, which is where most claims get
placed. It shares one client with the weekly board (`weekly-client.tsx`, `view="waivers"`),
so the decisions in `route-fantasy-football-weekly.md` apply here too.

## Audience

Isaac, plus fantasy players arriving from search in season. Same standing as the rest of the
tool fleet in PRODUCT.md, credible and available rather than staged as the pitch.

## Decisions not to re-litigate

The waiver reading is a published rank percentile minus a published rostered percentage.
It models no bid, no projection and no points total, and the copy says so and refuses to
invent a bid figure. The percentile is measured against the whole published board, the
denominators print on the page, and a candidate has to be startable, rostered under the
published threshold, and clear the minimum gap to be listed. Flex and quarterback rows keep
their board named on every row because the two rank spaces are not comparable.

## First critique, 2026-09-11

The route was split from weekly on 2026-09-09 (commit `11ec4dd`) and had never been
critiqued or briefed. It scored 30 of 40 with zero P0 and two P1, both upheld two to zero by
independent verification. Snapshot at
`.impeccable/critique/2026-09-11T08-57-02Z__route-fantasy-football-waivers.md`. The whole
loop, including the instrument and the season state, is recorded in
`.impeccable/surfaces/route-fantasy-football.md` under "Full-group loop, 2026-09-11".

The phone table was the first P1. At 390 the table carried a 38rem floor inside a 316px
wrapper, so the default paint showed names and "Flex" or "QB" and nothing else, with Rank,
Percentile, Rostered and the Gap column the page is named for sitting at x=369 to 645 behind a
clip with no scroll hint, no sticky column, and no tab stop. Sticky-left was not the fix,
because the Player cell alone is 274px and the five numeric columns alone measure 334px, so
neither half fits. Below `md` the list is now stacked, name over position, team and opponent,
then labeled pairs with Gap first and bold, measured at 390 as a 316px list with every value
on screen. From `md` up the table puts Gap directly after Player inside a labeled, focusable
region.

The freshness stamp was the second. `page.tsx` pins the route to the flex board and the
client derived source and staleness from that board alone, so the header read "Sep 10, 7:26 PM
· Current · 157 experts" while six of nineteen PPR rows came from the quarterback board, whose
own stamp (19:02Z, 142 experts) was never printed and whose staleness was never checked. The
stamp now prints both boards and the chip reads the worse of the two, and a test pins a
thirty-day-old quarterback source reading Stale while flex is fresh.

Two P2s fell out of the same edits. The count line is a polite status region, so a scoring
tap that takes nineteen rows to seventeen announces it, and the section h2 no longer repeats
the h1's words.

## Verified state, 2026-09-11

Both themes at 390, 768, 1024 and 1440, parser gate at 16.29:1 light and 15.28:1 dark: zero
AA contrast failures, zero horizontal overflow, zero sub-44px targets, one `main`, one `h1`,
zero unnamed `section` landmarks, 90 of 90 focus rings at 1440.

## Deliberately deferred

The critique's P2s on the silent twenty-row cap in `getFantasyWeeklyWaiverCandidates`
(uncapped counts were 19, 17 and 18 this week, so it is one row from biting), the duplicated
lead sentence between the title and the h2, and the preload that Chrome logs as a
credentials-mode mismatch are recorded, not fixed. The cap needs a product decision about
whether the list is "everyone who clears the gap" or "the top twenty", and the copy currently
promises the former.
