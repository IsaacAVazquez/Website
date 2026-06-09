# World Cup 2026 Re-Ranking Template and Cadence Plan

**Internal. Not a published page.** This is the format for the follow-up articles that continue the countdown as the tournament plays out. The original countdown ranks the field before kickoff. These updates re-rank the survivors after each round, owning what the first list got right and wrong.

The body below is a copy-paste MDX scaffold. Do not leave it in `content/blog/` unfilled, because anything in that folder is picked up as a live post. When you are ready to write an update, copy the scaffold into a new file under `content/blog/`, fill in every `[BRACKET]` and delete every `{/* guidance */}` comment, then set the real `publishedAt`. The `{/* */}` comments are valid MDX and will not render if you forget one, but clear them out anyway.

---

## Suggested cadence

The tournament gives you four or five natural re-ranking moments. Each one has a different job.

1. **After the group stage (round of 32 set, around June 27).** The biggest update of the series. Roughly a third of the contenders may already be gone, and the projected knockout paths I guessed at before the draw are now real fixtures. Re-rank everyone still alive, run a short obituary for the contenders who went out, and call out the dark horses who earned their way in. Working title pattern: "World Cup 2026 Power Rankings After the Group Stage."

2. **After the round of 32 (around July 3).** The field is down to sixteen. Shorter than the group-stage piece. Focus on the upsets, the favorites who looked vulnerable, and how the bracket has tightened.

3. **After the round of 16 (quarterfinalists known).** Eight teams left. This is where the article shifts from ranking a broad field to handicapping a small one. Rank the eight, preview the four quarterfinals as matchups.

4. **After the quarterfinals (final four set).** Rank the four. This can be a pure matchup-preview piece for the two semifinals rather than a ranking.

5. **Before the final.** A head-to-head of the two finalists and a champion pick, plus a short honest scorecard of how the original top ten held up.

A through-line worth keeping across all of them is accountability. The original list made specific calls (Spain over France, Brazil over Portugal, Norway left out). Each update should say plainly which of those calls are aging well and which are aging badly. That honesty is the whole appeal of running a countdown in public.

## What changes each round (fill-in checklist)

Before writing an update, gather the same five inputs the original used, refreshed for the current round:

- **Results.** Who advanced, who went out, the scorelines and the manner of them. A team can advance and still drop in your ranking if it limped through.
- **Updated odds.** Pull fresh title odds and reach-round prices. Note movement since the last piece, since that is the most honest signal of how the market re-rated a team.
- **Updated model numbers.** If Opta or another model re-runs its simulation after the groups, cite the new title probabilities.
- **Injuries and suspensions.** Knockout football turns on availability. A key player suspended for accumulated cards or hurt in the last game can swing a ranking.
- **The actual bracket.** Replace every "projected" opponent from the original pieces with the confirmed fixture. This is the single biggest source of new information after the group stage.

---

## Copy-paste MDX scaffold

```mdx
---
title: "World Cup 2026 Power Rankings After the [ROUND]: [HOOK]"
excerpt: "[One or two sentences. Lead with the biggest mover or the biggest casualty, name the new number one if it changed, and promise the honest accounting of what the pre-tournament list got wrong.]"
publishedAt: "[YYYY-MM-DD]"
category: "Sports Analytics"
tags: ["World Cup", "World Cup 2026", "Power Rankings", "Soccer", "Sports Analytics", "Betting"]
featured: false
archiveBucket: "Sports & Fantasy"
author: "Isaac Vazquez"
seo:
  title: "World Cup 2026 Power Rankings After the [ROUND]"
  description: "[Updated power rankings after the [ROUND] of the 2026 World Cup, with the biggest movers, the contenders eliminated, the refreshed betting picture, and a scorecard on the pre-tournament top ten.]"
  keywords: ["World Cup 2026 power rankings", "World Cup 2026 [round]", "World Cup 2026 favorites", "World Cup 2026 odds", "[team] World Cup 2026"]
---

# World Cup 2026 Power Rankings After the [ROUND]: [HOOK]

{/* Voice reminders: first person, no em dashes, no colons as sentence connectors, prose over bullet lists. Read WRITING_VOICE.md if unsure. */}

[Open with the single most important thing that changed. If the pre-tournament number one held up, say so and say why. If it got knocked off, lead with that. Link back to the original list so readers can see what you are updating.] Before any of this started, I [ranked my top ten contenders](/writing/world-cup-2026-top-ten-contenders), and [the round] has already made some of those calls look smart and some look foolish. Here is where the field stands now, and where I was wrong.

## What I got right, and what I got wrong

[The accountability section. Be specific. Name the call from the original list that is aging best and the one aging worst. For example, whether Spain over France is holding up, whether Norway should have been in the ten, whether the Brazil-over-Portugal coin flip landed. This is the section readers come back for, so do not soften it.]

## The contenders who are out

[Run through any team from the original top ten that has been eliminated. One honest paragraph each. What went wrong, whether it was an upset or a regression to the mean, and whether you saw it coming. If a pre-tournament dark horse knocked one of them out, give that team credit here.]

## The updated ranking

[Re-rank everyone still alive. Keep the same per-team rhythm as the original entries but shorter, because the field is smaller and the reader already knows the squads. For each surviving team, lead with how it actually looked in [the round], not how it looked on paper, then update the path with the confirmed bracket and the refreshed odds.]

[1.] **[Team]** — [What changed and why it is here now. Confirmed next opponent. Updated title price and movement since the last piece.]

[2.] **[Team]** — [...]

{/* Continue for every surviving contender. After the group stage you may be ranking 12-16 teams; after the round of 16, only 8. Adjust depth to the field size. */}

## The new dark horses

[Teams that were outside the original ten or in the dark-horse section and have now played their way into the conversation. The whole point of re-ranking is that the tournament tells you things the pre-tournament data could not, so give the genuine surprises their due.]

## The betting picture now

[Refresh the market read. Who shortened, who drifted, and where the value sits now that a third of the field is gone and the paths are set. Keep the framing that this is analysis and not advice, and that odds move. Reference the confirmed bracket when you talk about reach-round prices, since those are now priced against real opponents rather than projections.]

## What the next round changes

[Close by pointing forward. Name the one or two fixtures in the next round that will move this ranking the most, and tee up the next update. Avoid a generic wrap-up. End on a specific thing to watch.]
```

---

## Notes on reusing the original research

The pre-tournament dossier (`world-cup-2026-top-ten.md`) stays useful through every update, because the history, squad and pedigree sections do not change. What changes is form, the bracket, and the odds. When you write an update, you are mostly swapping the "projected path" and "betting angle" parts of each team's profile for confirmed fixtures and fresh prices, and adding a results-based paragraph on how the team actually looked. Keep the original dossier as the reference for everything that is fixed, and treat each re-ranking as a delta on top of it rather than a rewrite.
