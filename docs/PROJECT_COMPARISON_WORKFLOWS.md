# Project comparisons and history

I added the five improvements approved on October 26, 2026. Each workflow stays on its existing route and follows that project's design. Personal records stay in browser storage. The public weekly index archive is committed with the GitHub snapshot refresh.

| Module | Accepted behavior | Evidence boundary |
| --- | --- | --- |
| Retirement comparisons | Save up to 20 named plans, load or remove them, and compare up to four plans with their inputs and results | Recalculate with the existing engine and dated assumptions. Show each plan's age, horizon, contributions, spending, and changed assumptions. |
| Score Pools review | Preserve the recommendation, odds, rules, alternatives, and source time when picks are saved; score those choices after results arrive | Keep the original observation. Earlier picks without an observation stay unmeasured. Actual points do not establish model accuracy. |
| Formula 1 following | Follow drivers and constructors, compare their published race results, and download future sessions as a calendar | Use the supplied snapshot and known session times. Missing results stay unknown. Calendar downloads need another download when schedules change. |
| League following | Extend saved teams, published schedules, calendar downloads, and observed standings changes to Premier League, La Liga, and MLB | Compare the same season and competition. Keep source dates and missing teams visible. |
| Weekly index archive | Retain the last successful observation per UTC week with entrants, departures, and measured movement | Begin with the existing snapshot and retain future observations. Do not reconstruct unobserved rankings. |

The build order is retirement comparisons, Score Pools review, racing, the three leagues, and the public archive. These modules have no dependencies on one another. They reuse browser record validation, calendar escaping, and project controls where those already exist.

Source files and tests stay beside their project or existing shared library. The implementation uses the existing TypeScript and React conventions, explicit types, bounded record decoders, and named imports. No new dependencies are needed. Changes to the GitHub refresh artifact paths are part of the archive workflow.

The numerical and persistence checks use focused Jest tests, followed by `npm test -- --runInBand`, `npm run lint`, `npm run typecheck`, and `npm run build` under Node 22. Browser checks exercise save, reload, comparison, and calendar downloads, and inspect populated layouts at 320, 768, 1024, and 1440 pixels in both themes.

| Records | Storage | Bound |
| --- | --- | --- |
| Named retirement plans | `retirement-scenarios-v1` | 20 plans, four per comparison |
| Score Pools readings | Optional `review` in the existing `score_pools_store_v1` submission | One reading per saved pick |
| Followed racing entries | `f1-followed-<season>-v1` | 20 followed entries, four per comparison |
| Favorite teams and standings | `<league>-favorite-teams-v1`, `<league>-observed-standings-v1` | Ten teams and eight observed snapshots per league |
| Public weekly editions | `agentEditions` in `src/data/githubTrendingSnapshot.json` | 52 observed weeks |

Retirement comparisons recalculate through `projectCore` with each plan's saved seed, simulation count, and inputs. The table shows the current capital market assumption date and reports groups of changed inputs. It does not assign the outcome difference to any single input. Loading uses the existing plan editor and its persistence rules. Failed writes stay in memory and show a notice.

Score Pools records only scheduled games saved before their lock time. Saving the same pick again keeps its original reading and submission time. An edited pick receives the reading available at that save, while a late entry stays unmeasured. Each reading keeps the scoring rules, recommendation, higher-floor and differentiating alternatives, expected points, decimal odds, and source times. The review uses the original scoring rules against the latest available result, including the existing manual-result fallback. The regular tracker continues to use the pool's present rules. Sample matches keep the page's sample-data disclosure.

The racing comparison sends only published classification fields to the browser. Constructor readings sum the listed drivers' Grand Prix points and show how many drivers are present. Sprint points remain separate. The session calendar uses the nearest weekend with known future sessions, even when the snapshot's next-weekend label has become dated. Pacific display times and UTC calendar times remain explicit.

League schedules use the existing team endpoints. MLB's `upcomingGames` field is mapped into the shared schedule format. Soccer uses league position and draws, while MLB uses division position. An unavailable favorite stays removable. Calendar exports omit past, postponed, cancelled, unconfirmed, and conditional games. Downloads use stable event identities, escaped text, and UTF-8 line folding.

The archive starts with the October 22, 2026 source snapshot. The existing daily builder updates the current week's observation and keeps earlier weeks. A failed or reused Agents segment cannot add an edition. New and departed repositories describe membership in the tracked search group, and each row preserves its full-window, partial-window, or new-baseline label. No earlier ranks are reconstructed from today's star history.

The full Node 22 unit run covered 534 suites and 4,997 tests. All suites passed across the original run and reruns of the two suites whose local servers and child processes required sandbox access. The later named-plan component tests and submission-preservation check passed in seven focused suites with 30 tests, and the calendar changes passed three focused suites with nine tests. Lint, standalone TypeScript, and the production build passed. Inverting the future-session filter failed its calendar regression test, and the original condition was restored and checked again.

Chromium checked all seven affected routes in both themes at 320, 768, 1024, and 1440 pixels, for 56 populated layout checks. Each kept one page heading, one main landmark, and no page-wide horizontal overflow. Interactions covered saved-plan reloads and comparisons, racing selections and session downloads, favorites and league schedule downloads, archived rankings, and saved Score Pools readings scored against a manual sample result. The review check used isolated sample records with their original reading time. Retirement controls passed the contrast and 44 pixel target checks after a light-theme field correction. The final browser checks reported no application errors and retained two framework CSS preload warnings. Firefox and WebKit were not part of this pass.
