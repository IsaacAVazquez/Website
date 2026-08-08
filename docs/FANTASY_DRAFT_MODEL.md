# Fantasy draft model contract

**Status as of August 7, 2026**

I would use this tool as a draft process assistant. It now gives a defensible answer to four questions during a room. It shows the current market price, whether a gap is large relative to the published uncertainty, whether the roster can still reach a sensible final shape, and how the draft compares with teams that have made the same number of picks.

I would not use Draft Outlook as a player projection, a win probability, or a claim that one construction is proven to win. The snapshots do not contain weekly player distributions, current injury probabilities, waiver behavior, or a simulated field. Those missing inputs matter more than another round of hand tuning the current coefficients.

## What the tool means

| Output | Definition | Safe interpretation |
| --- | --- | --- |
| Published rank | FantasyPros expert consensus rank, or ECR | A sourced ordinal board, not equal units of player value |
| Avg | Arithmetic mean of the contributing expert ranks | The center of the expert rank distribution, separate from ECR |
| ADP | Average overall pick from the attributed draft source | A market price for the source format and slate |
| Value or Reach | ADP minus ECR after sample and variation checks | A prompt to inspect a market disagreement, not an automatic pick |
| Pick delta | Actual pick minus the usable pick baseline | Positive means the player lasted later than the baseline |
| Roster strength | Configured starting slots and planned depth that are covered | Structure only, with no claim about player quality beyond the market component |
| Draft Outlook | Weighted, room-relative draft process score | An ordinal comparison inside this room at equal draft progress |
| Expected return | User-entered payout chance times average payout, less entry cost | Arithmetic from the user's assumptions, separate from Draft Outlook |

[FantasyPros explains that ECR is now built from rank points rather than a simple average rank](https://support.fantasypros.com/hc/en-us/articles/115001219327-What-is-ECR-Expert-Consensus-Rankings-and-how-do-you-calculate-it). That distinction is why `rankEcr` and `rankAverage` remain separate fields. The rank range chart now marks `rankAverage`; the prior chart marked ECR while labeling it Avg. In the August 7 PPR snapshot, 522 of 523 players have different ECR and mean ranks. The median absolute difference is 1.4 spots through ECR 150, but it grows in the sparse tail, where fewer experts rank every player.

[FantasyPros' draft accuracy method maps rank slots to historical fantasy point values](https://www.fantasypros.com/about/faq/football-draft-accuracy-methodology/). That supports treating a rank as ordinal rather than pretending the distance from rank 1 to 2 has the same football value as the distance from rank 101 to 102.

## Data and source checks

The redraft board combines scoring-specific FantasyPros consensus pages with [Fantasy Football Calculator's ADP API](https://help.fantasyfootballcalculator.com/article/42/adp-rest-api). The best ball board combines PPR best ball consensus, current standard-season Underdog ADP, a separate Superflex consensus, bye weeks, and the Week 17 schedule. The relevant parsers and refresh gates now validate the requested sport, NFL season, scoring, position, declared player count, expert count, ADP format, team count, sample window, unique positive player IDs, names, rank distributions, ADP ranges, and minimum row counts before replacing a snapshot.

A FantasyPros board needs at least ten contributing experts. Redraft requires 300 overall players, 48 quarterbacks, 100 running backs, 120 wide receivers, 48 tight ends, 32 kickers, and 32 defenses. Those floors are large enough to finish the biggest configured room. It also requires at least 80% of the prior rows and prior top 150 player identities when the persisted NFL season matches the fresh board. The generated dataset stores the actual NFL season instead of inferring it from a January or February timestamp. Best ball requires at least 250 ranking rows, then preserves at least 80% of the prior same-season board and prior top 150 identities. A redraft ADP source with at least 50 rows must match at least 60% of its players to the ranking board, and a fresh same-season ADP board cannot drop below 80% of the prior rows or prior top-player identities. Best ball applies the same 80% preservation rule to its prior ADP matches and top-board prices.

The current redraft ADP evidence is uneven, which is why one fixed ten-pick rule was not enough.

| Format | Overall players | ADP matches | Players below 20 selections | Median selections | Median ADP SD | Maximum ADP SD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| PPR | 523 | 248 | 35 | 209 | 10.9 | 34.6 |
| Half PPR | 847 | 210 | 44 | 61 | 9.5 | 37.7 |
| Standard | 508 | 200 | 54 | 36 | 9.4 | 53.3 |

The API request asks for a 12-team room, but tests on August 7 returned the same 256 players, 4,929 drafts, and player prices for the 8, 10, 12, and 14 team parameters. The UI now describes this as a general market price rather than claiming the provider modeled the selected league size.

The source dates remain visible during a draft. From July through September, a ranking or ADP source ages after two days and is stale after four days. A prior-season ADP feed is also stale during those months. Saved picks are matched back to the current player snapshot before scoring, including any corrected player position, and exports rebuild their team counts from those same picks. An orphaned saved player keeps the name, team, and roster position but loses old ADP and expert baselines, while every restored room drops stale or slate-mismatched ADP. Best ball hides exact recommendation cards when its ranking source is stale. A fresh Superflex source must match at least 90% of the full board, 95% of the top 150, and every quarterback, for both ranks and tiers. The Week 17 schedule is accepted only when at least 30 team mappings survive validation. The snapshot has no separate live injury or player-news feed, and the draft pages now say so.

## ADP uncertainty

The rankings board uses `ADP - ECR`. A positive number means the market usually drafts the player later than the expert consensus. A label requires at least 20 observed player selections. When the source publishes player variation, the minimum gap is:

```text
threshold = max(6, ceil(sqrt(ADP_SD^2 + expert_rank_SD^2)))
```

If ADP standard deviation is missing but the observed high and low picks are present, `(low - high) / 4` substitutes for `ADP_SD`. A legacy snapshot with no ADP variation uses a ten-pick threshold. Player comparisons use the larger uncertainty threshold of the two players and do not declare an ADP winner when either sample has fewer than 20 selections.

This is a conservative decision rule, not a statistical confidence interval. Expert rankings are dependent opinions, completed mock drafts are not a random sample of every home league, and player-level selections are not independent. The rule keeps weak readings from looking precise without claiming more than the source can support.

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

## Best ball recommendations

Best Ball Mania VII and Puppy use current standard-season Underdog ADP when it is available. A player without a usable individual ADP, including the undrafted placeholder at the final room slot, stays on the browseable consensus board but is omitted from exact recommendation cards. Eliminator, Weekly Winners, and Sit and Go do not reuse the standard-season price because their player pools and slates can differ. They fall back to standard PPR best ball consensus. Superflex uses the separate sourced Superflex consensus and its tiers, with no standard-lineup ADP value. A missing Superflex tier adds no scarcity score, while a missing Superflex rank removes the player from exact recommendation cards and leaves the pick unpriced in Draft Outlook.

For Mania and Puppy, the recommendation base is one score point for each pick a player has fallen relative to ADP. ADP is counted once. The rest of the recommendation is deliberately bounded.

| Adjustment | Range | Rule |
| --- | ---: | --- |
| Roster need | -2 to +2 | Moves within a feasible final construction |
| QB stack | 0 to +2 | Same-team QB and WR or TE connection |
| Week 17 game stack | 0 to +1 | Completes a QB plus pass catcher side with an opponent player |
| Tier cliff | 0 to +2 | Applies only at a needed position with a measured board gap |
| Weekly projection spread | 0 to +1 | Applies only when player-level weekly projections exist |
| Bye coverage | -2 to 0 | Applies only when a pick worsens the best single attainable composition across every published bye |
| Team concentration | -2 to 0 | Applies after the contest profile's concentration limit |

The maximum positive adjustment inside any one contest profile is seven points. Week 17 scoring and weekly projection spread belong to different profiles, so their one-point bonuses cannot occur together. One Week 17 connection therefore cannot push a player more than a full tier ahead of the room price. A hard feasibility check removes any candidate that would make every allowed 18-player finish impossible. A player whose ADP says he is likely to last loses an otherwise tied comparison, but that flag cannot jump ahead of the recommendation score or turn a missing ADP into false urgency. Exact player cards stay hidden between the user's turns because the tool does not model the probability that each player survives the intervening picks.

The tier gap stays on the same consensus scale as the sourced tier. Standard formats measure the gap with PPR best ball ECR, while Superflex measures it with the separate Superflex rank. Underdog ADP sets the market price once and does not enter the tier adjustment.

[Underdog's ADP study found that most picks in rounds 4 through 14 landed within 12 spots of ADP and that reaches of ten or more spots generally performed worse](https://underdognetwork.com/football/best-ball-research/best-ball-adps-is-it-okay-to-reach-on-players). [A 40,000-entry stacking study also found that price-sensitive stacks advanced better than forced stacks](https://www.playerprofiler.com/article/the-complete-guide-to-stacking-in-best-ball/). Those findings support using correlation after player quality and price are already close.

Weekly Winners had previously received a position-level variation proxy even though the snapshot has no weekly projections. That component is now zero. [Underdog's study of more than 500,000 weekly rosters](https://underdognetwork.com/football/best-ball-research/strategy-data-for-underdog-fantasys-weekly-winners) supports small, clear stack paths, but it does not justify assigning one player's weekly variance from his position alone.

## Best ball Draft Outlook

Best ball Draft Outlook remains separate from the on-clock recommendation score. It evaluates the finished work across market price, feasible roster shape, QB correlation, Week 17 game stacks where the contest uses them, concentration, and bye lineup coverage. Bye coverage tests complete 18-player compositions rather than combining separate position maximums that cannot all fit on one roster. The weights change by contest.

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

## Winning lineups and season simulation

The tool does not currently calculate a winning lineup. Retrospective lists of champions or final-round players are useful descriptions, but they contain survivor bias, injury luck, and waiver outcomes. They should not directly set draft weights without a comparison group. The stronger design is to train and test on every entry or league, preserve the information available at the time of each draft, and hold out complete seasons.

A [peer-reviewed fantasy football optimization study](https://doi.org/10.1515/jqas-2013-0009) used weekly player estimates, opponent draft behavior, lineup constraints, and full-season simulation, then evaluated the system on later historical seasons. Its rules and 2000s data do not transfer directly to this tool, but the design supports the same conclusion. A serious win model has to represent the season after the draft instead of grading a roster from ranks alone.

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

## Current test coverage

The code now pins the main failure cases that could change a live draft decision. Tests cover scoring and season source mismatches, incomplete or duplicate ranking payloads, invalid expert rank distributions, absolute and relative board coverage, ADP duplicates and invalid ranges, sample-based signal suppression, uncertainty thresholds, late redraft ADP, the Underdog floor, ECR versus mean rank display, exact FLEX coverage, tie midpoint ranks, one-team room comparisons, attainable final roster and bye feasibility, slate-mismatched or missing ADP, no weekly proxy, price-first Week 17 behavior, and persistence migration.

Unit tests prove that the code follows this contract. They do not prove that Draft Outlook predicts wins. Historical pick-by-pick data such as [Underdog's public Best Ball Mania VI file](https://underdognetwork.com/football/best-ball-research/best-ball-mania-vi-downloadable-pick-by-pick-data) can support the first retrospective backtest, but a payout model also needs weekly scores, advancement groups, and the full contest structure.

## Remaining risks

| Priority | Risk | Current position |
| --- | --- | --- |
| P0 | FantasyPros licensing and source continuity | The current public-page pipeline and committed snapshots need written permission or an official licensed API path before I would treat them as a durable public product. [FantasyPros' legal terms restrict copying and redistribution](https://www.fantasypros.com/about/legal/), and its [API program](https://www.fantasypros.com/api-data/) is the proper route to resolve this. |
| P1 | No weekly projection or field simulation | The UI explicitly withholds win probability, winning lineup, and roster-specific payout claims. |
| P1 | No separate live injury or player-news source | The draft pages tell the user to verify current room and team news before every pick. |
| P1 | No historical calibration of Draft Outlook coefficients | The score remains ordinal draft process guidance. A held-out multi-season backtest is the next model task. |
| P2 | Redraft ADP does not vary across tested team-size parameters | The UI calls it a general market price and the model uses actual pick number plus exact lineup settings. |
| P2 | Separate best ball slates lack matching ADP | The tool removes market value rather than reusing the standard-season price. |

## Draft-day operating rule

Before a real draft, I would confirm the scoring format, team count, rounds, lineup, source dates, and current player news. During the room, I would use ADP as the price, ECR and tiers as a second opinion, roster feasibility as the constraint, and correlation as a close-call adjustment. I would not chase a position run or Week 17 opponent past a full tier. I would ignore a Value or Reach label when the player drawer says the sample is early, and I would treat Draft Outlook as a check on the process after four picks rather than a verdict on the season.
