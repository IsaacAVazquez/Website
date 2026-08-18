# Fantasy football platform setup

Status as of August 16, 2026.

This is the current operating map for the fantasy football pages, their supported room types, and the checked-in data behind them. I would treat anything outside the matrices below as unsupported until it has its own source, rules contract, model, and tests.

## Live routes

| Route | Purpose | Data path |
| --- | --- | --- |
| `/fantasy-football` | Redraft rankings, list and tier views, search, notes, queue, and player comparison | Scoring-specific redraft snapshot |
| `/fantasy-football/draft-tracker` | Manual redraft room tracker and Draft Outlook | Scoring-specific redraft snapshot plus browser-local draft state |
| `/fantasy-football/trade-calculator` | Preseason one-QB redraft trade estimate with explicit source coverage | Scoring-specific redraft snapshot plus browser-local player selections |
| `/fantasy-football/best-ball` | Best ball contest guide and rankings board | `public/data/fantasy/best-ball.json` |
| `/fantasy-football/best-ball/draft-tracker` | Manual best ball room tracker, roster guidance, and Draft Outlook | Best ball snapshot plus browser-local contest state |
| `/api/fantasy-data` | Rate-limited server fallback for redraft snapshots | The same committed PPR, Half PPR, and Standard JSON files |

The legacy route `/fantasy-football/rb-tiers` redirects to `/fantasy-football?position=rb&scoring=ppr`. `/fantasy-football/tiers/[position]` redirects to the matching PPR board. `public/fantasy/rb_current.json` remains only as a legacy artifact and is not part of the current refresh pipeline.

There is no best ball API route. The best ball pages load the committed static JSON directly. There are also no live `/api/fantasy-pros-*`, `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, `/api/scheduled-update`, `/api/scrape`, or historical fantasy archive routes.

## Exact redraft support

The redraft tracker is a one-QB, managed redraft assistant. These are the exact controls accepted by the setup UI and persisted-state decoder.

| Control | Supported values |
| --- | --- |
| Scoring | PPR, Half PPR, Standard |
| Ranking slices | Overall, QB, RB, WR, TE, FLEX, K, DST |
| Teams | 8, 10, 12, 14, 16 |
| Rounds | 13, 14, 15, 16, 17, 18 |
| Draft order | Snake or linear |
| Draft slot | Any slot in the configured room |
| QB starters | Exactly 1 |
| RB starters | 1 through 3 |
| WR starters | 1 through 4 |
| TE starters | 1 or 2 |
| FLEX starters | 0 through 3, with RB, WR, or TE eligibility |
| K and DST starters | 0 or 1 each |
| Pick timer | Off, 45, 60, 90, 120, or 180 seconds |

The three saved lineup presets are 2 WR plus FLEX, 3 WR plus FLEX, and 3 WR with two FLEX spots and no K or DST. A user can also choose any lineup inside the bounds above as long as the starting slots fit inside the selected number of rounds.

The redraft contract does not include Superflex, two-QB, tight end premium, points per first down, custom passing touchdown values, yardage bonuses, IDP, auction or salary cap, keeper, dynasty, third-round reversal, guillotine, or arbitrary team and round counts. The tracker records `isKeeper: false` on manual picks and has no keeper assignment workflow. It also has no historical season selector.

## Trade estimate contract

The trade calculator uses the overall preseason expert board and reliable mock-draft ADP from the selected redraft snapshot. It converts both ordinal inputs into a replacement-relative index using the league’s team count, roster size, and saved lineup preset, then reports a central estimate, a source-spread sensitivity range, and supported, limited, or insufficient coverage. It withholds exact values and the verdict unless the expert board and current market cover every selected player.

The market reading is mock-draft ADP, not completed trade activity. The expert reading is aggregate consensus, not a named creator model. The result does not claim rest-of-season points, win probability, injury adjustment, schedule value, dynasty value, or a guarantee. Unequal packages use quick mode, where each extra player is assumed to displace a replacement-level roster spot.

## Best ball presets

Every selectable best ball preset currently models a 12-team snake, 18 rounds, an 18-player roster, and half PPR scoring. The standard lineup is 1 QB, 2 RB, 3 WR, 1 TE, and 1 FLEX. The Superflex reference preset replaces FLEX with one Superflex slot.

The words exact and reference describe recommendation evidence. Exact means the snapshot has a current room-price source for that player pool and draft shape, so the tracker may show player-specific next-pick cards when the required sources are current. Reference means the sourced board and roster guidance remain available, but the tracker withholds exact player cards and does not reuse another contest's ADP.

| Preset | Mode | Board and price contract |
| --- | --- | --- |
| Best Ball Mania VII | Exact | PPR best ball consensus plus the current standard-season Underdog ADP |
| The Puppy | Exact | The same sourced board and standard-season Underdog ADP used by the matching 12-team, 18-round room |
| Eliminator | Reference | Standard PPR best ball board and Eliminator roster profile, with no Eliminator-specific ADP |
| Weekly Winners | Reference | Standard PPR best ball board and a 12-team, 18-round model only when the lobby card matches; no matching slate ADP or player-level weekly projections |
| Sit & Go | Reference | Standard PPR best ball board and cumulative roster profile only when the lobby card matches; no matching room ADP |
| Superflex | Reference | Separate half PPR Superflex consensus and roster profile, with no matching Superflex room ADP |

Exact does not mean the model knows win probability, projected points, or payout value for a roster. The official room card and linked contest rules remain authoritative if a contest changes.

Archived contest versions are not selectable presets. Earlier Best Ball Mania, Puppy, Eliminator, and other historical rule sets are not stored as versioned modes, and the current preset should not be used to reconstruct them. The platform also does not model Underdog Daily drafts, single-game or short-slate rooms, daily fantasy salary lineups, pick'em, playoff-only pools, late swap, or arbitrary platform contests. Weekly Winners is a reference preset for the matching season-long room shape, not general daily-slate support.

## Four-step snapshot pipeline

Run the full refresh with:

```bash
npm run update:fantasy
```

The command runs these steps in order.

| Step | Builder | What it does | Artifact |
| ---: | --- | --- | --- |
| 1 | `scripts/buildFantasyPositionData.ts` | Fetches and validates scoring-specific FantasyPros consensus boards through the explicitly selected source; the scheduled job pins public consensus HTML, while a local run can select the official API; reuses the scoring-independent QB, K, and DST boards | `src/data/fantasyPositionData.generated.ts` |
| 2 | `scripts/buildFantasyAdpData.ts` | Fetches Fantasy Football Calculator ADP by redraft scoring format and keeps the prior disclosed board when a fresh board fails or degrades | `src/data/fantasyAdpData.generated.ts` |
| 3 | `scripts/buildFantasySnapshots.ts` | Joins consensus and ADP, derives FLEX, builds all three redraft formats in memory, stages them, publishes the three JSON files, and publishes the shared revision last | `public/data/fantasy/ppr.json`, `public/data/fantasy/half_ppr.json`, `public/data/fantasy/standard.json`, and `src/data/fantasySnapshotRevision.generated.ts` |
| 4 | `scripts/buildBestBallSnapshot.ts` | Builds the best ball board from FantasyPros consensus and Superflex boards through the explicitly selected source, plus Underdog ADP, bye weeks, and the Week 17 schedule | `public/data/fantasy/best-ball.json` |

Step 3 does not touch an output until PPR, Half PPR, and Standard have all built and serialized successfully. It stages every redraft file, moves the three snapshots into place, moves the revision last, and removes its temporary files after an error. Importing the builder in a test does not run the command.

The FantasyPros source client reads `FANTASYPROS_SOURCE` and `FANTASYPROS_API_KEY` only during the refresh. `public-html` selects the public consensus pages and ignores a configured key. `official-api` requires the key and sends it in the API request. `auto`, which is also the behavior when the source variable is absent, selects the API when a key exists and public HTML when it does not. Once selected, HTTP, parsing, and board validation failures stop the refresh without changing sources.

The public app consumes these checked-in artifacts. It does not call FantasyPros, Fantasy Football Calculator, Underdog, or ESPN during a user request. The scheduled `.github/workflows/update-fantasy.yml` job runs daily at 17:00 UTC from July through September and weekly on Wednesday at 17:00 UTC during the rest of the year. It runs the full pipeline, verifies freshness and quality, and commits all seven generated artifacts only when they changed.

## Sources and freshness

| Surface | Ranking source | Market and schedule inputs |
| --- | --- | --- |
| Redraft | FantasyPros public consensus HTML in the scheduled job; the official FantasyPros API is an explicit local option. Overall, RB, WR, and TE are scoring-specific; QB, K, and DST are shared; FLEX is derived from the overall board. | Fantasy Football Calculator mock-draft ADP for the matching scoring format. The request uses its 12-team parameter, but the provider returned the same prices across tested room sizes, so the UI calls this a general market price. |
| Standard best ball | Official FantasyPros API when configured; public PPR best ball consensus HTML when the key is absent | Standard-season Underdog ADP via Hayden Winks, redraft bye weeks, and ESPN's Week 17 schedule |
| Superflex reference | FantasyPros public half PPR Superflex consensus HTML in the scheduled job; the official API remains an explicit local option | No matching Superflex ADP. Bye weeks and schedule remain supporting inputs. |

## Secret and licensing boundary

The scheduled refresh runs in GitHub Actions with `FANTASYPROS_SOURCE=public-html` and without `FANTASYPROS_API_KEY`. The explicit source setting prevents a retained or later-added key from moving the job back to the official endpoint, which returned a declared full board with only ten rows in the August 15 run. GitHub and Netlify may retain a key for other uses, but this workflow does not receive it. The deployed Netlify runtime does not need either variable because it serves the committed snapshots.

Official API access does not by itself grant permission to store and publicly redistribute the resulting rankings. Before publishing API-derived snapshots, the FantasyPros account and licensing tier must explicitly cover the checked-in artifacts and their public delivery through this site. The public HTML fallback carries the same redistribution question and should not be treated as a licensing substitute.

`generatedAt` says when this site built a file. `upstreamUpdatedAt` or a source-specific `asOf` says when the underlying board changed. The redraft API response headers and the data revision ledger use `upstreamUpdatedAt`, with `generatedAt` only as a legacy fallback.

From July through September, the UI labels a source Current before two days, Aging from two through four days, and Stale after four days. Outside that window, the boundaries are eight and fourteen days. Missing or invalid dates fail closed as stale. The operations freshness gate is tighter for redraft publication, with a 30-hour upstream target from July through September and ten days outside that window. Best ball workflow checks require ranking, ADP, and Superflex sources no older than four days during draft season or fourteen days outside it, and the built snapshot cannot be older than ten days.

Exact best ball cards disappear when their required consensus or matching ADP is stale. Redraft removes stale or prior-slate market fields before Draft Outlook uses a restored pick. Neither snapshot contains a separate live injury or player-news feed, so every draft page tells the user to check the live room and current team news.

## Validation contract

The source and publication gates are intentionally strict because one coherent but wrong board can look normal in the UI.

The FantasyPros source adapters normalize the official JSON and public HTML responses into the same board contract. Validation verifies NFL, draft or best ball ranking type, current NFL season, requested scoring and position, declared row count, expert count, positive unique player IDs, nonempty names, positive position ranks, and valid tiers. Public HTML rank ranges are validated when present. The official API contract does not promise expert minimum, maximum, average, or spread fields, so they remain absent and the UI labels that range unavailable. Redraft and Superflex boards require at least ten contributing experts. The standard best ball board has a separate five-expert floor because that source had six active contributors on August 9, and the actual count is stored in the snapshot and shown next to the source link. Each redraft format must contain at least 300 overall players, 48 quarterbacks, 100 running backs, 120 wide receivers, 48 tight ends, 32 kickers, and 32 defenses. A same-season refresh must also retain at least 80% of the prior rows and 80% of the prior top 150 identities.

The redraft ADP parser verifies source status, scoring format, 12-team metadata, sample window, positive ADP, unique name and position pairs, ranges, deviation, and selection counts. A fresh input needs at least 50 rows and at least 80% of the prior same-season rows and top-board identities before replacing the generated input. When 50 or more source rows are present, the snapshot join must match at least 60% of them and cover at least 90% of the top 150 overall board.

At runtime, redraft normalization rejects a present scoring format that does not match the requested file, future or invalid schema versions, empty snapshots, malformed player identity or rank fields, duplicate IDs inside a slice, and a player placed in the wrong position slice. FLEX accepts actual RB, WR, and TE players. Missing schema versions and positive legacy versions through the current schema remain readable. The client tries the static file first, but a fetch or normalization failure falls back to `/api/fantasy-data` before the page reports an error.

Best ball requires at least five recorded ranking experts, 250 ranking rows, and 80% preservation of the prior same-season board and top 150. A fresh ADP join needs at least 150 matches and 80% preservation of prior matches and top prices. A fresh Superflex board needs at least 150 matches, 90% coverage of the full board, 95% coverage of the top 150, 90% coverage of all quarterbacks, and complete rank and tier coverage for the first 42 quarterbacks. The 42-player core matches the midpoint of three to four quarterbacks across the supported 12-team room. The workflow also requires at least 30 validated Week 17 team mappings.

Consensus publication safety takes precedence over ADP. The redraft ADP fetch keeps the prior attributed source when possible and lets ADP degrade independently from consensus. Best ball secondary fetches keep the prior same-season ADP, Superflex, or schedule input when possible. The UI hides market-driven surfaces when provenance or freshness is not usable.

## Browser persistence

Redraft draft state is stored under `fantasy-draft-tracker-v3-<season>`. A restored room rebuilds its counters and team totals from its picks and current settings, and a completed room stays on its configured final round. Best ball draft state uses `fantasy-best-ball-draft-v1-<season>-<contest>` plus a previous-state backup. It also requires the saved contest rules to match the current rule schema, so changing presets cannot reuse incompatible picks.

Redraft and best ball draft rooms do not read or overwrite each other. The queue, notes, and comparison tray are intentionally shared by stable player ID through `fantasy-player-queue-v1`, `fantasy-player-notes-v1`, and `fantasy-compare-v1`. There is no fantasy account database or server-side room sync.

## Local setup and verification

The pages do not need operational secrets to render from committed snapshots.

```bash
npm install
npm run dev
```

The refresh rewrites committed artifacts. Set `FANTASYPROS_SOURCE=public-html` to exercise the same source as the scheduled job. To use the official API locally, set `FANTASYPROS_SOURCE=official-api` and export `FANTASYPROS_API_KEY` in the same shell.

```bash
npm run update:fantasy
npx tsx scripts/verifyDataRefresh.ts fantasy-football
```

Run the focused data and model checks with:

```bash
npm test -- --runInBand \
  .github/workflows/__tests__/snapshot-workflows.test.ts \
  scripts/__tests__/buildFantasySnapshots.test.ts \
  src/lib/__tests__/fantasy.test.ts \
  src/lib/__tests__/fantasyProsPublicSource.test.ts \
  src/lib/__tests__/fantasySnapshotBuilder.test.ts \
  src/lib/__tests__/bestBallSource.test.ts \
  src/lib/bestBall/__tests__/bestBall.test.ts
```

Run the repository gates before shipping a data, route, or model change.

```bash
npm run typecheck
npm run lint
npx eslint scripts/buildFantasySnapshots.ts scripts/__tests__/buildFantasySnapshots.test.ts
npm run build
npx playwright test e2e/fantasy-football.spec.ts
```

Check the redraft fallback API locally with:

```bash
curl "http://localhost:3000/api/fantasy-data?position=rb&scoring=ppr"
curl "http://localhost:3000/api/fantasy-data?scoring=half_ppr&all=true"
```

The API reads the same committed files and caches each normalized scoring snapshot in memory for five minutes. It is a delivery fallback, not a live upstream refresh.
