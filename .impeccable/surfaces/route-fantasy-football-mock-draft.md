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
