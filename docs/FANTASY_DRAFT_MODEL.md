# Fantasy draft model contract

Status as of August 25, 2026.

This document covers the draft models used at `/fantasy-football` and in the Draft Companion, plus the preseason trade calculator described near the end. Everything before the trade calculator section is about the draft tools.

I would use the draft tools as a process assistant. They now show the current market price, whether a gap is large relative to the published uncertainty, how far a player sits above the league's replacement lines, what the board may lose before the user's next turn, whether the roster can still reach a sensible final shape, and how the draft compares with teams that have made the same number of picks.

I would not use Draft Outlook as a player projection, a win probability, or a claim that one construction is proven to win. The snapshots do not contain weekly player distributions, current injury probabilities, waiver behavior, or a simulated field. Those missing inputs matter more than another round of hand tuning the current coefficients.

## Supported decision contexts

The redraft model supports PPR, Half PPR, and Standard one-QB leagues with 8, 10, 12, 14, or 16 teams, 13 through 18 rounds, and either snake or linear order. The configured lineup always has one QB, 1 through 3 RB, 1 through 4 WR, 1 or 2 TE, 0 through 3 FLEX, and 0 or 1 K and DST. FLEX accepts RB, WR, or TE. Those settings feed the roster and bye feasibility checks directly.

I would not carry this redraft model into Superflex, two-QB, tight end premium, points per first down, custom touchdown or bonus scoring, IDP, auction, keeper, dynasty, third-round reversal, guillotine, or an unsupported room size. Those formats change either the source board, the price scale, the roster constraints, or all three.

Every current best ball preset is a snake draft with half PPR scoring, and the roster size always equals the number of rounds. Most are 12-team, 18-round rooms using the standard 1 QB, 2 RB, 3 WR, 1 TE, and 1 FLEX lineup. Two are not. Superflex is a 20-round, 20-player room that starts one fewer receiver, keeps the flex, and adds a slot that may use a quarterback, and 6-Man is the same 18-round standard roster drafted by six teams instead of twelve. Both were corrected on 2026-08-23 against Underdog's published contest-style catalog, which is also where the half PPR figure comes from, since its NFL scoring type pays 0.5 per reception.

Underdog's catalog lists two more NFL best ball styles that are marked inactive and are therefore not modeled. One is a 20-round standard-roster style behind the Big Board, Bigger Board, Little Board, and War Room rules pages. The other is a 10-round style with a combined W/T slot behind the Mitten and Gauntlet pages, whose rules page and API roster disagree on the running back and bench split, so it would need that resolved before it could be modeled.

| Best ball preset | Recommendation mode | What the evidence supports |
| --- | --- | --- |
| Best Ball Mania VII | Exact | Standard PPR best ball consensus and current standard-season Underdog ADP match the modeled player pool and draft shape |
| The Puppy | Exact | The same board and market source match the modeled 12-team, 18-round room |
| The Little Dalmatian 2 | Exact | The same board and market source match the modeled 12-team, 18-round room |
| 6-Man | Reference | The same standard roster, but the snapshot's Underdog ADP is a 12-team market, so it prices players and not the pick slots in a six-team room |
| Eliminator | Reference | Contest-specific roster guidance, but no matching Eliminator ADP |
| Weekly Winners | Reference | Board and roster guidance only when the lobby card matches the fixed model; no matching slate ADP or player-level weekly projections |
| Sit & Go | Reference | Cumulative roster guidance only when the lobby card matches; no matching room ADP |
| Superflex | Reference | Separate sourced Superflex rank and tier board, but no matching Superflex room ADP |

The consensus board is scored differently than the contests it is used for, and I chose that trade deliberately. Underdog pays 0.5 per reception, but FantasyPros publishes exactly one best ball consensus and it reports its own scoring as full PPR. I checked the obvious half PPR best ball URLs on 2026-08-23 and they all redirect, so there is no half PPR best ball board to switch to. The half PPR boards FantasyPros does publish carry a `ranking_type_name` of `draft`, so they are redraft boards, and moving to one would drop the best ball roster logic this whole tool is built on and trade one mismatch for another. The full PPR baseline reads pass catchers slightly high against a half PPR contest, so the value column should be read as a guide, and both the contest lens footer and the draft tracker now say so on the page. Superflex is the exception and is already on half PPR, because FantasyPros does publish a half PPR Superflex page.

Exact means the tracker may show player-specific next-pick cards when the required sources are current. Reference presets keep the board, roster targets, and room tracking but withhold exact player cards and remove mismatched ADP. Archived contest versions are not modeled, and there is no historical rules selector. Daily drafts, short slates, single-game rooms, daily fantasy salary lineups, pick'em, playoff-only pools, and late swap are also outside this model. Weekly Winners does not turn the tracker into a general daily-slate tool.

## What the tool means

| Output | Definition | Safe interpretation |
| --- | --- | --- |
| Published rank | FantasyPros expert consensus rank, or ECR | A sourced ordinal board, not equal units of player value |
| Avg | Arithmetic mean of the contributing expert ranks | The center of the expert rank distribution, separate from ECR |
| ADP | Average overall pick from the attributed draft source | A market price for the source format and slate |
| Value or Reach | ADP minus ECR inside the top 150, after sample and variation checks | A prompt to inspect a market disagreement, not an automatic pick |
| Pick delta | Actual pick minus the usable pick baseline | Positive means the player lasted later than the baseline |
| VORP | FantasyPros projected season points above its same-position waiver replacement | A direct source value for the selected scoring and 10, 12, or 14 teams; zero means the player is at or below that source baseline |
| Replacement index | Rank based value above the league's starter and final roster cutoffs | A 0 to 100 ordinal index, not projected fantasy points |
| Wait cost | Consensus rank and replacement index drop to the best reliably priced option at the user's following pick | A current market estimate that appears only while the user is on the clock |
| Roster strength | Configured starting slots and planned depth that are covered | Structure only, with no claim about player quality beyond the market component |
| Draft Outlook | Weighted, room-relative draft process score | An ordinal comparison inside this room at equal draft progress |
| Expected return | User-entered payout chance times average payout, less entry cost | Arithmetic from the user's assumptions, separate from Draft Outlook |

[FantasyPros describes its rank-point ECR calculation](https://support.fantasypros.com/hc/en-us/articles/115001219327-What-is-ECR-Expert-Consensus-Rankings-and-how-do-you-calculate-it). That distinction is why `rankEcr` and `rankAverage` remain separate fields. The rank range chart now marks `rankAverage`; the prior chart marked ECR while labeling it Avg. In the August 9 PPR snapshot, 513 of 515 players have different ECR and mean ranks. The median absolute difference is 1.4 spots through ECR 150, but it grows in the sparse tail, where fewer experts rank every player.

[FantasyPros' draft accuracy method maps rank slots to historical fantasy point values](https://www.fantasypros.com/about/faq/football-draft-accuracy-methodology/). A rank is therefore ordinal, and the distance from rank 1 to 2 does not carry the same football value as the distance from rank 101 to 102.

### What the gap cannot say at the very top of the board

ADP is a fractional pick number and the consensus rank is a whole slot, so the column reports the gap to one decimal, the same precision the ADP column already uses. Rounding it to a whole pick made a half-pick difference look like a full one, which is how Jahmyr Gibbs at ECR 1 and ADP 1.5 came out as "+1" on the 2026-08-16 half PPR board when the real gap is half a pick.

The top few rows also have a floor the rest of the board does not. No pick is earlier than 1.0, so the player at ECR 1 can only ever show a gap of zero or better, the player at ECR 2 can never show worse than -1, and so on. Any small positive gap in the first handful of rows is partly that boundary rather than a market read, which is one more reason the value and reach labels need a gap of at least six picks before they appear.

### Why the ADP gap stops at rank 150

ADP is a pick number in a 12-team draft, so it runs out around pick 190, while the consensus board ranks more than 500 players. Past the top 150 the gap between the two stops measuring the market and starts measuring the length of the draft. In the 2026-08-16 PPR snapshot the median gap sits within about a pick of zero through rank 150, then falls to roughly -13 across ranks 151 to 200 and to -108 past rank 250, and the same shape holds in half PPR and standard. Part of that is the draft simply ending, and part of it is a selection effect, because a deep player only appears in the ADP feed at all if somebody drafted him, so the deep players who have a reading are exactly the ones taken earlier than their rank. Both effects push the number negative for reasons that have nothing to do with the player, so the board leaves the cell blank rather than publishing a reach that is really an artifact. It is the same line the pick baseline already draws for the draft tracker.

Kickers and defenses are left out for a separate reason. FantasyPros ranks the best defense around 158 and the best kicker around 182 on the overall board, below the last bench flex, while real rooms spend their final two rounds on them, so every one of them showed a 30 to 77 pick reach that said nothing about any individual player. Their position boards still rank them against each other, which is the comparison that actually holds.

## Data and source checks

The redraft board combines scoring-specific FantasyPros consensus, [FantasyPros projected VORP reports](https://www.fantasypros.com/nfl/rankings/ppr-vorp.php), and [Fantasy Football Calculator's ADP API](https://help.fantasyfootballcalculator.com/article/42/adp-rest-api). The VORP refresh reads all nine published combinations across PPR, Half PPR, and Standard scoring and 10, 12, and 14 teams. The best ball board combines PPR best ball consensus, current standard-season Underdog ADP, a separate half PPR Superflex consensus, bye weeks, and the Week 17 schedule. `FANTASYPROS_SOURCE=public-html` selects the public consensus pages even when an API key exists. `FANTASYPROS_SOURCE=official-api` requires `FANTASYPROS_API_KEY` and selects the official JSON API. A selected consensus source that fails its HTTP, parsing, or board checks stops the refresh and never changes sources automatically. A VORP report that fails to fetch keeps the previous same-season report instead, and a league size with no usable report is left out of the snapshot rather than stopping the refresh.

The scheduled refresh pins `FANTASYPROS_SOURCE=public-html` and does not receive `FANTASYPROS_API_KEY`. This avoids the official endpoint that declared 98 quarterback rows but returned 10 in the August 15 scheduled run, while keeping the same declared-count, board-size, identity-retention, expert-count, and downstream snapshot gates. A local refresh can select the official API explicitly. The deployed app does not need either variable because it reads committed snapshots and makes no live FantasyPros request.

The source adapters normalize the official API and public HTML responses into the same player contract, and the refresh gates validate the requested sport, NFL season, scoring, position, declared player count, expert count, ADP format, team count, sample window, unique positive player IDs, names, published rank distributions, ADP ranges, and minimum row counts before replacing a snapshot. The VORP adapter separately requires the exact report heading, projection season, selected scoring, selected team size, Rank, Player, POS, and VORP columns, at least 300 rows, sequential unique ranks, unique player IDs, and values ordered from highest to lowest. It also confirms that the displayed value is the source's zero floor over its raw value. The public HTML consensus board includes expert minimum, maximum, average, and spread fields. The official API contract does not promise those four fields, so the snapshot leaves them absent and the UI reports that the expert range is unavailable. Official API access still needs a FantasyPros account and licensing tier that permits storing and publicly redistributing the published snapshot data. The public HTML fallback does not resolve that licensing requirement.

Redraft and Superflex FantasyPros boards need at least ten contributing experts. The standard best ball board has a separate floor of five because six experts were contributing on August 9, and the snapshot stores and displays the actual count. Redraft requires 300 overall players, 48 quarterbacks, 100 running backs, 120 wide receivers, 48 tight ends, 32 kickers, and 32 defenses. Those floors are large enough to finish the biggest configured room. It also requires at least 80% of the prior rows and prior top 150 player identities when the persisted NFL season matches the fresh board. The generated dataset stores the actual NFL season directly. Each VORP report must match at least 90% of the top 150 consensus player IDs before its ranks and values can enter the snapshot. A report that misses that bar, or has no usable same-season fallback, is left out of the snapshot for that league size instead of stopping the refresh. Best ball requires at least 250 ranking rows, then preserves at least 80% of the prior same-season board and prior top 150 identities. A redraft ADP source with at least 50 rows must match at least 60% of its players to the ranking board and at least 90% of the top 150 overall players, and a fresh same-season ADP board cannot drop below 80% of the prior rows or prior top-player identities. Best ball applies the same 80% preservation rule to its prior ADP matches and top-board prices, with a floor of 150 fresh matches.

The redraft runtime rejects a scoring label that conflicts with the requested route, a future or invalid schema version, an empty snapshot, invalid player identity or rank fields, duplicate IDs inside a slice, and a player placed on the wrong position board. It accepts missing schema versions and positive legacy versions through the current schema. FLEX may contain actual RB, WR, and TE players. The browser normalizes the static file before caching it, and an invalid static file falls back to the server route before the page reports an error. The server reads and normalizes the same committed files.

The redraft publisher builds and serializes PPR, Half PPR, and Standard before it writes anything. It stages all three snapshots and their shared revision, moves the snapshot files first, and moves the revision last. A failure while building the second format therefore leaves every published format and the revision unchanged. Best ball has separate gates for at least 90% full-board Superflex coverage, 95% top 150 coverage, 90% coverage across all quarterbacks on the standard board, complete rank and tier coverage for the first 42 quarterbacks, and at least 30 Week 17 team mappings. The 42-player core matches the midpoint of three to four quarterbacks across the supported 12-team room, while the broader 90% gate still catches a source that drops a material share of fringe quarterbacks.

The current redraft ADP evidence is uneven, which is why one fixed ten-pick rule was not enough.

| Format | Overall players | Overall players with ADP | Total source matches | Source drafts | ADP as of |
| --- | ---: | ---: | ---: | ---: | --- |
| PPR | 515 | 255 | 256 | 5,417 | August 9, 2026 |
| Half PPR | 815 | 209 | 209 | 1,839 | August 9, 2026 |
| Standard | 501 | 201 | 201 | 1,002 | August 9, 2026 |

The API request asks for a 12-team room, but tests on August 7 returned the same 256 players, 4,929 drafts, and player prices for the 8, 10, 12, and 14 team parameters. The UI now describes this as a general market price and makes no selected-league-size claim.

The source dates remain visible during a draft. From July through September, a ranking or ADP source ages after two days and is stale after four days. Outside that window, the boundaries are eight and fourteen days. A prior-season ADP feed is also stale during draft season. The operations ledger reads the upstream source date, so a newly wrapped old board stays old. Saved picks are matched back to the full current player universe before scoring, including corrected team, position, and bye data for players found only on a position board. Exports rebuild their team counts from those same picks. An orphaned saved player keeps the name, team, and roster position but loses old ADP and expert baselines, while every restored room drops stale or slate-mismatched ADP. Best ball hides exact recommendation cards when either the required ranking source or matching ADP is stale. Reference presets never show exact player cards, even when their consensus board is current. The snapshot has no separate live injury or player-news feed, and the draft pages say so.

## Prior-season points per game

The player drawer on the rankings board shows a fourth reading alongside the consensus rank, the expert range, and the market price, which is how many fantasy points the player actually scored per game in the last completed regular season. It comes from [nflverse's weekly `stats_player` release](https://github.com/nflverse/nflverse-data/releases/tag/stats_player), the same open dataset that already backs the NFL dashboard, and `scripts/buildFantasyGameLogData.ts` reduces each player's game log to four figures, the lowest game, the median, the average, and the highest game.

nflverse publishes a standard column and a full PPR column. Half PPR is their exact midpoint, because the two formats differ only by one point per reception, so all three boards report a figure computed the way that board scores. That does mean a quarterback who caught a pass shows a slightly different per-game line across formats even though his consensus rank is identical in all three, and the difference is points he actually scored.

A player needs at least four regular-season games before the panel will draw anything. Below that, the low and the high are two readings of a nearly empty sample, and the meter would draw a range wide enough to look meaningful across what is mostly noise. Matching onto the consensus board runs through the same tiered exact matcher ADP uses, name and team and position with an ambiguity guard, never fuzzy distance, so an unmatched player carries no per-game data and the panel simply does not render. That is deliberate, since the alternative failure is showing someone else's season on his card.

Coverage on the August 18, 2026 build of the PPR board is 341 of 511 overall players, which is 76.5% of the 446 players at quarterback, running back, wide receiver, and tight end, and 90.5% of the top 200 of those same skill players by board rank. The gap is mostly rookies, who have no prior NFL season at all, plus anyone who missed most of the year. I would read the top 200 figure as the one that matters during a draft, since that is roughly the population a 12-team room actually selects from.

The builder tries the current season first and falls back to the prior one, so during the offseason it reports the completed season and it rolls forward on its own once the new season has enough games behind it. The panel always names the season and the number of games it is describing, so a four-game line and a seventeen-game line are never presented as the same strength of evidence.

What this does not establish is any claim about the season ahead. It is history, and a strong prior year is not a projection, a floor, or a ceiling for the coming one. There is no adjustment for opponent, for snap share, for role change, for a new team, or for the games a player missed, so a player who was hurt for half a season and a player who was healthy and merely inconsistent can produce a similar looking spread for entirely different reasons. I would use it the way I would use any other piece of context in the room, as a check on whether the consensus rank matches what the player has actually done, and not as a forecast.

## ADP uncertainty

The rankings board uses `ADP - ECR`. A positive number means the market usually drafts the player later than the expert consensus. A label requires at least 20 observed player selections. When the source publishes player variation, the minimum gap is:

```text
threshold = max(6, ceil(sqrt(ADP_SD^2 + expert_rank_SD^2)))
```

If ADP standard deviation is missing but the observed high and low picks are present, `(low - high) / 4` substitutes for `ADP_SD`. A snapshot with no ADP variation uses a ten-pick threshold. When the official API omits expert spread, the threshold stays at least ten and can rise with ADP variation. Player comparisons use the larger uncertainty threshold of the two players and do not declare an ADP winner when either sample has fewer than 20 selections.

This is a conservative decision rule, not a statistical confidence interval. Expert rankings are dependent opinions, completed mock drafts are not a random sample of every home league, and player-level selections are not independent. The rule keeps weak readings from looking precise without claiming more than the source can support.

## Published VORP rankings

[FantasyPros defines VORP](https://www.fantasypros.com/2025/06/fantasy-football-draft-strategy-value-based-drafting-vorp-vols-vona/) as a player's projected season points minus the projected points of the best same-position player expected to remain available on waivers. The rankings page publishes that value and its overall VORP order directly. The site stores those published values and ranks instead of deriving projected points from ECR.

The VORP selector follows the scoring format and supports the team sizes FantasyPros publishes, which are 10, 12, and 14. A displayed value of zero means the source's raw value is zero or negative, so the player is at or below FantasyPros' waiver replacement baseline. The report has no matching 8-team or 16-team option, and the site leaves VORP unavailable for those rooms instead of interpolating one.

FantasyPros supplies the roster assumptions behind each published replacement baseline. The site's custom starting lineup, FLEX count, rounds, and planned roster shape do not change that source VORP. Those settings feed the separate replacement index and scarcity report described below, which remains a 0 to 100 ordinal reading from consensus rank.

## Redraft replacement and scarcity

The redraft tracker now runs a separate decision model, `redraft-decision-v1`, for QB, RB, WR, and TE. It uses the same overall consensus board for the selected scoring, league size, rounds, starting lineup, and roster target as the rest of the tracker. The board rows, recommendation cards, and the replacement and scarcity panel all read from this one report. Kicker and defense stay out because their overall ranks and real draft slots are not comparable enough to support the same live scarcity reading.

The replacement index begins with two fixed league cutoffs for each position. The starter cutoff is the worst overall consensus rank needed to fill every dedicated starting slot across the league, then FLEX is assigned from the best remaining RB, WR, and TE players. The roster cutoff uses the final position counts described in the Draft Outlook section below. Both cutoffs come from the complete board before the draft and stay fixed after players are selected, so the value of a player does not rise because the room already drafted the alternatives.

FLEX can allocate more starters to one position than the original final roster target expected, most often at tight end in a shallow room without kicker or defense. The roster count for each position is now floored at its actual dedicated and FLEX starter count, so its roster cutoff can never sit earlier on the board than its starter cutoff. If those floors exceed the room's total draft capacity, the model removes the lowest-ranked marginal bench slots from other positions until the counts fit the exact league size and rounds.

Each cutoff turns the player's overall consensus rank into a bounded ordinal index.

```text
value = clamp(100 * ln(cutoff / rank) / ln(cutoff), 0, 100)
replacement = 0.75 * starter_value + 0.25 * roster_value
```

A player at the cutoff or farther down the board scores zero against that cutoff. The combined figure gives most of its weight to starting lineup value while keeping a smaller reading for bench depth. It is the same rank curve the trade calculator uses, and it does not convert a rank gap into projected fantasy points. A missing starter or roster cutoff reduces coverage instead of filling the gap with an estimate.

The positional tier reading comes from the matching position board, where the tier and position rank actually live. The current tier becomes more urgent as it falls from four players left to one, and the size of the cliff comes from the overall consensus rank gap between the last player in that tier and the first player in the next tier.

```text
tier_urgency = clamp((4 - players_left) / 3, 0, 1)
tier_magnitude = clamp(overall_rank_gap / 12, 0, 1)
tier_signal = tier_urgency * tier_magnitude
```

A thin tier with no meaningful gap on the overall board therefore stays small. A final published tier has no next tier to measure and is reported as unavailable instead of being treated as the largest cliff on the board.

The wait reading appears only while the user is on the clock and compares the present pick with the user's following pick, respecting either snake or linear order. It looks through the available players at one position and finds the best player by consensus rank whose current ADP midpoint is at or after that following pick. The panel reports both the consensus rank cost and the drop in replacement index from the best option now. ADP decides who the market prices to remain available, while consensus rank and the fixed replacement lines decide the size of the drop.

A player needs at least 20 observed selections before his ADP can support this reading. The published uncertainty threshold supplies two additional checks. `ADP + threshold` identifies a plausible survivor inside the later side of the market range, while `ADP - threshold` identifies the safer survivor whose range still clears the following pick. If no midpoint survivor exists but a plausible survivor does, the panel names that distinction. Missing reliable prices ahead of the reported survivor reduce coverage to limited.

The wait result stays unmeasurable between the user's turns, on the user's final turn, when current ADP is unavailable, when no overall rank is readable, or when no remaining player at the position has a large enough ADP sample. Those states do not become zero, because a missing market answer is different from a market that expects the same player quality to remain.

Scarcity applies only to a position the roster still needs for a starter, FLEX, or planned depth. A measured wait cost is scaled against both the highest wait cost among those needed positions and one full round of picks.

```text
relative_wait = clamp(rank_cost / highest_needed_rank_cost, 0, 1)
round_wait = clamp(rank_cost / league_teams, 0, 1)
wait_signal = relative_wait * round_wait
scarcity = round(100 * max(tier_signal, wait_signal))
```

The multiplication means a lead of one spot cannot look urgent merely because every other needed position has a zero cost. When the market has supported coverage and no reliably priced player reaches the following pick, the wait signal is one. Limited coverage does not get that full signal. The model takes the larger of the tier and wait readings instead of adding them, because both describe the same loss of choice from different evidence. A filled position receives zero scarcity, and the Most at risk card goes to the needed position with the highest scarcity score, breaking a tie with the replacement index of the best available player.

This decision report remains separate from Draft Outlook. It describes the choice at the present turn, while Draft Outlook grades the picks already made against the rest of the room. Neither is a projected points or win probability model.

## Redraft Draft Outlook

The redraft setup now records the actual starting lineup for RB, WR, TE, FLEX, K, and DST, along with the league size, rounds, scoring, order, and draft slot. FLEX accepts RB, WR, or TE. The board is intentionally fixed to one QB because the source rankings are one-QB boards. Superflex and two-QB redraft need their own sourced board and model.

The planned final roster starts with every configured starter. A backup QB is added when at least four bench spots remain, and a backup TE is added when at least five remain. The remaining bench is split between RB and WR, with roughly 45% assigned to RB while never dropping below the configured starters. Kicker and defense enter the need prompts, roster expectation, and lineup coverage only when the remaining picks equal those unfilled slots. This is transparent coverage guidance, not a claim that one fixed count wins every league.

Each priced pick uses the following draft-day delta:

```text
delta = actual overall pick - expected pick
signal = tanh(delta / noise)
```

ADP is the first expected-pick source. An early consensus rank can substitute when ADP is absent, but consensus ranks past 150 remain unscored because the deep expert board and completed-draft market no longer share a reliable pick scale. A valid late Fantasy Football Calculator ADP is preserved. The undrafted-floor rule applies only to the Underdog feed that uses the final draft slots as placeholders.

For ADP, confidence is reduced to 0.25 when the player has fewer than 20 selections. Wide published variation also pulls confidence toward zero, with a floor of 0.25. Consensus fallbacks receive 0.75 confidence. The market score simplifies to the following expression before rounding and clamping to 0 through 100:

```text
market = 50 + 50 * sum(confidence_i * signal_i) / judged_pick_count
```

The bye check enumerates attainable final rosters that preserve the players already drafted, total the configured rounds, and cover every configured starter, FLEX, kicker, and defense requirement. It chooses one final composition across every published bye week. It does not combine separate position maximums that cannot fit on the same roster.

The redraft composite uses fixed weights.

| Component | Weight | What it measures |
| --- | ---: | --- |
| Market price | 65% | Actual pick against a usable ADP or early consensus fallback, reduced for weak evidence |
| Roster shape | 20% | Distance from the configured final position counts at the current draft progress |
| Lineup coverage | 10% | Configured starting slots already coverable by the drafted positions |
| Bye lineup coverage | 5% | Whether a known bye could still leave a starting slot open at the planned final counts |

Scores are compared only with teams that have made the same number of picks. The UI holds the room rank until a team has four picks and another team is available at the same progress. Exact ties use the midpoint rank and a 50th percentile result when the whole comparison group is tied. The recap shows raw market deltas and open roster slots, but it no longer turns those deltas into letter grades. A raw ADP sum and the uncertainty-adjusted composite answer different questions, so only Draft Outlook supplies the room rank.

The 65, 20, 10, and 5 weights are judgment weights. They have not been fit against historical league outcomes. I think they are appropriate for a process score because price is the strongest observable input and structure is a guardrail, but they should be replaced or confirmed through held-out backtests before anyone calls them predictive coefficients.

## Mock draft rehearsal room

`/fantasy-football/mock-draft` is a practice surface rather than a projection tool. The user owns one slot, and every other pick comes from the pure engine in `src/lib/mockDraft.ts`, which prices the remaining board with the same ADP-or-consensus value the analytics baseline uses and samples a pick from a small window at the top of it. The room temper sets those window sizes by draft phase, so a faithful room samples the top 2, 3, then 4, a normal room the top 3, 5, then 8, and a chaotic room the top 6, 10, then 14. The windows are tuned judgment rather than fitted parameters, and normal keeps the original engine tuning so a saved room replays unchanged. Required starters and the kicker and defense caps derive from the configured starting lineup, so a room with no kicker slot never drafts one unless the board has run out of everything else. When the engine sims the user's own remaining turns through the sim-to-end control, it uses the faithful window regardless of the room temper.

The recap judges only the user's picks, using the same per-pick baseline the tracker uses, meaning reliable market ADP first, an early consensus rank through 150 when ADP is absent, and no judgment at all past that. The draft grade letter maps the average signed pick delta across judged picks, with A at +3 or better, A− at +1.5, B+ at +0.5, B at −0.5, B− at −2, and C+ below that. Those cutoffs are judgment values chosen so an average pick near the market reads as a B. The grade is practice feedback about price discipline in a simulated room, not a projection of season outcomes and not a room rank. The tracker recap deliberately shows raw deltas without letters because its Draft Outlook composite already supplies the room rank there, while the mock draft ships no Draft Outlook, so the letter grades the narrower question of how far the user's own picks landed from the market baseline.

## Best ball recommendations

Best Ball Mania VII, Puppy, and The Little Dalmatian 2 are the only presets with exact player cards because the current standard-season Underdog ADP matches those 12-team rooms. A player without a usable individual ADP, including the undrafted placeholder at the final room slot, stays on the browseable consensus board but is omitted from exact cards. Eliminator, Weekly Winners, Sit & Go, and 6-Man keep their standard PPR best ball board and roster guidance, but they stay in reference mode because their player pools, slates, or room settings differ. Superflex keeps its separate sourced consensus board and roster guidance, but it also stays in reference mode because the snapshot has no matching Superflex room ADP.

For the exact presets, the recommendation base is one score point for each pick the current selection sits past a player's expert consensus rank, and the market term then moves the score half a point for every pick of disagreement between that rank and Underdog ADP. The pair resolves to `currentPick - (ECR + ADP) / 2`, so a sourced expert board and a sourced market carry the same weight. The 0.5 market weight is tuned judgment and has not been fit against draft outcomes, and it is the single number to turn if the board leans too far toward either input.

That weight was 1 until 2026-08-23, which made the pair resolve to `currentPick - ADP` and cancelled the consensus rank out of the arithmetic completely. The visible base rank and ADP value components looked like two independent inputs while being two halves of one market term, so the board could rate a player forty consensus spots worse above a better one on a single slot of ADP, and the expert column beside it had no effect on the ordering. A regression test in `src/lib/bestBall/__tests__/bestBall.test.ts` now fails if the consensus stops moving the score.

The rest of the recommendation is deliberately bounded.

| Adjustment | Range | Rule |
| --- | ---: | --- |
| Roster need | -2 to +2 | Moves within a feasible final construction |
| QB stack | 0 to +2 | Same-team QB and WR or TE connection |
| Week 17 game stack | 0 to +1 | Completes a QB plus pass catcher side with an opponent player |
| Positional scarcity | 0 to +2 | Applies only at a needed position, and reads the larger of the tier cliff and the cost of waiting a turn |
| Bye coverage | -2 to 0 | Applies only when a pick worsens the best single attainable composition across every published bye |
| Team concentration | -2 to 0 | Applies after the contest profile's concentration limit |

The maximum positive adjustment is seven points. One Week 17 connection therefore cannot push a player more than a full tier ahead of the room price. A hard feasibility check removes any candidate that would make every allowed 18-player finish impossible. A player whose ADP says he is likely to last loses an otherwise tied comparison, but that flag cannot jump ahead of the recommendation score or turn a missing ADP into false urgency. Exact player cards stay hidden between the user's turns because the tool does not model the probability that each player survives the intervening picks.

The scarcity adjustment reads two things and takes whichever is larger. The first is the tier cliff, which asks how few players are left in the candidate's own tier at his position and how far down the board the next tier starts. The second, added 2026-08-23, is the cost of waiting a turn, which finds the best player at the position whose ADP says he is still there at the user's next pick and measures how many board spots below the current best available he sits. Each position's wait cost is scaled two ways at once. It is read against the most expensive of the positions the roster still needs, which is the choice a drafter actually faces, and it is also read against a full round of picks in absolute terms. Both factors are needed. The relative one alone would hand the full adjustment to whichever position leads even when it leads by a single board spot, and the absolute one alone would stop answering which position to take. Positions the roster has already filled to target are excluded from the comparison and score zero, which keeps a scarce quarterback from making every position the roster does need look cheap.

The term separates three states that would otherwise collapse into the same zero. A measured cost is the board gap. A position where the market is readable and every remaining player is priced to be gone before the turn returns is the most scarce this reading goes, and it takes the full adjustment. A position the board cannot answer for at all, meaning no next pick, no readable rank, or no readable ADP anywhere in the pool, scores zero and says so on the card, because a market that gave no answer must not be reported as a market saying the position will keep.

The tier cliff alone was blind to the case it matters most in. A position can sit in a perfectly deep tier and still be the one to take now, because the whole tier will be gone by the time the turn comes back around. Replaying the 2026-08-23 snapshot through a simulated 12-team room, there were rounds where the tier cliff scored zero on every card while waiting a turn on quarterback cost forty board spots. Both halves are bounded by the same 0 to 2 range, and they are combined by the larger of the two rather than added, because they are two readings of one thing.

The tier gap for exact cards stays on the PPR best ball consensus scale, and Underdog ADP sets the market price once in the base pair. ADP enters the scarcity term only to say who is likely to survive the turn, and it leaves what a player is worth alone. Where the snapshot has no readable ADP, including Superflex, the wait cost is reported as unmeasurable rather than guessed and the tier cliff carries the term by itself. The Superflex consensus still sets its reference board order, but it does not produce an exact player score.

[Underdog's ADP study found that most picks in rounds 4 through 14 landed within 12 spots of ADP and that reaches of ten or more spots generally performed worse](https://underdognetwork.com/football/best-ball-research/best-ball-adps-is-it-okay-to-reach-on-players). [A 40,000-entry stacking study also found that price-sensitive stacks advanced better than forced stacks](https://www.playerprofiler.com/article/the-complete-guide-to-stacking-in-best-ball/). Those findings support using correlation after player quality and price are already close.

Weekly Winners had previously received a position-level variation proxy even though the snapshot has no weekly projections. It now stays in reference mode and shows no exact player score. [Underdog's study of more than 500,000 weekly rosters](https://underdognetwork.com/football/best-ball-research/strategy-data-for-underdog-fantasys-weekly-winners) supports small, clear stack paths, but it does not justify assigning one player's weekly variance from his position alone.

## Best ball Draft Outlook

Best ball Draft Outlook remains separate from the on-clock recommendation score. It evaluates the finished work across market price, feasible roster shape, QB correlation, Week 17 game stacks where the contest uses them, concentration, and bye lineup coverage. Bye coverage tests complete 18-player compositions and never combine separate position maximums that cannot all fit on one roster. The weights change by contest.

| Contest profile | Market | Roster | Correlation | Byes |
| --- | ---: | ---: | ---: | ---: |
| Mania and Puppy | 50% | 30% | 15% | 5% |
| Eliminator | 45% | 30% | 5% | 20% |
| Weekly Winners | 45% | 30% | 20% | 5% |
| Sit and Go | 55% | 30% | 10% | 5% |
| Superflex | 55% | 30% | 10% | 5% |

The roster search allows 2 to 3 QB, 4 to 7 RB, 6 to 9 WR, and 2 to 3 TE in standard 18-player rooms. Superflex allows 3 to 4 QB, 4 to 7 RB, 5 to 8 WR, and 2 to 3 TE. The preferred finish changes with early draft capital. These are strategy boundaries, not the contest's legal roster rules, and unusual constructions outside them are intentionally not recommended.

The default lean toward three quarterbacks comes from a [2026 review of Best Ball Mania VI and the prior five seasons](https://www.4for4.com/2026/preseason/how-winners-draft-quarterbacks-underdog-best-ball-mania), which found that three-quarterback builds beat two-quarterback builds in four of six seasons and made up four of the five strongest common constructions in 2025. [Underdog's five-season construction review](https://underdognetwork.com/football/best-ball-research/what-has-worked-in-all-5-years-of-best-ball-mania) found five running backs above average in every season, while the right final count still depended on how early the roster spent picks at the position. The adaptive target uses those as broad centers and changes the preferred finish after early or delayed investment.

The [official Best Ball Mania VII rules](https://help.underdogsports.com/en/articles/14785343-best-ball-mania-vii) remain the authority for the current 12-team, 18-round, half PPR contest, its lineup, advancement, entry fee, field, and prize pool. The draft page links the current rules because lobby cards can change. Published field economics are kept separate from the roster score.

## Trade calculator

`/fantasy-football/trade-calculator` answers a narrower question than the draft tools. It estimates whether two preseason redraft packages are close in value, using the same overall consensus board and mock-draft ADP that the rankings page already publishes. The model version is `preseason-redraft-v1` and its declared scope is `preseason-one-qb-redraft`.

I would use it as a balance check before I think about roster fit. I would not use it in season, in a dynasty or keeper league, in superflex or two-QB, or as a points projection. It has no weekly scoring, no injury feed, no schedule, and no knowledge of either roster beyond the players named in the two packages.

It supports the same league shapes as the redraft tracker, which is PPR, Half PPR, or Standard scoring, 8, 10, 12, 14, or 16 teams, and a roster size of 13 through 18. Each side holds one to six players, and a player can appear only once across the two sides.

### How a player becomes a number

The expert reading and the market reading are built separately and stay separate until the last step. That is deliberate, because published rank and market price disagree in useful ways, and averaging them early hides the disagreement.

For each position the model finds two league-specific cutoffs. The starter cutoff is the worst rank still needed to fill every league starting slot at that position, counting FLEX after the dedicated slots are filled. The roster cutoff is the rank at the league's total rostered count for that position, taken from the same final roster target the draft tracker uses. A player at or past a cutoff scores zero against it, and above it the value grows on a log curve.

```text
value = clamp(100 * ln(cutoff / rank) / ln(cutoff), 0, 100)
```

The log shape gives an elite player a premium over a replacement starter without claiming that adjacent ranks are equal units of football production, which is the same reason the rest of this document treats a rank as ordinal. Starter value is weighted 75% and depth value 25%. The market cutoffs are built only from players with at least 20 observed selections, so a thin ADP sample cannot set a league's replacement line.

The two readings then blend by how reliable the player's ADP looks.

```text
reliability = clamp(10 / adp_signal_threshold, 0.25, 1)
blended = (expert + market * reliability) / (1 + reliability)
```

`adp_signal_threshold` is the shared threshold described under ADP uncertainty, so a widely disputed player pulls the market reading toward a quarter weight while a tightly drafted player can reach parity with the expert reading. A player with no usable market reading keeps the expert value alone.

The published range recomputes both readings one uncertainty step above and below the player's rank. Expert spread comes from the published standard deviation, or from `(max - min) / 4`, or from the distance between ECR and the mean rank. Market spread comes from the ADP standard deviation or from `(low - high) / 4`.

### Coverage and verdict

| Coverage | When it applies |
| --- | --- |
| Supported | Both sources cover every replacement cutoff for the player's position and both publish a usable spread |
| Limited | Any of that is missing, or the result carries a warning, or either source is aging, or the two packages hold a different number of players |
| Insufficient | The league settings or the two sides fail validation, the expert board is stale, or any selected player lacks a reliable current-market reading |

The verdict compares side totals through a relative gap.

```text
relative_gap = |value_A - value_B| / max(value_A, value_B)
```

| Verdict | Rule |
| --- | --- |
| Balanced | Relative gap at or under 5% |
| Leans to a side | Gap above 5% while the clear-edge test fails |
| Clear edge | Gap at or above 15%, supported coverage, and two published ranges that do not overlap |
| Insufficient | Coverage is insufficient, and no winner or gap is reported |

Requiring the ranges not to overlap is the part I would keep if I trimmed this model down. A 16% gap between two packages whose uncertainty bands still overlap is not a finding, and treating it as one is how a trade calculator starts sounding more certain than the boards underneath it.

Unequal packages run in quick mode. Every extra player is assumed to displace a replacement-level asset worth zero, which flatters the side receiving more bodies. The model warns and drops to limited coverage instead of hiding that assumption. A roster-aware version would need each manager's full roster and the cuts they would actually make.

### What the trade values do not establish

These values have not been fit against historical trade outcomes or measured against realized points. The 75/25 starter split, the 5% and 15% thresholds, and the 0.25 reliability floor are judgment settings. I think they are reasonable for a balance check, since the log curve and the range test both keep the tool conservative, but they should be confirmed against held-out seasons before anyone treats the output as a valuation.

### What happens to the trade calculator in season

The model is a preseason one-QB redraft estimator and its market leg is mock-draft ADP, which stops moving once real drafts end. That means from Week 1 the coverage rule drops to insufficient and the tool declines verdicts for the rest of the season. That is correct behavior and I am leaving it. Repointing the market leg at rest-of-season consensus mid-season would quietly change what the number means, and I would rather it go quiet than go wrong.

What I did change is that the silence is now labeled. From Week 1 the page carries a dated note saying the market it prices closed when drafts ended, so a withheld verdict reads as the model's boundary instead of a broken tool. Rebuilding the market leg on rest-of-season consensus stays open as the real fix, and it is blocked on the same rest-of-season board the weekly surface is waiting for.

## The weekly board

`/fantasy-football/weekly` is the only in-season surface. It reads two FantasyPros boards per scoring format, the weekly FLEX board and the weekly quarterback board, and keeps them apart. Their ranks are not comparable, because FantasyPros publishes no single in-season overall board and merging the two would manufacture a cross-position ordering the source never made.

The in-season boards need their own thresholds rather than the draft ones. They rank only players worth starting, so they are shorter than a draft board, 95 running backs against the 100 the draft pipeline requires. Fewer experts contribute too, six on kickers against the ten the draft gates demand. Both gates were already parameterized, so the weekly source sets its own floors and the draft floors are untouched.

The board is absent before Week 1 by design. The builder refuses to publish a preseason board and the client treats a missing file as a state rather than a failure, because rostered percentages before leagues have drafted describe the preseason and would make the waiver list say something I cannot support.

### The waiver metric

A waiver candidate is a player whose board percentile runs ahead of how widely he is rostered. The gap is the percentile minus the rostered percentage, both published numbers, and both are printed next to it so any row can be reproduced by hand. There is no bid figure, no projection, and no points total, because FantasyPros carries none of those on these boards and I am not inventing them.

Two filters make the gap mean something. A candidate has to sit inside the top 120 of the flex board or the top 24 quarterbacks, which is roughly what a 12-team league can start, and be rostered in under 60 percent of leagues. Without the depth filter the widest gaps are all deep bench players. The first board built from live data put a receiver ranked 142nd of 284 at the top of the list on a 2.9 percent rostered rate, which is a real discrepancy and not a start.

The rest-of-season board would be the better backbone for this and for the trade calculator's market leg, and it is wired but not reachable. As of 2026-08-21 all three rest-of-season pages still serve year 2025 with a last_updated of 12/25, so the season check rejects them, which is the gate working. The builder treats it as optional and logs the reason, so it starts populating on its own once FantasyPros rolls those pages over. It has not been validated against live current-season data and should be checked in the season's first week.

## Winning lineups and season simulation

The tool does not currently calculate a winning lineup. Retrospective lists of champions or final-round players are useful descriptions, but they contain survivor bias, injury luck, and waiver outcomes. They should not directly set draft weights without a comparison group. The stronger design is to train and test on every entry or league, preserve the information available at the time of each draft, and hold out complete seasons.

A [peer-reviewed fantasy football optimization study](https://doi.org/10.1515/jqas-2013-0009) used weekly player estimates, opponent draft behavior, lineup constraints, and full-season simulation, then evaluated the system on later historical seasons. Its rules and 2000s data do not transfer directly to this tool, but the design supports the same conclusion. A serious win model has to represent the season after the draft because ranks alone cannot grade a roster.

A real best ball win model needs the inputs below.

| Required input | Why it matters |
| --- | --- |
| Weekly player score distributions by scoring format | A season total cannot represent spike weeks or lineup replacement |
| Injury, role, and active probabilities by week | Zeroes and role changes drive both floor and ceiling |
| Same-team and opponent correlations | Stacks change joint outcomes, not just average points |
| Exact weekly lineup optimizer | Best ball scores the best eligible lineup after games are played |
| Field drafts conditioned on ADP, slot, and draft date | Opponent rosters determine advancement and duplication |
| Contest advancement groups and payout ladder | A Mania roster has different value in Weeks 1 through 14 and Week 17 |
| Repeated simulation with uncertainty intervals | Rare first-place outcomes need many trials and an honest error range |

A redraft win model needs those weekly inputs plus opponent schedules, lineup decisions, waiver claims, free-agent replacement, trades, and playoff rules. [FantasyPros' 2025 championship roster review](https://www.fantasypros.com/2026/01/most-rostered-championship-playoff-players-fantasy-football/amp/) shows how much late additions and end-of-season availability can shape winning teams. Draft-only roster grades cannot capture that path.

The right validation target is prospective performance. For best ball, I would measure regular-season advance rate, playoff advancement, weekly score calibration, payout return, and recommendation regret on complete held-out drafts. For redraft, I would measure weekly starter points above a replacement baseline, playoff rate, championship rate, and the incremental effect of waivers. Every result should be split by season, draft month, scoring format, league size, and draft slot, with uncertainty intervals and a baseline that simply follows ADP.

## Current test coverage and verification

The code now pins the main failure cases that could change a live draft decision. Tests cover explicit public HTML and official API selection, key requirements, configured source failures without source switching, the scheduled public source pin, scoring and season source mismatches, the VORP report identity, selected scoring and team size, source zero floor, sequential order and minimum size, future and invalid snapshot schemas, corrupt player rows, static file fallback, incomplete or duplicate ranking payloads, invalid expert rank distributions, absolute and relative board coverage, mixed source publication rejection, all format publication failure, ADP duplicates and invalid ranges, sample based signal suppression, uncertainty thresholds, late redraft ADP, the Underdog floor, ECR versus mean rank display, exact FLEX coverage, fixed league replacement lines, the roster cutoff floor after FLEX allocation, position board tiers, snake and linear wait costs, stale and thin market suppression, filled position scarcity, tie midpoint ranks, one team room comparisons, attainable final roster and bye feasibility, completed draft round boundaries, position only player restoration, slate mismatched or missing ADP, exact versus reference contest rules, no weekly proxy, price first Week 17 behavior, and persistence migration.

Companion tests separately pin ECR first redraft order, exact scores only on the user's live turn, distinct source dates, a missing schedule that leaves the player board usable, version 2 snapshot cache restoration, and the published, saved, then bundled fallback order.

Unit tests prove that the code follows this contract. They do not prove that Draft Outlook predicts wins. Historical pick-by-pick data such as [Underdog's public Best Ball Mania VI file](https://underdognetwork.com/football/best-ball-research/best-ball-mania-vi-downloadable-pick-by-pick-data) can support the first retrospective backtest, but a payout model also needs weekly scores, advancement groups, and the full contest structure.

I would run the following gates before changing the model or publishing new snapshots.

```bash
npm run update:fantasy
npx tsx scripts/verifyDataRefresh.ts fantasy-football
npm test -- --runInBand \
  .github/workflows/__tests__/snapshot-workflows.test.ts \
  scripts/__tests__/buildFantasySnapshots.test.ts \
  src/lib/__tests__/fantasy.test.ts \
  src/lib/__tests__/fantasyProsPublicSource.test.ts \
  src/lib/__tests__/fantasyProsVorpSource.test.ts \
  src/lib/__tests__/fantasyReplacement.test.ts \
  src/lib/__tests__/redraftDraftDecision.test.ts \
  src/lib/__tests__/fantasySnapshotBuilder.test.ts \
  src/lib/__tests__/bestBallSource.test.ts \
  src/lib/bestBall/__tests__/bestBall.test.ts \
  src/lib/bestBall/__tests__/sourceCapabilities.test.ts \
  src/lib/fantasyCompanion/__tests__/recommendations.test.ts \
  extension/src/__tests__/snapshot-client.test.ts
npm run typecheck
npm run lint
npm run build
npx playwright test e2e/fantasy-football.spec.ts
```

## Remaining risks

| Priority | Risk | Current position |
| --- | --- | --- |
| P0 | FantasyPros licensing and source continuity | The scheduled job pins public HTML, while the official API remains an explicit local option. Neither access path by itself establishes public redistribution rights, so the applicable terms, account tier, or written agreement still need to permit storing and serving the committed snapshots. [FantasyPros' legal terms address copying and redistribution](https://www.fantasypros.com/about/legal/), and its [API program](https://www.fantasypros.com/api-data/) is the place to confirm that permission. |
| P1 | No weekly projection or field simulation | The UI explicitly withholds win probability, winning lineup, and roster-specific payout claims. |
| P1 | The spike-week component cannot fire on any shipped preset | It is inert twice over. Only `standard-tournament` is reachable by an exact preset and its `spikeWeekWeight` is 0, so the term multiplies to nothing. Separately `spikeWeekSignal` reads `player.weeklyProjections`, which the best ball snapshot does not carry, so the raw signal is 0 whatever the weight. The only test showing it nonzero uses `weekly-winners`, a reference preset that never reaches the engine. Its card copy correctly says no weekly variance adjustment applies, so nothing on screen is wrong, and the component is a placeholder waiting on a weekly projection source. Audited 2026-08-23. |
| P1 | No separate live injury or player-news source | The draft pages tell the user to verify current room and team news before every pick. |
| P1 | No historical calibration of Draft Outlook coefficients | The score remains ordinal draft process guidance. A held-out multi-season backtest is the next model task. |
| P2 | Redraft ADP does not vary across tested team-size parameters | The UI calls it a general market price and the model uses actual pick number plus exact lineup settings. |
| P2 | Separate best ball slates lack matching ADP | The tool removes market value rather than reusing the standard-season price. |
| P2 | Prior-season points per game carry no role or opponent adjustment | The panel names its season and its games-played count, and this spec says plainly that the figures describe what already happened and forecast nothing. A rookie or a player under the four-game floor gets no panel at all. |

## Draft-day operating rule

Before a real draft, I would confirm the scoring format, team count, rounds, lineup, source dates, and current player news. During the room, I would use ADP as the price, ECR and tiers as a second opinion, roster feasibility as the constraint, and correlation as a close-call adjustment. I would not chase a position run or Week 17 opponent past a full tier. I would ignore a Value or Reach label when the player drawer says the sample is early. Draft Outlook remains a check on the process after four picks and does not decide the season.
