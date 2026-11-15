# Fantasy football platform setup

Status as of November 2, 2026.

This is the current operating map for the fantasy football pages, their supported room types, and the checked-in data behind them. I would treat anything outside the matrices below as unsupported until it has its own source, rules contract, model, and tests.

## Live routes

| Route | Purpose | Data path |
| --- | --- | --- |
| `/fantasy-football` | Redraft rankings, list and tier views, search, notes, queue, and player comparison | Scoring-specific redraft snapshot |
| `/fantasy-football/draft-tracker` | Manual redraft room tracker and Draft Outlook | Scoring-specific redraft snapshot plus browser-local draft state |
| `/fantasy-football/trade-calculator` | One-QB redraft trade estimate with explicit source coverage, priced on the draft board before Week 1 and on the rest-of-season board from Week 1 | Scoring-specific redraft snapshot, the rest-of-season board in `public/data/fantasy/weekly.json` from Week 1, and browser-local player selections |
| `/fantasy-football/best-ball` | Best ball contest guide and rankings board | `public/data/fantasy/best-ball.json` |
| `/fantasy-football/best-ball/draft-tracker` | Manual best ball room tracker, roster guidance, and Draft Outlook | Best ball snapshot plus browser-local contest state |
| `/fantasy-football/mock-draft` | Mock draft simulator for a one-QB room, seeded from the published consensus board and market ADP | Scoring-specific redraft snapshot |
| `/fantasy-football/weekly` | In-season weekly FLEX and quarterback consensus boards, plus the saved My team panel | `public/data/fantasy/weekly.json` |
| `/fantasy-football/waivers` | In-season waiver targets where the weekly consensus rank runs ahead of the rostered rate | `public/data/fantasy/weekly.json` |
| `/api/fantasy-data` | Rate-limited server fallback for redraft snapshots | The same committed PPR, Half PPR, and Standard JSON files |

The legacy route `/fantasy-football/rb-tiers` redirects to `/fantasy-football?position=rb&scoring=ppr`. `/fantasy-football/tiers/[position]` redirects to the matching PPR board.
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

Before Week 1, and in season whenever the weekly snapshot has no rest-of-season board, the trade calculator uses the overall preseason expert board and reliable mock-draft ADP from the selected redraft snapshot. From Week 1, when `public/data/fantasy/weekly.json` carries a rest-of-season board for the season and scoring format, it uses FantasyPros' rest-of-season overall board as the expert reading and this season's points per game above replacement, weighted by games played, as the second reading. On either basis it converts both ordinal inputs into a replacement-relative index using the league’s team count, roster size, and saved lineup preset, then reports a central estimate, a source-spread sensitivity range, and supported, limited, or insufficient coverage. On the preseason basis it withholds exact values and the verdict unless the expert board and current market cover every selected player. On the in-season basis a player with no current scoring log is priced on the experts alone at limited coverage, and a rest-of-season board more than eight days old withholds the verdict. The formulas and thresholds are in `docs/FANTASY_DRAFT_MODEL.md`.

The second reading is mock-draft ADP before the season and this season's scoring in season, and neither is completed trade activity. The expert reading is aggregate consensus, not a named creator model. The result does not claim rest-of-season points, win probability, injury adjustment, schedule value, dynasty value, or a guarantee. Unequal packages use quick mode, where each extra player is assumed to displace a replacement-level roster spot.

## Best ball presets

Every selectable best ball preset is a snake draft with half PPR scoring and a roster size equal to its rounds. Most are 12-team, 18-round rooms with the standard 1 QB, 2 RB, 3 WR, 1 TE, and 1 FLEX lineup. 6-Man drafts that same 18-round standard roster with six teams, and the Superflex reference preset is a 12-team, 20-round, 20-player room that starts 1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX, and one Superflex slot.

The words exact and reference describe recommendation evidence. Exact means the snapshot has a current room-price source for that player pool and draft shape, so the tracker may show player-specific next-pick cards when the required sources are current. Reference means the sourced board and roster guidance remain available, but the tracker withholds exact player cards and does not reuse another contest's ADP.

| Preset | Mode | Board and price contract |
| --- | --- | --- |
| Best Ball Mania VII | Exact | PPR best ball consensus plus the current standard-season Underdog ADP |
| The Puppy | Exact | The same sourced board and standard-season Underdog ADP used by the matching 12-team, 18-round room |
| The Little Dalmatian 2 | Exact | The same sourced board and standard-season Underdog ADP used by the matching 12-team, 18-round room |
| 6-Man | Reference | Standard PPR best ball board and roster profile; the snapshot's Underdog ADP is a 12-team market, so it prices the players but not the pick slots in a six-team room |
| Eliminator | Reference | Standard PPR best ball board and Eliminator roster profile, with no Eliminator-specific ADP |
| Weekly Winners | Reference | Standard PPR best ball board and a 12-team, 18-round model only when the lobby card matches; no matching slate ADP or player-level weekly projections |
| Sit & Go | Reference | Standard PPR best ball board and cumulative roster profile only when the lobby card matches; no matching room ADP |
| Superflex | Reference | Separate half PPR Superflex consensus and roster profile, with no matching Superflex room ADP |

Exact does not mean the model knows win probability, projected points, or payout value for a roster. The official room card and linked contest rules remain authoritative if a contest changes.

Archived contest versions are not selectable presets. Earlier Best Ball Mania, Puppy, Eliminator, and other historical rule sets are not stored as versioned modes, and the current preset should not be used to reconstruct them. The platform also does not model Underdog Daily drafts, single-game or short-slate rooms, daily fantasy salary lineups, pick'em, playoff-only pools, late swap, or arbitrary platform contests. Weekly Winners is a reference preset for the matching season-long room shape, not general daily-slate support.

## Seven-step snapshot pipeline

Run the full refresh with:

```bash
npm run update:fantasy
```

The command runs these steps in order. Steps 1 through 5 are `update:fantasy:redraft`, step 6 is `update:fantasy:best-ball`, and step 7 is `update:fantasy:weekly`.

| Step | Builder | What it does | Artifact |
| ---: | --- | --- | --- |
| 1 | `scripts/buildFantasyPositionData.ts` | Fetches and validates scoring-specific FantasyPros public consensus boards; reuses the scoring-independent QB, K, and DST boards | `src/data/fantasyPositionData.generated.json` |
| 2 | `scripts/buildFantasyAdpData.ts` | Fetches Fantasy Football Calculator ADP by redraft scoring format and keeps the prior disclosed board when a fresh board fails or degrades | `src/data/fantasyAdpData.generated.json` |
| 3 | `scripts/buildFantasyGameLogData.ts` | Rebuilds the per-game scoring input from nflverse weekly player stats, trying the current season first and falling back to the prior one, so in season it carries this season's games so far | `src/data/fantasyGameLogData.generated.json` |
| 4 | `scripts/buildFantasyVorpData.ts` | Rebuilds the VORP input from the FantasyPros projected VORP reports | `src/data/fantasyVorpData.generated.json` |
| 5 | `scripts/buildFantasySnapshots.ts` | Joins consensus, ADP, VORP, and game logs, derives FLEX, builds all three redraft formats in memory, appends the day's reading to the rank history and stamps 7 and 14-day movement on the overall and FLEX boards, stages everything, publishes the three JSON files and then the rank history, and publishes the shared revision last | `public/data/fantasy/ppr.json`, `public/data/fantasy/half_ppr.json`, `public/data/fantasy/standard.json`, `src/data/fantasyRankHistory.generated.json`, and `src/data/fantasySnapshotRevision.generated.ts` |
| 6 | `scripts/buildBestBallSnapshot.ts` | Builds the best ball board from the FantasyPros public best ball and half PPR Superflex consensus pages, plus Underdog ADP, bye weeks, and the Week 17 schedule. A failed rankings refresh keeps the committed snapshot while it is at most ten days old, and at any age once the regular season has opened | `public/data/fantasy/best-ball.json` |
| 7 | `scripts/buildFantasyWeeklySnapshot.ts` | Builds the in-season weekly board from the FantasyPros weekly FLEX and quarterback consensus pages, adds the rest-of-season overall board for each scoring format and keeps the previous build's board when that fetch fails, and writes nothing before Week 1 or more than seven days after Week 18 opens | `public/data/fantasy/weekly.json` |

Step 5 does not touch an output until PPR, Half PPR, and Standard have all built and serialized successfully. It stages every redraft file, moves the three snapshots into place, then the rank history, moves the revision last, and removes its temporary files after an error. Importing the builder in a test does not run the command.

The FantasyPros source client reads the public consensus pages during the refresh. In the redraft and weekly lanes, an HTTP, parsing, or board validation failure on a consensus page stops that lane and leaves its committed files in place. The best ball rankings, the Superflex board, and the rest-of-season board fall back to their committed copies instead, as steps 6 and 7 above and the validation contract below describe.

The public app consumes these checked-in artifacts. It does not call FantasyPros, Fantasy Football Calculator, Underdog, or ESPN during a user request. The scheduled `.github/workflows/update-fantasy.yml` job runs daily at 17:17 UTC from July through December and from January 1 through 12, weekly on Wednesday at 17:17 UTC from January through June, and also at 11:47 UTC on Sundays in January and September through December so the weekly board is current at kickoff. It runs the weekly, redraft, and best ball lanes as separate steps in that order, verifies freshness and quality, and commits each lane's artifacts on its own only when they changed.

## Sources and freshness

| Surface | Ranking source | Market and schedule inputs |
| --- | --- | --- |
| Redraft | FantasyPros public consensus HTML. Overall, RB, WR, and TE are scoring-specific; QB, K, and DST are shared; FLEX is derived from the overall board. | Fantasy Football Calculator mock-draft ADP for the matching scoring format. The request uses its 12-team parameter, but the provider returned the same prices across tested room sizes, so the UI calls this a general market price. |
| Standard best ball | FantasyPros public PPR best ball consensus HTML | Standard-season Underdog ADP via Hayden Winks, redraft bye weeks, and ESPN's Week 17 schedule |
| Superflex reference | FantasyPros public half PPR Superflex consensus HTML | No matching Superflex ADP. Bye weeks and schedule remain supporting inputs. |
| Weekly and waivers | FantasyPros public weekly FLEX consensus for each scoring format and one shared weekly quarterback board, plus the public rest-of-season overall board for each scoring format, which the trade calculator reads in season | The rostered percentages published on the weekly boards. No ADP, projections, or bids. |

## Secret and licensing boundary

The scheduled refresh runs in GitHub Actions and reads the public consensus pages. The deployed Netlify runtime needs no FantasyPros variable because it serves the committed snapshots.

Reading the public pages does not by itself grant permission to store and publicly redistribute the resulting rankings. The FantasyPros terms, account tier, or a written agreement has to explicitly cover the checked-in artifacts and their public delivery through this site. The official API path that used to sit beside the public pages was removed on 2026-10-02, and API access would have raised the same question.

`generatedAt` says when this site built a file. `upstreamUpdatedAt` or a source-specific `asOf` says when the underlying board changed. The redraft API response headers and the data revision ledger use `upstreamUpdatedAt`, with `generatedAt` only as a legacy fallback.

From July through December, the UI labels a source Current before two days, Aging from two through four days, and Stale after four days. Outside that window, the boundaries are eight and fourteen days. Missing or invalid dates fail closed as stale. The operations freshness gate for redraft publication allows a 36-hour upstream age from July through September until Week 1 opens, 200 days from the Week 1 opener while FantasyPros keeps its draft board frozen, and ten days otherwise. Best ball workflow checks require ranking, ADP, Superflex, and schedule sources no older than four days from July through December or fourteen days outside it, and the built snapshot cannot be older than ten days. Once the regular season opens those age checks only warn, because the best ball board is frozen at its dated sources by design. The workflow holds redraft ADP to the same four and fourteen-day limits. Before the regular season opens an older ADP reading turns the run red without holding back the rankings commit, and after it opens the same reading only warns.

Exact best ball cards disappear when their required consensus or matching ADP is stale, when the PPR best ball consensus fails its self-consistency check, or, for the contests that score Week 17 game stacks, when the Week 17 schedule is missing, stale, or maps fewer than 30 teams. Redraft removes stale or prior-slate market fields before Draft Outlook uses a restored pick. Neither snapshot contains a separate live injury or player-news feed, so every draft page tells the user to check the live room and current team news.

## Validation contract

The source and publication gates are intentionally strict because one coherent but wrong board can look normal in the UI.

The FantasyPros source adapter normalizes the public HTML response into the board contract. Validation verifies NFL, the requested ranking type (draft, best ball, weekly, or rest-of-season), current NFL season, requested scoring and position, declared row count, expert count, positive unique player IDs, nonempty names, positive position ranks, and valid tiers. Rank ranges are validated on every row. A single-position board may carry a few rows tagged with another position, since FantasyPros lists an RB-tagged row around TE168 on every 2026 TE page; those rows are dropped and the board publishes without them, and a board where more than 5% of the rows are off-position is rejected as wrong or mixed. Redraft and Superflex boards require at least ten contributing experts. The standard best ball board has a separate four-expert floor, lowered from five on 2026-08-31 after that panel thinned to four contributors, and the actual count is stored in the snapshot and shown next to the source link. Each redraft format must contain at least 300 overall players, 48 quarterbacks, 100 running backs, 120 wide receivers, 48 tight ends, 32 kickers, and 32 defenses. A same-season refresh must also retain at least 80% of the prior rows and 80% of the prior top 150 identities.

The redraft ADP parser verifies source status, scoring format, 12-team metadata, sample window, positive ADP, unique name and position pairs, ranges, deviation, and selection counts. A fresh input needs at least 50 rows and at least 80% of the prior same-season rows and top-board identities before replacing the generated input. When 50 or more source rows are present, the snapshot join must match at least 60% of them and cover at least 90% of the top 150 overall board.

At runtime, redraft normalization rejects a present scoring format that does not match the requested file, future or invalid schema versions, a current-schema file that does not name its source, and empty snapshots. The browser and the server route have normalized in a lenient mode since 2026-08-12, and the Draft Companion does the same, so a row with malformed player identity or rank fields, a duplicate ID inside a slice, or a player placed in the wrong position slice is dropped and the rest of the snapshot still loads. FLEX accepts actual RB, WR, and TE players. Missing schema versions and positive legacy versions through the current schema remain readable. The client tries the static file first, but a fetch or normalization failure falls back to `/api/fantasy-data` before the page reports an error.

Best ball requires at least four recorded ranking experts, 250 ranking rows, and 80% preservation of the prior same-season board and top 150. The PPR best ball board also has to agree with itself, so among its top 150 players by published average rank no more than five may carry a consensus rank more than ten places outside that player's published expert range. A fresh ADP join needs at least 150 matches and 80% preservation of prior matches and top prices. A fresh Superflex board needs at least 150 matches, 90% coverage of the full board, 95% coverage of the top 150, 90% coverage of all quarterbacks, and complete rank and tier coverage for the first 42 quarterbacks. The 42-player core matches the midpoint of three to four quarterbacks across the supported 12-team room. The workflow also requires at least 30 validated Week 17 team mappings.

The weekly board sets its own floors. Each weekly page needs at least five contributing experts, the flex page at least 150 rows, and the quarterback page at least 24. The builder refuses a page more than one week behind the calendar, a page last updated more than 72 hours before the build, and a flex page from a different week than the quarterback page. Every published format must carry at least 120 flex players and 24 quarterbacks, and within the same week the PPR flex board cannot drop below 80% of the committed one. The rest-of-season board needs 300 rows from at least four experts, and a failed rest-of-season fetch keeps the previous build's board for the same season without failing the weekly board.

Consensus publication safety takes precedence over ADP. The redraft ADP fetch keeps the prior attributed source when possible and lets ADP degrade independently from consensus. Best ball secondary fetches keep the prior same-season ADP, Superflex, or schedule input when possible. A failed best ball rankings refresh, including one rejected by the self-consistency check, keeps the committed snapshot while it is at most ten days old, and at any age once the regular season has opened. The UI hides market-driven surfaces when provenance or freshness is not usable.

## Browser persistence

Redraft draft state is stored under `fantasy-draft-tracker-v3-<season>`. A restored room rebuilds its counters and team totals from its picks and current settings, and a completed room stays on its configured final round. Best ball draft state uses `fantasy-best-ball-draft-v1-<season>-<contest>` plus a previous-state backup. It also requires the saved contest rules to match the current rule schema, so changing presets cannot reuse incompatible picks.

Redraft and best ball draft rooms do not read or overwrite each other. The queue, notes, and comparison tray are intentionally shared by stable player ID through `fantasy-player-queue-v1`, `fantasy-player-notes-v1`, and `fantasy-compare-v1`. The redraft tracker also keeps per-turn recommendation telemetry under `fantasy-draft-telemetry-v2-<draftId>` and named league presets under `fantasy-draft-presets-v1`. The mock draft room saves under `fantasy-mock-draft-v1-<season>`, the trade calculator keeps the selected players under `fantasy-trade-calculator-v1-<season>-<scoring>`, and the My team panel on the weekly and waiver pages keeps one roster per season under `fantasy-my-team-v1-<season>`. There is no fantasy account database or server-side room sync.

## Local setup and verification

The pages do not need operational secrets to render from committed snapshots.

```bash
npm install
npm run dev
```

The refresh rewrites committed artifacts.

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
  src/lib/__tests__/fantasyAdpSource.test.ts \
  scripts/__tests__/buildFantasyAdpData.test.ts \
  src/lib/__tests__/bestBallSnapshot.test.ts \
  src/lib/__tests__/bestBallSource.test.ts \
  src/lib/bestBall/__tests__/bestBall.test.ts \
  scripts/__tests__/buildFantasyWeeklySnapshot.test.ts \
  src/lib/__tests__/fantasyWeeklySnapshot.test.ts \
  src/lib/__tests__/fantasyWeeklySource.test.ts
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
