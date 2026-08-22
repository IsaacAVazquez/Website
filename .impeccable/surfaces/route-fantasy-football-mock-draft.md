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
