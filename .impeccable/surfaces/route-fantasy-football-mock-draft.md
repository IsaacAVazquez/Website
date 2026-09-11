---
version: 1
slug: "route-fantasy-football-mock-draft"
primary_target: "route:/fantasy-football/mock-draft"
related_targets: ["src/app/fantasy-football/mock-draft/mock-draft-client.tsx","src/app/fantasy-football/mock-draft/hooks/useMockDraftState.ts","src/lib/mockDraft.ts"]
---

# Fantasy Football Mock Draft

## Mode

Operate. The visitor is rehearsing the early rounds of a one-QB draft against a seeded room, so the loop is judge, pick, and read the tape, under a self-imposed clock rather than a real one. Structure and density follow the redraft tracker's conventions, and brand lives in the same precise details.

## Audience

Isaac, plus fantasy players arriving from search who want reps before a real draft. The room is simulated, so the page has to keep saying so honestly rather than dressing simulation up as prediction.

## What the surface is

A client-driven simulator at `/fantasy-football/mock-draft` (`mock-draft-client.tsx`, state in `hooks/useMockDraftState.ts`, engine in `src/lib/mockDraft.ts`). Opponents pick from the published consensus board and market ADP with visible source dates. Setup, an in-draft view with a fascia strip, quick picks, a room tape, and a sim-to-end board grid plus value report are all one route with three top-level states.

## Decisions not to re-litigate

Simulated picks pause when the ranking source is stale; that gate is honesty machinery, keep it. Opponent behavior comes from the published board and ADP, never from an invented projection. The room is explicitly a rehearsal aid, so copy must keep saying "simulated" and "seeded room" rather than implying prediction.

## Verified state, 2026-08-22

First audit ran with the four-route batched sweep after the 2026-08-22 baseline. Zero horizontal overflow at 390 and 1440, one h1, and after same-day fixes: exactly one `main` (the client's three per-state `main` containers became divs, the layout owns `#main-content`), "You" and "You're up" moved from 4.09:1 and 4.15:1 on their signal washes to 6.08 and 6.16 in light (7.29 and 7.39 in dark) via signal mixed 72% toward ink, and the two footer tool links took the 44px floor. Remaining sub-44 matches are the hidden mobile nav toggle and the site footer's "Now" link, both shared shell. No full dual-agent critique has scored this surface yet; that is the natural next evaluate step if the surface gets real investment.


## Full-group loop, 2026-08-23

This surface was critiqued as part of the first pass to treat all seven fantasy UI surfaces
as one job. The whole record, including the instrument's blind spots and the findings the
verifiers refuted, is in `.impeccable/surfaces/route-fantasy-football.md` under
"Full-group loop, 2026-08-23". Only what is specific to the mock draft is repeated here.

It scored 29/40. Four findings landed. A `harden` pass gave the draft loop a live region and
kept focus stable across each pick, which had been announcing nothing and dropping focus every
cycle on a clock-driven surface. "Sim to end" was an unconfirmed one-way door styled
identically to the undo beside it, and is now differentiated and explained. The live room's
pause alert named the wrong cause and is now accurate with a way out. The recap's disabled
"Run it back" now carries its reason. Four `section` landmarks in the running state had no
accessible name, so they were not exposed as landmarks at all, and now carry literal labels.

Measured after, in both themes at 390 and 1440 with a draft running: zero AA contrast
failures, zero horizontal overflow, zero sub-44px targets, one `main`, one `h1`, zero unnamed
sections. The 2026-08-22 signal-on-signal-wash repair here still holds, and the same defect
was found and fixed on the redraft tracker this round.

## Full-group loop, 2026-09-11

First critique of this surface in its in-season state, run as part of the loop recorded in
`route-fantasy-football.md` under "Full-group loop, 2026-09-11". It scored 27 of 40 with zero
P0 and five P1, all five upheld two to zero. Snapshot at
`.impeccable/critique/2026-09-11T08-58-05Z__route-fantasy-football-mock-draft.md`.

The one that mattered most was the gate against the note. The scope note said the board
"stops refreshing once real games start" and the room was "left running", while
`simulationAvailable` still used the four-day stale band. Driven with a fixed clock at
2026-09-15 the chips read "Board Stale" and "ADP unavailable", Start mock was disabled, and
the pause copy told the visitor to wait for a refresh the note said would not come. Both
verifiers said keep the gate, which this brief already protects, and fix the copy, with one
correction to the finding: the refresh cron runs daily through December and the upstream stamp
moved from 09-09 to 09-10 after the opener, so "a refresh is not coming" was the note's
assertion, not an observed fact. The note now says the room drafts off the published preseason
board and its mock-draft ADP, that it pauses simulated picks if that board goes stale, carries
a mono stamp line with both dates, and links the weekly board. The stale status, the live
room's alert and the recap's blocked line all name the dated board and stop pointing at a
refresh. Measured at 09-11 the chip reads Current and Start is enabled; at 09-15 the room
pauses with the new sentences.

The fascia was sized by its button stack. Every readout cell measured 160px for 68px of
content at 1440, 768 painted three empty tracks, and 390 pinned 331 of 844px with three
readouts truncated. The readouts are a bordered description list now with the three pills on
their own row, and below `md` the four readouts collapse to one wrapping mono line. Strip
height went 162 to 81 at 1440, 245 to 137 at 768 with zero empty tracks, and 259 to 109 at
390 with zero truncations, pinned share 39% to 21%.

Board numbers carried only `title` attributes under an `aria-hidden`, static label row. Inside
the `adpAvailable` branch each value now has an sr-only label and an `md:hidden` micro label,
following the redraft tracker's `DraftBoard.tsx`; the sticky header row is deferred until the
fascia shrinks further, as both verifiers asked. The scope note rendered outside the shell
(left 0, width 1440 against the header's 180 and 1080) and is wrapped now. And Start mock,
Take back and Run it back all left focus on body with an empty status; a pending-focus ref
consumed after the on-the-clock section mounts moves focus there (Sim to end goes to the value
report) and a transition sentence feeds the status region, with Take back describing the
restored turn. The running-state h1 sits on the DESIGN.md title ramp now.

Verified after in both themes at 390, 768, 1024 and 1440, setup and running: zero AA contrast
failures, zero horizontal overflow, zero sub-44px targets, one `main`, one `h1`, zero unnamed
sections, 38 of 38 focus rings. Still open: `getFantasyAdpFreshness` hides the ADP columns on
the same four-day rule (shared `fantasyUtils.ts`), and the "Sim to end" fill in light is nearly
the same tone as the signal wash beside it (P2).
