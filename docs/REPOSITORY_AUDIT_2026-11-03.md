# Repository audit, November 3, 2026

Since this was written, six of the nine P1 findings have a fix in pull request #680 and the five confirmed problems on the branch in flight have fixes in #684, which carries the rest of that branch. Both were open on November 15, 2026. The file links below point at the current tree, so a line number can have drifted from the line the finding names.

I audited the whole repository at origin/main as it stood on October 26, 2026 (commit f591b5fff), plus the work in flight on feature/practical-project-tools, which sits twenty commits past its merge base with uncommitted changes on top. The method was to split the tree into 38 areas that together cover every one of the 2,210 tracked files, send one reader per area and lens (correctness, trust boundaries, over-engineering in the ponytail sense, tests, the design and accessibility contract, copy, and operations for the refresh lanes), and then put every finding in front of verifiers with different jobs, one trying to refute it from the code, one trying to reproduce it by running something, and one calibrating severity and catching duplicates. Nothing below survived on a single reader's say so.

The run was interrupted three times by the account's spend limit, and the temporary folder that held the first results was cleaned by the operating system in between, so the audit happened in two halves. The first half is eleven areas that cover the designed pages, site search, the writing system, the shared library, the refresh platform, build and dependency tooling, the browser test suite, the documentation, the published posts, and the branch in flight. Every lens ran on each of those areas and every finding was verified, and that half is what most of this document reports. The second half is the 27 product areas (fantasy football, investments, the sports and space dashboards, the personal tools, score pools, the job search tracker, and the shared shell), which ran as one combined reader per area to fit the budget, with the same verification behind it. That section is at the end.

Across both halves, 905 findings came back from 66 readers, 864 after merging the ones that named the same lines, and 720 of those survived verification, 9 rated P1, 101 rated P2, and 610 rated P3. Twenty one of the survivors are duplicates the judge flagged inside their own batch, so I count 699 distinct problems. Another 83 were contested, meaning the verifiers split, and 61 were refuted outright. The first half, eleven areas with one reader per lens, accounts for 253 of the confirmed findings, and the second half, 30 combined readers, for 467. I describe the contested and refuted ones near the end so the split is visible instead of quietly resolved.

If I were picking where to start, it would be the things that are costing something today. The Before You Buy browser test has kept the full browser matrix red on every push to main since October 21. The wine inventory field on the branch deletes a bottle from storage when someone types a four digit quantity. The changelog lane has dropped 29 of the last 121 merged pull requests without anyone noticing. The article image refresh still fires a Netlify build hook that goes around the ignore script that exists to stop metered builds. And the Food Map review date has kept the weekly curated data lane red since October 26. Then come the wrong numbers a visitor can see, which are the waiver count that is really a cap, the elevator outage count that is really a notice count, a withdrawn golfer printed at 69 under par, and a SpaceX page whose cores, crew, and capsules are read from a path the API does not use, so every mission prints none. After those come the 2.9 GiB of history every CI run clones, the two Dependabot pull requests that can never install and are holding slots, and the search endpoint that burns seconds of CPU per request with no rate limit in front of it.

## What I checked and how

Before any reader started, I ran the repository's own checks. On the branch's working tree, typecheck and lint pass and the Jest suite passes with 535 suites and 5,001 tests in 52 seconds. On the origin/main worktree, typecheck and lint pass, and the CI history on main shows the unit, lint, and build jobs green on every push with only the full browser matrix failing. An npm audit on main reports three high advisories, one of them (undici, reached through cheerio) on a production dependency path and the other two (vite and zod) in the development set. Three automation issues were open when I started, the matrix failure (#636), an investments refresh failure on October 24 (#642), and the curated data review that flagged Food Map at 181 days against a 180 day window (#643).

The readers worked in a detached worktree of commit f591b5fff with the main checkout's node_modules linked in, so they could run targeted Jest suites, call real functions through tsx with crafted inputs, parse the committed data files, and read GitHub Actions logs through gh without touching the live checkout. Readers for the branch worked in the live checkout itself and were told to say whether each finding sat in the pushed pull request (#639), in one of the nine unpushed commits, or in the uncommitted files. Every reader was given docs/TODO.md and the status sections of the three prior audits first, so anything already tracked carries a known mark and is not counted as new.

A finding counts as confirmed when every verifier on its batch called it real, or when two of three did. Batches holding a P1 or P2 got the reproducer as a third voice, and batches of P3s got the skeptic and the judge. The severity on each finding is the judge's call under one rubric, where P1 means data loss, a reachable security hole, wrong numbers shown to visitors, a broken route, or a failing lane, P2 means a reproducible correctness or reliability problem, a meaningful cut, or a rule the repository holds itself to in CLAUDE.md, STYLING.md, DESIGN_CHECKLIST.md, WRITING_VOICE.md, TESTING.md, or SNAPSHOT_DRIVEN_DASHBOARDS.md, and P3 means smaller.

The raw material is kept beside the repository, outside git. The batch files, every verifier's verdict with its one line of evidence, and the assembled result live under `.claude/worktrees/audit-data/results/`, which git ignores, and the worktree the readers used is `.claude/worktrees/audit-main`. Both can be deleted once this document has been acted on.

## The branch in flight

The branch feature/practical-project-tools carries the five workflows in pull request #639, nine unpushed commits that add rent and buy scenarios, restaurant visits, flight quote comparison, fantasy racing prices, followed teams, and model workload comparisons, and an uncommitted layer that adds the shared ProjectWorkspace component and following features on seven more routes. The readers ran the branch's own 47 new and changed suites (229 tests, all passing) and 112 app-level suites for the touched routes, and the problems below are in what those tests do not reach.

### P1. Stop the wine inventory field from deleting a bottle on an out of range keystroke

The On hand field in [WineInventory.tsx](../src/app/wine-cellar/WineInventory.tsx#L140) writes `Number(e.target.value)` straight through to storage on every change, and the save path re-validates the whole list with `parseWineInventory`, whose quantity check in [wineInventory.ts](../src/lib/wineInventory.ts#L45) drops any bottle whose quantity is not an integer from 0 to 999. So typing 1000, 1.5, or a negative number silently removes that bottle from `wine_cellar_inventory_v1`. The input's max and step attributes do not stop the keystrokes because the write happens on change, not on submit. A reader rendered the component, typed 1000, and watched storage become an empty array. Clamp in the handler, or make the parser clamp the quantity instead of discarding the record, and add a test that an out of range keystroke keeps the row. This is in the pushed pull request.

### P2. Keep the clock out of the Formula 1 following component's server render

[FollowedRacing.tsx](../src/app/formula-1/FollowedRacing.tsx#L33) seeds state with `new Date()` on the server, and that clock filters the next session heading and the session list it renders. The /formula-1 page is in `cdnCachedPages` with a six hour cache and a day of stale while revalidate, so once a session starts between the cached render and a visit, the client's clock produces different text and React reports a hydration mismatch, which a reader reproduced by rendering at one time and hydrating at another. Every other new component on the branch that needs now uses `useClientNow`, which returns null on the server, and the sibling FollowedLaunches does exactly that. Two readers raised this independently, one as a correctness problem and one as a duplicate of a hook the repository already has. It is uncommitted.

### P2. Scope the museum log's checked date to the two exhibitions it covers

The new header line in [museum-log-client.tsx](../src/app/museum-log/museum-log-client.tsx#L1394) prints "Listed exhibitions checked October 23, 2026" under the whole catalog, but that constant belongs only to the two shows added in `src/data/museumExhibitions.ts`. The 43 exhibitions in the base snapshot carry no checked date, their comments say they were read on October 22 (and the Whitney Biennial on September 28), and the snapshot's own generated date is October 22. Say what the constant covers, print the base snapshot's read date beside it, or stamp a checked date onto every exhibit. This is in the pushed pull request.

### P2. Pin the clock in the PersonalTeams test

The PersonalTeams change computes whether the schedule download exists from `sportsCalendar` with the real clock, and the uncommitted calendar change drops any fixture at or before now, so the test's fixture, which kicks off at 2026-11-01T20:00Z, stopped producing the Download button the moment that time passed. A verifier ran the suite on November 2 and one of its four tests failed. Pin the clock the way the budget planner test does, or build the fixture's date from the current time the way the score pools fixtures do. The test is in [PersonalTeams.test.tsx](../src/components/football/__tests__/PersonalTeams.test.tsx#L69).

### P2. Keep a visitor's restaurant notes when a place leaves the catalog

`parseFoodRecords` in [foodPersonal.ts](../src/app/food-map/foodPersonal.ts#L27) rebuilds the record map from the curated place list and keeps only ids that still exist, and `useBrowserRecord.update` re-parses storage before every write. So once a restaurant is delisted, the visitor's saved flag, visited flag, and note for it are dropped the next time they edit any other restaurant. The branch's other stores keep unavailable ids and show an "unavailable in this snapshot" control instead. Validate the record shape and keep unknown ids with a bound on count. This is in an unpushed commit.

### P2. Let the shared workspace stylesheet inherit the route's type and corners

[project-workspace.css](../src/components/project-workspace.css#L19) gives every `.pw-root h2` the body face at 1.25rem and puts a 4px radius on the workspace's fields and buttons, and nine routes that own their design render that workspace. On /investments the heading prints in the body face beside the terminal's mono headings and its fields have rounded corners beside the planner's square ones, which is the identity the investments module names in its own header, and the specificity of the workspace rule beats the route's `:where()` heading rule. Let the workspace inherit its font and leave the radius to the route, or expose a `--pw-radius` the route sets. This is uncommitted.

### P2. Bump the sitemap and page dates for the seven routes the branch changed

The branch adds visible sections to /news-pulse, /wine-cellar, /fintech-tools/budget-planner, /museum-log, /food-map, /travel-deals, and /fintech-tools/rent-vs-buy, but their hand kept dates in [sitemap.js](../src/lib/sitemap.js#L48) and the matching `page.tsx` files still say October 11 or 12, while the same branch bumps the date for the same kind of change on /frontier-models and six routes in the uncommitted diff. The published sitemap and metadata therefore claim those pages last changed before the work shipped. Bump the seven dates and regenerate `public/sitemap.xml`.

### The smaller branch findings

The P3s on the branch cluster into four themes. The first is duplication that the branch's own earlier code already solves. The ICS calendar scaffolding is written four times (sportsPersonal, launchFollowing, and the two raceFollowing modules), the id list store with its own parse and toggle three times, the timestamp validator five times, the finite number in range predicate three times as helpers and four times inline, a money formatter twice when `formatCurrency` exists, and `useBrowserRecord` is re-implemented by hand at five sites including WineInventory and PersonalTeams. The second is copy. Three strings print "1 models", "1 drivers", and "1 poll IDs are new", several surfaces print raw ISO timestamps with milliseconds, the followed teams section's screen reader label reads "PREMIER-LEAGUE personal teams", and the soccer record line promises wins-losses-draws while omitting the draws when they are zero. The third is documentation. PERSONAL_INTEREST_TOOLS.md still says Food Map persists nothing, CLAUDE.md's list of browser-persisted surfaces, COMPONENTS.md, and HOOKS-AND-STATE.md miss the branch's 17 new stores and two shared components, the engine docs for retirement and score pools predate the uncommitted extensions, docs/README.md does not index the two new workflow docs, and `tasks/plan.md` and `tasks/todo.md`, which main deliberately deleted, come back with the branch. The fourth is small behaviour. A headline longer than 600 characters is recorded as a new revision on every news refresh, the "compared with your last visit" line prints the feed's fetch time in place of the visit time, the rent sensitivity table repeats a row when an input sits at its bound and includes three rows that change nothing, and the news history is process local and last writer wins across server instances.

| Where | What | Fix in a few words |
| --- | --- | --- |
| src/lib/sportsPersonal.ts:139 | ICS scaffolding written four times | one `buildCalendar(events)` helper |
| src/lib/sportsPersonal.ts:32 | three id list stores with their own parse and toggle | one generic followed ids store |
| src/lib/newsHistory.ts:26 | five spellings of "is this a timestamp" | one validator in date-formatters |
| src/lib/flightQuotes.ts:20 | finite number in range predicate written seven times | one helper |
| src/app/fintech-tools/rent-vs-buy/RentScenarios.tsx:16 | two local money formatters equal to `formatCurrency` | import it |
| src/app/wine-cellar/WineInventory.tsx:24 | five sites re-implement `useBrowserRecord` | use the hook |
| src/components/football/PersonalTeams.tsx:189 | hand built picker that FollowPicker already provides | reuse FollowPicker |
| src/components/football/PersonalTeams.tsx:37 | builds the whole ICS document to test whether it is empty | test the filtered list |
| src/app/museum-log/museumTrips.ts:5 | date validator duplicates `isLocalDateKey`, food map uses a weaker third | one validator |
| src/app/museum-log/MuseumTripPlanner.tsx:89 | hand rolled disclosure where details and summary would do | native element |
| src/data/museumExhibitions.ts:7 | a merge layer for two exhibit objects | put them in the snapshot |
| src/app/spacex-mission-control/launchFollowing.ts:27 | precise launch predicate written twice in one file | one function |
| src/lib/scorePools/persistence.ts:210 | `decodePickReview` runs twice per submission | decode once |
| src/components/project-workspace.css:1 | two shared workspace sheets plus a route local copy for one chrome | one sheet |
| src/components/project-workspace.css:81 | `.pw-link` styled but never used | delete |
| src/components/project-workflows.css:8 | disclosure summaries draw no expand affordance | restore the marker |
| src/app/wine-cellar/wine-cellar.css:8 | new rules use raw rem values off the spacing ladder | use the `--c97-sp-*` steps |
| src/app/frontier-models/components/FrontierSavedComparisons.tsx:115 | "1 models", "1 drivers", "1 poll IDs are new" | pluralise |
| src/components/football/PersonalTeams.tsx:260 | raw ISO timestamps with milliseconds shown to visitors | run them through the formatters |
| src/components/football/PersonalTeams.tsx:182 | screen reader label upper cases the league slug | use the league name |
| src/components/football/PersonalTeams.tsx:95 | "wins-losses-draws" suffix while draws are omitted when zero | always print the draws |
| src/app/ai-dev-tools/ai-dev-tools-client.tsx:366 | long date and bare ISO date in one disclosure sentence | format both |
| src/app/fintech-tools/rent-vs-buy/RentScenarios.tsx:183 | copy says every row changes one input while three rows are the current plan | drop the unchanged rows |
| src/app/fintech-tools/rent-vs-buy/RentScenarios.tsx:224 | status live regions mounted together with their first message | keep the region mounted |
| src/app/news-pulse/NewsHistory.tsx:132 | "your last visit" prints the feed's fetch time | store the visit time |
| src/app/spacex-mission-control/spacex-mission-control-client.tsx:595 | launch tracker nested in the manifest region ahead of its heading | move it after the heading |
| src/lib/newsHistory.ts:98 | a headline over 600 characters becomes a new revision on every refresh | compare truncated with truncated |
| src/lib/newsPulseServer.ts:198 | news history is process local and last writer wins across instances | merge on write |
| src/lib/rentVsBuy/scenarios.ts:52 | sensitivity table repeats a row when an input sits at its bound | skip the duplicate direction |
| src/app/museum-log/__tests__/MuseumTripPlanner.test.tsx:13 | test depends on a curated Whitney exhibit's dates | use a fixture |
| src/lib/__tests__/agentEditions.test.ts:2 | test uses the live committed GitHub snapshot as its fixture | freeze a fixture |
| PERSONAL_INTEREST_TOOLS.md:122 | says Food Map persists nothing | document `food-map-records-v1` |
| CLAUDE.md:166 | browser persisted list, COMPONENTS.md, HOOKS-AND-STATE.md miss 17 new stores | update the three docs |
| RETIREMENT_PLANNER_ENGINE.md:113 | engine docs predate the scenarios and pick review | update both |
| docs/DATA_UPDATE_OPERATIONS.md:45 | runbooks omit the two new durable artifacts | document the archive and the blob |
| docs/README.md:46 | index omits the two new workflow docs | add them |
| tasks/plan.md:1 | scratch files main deleted come back with the branch | remove them |

## The browser test suite and CI

### P1. Fix the Before You Buy test that keeps the full matrix red

The matrix job has failed on nearly every push to main since October 21 (issue #636), and a reader traced the dominant failure to one line. [before-you-buy.spec.ts](../e2e/before-you-buy.spec.ts#L49) fills the "Add holding symbol" combobox while it sits below the fold inside the just opened editor and relies on the browser to scroll the input into view on focus. WebKit does not do that on Playwright's fill path while Chromium and Firefox do, so when StockSearch opens its suggestions it anchors a `position: fixed` listbox to the input's off screen rectangle, the computed bottom goes negative, and the KO option has no visible quad, which is the "waiting for element to be visible, enabled and stable" timeout in the logs. The verifier confirmed the unclamped arithmetic in [StockSearch.tsx](../src/components/investments/StockSearch.tsx#L144) and read the same failure in four runs. Click the field before filling it, or select the suggestion with ArrowDown and Enter the way the trade calculator spec does, and clamp the listbox into the viewport so an off screen input can never produce an off screen list. The same spec's mobile layout test dereferences a nullable `boundingBox()` with `!` and is the "Cannot read properties of null (reading 'y')" error in the same runs.

### P2. Key the Playwright browser cache on the runner image

Both end to end jobs in [test.yml](../.github/workflows/test.yml#L221) restore `~/.cache/ms-playwright` under a key made of the runner OS and the Playwright version only, while Playwright downloads a distribution specific WebKit. When GitHub moved ubuntu-latest from 24.04 to 26.04, the matrix job restored the 24.04 WebKit, installed the 26.04 package set, and MiniBrowser failed to load `libicudata.so.74`, so every WebKit and Mobile Safari test failed at launch. The key only changed because a dependency bump moved the Playwright version minutes later, so the fault is latent and comes back on the next image change. Add the image name and version to both cache keys, or pin the end to end jobs to a dated image.

### P2. Make the accessibility tests able to fail

Four of the five tests in [accessibility.spec.ts](../e2e/accessibility.spec.ts#L42) assert only that a value is defined or truthy, which every page satisfies. `document.activeElement?.tagName` is "BODY" when nothing has focus, `getAttribute('alt')` returns null for a missing alt and `expect(null).toBeDefined()` passes, computed colours are always strings, and `ariaLabel || text` is truthy for whitespace. The suite named Accessibility therefore gates nothing beyond the heading and main count two other specs already check. Delete the four or make them real, and consider axe for the contrast check.

### P2. Settle the draft tracker before the preset test clicks

After New room, the draft setup screen focuses its heading without `preventScroll` and the page's smooth scrolling animates the reveal, so WebKit is still moving when the test's next pointer events arrive. Playwright validates only the first pointer event of a click, so a mousedown that lands on "Show optional settings" and a mouseup that lands elsewhere produce no click while the test proceeds as if it had, and the dominant shape in CI is a preset saved under the league name fallback with an empty name box. The flake in [fantasy-football.spec.ts](../e2e/fantasy-football.spec.ts#L565) is confirmed in four matrix runs. Set `reducedMotion: 'reduce'` in the Playwright config, at least for the WebKit projects, since the global stylesheet already turns scroll behaviour to auto under that media query, and wait for the heading to be focused before clicking.

### The smaller test findings

| Where | What | Fix in a few words |
| --- | --- | --- |
| e2e/before-you-buy.spec.ts:66 | nullable `boundingBox()` dereferenced with `!` | assert not null first |
| .github/workflows/test.yml:232 | the matrix job re-runs the 437 Chromium tests the shards just passed | run the non Chromium projects only |
| playwright.config.ts:79 | traces only on retry, so a first attempt flake cannot be diagnosed | `on-first-retry` plus `retain-on-failure` |
| e2e/fantasy-trade-calculator.spec.ts:77 | eleven copies of the overflow check with two tolerances, the same load journey in six specs | one helper in layoutChecks |
| e2e/writing.spec.ts:61 | tests that only load a page or if guard their assertion | assert behaviour or delete |
| TESTING.md:73 | coverage list omits six of the twenty spec files | update the list |

## The refresh platform

### P2. Stop the changelog lane from dropping merged pull requests

[changelog-on-merge.yml](../.github/workflows/changelog-on-merge.yml#L14) fires once per merged pull request under a concurrency group with GitHub's default single pending slot, and GitHub cancels and replaces the one pending run whenever a newer run queues. So when pull requests merge faster than one run finishes, about a minute, every run except the one running and the last one queued is cancelled before the append script ever starts. A verifier counted twelve cancelled runs in three minutes on October 21 and found 29 of the 121 first parent merges since September 15 missing from CHANGELOG.md. The header comment that every merged pull request appends a bullet is false. Add `queue: max` under the concurrency block and backfill the missing bullets once with the append script, which is idempotent.

### P2. Remove the Netlify build hook from the article image refresh

When covers commit, [update-article-images.yml](../.github/workflows/update-article-images.yml#L87) posts to `NETLIFY_BUILD_HOOK`, and Netlify documents that the ignore command never cancels a build a hook triggered, so `scripts/ci/netlify-ignore.sh` does not apply and the hook starts a metered build and production deploy of main that duplicates and races the Actions deploy in publish-data.yml. A verifier found the hook set in the repository secrets, a run on October 5 that logged the trigger, and the resulting production deploy in Netlify's deploy list. The fallback message on line 98 names a daily rebuild that no longer exists, docs/CRON_SETUP.md says nothing depends on the hook, and the workflow test exempts this one file from the rule that forbids the hook. Delete the step and the exemption, and dispatch publish-data.yml instead if covers need to ship sooner than the next scheduled publish.

### P2. Only commit raster bytes from the SpaceX image refresh

`downloadImage` in [buildSpaceXImageSnapshots.ts](../scripts/buildSpaceXImageSnapshots.ts#L215) writes whatever a Launch Library image URL returns to `public/data/spacex/images/`, with the extension taken from the upstream content type, which includes `image/svg+xml`, or from the URL's own extension for anything outside the map, with no byte sniffing and no allow list. The SpaceX workflow commits the folder after a gate that checks only the path prefix and file existence, so an SVG or HTML answer from upstream would be served from the site's own origin as a same origin document. Sniff the magic bytes, allow only the raster types, cap the size, and make the workflow gate fail on any other extension.

### P2. Persist the investments fetch ledger as it goes

The per symbol watchdogs in [fetch_investments_data.py](../scripts/fetch_investments_data.py#L883) are SIGALRM timers inside one interpreter, so a native crash in duckdb or pyarrow during one symbol ends the process with exit 139, and because `index.json` with its attempts, failures, and entries is written once after the loop, every symbol already fetched and the rotation ledger are lost. The verifier found two such segfaults in the run history, one on October 13 and the one behind issue #642 on October 24. Write the index after every symbol and record the attempt before a symbol starts, or run each symbol in a subprocess so a signal becomes a per symbol failure.

### The smaller refresh findings

| Where | What | Fix in a few words |
| --- | --- | --- |
| .github/workflows/update-fantasy.yml:509 | the redraft chain can commit refreshed inputs without the boards built from them | gate the commit on the whole chain |
| .github/workflows/update-fantasy.yml:335 | NFL season math and ADP thresholds re-implemented three times inline | call the lib |
| .github/workflows/refresh-snapshot.yml:103 | a Formula 1 live lock skips verification yet closes every open failure issue | close only after a verified run |
| .github/workflows/refresh-snapshot.yml:93 | GITHUB_TOKEN passed to five commit steps that never read it | drop the env |
| .github/workflows/update-spacex.yml:82 | inline four day age gate can never fire, count floors duplicate the registry | delete the gate |
| .github/workflows/test.yml:38 | the one third party action is pinned to a mutable major tag | pin a commit |
| .github/workflows/test.yml:34 | the Python watchdog suite never runs on pull requests | add a pip step |
| .github/workflows/audit-curated-data.yml:38 | re-implements failure-issue.cjs inline | call the helper |
| .github/workflows/__tests__/snapshot-workflows.test.ts:240 | quality gates held only by substring checks | execute the gates in a test |
| .github/workflows/__tests__/snapshot-workflows.test.ts:91 | the shared commit helper's race and conflict branches have no executing test | a bash test with a fake remote |
| .github/workflows/__tests__/data-publication-verifier.test.ts:92 | the no hook branch production uses is untested | add the case |
| .github/CODEOWNERS:5 | path entries name the same owner as the catch all | keep the catch all |
| scripts/verifyDataRefresh.ts:125 | writes a manifest and three outputs nothing reads | delete |
| scripts/ci/ensure-production-data-ledger.mjs:166 | keeps a build hook branch no caller uses | delete |
| scripts/ci/verify-deploy-assets.mjs:40 | `inspectDeployFiles`, the only guard against an unstyled deploy, has no test | add one |
| scripts/__tests__/buildFormula1Snapshot.test.ts:139 | four builder suites delete temp directories they did not create | track what you made |
| scripts/dataRefreshRegistry.ts:19 | the registry bakes in `process.cwd()` that the verifier strips back out | store relative paths |
| docs/DATA_UPDATE_OPERATIONS.md:34 | twelve builder scripts listed with a `.json` extension | `.ts` |
| docs/DATA_UPDATE_OPERATIONS.md:234 | kept snapshot exit code is pinned for NFL, untested for four lanes, documented the other way | align the docs and the lanes |
| docs/ai-context/DATA-PIPELINE.md:111 | earthquake called hourly, World Cup called a pushing bot | daily, and no cron |
| docs/CRON_SETUP.md:54 | a third, partly stale copy of the publication story | fold into DATA_UPDATE_OPERATIONS |
| SNAPSHOT_DRIVEN_DASHBOARDS.md:254 | names a purge function the same document says was deleted | cut the sentence |
| netlify.toml:10 | `CRON_SECRET` kept in the secrets scan exemptions and a setup comment with no reader | delete |

## Build, configuration, and dependencies

### P2. Shed the 2.9 GiB of history that every CI run clones

The objects reachable from origin/main weigh 2.9 GiB against a 104 MB tree, because the clean root created on 2025-08-09 was merged back with the old history the next day, which kept 1.6 GiB of player images, 0.8 GiB of webpack cache, and raw investment data reachable even though every one of those paths is deleted and ignored today. [test.yml](../.github/workflows/test.yml#L18) and changelog-on-merge.yml check out with `fetch-depth: 0`, so every unit test job and every merge downloads all of it. Rewrite the history once with git filter-repo and replace the two full depth checkouts with a blob filter or a bounded depth that still reaches the pull request base.

### P2. Close the two Dependabot pull requests that cannot install

Pull request #603 bumps TypeScript to 7.0.2, but typescript-eslint, on 8.71.0, 8.72.0, and the latest 8.72.1, peer requires TypeScript below 6.1, so `npm ci` fails with ERESOLVE, which the verifier read in the pull request's own run. With the five October 26 pull requests it fills the npm limit of five in [dependabot.yml](../.github/dependabot.yml#L8), so nothing else can open, including the vite bump that clears six advisories. Pull request #605 bumps ipython to 9.17.1 while defeatbeta-api pins ipython at or below 8.37, and its checks are green only because the test workflow never installs the Python requirements. The one lane that does would fail on its first run after a merge. Close both, add ignore rules for TypeScript majors and for the three Python packages whose parents pin them exactly (ipython, pydantic-core, duckdb), and bump vite by hand.

### P2. Raise the coverage thresholds to where coverage is

[jest.config.js](../jest.config.js#L36) holds the thresholds at 52 percent branches, 62 functions, 66 lines, and 65 statements, last raised on July 11, while the suite on main measures 80.8, 90.3, 91.3, and 89.6. TESTING.md says the thresholds ratchet upward as coverage improves, and they have not moved in three and a half months, so a regression of a quarter of all covered lines would still pass. Set them a few points under the measured numbers.

### The smaller tooling findings

| Where | What | Fix in a few words |
| --- | --- | --- |
| package-lock.json:12115 | three high advisories, undici on the production path through cheerio | bump undici, vite, zod |
| next.config.mjs:356 | a report only CSP with no report sink duplicates the enforcing policy in proxy.ts | keep one |
| next.config.mjs:361 | the HSTS preload directive never reaches an HTML response because the proxy's shorter header wins | one header, one place |
| next.config.mjs:282 | better-sqlite3 configured as an external but not a dependency | delete the config |
| next.config.mjs:296 | two remote image hosts nothing uses, SVG optimisation for SVGs that do not exist | delete |
| eslint.config.mjs:10 | lint covers src only and no rule applies to any `.mjs` or `.cjs` file | widen the glob and the script |
| package.json:15 | `npm run lint` skips scripts, extension, netlify, and e2e, where two errors already exist | lint them |
| package.json:86 | @types/node pinned to 26 while every runtime is Node 22 | pin 22 |
| package.json:42 | three builders the env comments point at never load `.env.local` | add the flag |
| .env.example:36 | omits FINNHUB_API_KEY and the ADZUNA keys, lists RESEND_FROM_EMAIL which nothing reads | match the code |
| .gitignore:53 | `next-env.d.ts` is tracked and rewritten by every dev and build run | ignore it |
| .gitignore:74 | bare `*backup*` ignores any new file with backup in its name | anchor the pattern |
| netlify.toml:2 | the build command deletes a standalone path Next never creates | delete the command |
| playwright.config.ts:91 | local runs reuse whatever server holds port 3000, often another worktree's | a per worktree port |
| public/.well-known/security.txt:1 | names a different disclosure contact than SECURITY.md | one contact |
| public/project-screenshots/README.md:1 | a published folder holding only a README that calls itself historical | delete the folder |
| scripts/contrastSweep.mjs:11 | two sweep scripts import `playwright`, which is not a declared dependency | import from @playwright/test |
| scripts/patch-nft-sharp.mjs:32 | dead, since `outputFileTracingExcludes` already drops sharp | delete the step |
| tsconfig.json:38 | three tooling configs reference files and packages that do not exist | clean the lists |
| DEPLOYMENT.md:38 | four docs restate postbuild without `build:llms`, CONFIG.md describes proxy redirects that moved | update |
| TROUBLESHOOTING.md:25 | still points at the removed email digest, auth, and cache purge flows | cut the sections |
| docs/SECURITY.md:103 | requires next and react pinned exactly while next carries a caret | pin or reword |

## Site search

### P2. Bound the query and rate limit the search endpoint

The `q` parameter in [route.ts](../src/app/api/search/route.ts#L525) has no length or token bound, every whitespace separated token is run over the full 1.5 million character corpus, the corpus is rebuilt from 249 files on every request, and this is the one public handler in the repository without the shared rate limiter. A verifier timed the real handler at about 60 milliseconds for a normal query, 3.2 seconds for a thousand single letter tokens, and 16 seconds for four thousand, and each distinct query misses the edge cache because the route varies on the query string. Cap the query, add the limiter keyed on the client address, and memoize the corpus at module scope.

### P2. Give the header search results one keyboard path

Each result in [HeaderSearchPanel.tsx](../src/components/search/HeaderSearchPanel.tsx#L252) is an `li` with the option role wrapping a focusable link. The option role has presentational children, so assistive technology drops the link, while the modal's focus trap still Tab stops on all six anchors, so the panel exposes two parallel keyboard paths over the same results, arrow keys moving `aria-activedescendant` and Tab landing on role less anchors. DESIGN_CHECKLIST.md rules this shape out. Make the row the control, or drop the listbox roles and render plain links.

### P2. Offer category filters the corpus can match

The filter row in [SearchFilters.tsx](../src/components/search/SearchFilters.tsx#L29) sends "Sports Data Tools" for the Sports Dashboards button, but since October 2 project categories come from `toolCategories.ts` and the route matches by exact equality, so that button returns zero results for any query, which a verifier confirmed with the real handler. "Fintech" sends an id that only four posts carry and none of the five fintech tools, and "Fantasy Football" skips the five posts whose category is literally that. Derive the options from what the route emits and add a route test that every filter id returns at least one result.

### P2. Reconcile the search events with the privacy page

`useTrackedListingSearch` in [SearchInterface.tsx](../src/components/search/SearchInterface.tsx#L103) sends a `listing_search` event to GA4 whose `search_term` is the typed query, 700 milliseconds after typing stops, and the filter handlers send the picked option as `filter_value`. The privacy page lists the site's events, never names a search event, and says none of them carry what you typed or picked. Two readers found this from opposite ends, one in the search code and one on the privacy page. Either stop sending the term and the value, or amend the privacy page.

### The smaller search findings

| Where | What | Fix in a few words |
| --- | --- | --- |
| src/components/search/SearchResults.tsx:144 | highlighting runs over escaped text, so searching 39 or amp corrupts apostrophes and ampersands | highlight before escaping, or split the raw text |
| src/components/search/HeaderSearchPanel.tsx:148 | ArrowUp from the unselected state lands on the second to last result | handle the -1 case |
| src/components/search/HeaderSearchPanel.tsx:176 | the input's focus ring is clipped on its top edge by `overflow-hidden` | padding or overflow visible |
| src/components/search/HeaderSearchPanel.tsx:221 | status live regions mounted with their text | keep the region mounted |
| src/components/search/HeaderSearchPanel.tsx:11 | re-declares the result type, the type labels, and the fetch contract the page owns | share them |
| src/components/search/HeaderSearchPanel.tsx:49 | a controller ref aborts a request the effect cleanup already aborts | delete the ref |
| src/components/search/HeaderSearchPanel.tsx:227 | the error line, empty line, and View all handoff have no test | add cases |
| src/components/search/__tests__/HeaderSearchPanel.test.tsx:124 | modifier click tests print jsdom's navigation error on every run | stub navigation |
| src/components/search/SearchInterface.tsx:433 | the active filter chip prints the internal type id | print the label |
| src/components/search/SearchInterface.tsx:103 | the GA4 event reports the previous search's result count when the response is slow | track on success |
| src/components/search/SearchInterface.tsx:71 | three refs and four effects where two effects and a render time reset do the same | simplify |
| src/components/search/SearchInterface.tsx:51 | re-reads `window.location.search` for values the props carry | use the props |
| src/app/search/page.tsx:54 | awaits search params and passes three props the client wrapper overwrites | drop them |
| src/app/search/page.tsx:10 | `og:updated_time` says 2025-02-05 though the page was rebuilt four times since | update the date |
| src/app/api/search/route.ts:189 | fourteen hand copied hidden answer constants and a 44 key alias record | one helper and a table |
| src/app/api/search/route.ts:391 | one includes and add loop repeated for four fields | one loop over a weights table |
| src/app/api/search/route.ts:395 | the exact title bonus compares the untrimmed query | trim first |
| src/app/api/search/route.ts:203 | the Konami answer says the code ends with an arcade link, which Mission Control does not do | reword |
| src/app/api/search/route.ts:178 | curated keywords keyed by URL die silently on a rename | a test that every key resolves |
| src/app/api/search/__tests__/route.test.ts:85 | the route test never asserts the `Netlify-Vary` header that fixed per query caching | assert it |
| src/components/catalog97/Catalog97Header.tsx:42 | the Cmd+K opener has no test | add one |
| docs/ai-context/API-ROUTES.md:67 | still calls /api/search a small hardcoded set | describe the corpus |

## The writing system

### P2. Validate the article slug before it reaches the filesystem

`resolveBlogPostPath` in [blog.ts](../src/lib/blog.ts#L118) joins the raw route parameter into `content/blog` with no character or membership check, and Next decodes `%2F` into a slash for dynamic segments, so a request for `/writing/..%2F..%2F<name>` makes the server stat and read `<name>.mdx` from the project root. The response is a 404 only because the frontmatter check throws on a file without the four required fields, which is an accidental guard, and the same path runs in the metadata and share image routes. Return null unless the slug matches the shape the sitemap already enforces for topics, or is in the known slug list.

### P2. Delete the schema generators nothing calls

`generateProjectSchema`, `generateProfessionalServiceSchema`, `generateNavigationSchema`, their interfaces, and the Person, ProfessionalService, Project, Navigation, and Custom branches of AIStructuredData are reached only from the ai-seo test, which casts strings through `unknown` to exercise branches the declared types make unreachable. The unreachable ProfessionalService defaults also advertise "Isaac Vazquez Product Management Consulting" from Austin, a description no page should carry. The dead code is in [ai-seo.ts](../src/lib/ai-seo.ts#L502). Keep Article, Breadcrumb, ProfilePage, FAQ, and ItemList with the fields the four callers pass.

### P2. Apply one validity rule to the sitemap and the reader

`getPublishedPosts` in [sitemap.js](../src/lib/sitemap.js#L539) keeps every post whose publish date is not in the future, but the reader requires title, excerpt, category, and publish date and returns null when one is missing, so the article page calls `notFound()` and static params omit it while the sitemap and the IndexNow list still advertise the URL with a last modified date. The comment in blog.ts that a missing field fails the build is wrong, since the throw is caught and logged. Either skip invalid posts in the sitemap or make the reader fail the build the way its comment claims.

### P2. Regenerate the representative article list in llms.txt

Four of the sixteen representative articles in [llms.txt](../public/llms.txt#L104) carry titles the posts no longer have after the October 26 retitles, and two of the stale titles still make the "daily deploys" and "5M to 60M+ users" claims the site removed on September 25 as figures no résumé supports. The generated llms-full.txt carries the current titles, so the two public files disagree. Generate the list from frontmatter using the slug array buildLlmsFull.mjs already holds.

### The smaller writing findings

| Where | What | Fix in a few words |
| --- | --- | --- |
| src/lib/seo.ts:195 | every article's share image alt describes the headshot | use the card's title |
| src/lib/seo.ts:100 | search titles clipped mid phrase on 132 posts, 24 ending on a function word | cut at a word boundary with a floor |
| src/lib/seo.ts:103 | 120 archive posts ship a description over 160 characters, 81 cut mid sentence | fix the descriptions |
| src/lib/seo.ts:308 | `generateAIOptimizedMetadata` is a one caller wrapper that drops five fields | call `constructMetadata` |
| src/lib/seo.ts:384 | `calculateReadingTime` has no importer | delete |
| src/lib/og.tsx:26 | `clip` returns the whole text when no space falls inside the limit | handle -1 |
| src/lib/og.tsx:24 | `clip` re-implements `truncateMetadataText` | import it |
| src/lib/blog.ts:371 | the home page pins a write up even when it is future dated | apply the published check |
| src/lib/blog.ts:223 | `featured` and `author` built for every post and never read | delete the fields |
| src/lib/blog.ts:118 | `.md` fallbacks in five readers for an extension no post uses | mdx only |
| src/lib/blog.ts:88 | the readers create `content/blog` on the way in | delete |
| src/lib/blog.ts:15 | three interfaces restate one post record | derive them |
| src/lib/ai-seo.ts:625 | two breadcrumb builders and a four line cast at 56 call sites | one builder, typed props |
| src/lib/sitemap.js:219 | twenty `readXLastmod` functions are one table lookup | a table |
| src/lib/sitemap.js:75 | priority and changefreq tiers Google documents it ignores | delete |
| src/lib/sitemap.js:54 | rows for a noindex route the walk drops, an empty unlisted list | delete |
| src/app/api/rss/route.ts:10 | the feed renders every post to HTML and emits none of it | read previews |
| src/app/writing/[slug]/opengraph-image.tsx:26 | a 200 card for any slug, so unknown slugs are unbounded renders | `notFound()` |
| src/app/writing/[slug]/page.tsx:52 | the description is fitted twice and the keywords ternary has dead branches | simplify |
| src/app/writing/page.tsx:22 | hard coded `dateModified` while the sitemap date moves with the newest post | derive it |
| src/app/writing/page.tsx:74 | hardcodes the origin three times where SEO.md forbids it | use the helper |
| src/app/writing/page.tsx:25 | reading minutes re-parsed from the "N min read" string in two components | keep the number |
| src/app/writing/topics/[topic]/page.tsx:87 | topic pages date themselves by publish date while the sitemap counts updates | agree on updatedAt |
| src/components/catalog97/Catalog97Writing.tsx:497 | the status line says every match is shown while only 30 rows render | count the rows |
| src/components/catalog97/Catalog97Writing.tsx:483 | filter buttons lose the accent underline after a click (shorthand beside longhands) | longhands only |
| src/components/catalog97/Catalog97Writing.tsx:14 | `SectionSummary.description` passed and never read | delete |
| src/app/writing/__tests__/page.test.tsx:222 | a `next/dynamic` import resolves outside `act()` | await it |
| src/lib/__tests__/blog.test.ts:268 | two tests re-implement the scoring and sorting they claim to test | call the code |
| src/lib/__tests__/blog-seo-content.test.ts:166 | the limit test asserts the fitter's own post condition | assert the raw lengths |
| src/lib/__tests__/blog-seo-content.test.ts:195 | the date shape test accepts impossible dates V8 rolls forward | round trip the date |
| scripts/buildLlmsFull.mjs:113 | calls SpaceX Mission Control real time when it reads a twice daily snapshot | reword |
| scripts/buildLlmsFull.mjs:64 | the corpus header uses an em dash and the word comprehensive | reword |
| scripts/buildArticleCoverImages.ts:503 | hand rolled flag parsers where `util.parseArgs` ships | use it |
| scripts/buildArticleCoverImages.ts:99 | an error status nothing reads and a one line path wrapper | delete |
| scripts/generatePublicSitemap.mjs:25 | preserves the committed file's historical row order | sort |
| scripts/data/scorePoolsConfig.ts:22 | two identity team aliases | delete |
| public/llms.txt:60 | still describes the job search tracker as an MBA internship notifier | update |
| SEO.md:194 | documents helpers, values, and dates the code no longer has | update |
| SEO.md:284 | postbuild, article section, and cover behaviour described from an older state | update |

## The designed pages and the frame

### P2. Give the back room pages their gutter

The five `/back-room/[discovery]` pages wrap their content in a section that carries only the discoveries module's padding and a bare `.c97-shell`, with no `c97-band` and no `.c97-frame`, so below the 1080px shell cap the heading, the back link, and the receipt start at the viewport edge while the header row starts at the gutter. The page is [page.tsx](../src/app/back-room/[discovery]/page.tsx#L37). Give the section the band it is missing and add the five routes to the layout sweep's extra routes so a noindex page is checked too.

### P2. Fix the privacy page's dates and its search disclosure

The visible kicker in [privacy/page.tsx](../src/app/privacy/page.tsx#L73) reads "Updated October 2, 2026" while the UPDATED constant on line 15, which drives the structured data and matches the sitemap, says October 21, and the body gained the résumé, contact, and tool events, the visit receipt paragraph, and the guestbook entry on October 20 and 21. Render the kicker from the constant. The same page's analytics paragraph needs the search event described under site search above. Its metadata still says two forms send an email address where the body says one, its storage list leaves out four tools that save entries (Decision Lab, the Enablement Assistant, Before You Buy, and the score pools tracker), and it still calls the job search tracker the MBA internship tracker.

### P2. Read the stacking and easing tokens in the easter egg module

[Catalog97EasterEggs.module.css](../src/components/catalog97/Catalog97EasterEggs.module.css#L117) fixes the toast region at `z-index: 60`, the proof marks at 70, and the safelight at 55 as literals, while STYLING.md's stacking table and DESIGN_CHECKLIST.md say every overlay reads its `--c97-z-*` token, and the toast is in fact parked at the drawer level, 60, where the toast level is 55. The same module's drift transitions and one shot animations use `ease-in-out` and `ease-out`, and the stamp press passes `ease-out` to the Web Animations call, where the checklist's motion rule names `var(--c97-ease)` with looping keyframes and the arcade as the only exceptions. A grep found these keywords nowhere else in the frame's stylesheets.

### The smaller page findings

| Where | What | Fix in a few words |
| --- | --- | --- |
| src/app/metadata.ts:10 | the home page's `dateModified` stayed at October 1 through the October rework | bump it |
| src/app/dashboards/page.tsx:17 | `dateModified` predates the October 26 copy changes | bump it |
| src/app/accessibility/page.tsx:13 | the statement's `dateModified` predates its October 26 edits | bump it |
| src/app/privacy/page.tsx:18 | metadata says two forms send an email address | one |
| src/app/privacy/page.tsx:27 | the storage list omits four tools that save entries | add them |
| src/app/privacy/page.tsx:33 | still names the MBA internship tracker | job search tracker |
| src/app/catalog97.css:2394 | the footer's Now and Work links and the Juno heading link fall under 44px wide (known open) | minimum width |
| DESIGN_CHECKLIST.md:222 | the checklist and STYLING.md still say every designed h1 takes `.c97-poster` | note the two `.c97-poster-sm` index pages |
| docs/EASTER_EGGS.md:50 | points at the wrong file for PAINTERS | siteDiscoveries.ts |
| src/components/catalog97/__tests__/Catalog97EasterEggs.test.tsx:91 | the console note test passes only when it renders first in the file | reset modules |
| src/components/catalog97/__tests__/Catalog97EasterEggs.test.tsx:33 | the stamp, knock, and worn in tests run against a hand built footer | render the shell |
| src/lib/__tests__/changelog.test.ts:138 | the `.mdx` over `.md` test passes whether or not slugs are deduplicated | assert the count |

## The shared library

### P2. Key the rate limiters on the real client when Cloudflare is in front

`getClientIp` in [rateLimit.ts](../src/lib/rateLimit.ts#L78) returns `x-nf-client-connection-ip`, which Netlify sets from the TCP peer, and never reads `cf-connecting-ip`. The custom domain is proxied through Cloudflare, which the privacy page itself states and a verifier confirmed from the response headers on November 3, so the peer Netlify sees is a Cloudflare egress address shared by many visitors, and the newsletter, quotes, job board, and fantasy data limiters bucket unrelated visitors together. Trust `cf-connecting-ip` only when the connection address is inside Cloudflare's published ranges, so a client hitting the netlify.app origin cannot forge it, and add a test with Cloudflare shaped headers.

## The documentation

The two documentation areas produced the longest lists, and most of it is drift, with only a little style. The items that would mislead an agent reading CLAUDE.md or AGENTS.md at the start of a session come first.

| Where | What | Fix in a few words |
| --- | --- | --- |
| CLAUDE.md:251 | names the draft telemetry key prefix as v1; the code has used v2 since August 31 | v2 |
| CLAUDE.md:55 | postbuild described as two steps in six places; it also runs `build:llms` and rewrites llms-full.txt | three steps |
| AGENTS.md:432 | AGENTS.md and TESTING.md omit the CI gate that fails a pull request on an article body change without a date bump | document it |
| AGENTS.md:360 | the command list omits five scripts and the reusable refresh workflow | add them |
| ARCHITECTURE.md:61 | calls the fantasy refresh weekly and PAGES.md calls golf daily; the crons are daily in season | correct both |
| ARCHITECTURE.md:101 | ARCHITECTURE.md and COMPONENTS.md name a hook `useMBACandidates` that does not exist | `useMBAJobCandidates` |
| COMPONENTS.md:132 | lists StockResearch and ResearchSidebar, deleted in August | remove |
| COMPONENTS.md:51 | Catalog97Home props documented as heroIndex, liveToolGroups, liveFeed; it takes readouts | update |
| COMPONENTS.md:190 | ModernButton said to serve the admin page, removed October 2 | update |
| COMPONENTS.md:28 | omits the GA4 analytics layer Providers mounts and the editorial end mark | add |
| PAGES.md:38 | route inventories in four docs omit /investments/before-you-buy and the back room pages | add |
| PAGES.md:86 | still calls the trade calculator a preseason estimate; it has read the in season board since October 16 | update |
| PRODUCT.md:35 | says Formula 1 reads the shared tokens again; it declares its own palette | update |
| CHANGELOG.md:110 | a branch name entry the append script passes through ("Feat/transit street map") | strip `type/` prefixes |
| docs/README.md:120 | describes 104 tracked skill docs, a historical content tree, and a Working Instrument design doc that are gone | rewrite the counts |
| docs/README.md:44 | index omits docs/BEFORE_YOU_BUY.md and docs/PROJECT_PLATES.md | add |
| docs/ai-context/PAGES.md:15 | gives /portfolio the search and filters that moved to /dashboards on October 19 | update |
| docs/ai-context/CONFIG.md:128 | says the proxy redirects /blog; it stopped on September 24 | update |
| docs/ai-context/CONFIG.md:79 | says tsconfig excludes `src/data/backup`; the exclude is node_modules only | update |
| docs/ai-context/HOOKS-AND-STATE.md:11 | the hook inventory omits seven shared hooks | add |
| docs/ai-context/HOOKS-AND-STATE.md:147 | `useTablistKeyboard` attributed to the portfolio and writing archive; its callers are dashboards | update |
| docs/ai-context/REDIRECTS-AND-NAVIGATION.md:31 | says the header marks a link active only on an exact match; it also marks the section | update |
| docs/ai-context/STYLING.md:24 | names an ESLint rule `c97/no-working-instrument-tokens` that does not exist | the closeout test only |
| docs/ai-context/SEO-AND-METADATA.md:25 | describes the homepage metadata and the writing index schema from an older state | update |
| docs/PROJECT_AUDIT_2026-10-12.md:127 | the status still lists two issues as open that were fixed on October 22 | update the status |
| docs/superpowers/specs/2026-09-16-catalog97-unification-design.md:7 | the last status line lists work as open that has closed | add a status line |
| DESIGN.md:204 | calls the spacing ladder seven steps while the CSS and its own table say eight | eight |
| DESIGN.md:172 | says status tokens fall back to ink on stone; stone keeps coloured status | correct |
| DESIGN.md:216 | says only two users read the touch constants; the About module reads them too | correct |
| STYLING.md:106 | describes a polling rating ramp and two helpers that no longer exist | remove |
| STYLING.md:205 | keeps a print rule for project hero readouts deleted on October 12 | remove |
| STYLING.md:163 | "the one token read of that kind" is no longer true after the back room eggs | update |
| WRITING_VOICE.md:7 | points at a "Writing Voice" section in CLAUDE.md that the repository's CLAUDE.md does not have | fix the pointer |
| README.md:14 | opens with six bold label em dash bullets and title cases its H2s | rewrite the overview |
| TESTING.md:102 | em dash separators and a paired em dash | rewrite |
| docs/PROJECTS.md:42 | an emoji in a heading, items marked not started that other docs record as done | update or retire |
| docs/README.md:48 | two list separators in one list, title case H2s | one separator |
| docs/ai-context/API-ROUTES.md:67 | "currently returns" without a date | date it |
| docs/ai-context/COMPONENTS.md:130 | 28 list entries joined with em dashes | rewrite |
| docs/ai-context/CONFIG.md:119 | em dashes and a "Key facts" lead in | rewrite |

Several more prose rule findings were contested and are described in the contested section below. The verifiers agreed the em dashes and title case headings are there, and disagreed on whether a reference document written before the rule existed, or one kept as a dated historical record, is a finding at all. I lean towards leaving the historical records alone and fixing only the documents that agents load every session.

## The published writing

The structural pass over the 249 posts was done with scripts over every post, and it found the writing in good shape after the October 26 voice pass. Every hard rule is clean in every body. Six word level items from the vocabulary table survive across the archive after discarding literal uses, in posts such as supply-chain-risk-agent-era, and they are a short fix. The metadata is where the problems are, and the script counted them. 132 archive posts ship a search title that `fitSearchTitle` truncates with an ellipsis, and the test that claims to catch this asserts the fitter's own output, so it never sees the raw length. 120 posts ship a meta description over the 160 character budget, 81 of them cut mid sentence. And the `featured` frontmatter field is read into every preview and consumed by nothing, so the 14 posts that set it get nothing for it.

## The product areas

The second half covered the 27 product areas plus the site frame, the shared library, the designed pages' remaining lenses, and the writing system's design lens, 30 readers in all, each applying every lens its area still lacked in a single read. They returned 530 findings, 529 after merging, and the same skeptic, reproducer, and judge verification ran behind them. The tallies for this half are in the section that closes the document, and the findings below are the ones that survived.

### Fantasy football

The eight fantasy routes, the kit, the engines, the pipeline, the companion extension, and the Formula 1 optimizer made up a third of the second half, and they produced one P1 and fifteen P2s.

#### P1. Count the waiver list before it is capped

`getFantasyWeeklyWaiverCandidates` defaults its limit to 20 and slices the sorted list, but the waivers view in [weekly-client.tsx](../src/app/fantasy-football/weekly/weekly-client.tsx#L667) prints the sliced length as "N players clear the gap" and the footnote promises that any candidate inside the thresholds is "listed at all". Neither sentence, the heading, nor docs/FANTASY_DRAFT_MODEL.md mentions the cap, so the printed count is the cap and the promise is false for everyone past it. A verifier ran the real function over the committed board and confirmed the count. Count the uncapped list for the sentence and say what is shown, or drop the default cap behind the same Load more the rankings view has.

#### The best ball board in season

Three P2s sit on the best ball board. The in-season lane rewrites the board the page calls frozen on every daily run while FantasyPros still serves the page, adopting whatever player list it now carries, so the board has lost players since its September 9 consensus while every date on the page keeps moving ([buildBestBallSnapshot.ts](../scripts/buildBestBallSnapshot.ts#L279)). The ADP source date is stamped from the newest provider row touch, which advanced every day from September 26 to October 26 while 337 of 338 shared ADP values stayed identical, so the page calls a frozen ADP current and dates it to yesterday. And `?contest=constructor` resolves through a plain object alias table to `Object.prototype.constructor`, a function, and both best ball routes throw `value.trim is not a function`, which a verifier reproduced through the real normalizer ([contests.ts](../src/lib/bestBall/contests.ts#L338)). Freeze the board and the ADP stamp once the regular season starts, and guard the alias lookup with `Object.hasOwn`.

#### The weekly board between seasons

The builder leaves the committed weekly file alone before Week 1 and after the final week, the hook maps only a 404 to "not published", and the normalizer never checks the season against the date, so from the 2027 draft season until Week 1 of 2027 the weekly and waivers pages will print the 2026 Week 18 board as this week's list, the "opens with Week 1" note becomes unreachable, and My team saves a 2027 roster under the 2026 key ([weekly-client.tsx](../src/app/fantasy-football/weekly/weekly-client.tsx#L289)). Treat a snapshot whose season is below the current draft season as not published and key My team by the draft season. A second P2 sits in the same hook, where Try again after a newer-seed error re-reads the stale file for up to an hour, because `retry()` clears the module cache before the request version bumps and the no-cache flag keys on that cache alone ([useFantasyWeeklySnapshot.ts](../src/hooks/useFantasyWeeklySnapshot.ts#L55)).

#### The companion extension

Two P2s. The away controller decides the user's turn from "on the clock" patterns matched against the whole page text, and resets its acted flag only when that text disappears, so a chat line saying "you are on the clock" makes it act once, fail against a disabled button, and never act again, including on the real turn, and "draft complete" in chat disarms it ([autodraft-controller.ts](../extension/src/autodraft-controller.ts#L496)). And pick sync returns a lone name and position match before the team is ever compared, so a single name match with a different team is recorded as a verified pick, which a verifier reproduced with "J. Williams" RB matching the wrong Williams ([draftSync.ts](../src/lib/fantasyCompanion/draftSync.ts#L114)). Scope the turn check to the provider's banner and require the team when the pick carries one.

#### The draft room and its engines

The mock draft engine is stuck in forced-starter mode for every room size the page offers, because the default lineup needs seven to nine starters while the page only offers three to six rounds, so `mustFill` holds from pick 1, a simulated team can never take a third running back or receiver, and it skips the best player on the board to fill a quarterback or tight end ([mockDraft.ts](../src/lib/mockDraft.ts#L148)). A verifier simulated twenty rooms per size and drafted zero third running backs. The recap's predicted and realized wait cost averages run over different turn sets despite the comment saying they share a denominator ([draftTelemetry.ts](../src/lib/draftTelemetry.ts#L353)). The stale ADP client test depends on the wall clock and fails from January to June, which a verifier reproduced by pinning the date to March 2027 ([draft-tracker-client.test.tsx](../src/app/fantasy-football/draft-tracker/__tests__/draft-tracker-client.test.tsx#L318)). And the trade calculator's header prints a red "stale sources" status before any source has loaded, which is also the HTML the CDN caches for six hours ([trade-calculator-client.tsx](../src/app/fantasy-football/trade-calculator/trade-calculator-client.tsx#L344)).

#### The pipeline, the kit, and the Formula 1 optimizer

The ADP, VORP, and game log fetchers call fetch with no timeout and the retry wrapper adds none, so a stalled upstream runs to undici's five minute defaults per attempt, nine boards in sequence, inside a step capped at 15 minutes, the exact failure the public source fetcher already fixed with `AbortSignal.timeout` ([fantasyProsVorpSource.ts](../src/lib/fantasyProsVorpSource.ts#L291)). The route header switches its short and long freshness labels with Tailwind's `md` variants, which the site defines as screen only, so the short label prints at every paper width against the kit's own rule ([FantasyRouteHeader.tsx](../src/components/fantasy/FantasyRouteHeader.tsx#L115)). On the Formula 1 optimizer the risk rating and its printed reason come from different thresholds, so four committed rows print "medium" beside "Stable recent production" ([fantasyFormula1.ts](../src/lib/fantasyFormula1.ts#L94)), and empty garage slots are keyed `driver-N` while assets are keyed by car number, so adding a driver whose number is under five collides with the empty slot, which a verifier reproduced in jsdom and on the live page ([GarageSignature.tsx](../src/app/fantasy-formula-1/GarageSignature.tsx#L139)).

#### The smaller fantasy findings

| Where | What | Fix in a few words |
| --- | --- | --- |
| scripts/buildBestBallSnapshot.ts:91 | the builder's fallback branches have no test | add the two cited days |
| src/app/fantasy-football/best-ball/draft-tracker/__tests__/draft-tracker-client.test.tsx:187 | a regression test reads its fixture from git history and skips without it | commit the fixture |
| src/app/fantasy-football/best-ball/draft-tracker/best-ball-build-panel.tsx:68 | the build sheet dialog is named by a count, and "My build" is not a heading | swap them |
| src/app/fantasy-football/best-ball/draft-tracker/draft-tracker-client.tsx:190 | the tracker keeps its first contest when the URL changes contest | read the prop |
| src/app/fantasy-football/best-ball/page.tsx:56 | the SoftwareApplication structured data carries a relative url | absolute |
| src/lib/bestBall/contests.ts:327 | three hand added alias keys already come out of the catalog | delete |
| src/lib/bestBall/recommendations.ts:192 | the spike week component reads projections no builder writes (known) | delete |
| src/lib/bestBallSource.ts:41 | `getExpectedBestBallSeason` re-implements `getCurrentDraftSeason` | import it |
| src/app/api/fantasy-data/route.ts:84 | the snapshot metadata object is assembled three times | one builder |
| src/app/fantasy-football/fantasy-football-client.tsx:513 | player sentences say "him", one attached to every team defence | rewrite |
| src/app/fantasy-football/fantasy-football-client.tsx:772 | the in-season note says "Week 18" and "Frozen since" for seven weeks after the season | return to 0 |
| src/app/fantasy-football/fantasy-football-client.tsx:772 | week and staleness labels read the clock during the server render | `useClientNow` |
| src/app/fantasy-football/weekly/weekly-client.tsx:162 | the weekly board normalizer lives in the client and inline in the page | one function |
| src/app/fantasy-football/weekly/weekly-client.tsx:76 | scoring short labels declared in three clients | one map |
| src/components/fantasy/FantasyRouteHeader.tsx:71 | `TitleAccent` is a fragment that returns its children | delete |
| extension/public/manifest.json:12 | the Sleeper host permission and `activeTab` are unused | delete |
| extension/src/App.tsx:576 | auto sync binds to the active tab once and never rebinds | rebind on tab change |
| extension/src/App.tsx:709 | the Underdog away queue is sized by a stale 12 by 18 setup | use the contest |
| extension/src/App.tsx:1964 | two side panels overwrite each other's draft state with no revision check | revision check |
| extension/src/App.tsx:1018 | the rankings status prints `generatedAt` as the rank date when the source is missing | say unknown |
| extension/src/App.tsx:1934 | the v1 setup key migration has done its one job | delete |
| extension/src/App.tsx:571 | the 2,034 line panel has no tests | test the four pure parts |
| extension/src/__tests__/snapshot-client.test.ts:48 | tests hardcode season 2026 and row floors against the live snapshot | derive the season |
| extension/src/autodraft-controller.ts:328 | a loop over a list already proven to have one entry | one lookup |
| extension/src/draft-pick-sync.ts:331 | ESPN sync refetches the whole player list every 2.5 seconds once any id is missing | remember misses |
| extension/src/draft-pick-sync.ts:83 | an unvalidated leagueId from the URL goes into the API path | validate digits |
| extension/src/snapshot-client.ts:115 | kind is validated twice and then ignored | once |
| extension/vite.config.ts:54 | an unreachable `entryFileNames` branch | delete |
| package.json:15 | the extension build and lint run outside CI | add a job |
| src/lib/fantasyCompanion/types.ts:44 | `draftType` is a compatibility alias with no caller | delete |
| src/lib/fantasy.ts:733 | `buildLegacyFlexPlayers` equals the builder's `buildFlexSlice` | one function |
| src/lib/fantasy.ts:655 | `getFantasySliceSupport` ignores its scoring argument and always returns supported | delete |
| src/lib/fantasy.ts:468 | the same finite number copy repeated seventeen times | a loop |
| src/lib/fantasy.ts:857 | slice metadata as two eight entry literals with dead branches | one loop |
| src/lib/fantasyMyTeam.ts:125 | `compareMyTeamWaiver` returns three fields its caller never reads | trim |
| src/lib/fantasyPositionData.ts:55 | a legacy shape branch the generated module cannot produce | delete |
| src/lib/fantasyRankHistory.ts:151 | 7 and 14 day moves accept a reading up to three days older than the window | label the span |
| src/lib/fantasyUtils.ts:131 | `isDailyRefreshWindow` misses the January 1 to 12 daily lane | match the cron |
| src/lib/fantasyUtils.ts:23 | `formatUpdatedAt` exists twice with different invalid date paths | one |
| src/lib/fantasyUtils.ts:276 | the 150 rank cap is declared in two files | one constant |
| src/lib/fantasyUtils.ts:777 | `assignLineupSlots` has no test | add one |
| src/lib/fantasyUtils.ts:111 | the March rollover that keys every saved room has no test | add one |
| src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx:784 | Start from setup drops the chosen settings after another tab saved | save then start |
| src/app/fantasy-football/draft-tracker/__tests__/draft-room-renders.test.tsx:139 | the drawer preload runs past each fake timer test and logs act warnings | mock the drawer |
| src/app/fantasy-football/draft-tracker/__tests__/draft-tracker-client.test.tsx:101 | pick fixtures do not match the hook's shape | real fixtures |
| src/app/fantasy-football/draft-tracker/components/DraftBoard.tsx:362 | visitor sentences say "him" and "his" about a player | rewrite |
| src/app/fantasy-football/draft-tracker/components/DraftSetup.tsx:319 | team, round, and clock lists written in four places | one source |
| src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx:1059 | a parked room on an unavailable format is a dead end | offer the switch |
| src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx:112 | the wait cell prints "−0.0 pts" and "−0 spots" | round first |
| src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx:889 | the U shortcut undoes a pick per auto repeat event | check `event.repeat` |
| src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx:802 | the export toast timer is never cleared | keep the id |
| src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx:416 | snake order math implemented in the hook, the model, and the client | one function |
| src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx:1344 | the no recap explainer blames a stale ADP that never hides the strip | reword |
| src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx:698 | the freshness line and the seasonal note print two different weeks | one week |
| src/app/fantasy-football/draft-tracker/hooks/useDraftState.ts:673 | `undoLastPick` is a hand kept copy of `undoToPick` | call it |
| src/app/fantasy-football/draft-tracker/hooks/useDraftState.ts:960 | fields the room writes and nobody reads | delete |
| src/app/fantasy-football/draft-tracker/hooks/useDraftState.ts:234 | `decodePlayer` restores fourteen fields no reader uses | trim |
| src/app/fantasy-football/draft-tracker/hooks/useDraftTelemetry.ts:49 | the sweep of other rooms' records has no test | add one |
| src/app/fantasy-football/draft-tracker/page.tsx:8 | the route calls itself three names and promises tier columns | one name |
| src/components/fantasy/DraftRoomParts.tsx:55 | two props with no caller outside tests | delete |
| CLAUDE.md:251 | telemetry key documented as v1, written as v2 | v2 |
| src/components/fantasy/DraftValuePanel.tsx:116 | an uncontrolled mode only tests use | delete |
| src/lib/__tests__/mockDraft.test.ts:66 | the engine is tested only in 15 round rooms the page never offers | test 3 to 6 |
| src/lib/draftAnalytics.ts:44 | a runtime object kept only to derive a type | a type alias |
| src/lib/draftAnalytics.ts:412 | the reaches sort recomputes a baseline it already holds | use `delta` |
| src/lib/draftPresets.ts:24 | room option arrays in three places that already disagree | one source |
| src/lib/draftTelemetry.ts:281 | a legacy telemetry branch unreachable from stored data | delete |
| src/lib/mockDraft.ts:31 | optional lineup fallbacks with no production caller | delete |
| src/lib/redraftDraftDecision.ts:162 | next pick search implemented four times | one |
| docs/ai-context/PAGES.md:142 | still describes the retired builder, assets, and rules views | update |
| src/app/fantasy-formula-1/fantasy-formula-1.css:69 | a focus rule the shell's outranks | delete |
| src/app/fantasy-formula-1/garage.ts:59 | rounds by hand beside `roundTo` | import it |
| src/app/fantasy-formula-1/page.tsx:66 | ships the 23 meeting array the client never reads | trim the prop |
| src/lib/__tests__/fantasyFormula1.test.ts:262 | sprint multiplier, sanitize, and risk branches untested | add cases |
| src/types/fantasyFormula1.ts:13 | unread asset fields and guards for a shape never emitted | delete |
| src/components/fantasy/CompareTray.tsx:110 | the prune path has no caller that turns it on | delete |
| src/components/fantasy/PlayerDetailDrawer.tsx:378 | the Movement tooltip says "he moved up" for a defence | rewrite |
| src/components/fantasy/__tests__/CompareTray.test.tsx:76 | the mixed pin wording is untested | add a case |
| src/components/fantasy/compareMetrics.ts:15 | the consensus rank fallback written three times | one |
| src/components/fantasy/fantasy.css:1346 | `.ffb-table-sticky` is styled and used by no markup | delete |
| src/components/fantasy/fantasy.css:385 | the visually hidden block repeated four times | one class |
| src/components/fantasy/fantasy.css:892 | two colour literals outside the token block, one a light chevron in dark mode | tokens |
| src/components/fantasy/fantasy.css:17 | the header points at a KIT.md that does not exist | fix the pointer |
| src/components/fantasy/fantasy.css:2597 | the kit restyles `.c97-footer` although its doc says it restyles no Catalog 97 class | note or move |
| .github/workflows/update-fantasy.yml:509 | the redraft commit does not require the build step to have succeeded | gate on build |
| .github/workflows/update-fantasy.yml:130 | 325 lines of JavaScript inlined in YAML covered only by substring tests | move to scripts |
| docs/FANTASY_PLATFORM_SETUP.md:97 | describes a schedule, an API path, and a game log season the code no longer has | update |
| scripts/buildFantasyGameLogData.ts:56 | no test for the season fallback that picks the points per game year | add one |
| scripts/buildFantasyPositionData.ts:35 | source label plumbing for a second source that no longer exists | delete |
| scripts/buildFantasyPositionData.ts:142 | two builders run on import behind NODE_ENV while three use a main check | one pattern |
| scripts/buildFantasyWeeklySnapshot.ts:291 | the same week regression check reads only the PPR flex board | all boards |
| scripts/buildFantasyWeeklySnapshot.ts:276 | absolute floors that the fetcher already enforces | delete |
| src/lib/__tests__/fantasySnapshotBuilder.test.ts:164 | a test pins Josh Allen as QB1 from the committed snapshot | fixture |
| src/lib/fantasyProsPublicSource.ts:407 | optional handling of fields validation already requires | simplify |
| src/lib/fantasySnapshotBuilder.ts:60 | `getSnapshotSeason` duplicates `getCurrentDraftSeason` | import it |
| src/lib/fantasySnapshotBuilder.ts:202 | two slice builders only delegate | inline |
| src/lib/fetchRetry.ts:41 | a deterministic parse failure is retried four times | classify errors |
| PAGES.md:86 | still calls the calculator preseason only | update |
| docs/FANTASY_DRAFT_MODEL.md:3 | the opening dates the doc to August and calls the calculator preseason | update |
| src/app/fantasy-football/trade-calculator/trade-balance-scale.tsx:75 | an sr-only caption under a `role=img` figure is never exposed | delete |
| src/app/fantasy-football/trade-calculator/trade-balance-scale.tsx:19 | the scale has no test | add one |
| src/app/fantasy-football/trade-calculator/trade-calculator-client.tsx:215 | a failed rest of season fetch silently demotes the page with no notice | read `weekly.error` |
| src/app/fantasy-football/trade-calculator/trade-calculator-client.tsx:352 | re-implements `pickWorseFantasySnapshotStaleness` | import it |
| src/app/fantasy-football/trade-calculator/trade-package-fieldset.tsx:108 | a stored player missing from the pool prints its raw id as a name | say unavailable |
| src/app/fantasy-football/trade-calculator/trade-package-fieldset.tsx:24 | `formatTradeValue` and `formatIndex` are the same function | one |
| src/app/fantasy-football/trade-calculator/trade-player-combobox.tsx:192 | "Six-player limit" hardcoded beside the constant | use the constant |
| src/app/fantasy-football/trade-calculator/trade-roster-impact.tsx:64 | guards on array lengths that are always integers | delete |
| src/hooks/useFantasyTradeCalculator.ts:35 | a persisted `modelVersion` never read and always the preseason constant | delete |
| src/lib/__tests__/fantasyTrade.test.ts:309 | the overlap gate's lean branch is never asserted | add a case |
| src/lib/__tests__/fantasyTrade.test.ts:571 | `PRODUCTION_MAX_WEEKS_BEHIND` has no test | add one |
| src/lib/fantasyTrade.ts:817 | a scoring log that stopped updating reads as "No 2026 scoring yet" | say stale |
| src/lib/fantasyTrade.ts:378 | every K and DST is told it lacks a four game log, and a defence is "him" | skip the warning |
| src/lib/fantasyTrade.ts:61 | team counts and roster sizes declared three times | one |
| src/lib/fantasyTrade.ts:617 | `marketRank` falls back to raw ADP where its doc says null | match the doc |
| src/lib/fantasyTrade.ts:577 | four fallbacks in the range maths that cannot fire | delete |
| src/lib/fantasyTradePersistence.ts:13 | re-lists the scoring formats fantasy.ts owns | import |

### Investments

#### P2. Keep Before You Buy on its feet when the alternative has no history

The worst days table maps the first result's five worst days and reads `result.worstDays[i].after` for every result, but `compareBuys` returns an empty list for a purchase whose symbol has no loaded history, and the client still includes the alternative when its snapshot fetch failed, so the render throws and the whole route falls to its error boundary. A verifier reproduced it in Jest with the alternative's fetch rejected ([purchase-comparison.tsx](../src/app/investments/before-you-buy/purchase-comparison.tsx#L121)). Read the day optionally and print Unavailable the way the current column already does.

#### P2. Stop calling sixteen month old news the latest

The research overview heads its feed "Latest news" and sorts newest first, but across the committed dataset the newest item for 150 of 151 symbols dates from March to June 2025 while the snapshots were built on October 22, 2026 ([ResearchOverview.tsx](../src/components/investments/ResearchOverview.tsx#L270)). Date the heading from the newest item or fall to the snapshot mode panel past a threshold, and if news is meant to refresh, the builder or the provider is where the fault is.

#### The other investments P2s

The research tab fallback redirects with `router.push`, so Back lands on the unavailable section again and the effect pushes once more, a history trap a verifier reproduced through the real client ([ResearchWorkspace.tsx](../src/components/investments/ResearchWorkspace.tsx#L103)). The lever "to reach 85%" targets are solved at 250 simulations while the gauge reports 1,000, and the same seed at a different path count gives a different rate, so the printed dial position misses the threshold when the visitor applies it, which a verifier showed as 0.852 against 0.839 on the audited plan ([levers.ts](../src/lib/retirement/levers.ts#L147)). The metric and stat hints are hover only title attributes on non focusable spans, which docs/DESIGN_REVIEW_2026-07.md already lists, and the news headline and website links sit under the 44px floor. The investments fetch segfaults are the same finding the refresh platform section reports, seen from the data side, with three crashes in the last 22 scheduled runs.

#### The smaller investments findings

| Where | What | Fix in a few words |
| --- | --- | --- |
| .github/workflows/__tests__/update-investments.test.ts:31 | the 170 line verify gate lives inline in YAML, tested by substring | move to a script |
| .github/workflows/update-investments.yml:89 | defeatbeta cache steps never help, the library clears the cache every run | drop the steps |
| .github/workflows/update-investments.yml:224 | the fundamentals outage gate counts stale carryovers | count fresh writes |
| .github/workflows/update-investments.yml:7 | scheduled runs start four to seven hours after the cron, and two docs quote the cron as the time | document the delay |
| docs/INVESTMENTS_DATA_SOURCES.md:16 | names a validator and a regex the code does not have | `isValidSymbol` |
| docs/INVESTMENTS_DATA_SOURCES.md:32 | the quality baseline describes July while the index is 151 of 151 recent | update |
| scripts/buildInvestmentsSnapshots.ts:137 | no executable test for the bulk price path that prices 87 of 151 symbols | add one |
| scripts/buildInvestmentsSnapshots.ts:21 | redeclares the section list and type src/types already holds | import |
| scripts/fetch_investments_data.py:452 | one loop written four times | one function |
| src/app/api/investments/quotes/route.ts:83 | the zeroed quote literal written three times | one |
| src/lib/finnhub.ts:180 | a missing API key reads as a transient outage with no log line | log it |
| src/lib/investmentsAssetOrigin.ts:23 | an HTTP fallback for a runtime the site no longer has | delete |
| AGENTS.md:138 | names a symbol validator and regex that do not exist | fix |
| STYLING.md:163 | says `var()` never resolves in SVG presentation attributes; all three engines resolve it | correct the rule |
| src/app/investments/__tests__/investments-client.test.tsx:25 | the URL tests stub the dashboard, so the section redirect is never exercised | render it |
| src/app/investments/before-you-buy/__tests__/before-you-buy-client.test.tsx:207 | never loses only the alternative's history | add the case |
| src/app/investments/before-you-buy/before-you-buy-client.tsx:101 | saved holdings print floating point tails in a number input | round |
| src/app/investments/before-you-buy/before-you-buy-client.tsx:185 | "View and edit 1 holdings" | pluralise |
| src/app/investments/before-you-buy/error.tsx:12 | repeats the root boundary with only a surface name | delete |
| src/app/investments/investments-state.ts:27 | the symbol regex declared three more times beside the validator | import |
| src/app/investments/investments.module.css:596 | dead selectors | delete |
| src/components/investments/AllocationChart.tsx:76 | a generic `ease` transition that never runs | delete |
| src/components/investments/AllocationChart.tsx:140 | "based on current market value" includes holdings weighted at cost | say so |
| src/components/investments/ComparisonRadarChart.tsx:150 | "verified metrics" claims a verification nothing performs | reword |
| src/components/investments/HoldingsTable.tsx:67 | each row downloads a 226 KB snapshot for a sparkline hidden under 1500px | fetch when shown |
| src/components/investments/InvestmentsDashboard.tsx:73 | one build instant dated in UTC on the title bar and Los Angeles elsewhere | one zone |
| src/components/investments/InvestmentsDashboard.tsx:427 | "Updated 2d ago" describes the market timestamp, not the refresh | relabel |
| src/components/investments/InvestmentsDashboard.tsx:330 | the filter advertises ⌘K on every platform | detect |
| src/components/investments/MetricTooltip.tsx:8 | fourteen unused definitions and a deprecated prop | delete |
| src/components/investments/PortfolioHeroCard.tsx:123 | "a point is saved each day you visit" overstates when a point is written | reword |
| src/components/investments/ResearchAssetHeader.tsx:388 | `role=list` with no list items | add roles |
| src/components/investments/ResearchOverview.tsx:136 | "EPS YoY at +29.1% YoY" | drop the suffix |
| src/components/investments/TerminalPanel.tsx:28 | every panel is an unnamed article landmark | name or demote |
| src/components/investments/TerminalPanel.tsx:10 | a padding prop its callers re-apply by hand | delete |
| src/components/investments/__tests__/MetricTooltip.test.tsx:40 | focus outside act logs two warnings per run | `act` |
| src/lib/retirement/projection.ts:227 | "Projected at retirement" deflated one year more than the chart's band | one exponent |
| src/lib/retirement/projection.ts:145 | the guardrails strategy has no engine test | add one |
| RETIREMENT_PLANNER_ENGINE.md:135 | prints a CMA date and pinning status the code no longer has | update |
| src/components/investments/retirement/RetirementAssumptions.tsx:12 | the strategy labelled differently in the select and the footer | one list |
| src/components/investments/retirement/RetirementAssumptions.tsx:44 | "never a single hardcoded number" negative parallelism | rewrite |
| src/components/investments/retirement/RetirementInputs.tsx:243 | the withdrawal rate field also sets the annual spend under fixed percent | split or label |
| src/components/investments/retirement/RetirementProjectionChart.tsx:54 | an all zero projection draws at mid plot | guard the domain |
| src/components/investments/retirement/RetirementVerdict.tsx:77 | an "X, not Y" pivot in the verdict sub line | rewrite |
| src/components/investments/retirement/__tests__/RetirementInputs.test.tsx:16 | a controller fixture with a status shape the hook never returns | real shape |
| src/hooks/useRetirementPlan.ts:201 | the next edit rebases on the decoded plan, so clamps rewrite untouched fields | edit the raw plan |
| src/hooks/useRetirementPlan.ts:58 | a seed allocation no production caller passes | delete |
| src/lib/retirement/levers.ts:193 | "Retire later" can name the current retirement age | guard it |
| src/lib/retirement/levers.ts:146 | the threshold solver has no test | add one |
| src/lib/retirement/levers.ts:128 | re-runs the headline Monte Carlo for a baseline it already has | reuse |
| src/lib/retirement/monteCarlo.ts:121 | `endingBalance` computed and exposed, read by no screen | delete |
| src/lib/retirement/types.ts:104 | filing status and region collected and never read | delete |

### Fintech tools

#### P2. Deduct mortgage interest within the acquisition debt limit, or say the model does not

The rent versus buy engine deducts every dollar of interest at the marginal rate, while federal law limits the deduction to interest on $750,000 of acquisition debt, and the tax note lists the SALT cap, the standard deduction simplification, the untaxed growth, and the skipped phase down but not this. The tool accepts prices up to $100,000,000. A verifier ran a $1.5 million case and the limit flipped the verdict from buying ahead after seven years to renting ([engine.ts](../src/lib/rentVsBuy/engine.ts#L106)). Scale the deductible interest by the limit, or add the omission to the note.

| Where | What | Fix in a few words |
| --- | --- | --- |
| src/lib/budgetPlanner.ts:154 | notes over 140 characters are kept on save and cut on the next load | clamp on save |
| .impeccable/surfaces/route-fintech-tools-interchange-iq.md:46 | the surface brief describes the pre October 22 page | update |
| src/app/fintech-tools/budget-planner/budget-planner-client.tsx:446 | typing a budget that crosses the spent amount reorders the grid mid keystroke | sort on blur |
| src/app/fintech-tools/budget-planner/budget-planner-client.tsx:341 | the month field cannot be typed into in Firefox or desktop Safari | accept partial input |
| src/app/fintech-tools/budget-planner/budget-planner-client.tsx:367 | coarse `step` attributes mark ordinary values invalid | `step="any"` |
| src/app/fintech-tools/budget-planner/budget-planner-client.tsx:63 | the amount clamp implemented three times along one path | one |
| src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx:406 | the breakeven marker is pinned at the $5 end and a sentence can never show | fix the scale |
| src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx:209 | the channel select, the hints, and the in person verdict have no client test | add cases |
| src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx:19 | four re-aliases and an unread domain | delete |
| src/app/fintech-tools/interchange-iq/page.tsx:11 | `dateModified` and the sitemap predate the rate check and the channel comparison | bump |
| src/app/fintech-tools/interchange-iq/page.tsx:8 | the description says "real interchange economics" while the page says representative | reword |
| src/app/fintech-tools/rent-vs-buy/opengraph-image.tsx:15 | the card says "the exact year" while the page says "about" | reword |
| src/lib/budgetPlanner.ts:314 | the CSV export has no test | add one |
| src/lib/budgetPlanner.ts:216 | an optional storage parameter no caller passes | delete |
| src/lib/budgetPlanner.ts:268 | `recentExpenses` and `utilization` have no reader | delete |
| src/lib/interchangeIq.ts:52 | Square's note says "online checkout" under the in person channel | per channel notes |
| src/lib/rentVsBuy/defaults.ts:57 | three assumptions computed and never read | delete |

### The sports dashboards

#### P1. Compute a withdrawn golfer's total from finished rounds only

For a row whose status says the player left mid event, the builder derives the total from strokes minus par times the number of rounds, but the rounds list keeps the partial round's strokes while ESPN's total counts only finished rounds, so 73 minus 71 times 2 prints as 69 under par. A verifier ran the real builder against a mocked withdrawn row and got the same figure ([golfData.ts](../src/lib/golfData.ts#L594)). Count only the rounds that add up to the stroke total and give the partial round no to par figure.

#### The soccer and US sports P2s

The request time live refresh path for the two league accessors has no caller, so its summary builders, the `preferLive` plumbing, and the revalidate constants can go ([footballLeagueData.ts](../src/lib/footballLeagueData.ts#L443)). A view filter on the Premier League page writes the auto picked leader into the URL, and a fresh load of that URL opens the leader's drawer, with La Liga doing the same through its state builder ([premier-league-client.tsx](../src/app/premier-league/premier-league-client.tsx#L82)). The points ladder marks are role=button targets about 26px tall on both league pages ([PointsLadderChart.tsx](../src/components/football/PointsLadderChart.tsx#L101)). The NFL, NBA, and MLB drawers print their form pills newest first with no marker, the reverse of the soccer drawers and of how "Last 5" reads, so a visitor reads the latest loss as four games ago ([nfl-client.tsx](../src/app/nfl/nfl-client.tsx#L537)). And the MLB builder treats any game date ending in midnight UTC as a placeholder, so every 2026 World Series game, which the Stats API lists at exactly that time with a published 8 PM start, printed "time TBD" ([mlbData.ts](../src/lib/mlbData.ts#L241)).

#### The smaller sports findings

| Where | What | Fix in a few words |
| --- | --- | --- |
| docs/DATA_UPDATE_OPERATIONS.md:34 | the soccer, golf, and Formula 1 builders listed with a `.json` extension | `.ts` |
| docs/TODO.md:12 | still asks to watch the first Formula 1 run, which has gone green five times | delete the item |
| src/app/formula-1/formula-1-client.tsx:223 | "Lights out" prints for any past countdown until the next refresh | check the meeting end |
| src/app/formula-1/formula-1-client.tsx:46 | calendar dates print the Pacific date with no zone, a day early for Asia Pacific rounds | local date |
| src/app/formula-1/formula-1-client.tsx:46 | re-implements two formatters from the module it imports | import |
| src/app/formula-1/formula-1.module.css:42 | the dark palette is not held to the screen (known) | `@media screen` |
| src/app/golf/golf-client.tsx:41 | its own last checked formatter beside the shared one | import |
| src/app/golf/golf-client.tsx:333 | the mount rewrite drops a link's fragment (known) | keep the hash |
| src/lib/__tests__/golfData.test.ts:193 | the to par test asserts `typeof number` and never feeds a partial round | add the case |
| src/lib/golfData.ts:335 | `fillTodayToPar` fills a board shape no longer committed | delete |
| src/types/golf.ts:72 | `players` and hero stats ride to the client and nothing renders them | delete |
| src/app/la-liga/__tests__/la-liga-client.test.tsx:94 | tests pin club ids into a snapshot a bot rewrites every four hours | fixture |
| src/app/la-liga/page.tsx:14 | metadata calls a football-data.org snapshot official | reword |
| src/app/world-cup-2026/page.tsx:65 | structured data promises a full schedule the page caps at twelve | reword |
| src/app/world-cup-2026/world-cup-client.tsx:382 | the Golden Boot table can never render, the builder writes an empty scorers list | delete or fill |
| src/app/world-cup-2026/world-cup-client.tsx:698 | the third place footnote calls the order provisional on a completed tournament | gate on phase |
| src/app/world-cup-2026/world-cup.css:41 | the dark palette is not held to the screen (known) | `@media screen` |
| src/components/football/ClubDrawer.tsx:136 | re-implements DetailDrawer's overlay, panel, and modal wiring | use DetailDrawer |
| src/components/football/GoalsPulseStrip.tsx:43 | values exposed only through pointer tooltips | a visually hidden list |
| src/components/football/LeagueTableBoard.tsx:139 | the updated stamp in Pacific, every kickoff in Eastern | one zone |
| src/components/football/LeagueTableBoard.tsx:190 | the tape is labelled with the current matchday while half its items are the next one's | label both |
| src/components/football/SurfaceCard.tsx:4 | a one caller wrapper around a bordered div | inline |
| src/lib/worldCupData.ts:171 | knockout rounds classified by hard coded 2026 dates | derive from the data |
| src/lib/worldCupData.ts:249 | a shootout tie records a draw when ESPN omits the winner flag | read the shootout score |
| src/lib/worldCupData.ts:502 | group rows carry a form array nothing reads | delete |
| scripts/updateMlbSnapshot.ts:24 | MLB and NBA scripts exit 0 when the build fails and the snapshot is kept | exit non zero or flag |
| src/app/mlb/mlb-client.tsx:545 | "Official leaders" opens an empty JSON API response | link the page |
| src/app/api/mlb/teams/[teamId]/__tests__/route.test.ts:1 | three copies of one route test, each mocking the accessor | one shared test |
| src/app/mlb/__tests__/mlb-client.test.tsx:180 | an unmocked fetch leaks and logs act warnings | mock it |
| src/app/mlb/mlb-client.tsx:450 | calls the automated API snapshot "curated" | reword |
| src/app/nba/nba-client.tsx:593 | a top six team is "locked into a playoff seed" from its current seed alone | compute the lock |
| src/app/nba/nba-client.tsx:173 | the three clients repeat the route state, drawer, and snapshot block | one hook |
| src/lib/__tests__/nbaData.test.ts:1271 | spies a timer the builder does not use | mock the promise timer |
| src/lib/mlbData.ts:341 | leader rows carry `games` and `perGame` nothing renders, hydrated six leaders deep | drop the hydrate |
| src/lib/mlbData.ts:397 | Next revalidate plumbing in two builders that only run under Node | delete |
| src/lib/mlbData.ts:426 | `isValidMlbTeamId` exported twice under one name with two meanings | one name each |
| src/lib/nflData.ts:678 | two build options only tests set | delete |

### Space, earth, and transit

#### P1. Count the elevators BART reports, not its notices

BART's elevator feed answers with one aggregated notice listing every elevator out of service, and both transit builders set the hero's elevator outage count to the number of notices, so the count is always 0 or 1. The committed snapshot carries one notice reading "There are 2 elevators out of service" with a count of 1, and the home page and /dashboards print that 1 ([bayAreaTransitData.ts](../src/lib/bayAreaTransitData.ts#L464)). Parse the count from the notice and fall back to the notice count when the pattern is absent.

#### The other geo and transit P2s

Leaflet's script and stylesheet load from unpkg at runtime with no subresource integrity, and while the proxy's enforcing CSP exists, it allows all of unpkg, so an altered CDN response would run with the site's origin on two routes ([leaflet.ts](../src/lib/leaflet.ts#L108)). Add the published hashes or install the package. The busiest regions list splits one country in two when USGS tags offshore events with a "region" suffix, so "Japan region" and "Japan" rank tenth and twelfth where the merged count would be fourth ([earthquakeData.ts](../src/lib/earthquakeData.ts#L130)). And the alerts chevron transitions on the generic `ease` keyword against the motion rule.

#### The SpaceX P2s with a judge's verdict

The masthead's "Active rockets" counts vehicle families, so Falcon 9 and Falcon Heavy count once ([spacex-mission-control-client.tsx](../src/app/spacex-mission-control/spacex-mission-control-client.tsx#L497)). The sticky board tools set a literal z-index of 2 where the rule says `--c97-z-sticky`. And "Next mission" and its schedule line stay after T-0 until the next refresh and deploy, because staleness is computed once in the builder against the build clock and the five minute poll re-reads the same committed file ([MissionControlHero.tsx](../src/components/spacex/MissionControlHero.tsx#L215)). The remaining SpaceX findings, including the one rated P1 by its finder, are in the section below that covers the last five areas to finish verification.

#### The smaller geo and transit findings

| Where | What | Fix in a few words |
| --- | --- | --- |
| .github/workflows/update-bay-area-transit.yml:9 | the stagger comment names an hourly earthquake and six hourly World Cup refresh that no longer run | update |
| docs/DATA_UPDATE_OPERATIONS.md:43 | both builders named with a `.json` extension | `.ts` |
| scripts/buildEarthquakeSnapshot.ts:36 | a probe that only decides whether a warning prints before the same throw | delete |
| src/app/bay-area-transit/__tests__/TransitSignature.test.tsx:9 | fixtures cast as never carry fields the real shapes lack | real shapes |
| src/app/bay-area-transit/bay-area-transit-client.tsx:282 | a 404 branch reachable only across a deploy, with a stale comment | delete |
| src/app/bay-area-transit/bay-area-transit-client.tsx:409 | the stamp says "from the last good snapshot" when the builder wrote an empty one | say empty |
| src/app/bay-area-transit/opengraph-image.tsx:15 | the card says the boards come from a checked in snapshot while the page refreshes every minute | reword |
| src/app/bay-area-transit/station-map.ts:15 | a rings array no caller reads | delete |
| src/app/earthquake-pulse/earthquake-client.tsx:219 | the Tsunami flag presents USGS's large oceanic event flag as an issued alert | reword |
| src/lib/bayAreaTransitData.ts:354 | five line and departure fields built and committed, read by nothing | delete |
| src/lib/bayAreaTransitData.ts:437 | the default station pick and two sums written twice | one |
| src/lib/earthquakeData.ts:313 | four hero stats and the PAGER alert computed and never read | delete |

### Tech, news, and polling

#### P1. Pin the clock in the polling client test

The test that prints the national averages renders the client with the real clock and expects the source note to contain "midterms", but the client prints "election day, Nov 3, 2026." on that calendar date, so the unit lane was red on November 3 for every run, which a verifier reproduced that day ([polling-aggregator-client.test.tsx](../src/app/polling-aggregator/__tests__/polling-aggregator-client.test.tsx#L145)). Pin the clock the way the file's other tests do.

#### The polling, frontier, and news P2s

The frontier fact check copies reasoning and modalities from the live catalogs onto the curated model, but the pinnable facts cover only the five numeric ones, so a catalog that disagrees changes the row, counts the model as confirmed, and leaves the editorial notes contradicting it ([frontierModelsLive.ts](../src/lib/frontierModelsLive.ts#L342)). The headline approval average widens to every kept poll when fewer than three fall inside 30 days, and the committed seed has two, so the figure the page leads with is a mean of 30 polls from June to October, 23 of them from June, with no window stated ([pollingData.ts](../src/lib/pollingData.ts#L179)). The approval trend chart positions points by index while the builder skips months with no polls, so a two month gap draws at the same step as one ([polling-aggregator-client.tsx](../src/app/polling-aggregator/polling-aggregator-client.tsx#L63)). The polling view switch sticks at `z-index: 2`. Two startup descriptions printed in the table carry em dashes. And News Pulse refetches on mount and overwrites the server's headlines with whatever comes back, including an empty list on a failed fetch or an older payload, which a verifier reproduced ([news-pulse-client.tsx](../src/app/news-pulse/news-pulse-client.tsx#L125)).

#### The smaller tech and polling findings

| Where | What | Fix in a few words |
| --- | --- | --- |
| scripts/buildPollingSnapshot.ts:13 | a compatibility re-export only its own test imports | delete |
| scripts/buildTechStartupSnapshot.ts:143 | the disclaimer says each entry links to its source; Perplexity and Canva have none (known) | add or reword |
| src/app/ai-dev-tools/ai-dev-tools-client.tsx:499 | release freshness is a colour only dot with its text in an aria hidden tooltip | visible text |
| src/app/ai-dev-tools/ai-dev-tools-data.ts:222 | "GPT-5.5 retires on Oct 14, 2026" in the future tense about a past date | update |
| src/app/ai-dev-tools/ai-dev-tools.css:34 | AI dev tools and polling keep their dark palette on paper (known) | `@media screen` |
| src/app/frontier-models/components/FrontierCostContextChart.tsx:229 | the chart redraws its SVG on every parent render | stable callback |
| src/app/frontier-models/frontier-models-client.tsx:208 | the price tier filter never says where its cuts are | state the thresholds |
| src/app/frontier-models/frontier-models-client.tsx:181 | "Fewer filters" is inert while a filter is set | disable or hide |
| src/app/frontier-models/readouts.ts:40 | `count` computed, typed, tested, and never read | delete |
| src/app/polling-aggregator/polling-aggregator-client.tsx:579 | the empty race view blames VoteHub when the builder may have dropped the rows | distinguish |
| src/app/polling-aggregator/polling-aggregator-client.tsx:506 | no post election wording beyond dropping the countdown | add it |
| src/app/tech-startup-tracker/tech-startup-client.tsx:530 | Momentum is the default sort and a printed figure the page never defines | define it |
| src/app/tech-startup-tracker/tech-startup-tracker.css:301 | three route sheets name classes under the shared `c97-` prefix | own prefix |
| src/lib/__tests__/frontierModelsLive.test.ts:224 | no test covers a catalog that differs only on reasoning or modalities | add one |
| src/lib/__tests__/pollingData.test.ts:62 | the widen to all polls fallback is untested | add one |
| SNAPSHOT_DRIVEN_DASHBOARDS.md:240 | routes /api/news-pulse to the client side analysis module | fix the path |
| docs/DATA_UPDATE_OPERATIONS.md:45 | the trending builder named with a `.json` extension | `.ts` |
| src/app/agent-build-index/page.tsx:216 | "rather than" in the copy, and a daily partially measured page called weekly and measured | rewrite |
| src/app/github-trending-pulse/github-trending-client.tsx:213 | the degraded line names reused segments and never a segment that failed outright | name both |
| src/app/github-trending-pulse/github-trending-client.tsx:102 | two handlers scroll the segment row for a focused pill | one |
| src/app/github-trending-pulse/github-trending-client.tsx:356 | an unknown language is "Mixed" in the table and "Other" in the strip | one word |
| src/app/github-trending-pulse/github-trending-state.ts:72 | the address keeps `repo=` for a repository the segment cannot show | drop it |
| src/app/news-pulse/__tests__/news-pulse-client.test.tsx:116 | fetch driven updates leak past the test | await them |
| src/app/news-pulse/news-pulse-client.tsx:269 | the tone note says headlines while the score uses title plus description | say so |
| src/app/news-pulse/news-pulse-client.tsx:232 | stale fallback reads as a partial failure, failed refreshes print raw browser errors | plain messages |
| src/app/news-pulse/news-pulse.css:334 | on paper the outlet headlines and the coverage matrix sit inside closed disclosures | open on print |
| src/lib/githubTrending.ts:142 | a repository that lost stars prints a measured gain of zero | allow negatives |
| src/lib/githubTrendingSnapshot.ts:12 | the client snapshot ships 10.7 KB of fields no page reads | trim |

### The personal tools

#### The personal tool P2s

Plural pantry entries never match a recipe, because the matcher is a whole word set comparison and the normalizer strips no suffix although its docblock says it does, so a pantry of "eggs" matches zero of 26 recipes against six for "egg" ([recipes.ts](../src/lib/recipes.ts#L114)). The museum log's server HTML states that no museum has an exhibit running today while 15 of 16 do, because the count depends on a client only date that is null on the server and the sentence asserts the zero ([museum-log-client.tsx](../src/app/museum-log/museum-log-client.tsx#L1371)), and the page is CDN cached. And the curated museum and recipe copy that the pages print still carries em dashes on thirteen rendered lines and a "recently" about the Frick's reopening ([museumSnapshot.ts](../src/data/museumSnapshot.ts#L16)). The Food Map dataset's overdue date, which has kept the curated data lane red since October 26, is in the section below.

| Where | What | Fix in a few words |
| --- | --- | --- |
| src/app/museum-log/museum-log-client.tsx:1367 | "visited N of the 16" counts visits to museums the catalog no longer holds | intersect |
| src/app/museum-log/museum-log-client.tsx:1251 | hand rolls the client only date `useClientNow` supplies | use the hook |
| src/app/museum-log/museum-log-helpers.ts:254 | `averageRating` has no caller and is the only reason the helpers import d3 | delete |
| src/app/museum-log/museum-log-helpers.ts:60 | date only formatters written three times | import |
| src/app/museum-log/museum-log-helpers.ts:233 | an 18 line loop that is a two line clamp | shrink |
| src/app/museum-log/museum-log-state.ts:9 | its own copies of the type, region, and sort lists | derive |
| src/app/recipe-finder/RecipeMealPlan.tsx:63 | no component test, and the client test never saves or plans | add one |
| src/app/recipe-finder/page.tsx:8 | calls a hand written corpus a "recipe aggregator" | reword |
| src/app/recipe-finder/recipe-finder-client.tsx:112 | the pantry store re-implements `useBrowserRecord` in a file that imports it | use it |
| src/lib/wineCellar.ts:209 | the summary computes six fields the page never reads | delete |
| src/lib/wineCellar.ts:168 | an injectable storage parameter with no production caller | delete |
| src/types/museum.ts:43 | three snapshot fields nothing renders | delete |
| STYLING.md:163 | the SVG `var()` rule is false in all three engines | correct |
| src/app/food-map/food-map-data.ts:713 | a colon joins two clauses in the Aamanns entry | rewrite |
| src/app/food-map/food-map-state.ts:62 | a pick from another city stays in the URL and never shows | clear it |
| src/app/travel-deals/travel-deal-lab-client.tsx:110 | re-parses storage by hand and repeats the engine's zero points message | reuse |
| src/app/travel/__tests__/travel-planner-client.test.tsx:9 | the test reads the wall clock for every day key | pin it |
| src/app/travel/page.tsx:10 | `dateModified` and the sitemap predate the October 22 features | bump |
| src/app/travel/travel-planner-client.tsx:303 | a stop with its date cleared is refused with no message | show the error |
| src/app/travel/travel-planner-client.tsx:853 | same day journal entries render in random order | sort by created time |
| src/app/travel/travel-planner-client.tsx:113 | `formatBudget` re-implements `formatDollars` | import |

### The frame and the shared library, second pass

The second half's readers on the frame, the designed pages, the writing system's design lens, and the shared library added five P2s. The deleted case study template's fields still fill every one of the 34 entries in [caseStudies.ts](../src/constants/caseStudies.ts#L19) with empty arrays and strings, and a grep found no reader for any of the thirteen since the template went on October 2. The related writing links under an article use `.c97-link`, so a one line title is a 24 to 26px target where the index uses the 44px heading link ([page.tsx](../src/app/writing/[slug]/page.tsx#L391)). The writing index serializes all 249 previews and a duplicated ItemList into a 437 KB client payload, 620 KB raw for the page against 61 KB for /portfolio, measured on production on November 3 ([Catalog97Writing.tsx](../src/components/catalog97/Catalog97Writing.tsx#L83)). Article markdown tables scroll on the table element itself without the checklist's labelled scroll region ([blog.ts](../src/lib/blog.ts#L204)). And the privacy page's search term omission came up a third time from this side.

| Where | What | Fix in a few words |
| --- | --- | --- |
| src/app/about/page.tsx:7 | `generateAIOptimizedMetadata` has one caller and only forwards | call through |
| src/app/changelog/page.tsx:104 | the latest date is re-read from disk when the sorted entries hold it | read the first entry |
| src/app/metadata.ts:10 | `dateModified` lags on home, dashboards, and accessibility, and the sitemap copies the lag | bump or derive |
| src/app/portfolio/page.tsx:30 | breadcrumb JSON-LD built two ways across eight pages | one helper |
| src/app/resume/page.tsx:36 | About and Résumé carry the same 29 line ProfilePage schema | share it |
| src/components/catalog97/Catalog97Portfolio.tsx:36 | the Work page hardcodes the two write ups' excerpts, and one has drifted | read the frontmatter |
| src/lib/__tests__/catalog97Readouts.test.ts:3 | the six snapshot readers behind the home board have no tests | add them |
| src/lib/changelog.ts:25 | the reader creates `content/changelog` on every read | delete |
| src/lib/profile.ts:27 | three fields nothing reads | delete |
| src/__tests__/proxy.test.ts:88 | the production CSP shape is untested | assert no eval or localhost |
| src/app/catalog97.css:85 | Archivo preloads two weights Apple visitors never render | reorder or drop the preload |
| src/app/catalog97.css:613 | classes and tokens nothing reads | delete |
| src/app/catalog97.css:2955 | repeats the global reduced motion block | delete one |
| src/app/catalog97.css:2381 | footer tiles cast their offset in their own second ink | read the footer's |
| src/app/layout.tsx:142 | the skip link uses Tailwind spacing and a literal z-index | tokens |
| src/app/layout.tsx:19 | Instrument Sans is loaded and preloaded on every route for a skip link | drop the preload |
| src/app/not-found.module.css:94 | an off ladder type size and its own easing curve | ladder and token |
| src/components/__tests__/ConditionalLayout.test.tsx:11 | the wide column plumbing has no test | add one |
| src/components/__tests__/ProjectBuildNote.test.tsx:55 | nothing holds the build note links to the case study notes | a drift test |
| src/components/catalog97/Catalog97Header.tsx:42 | Cmd+K opens search over an open modal where slash refuses | same guard |
| src/components/catalog97/Catalog97Shell.tsx:89 | the footer and the author bio hardcode addresses profile.ts holds | import |
| src/components/catalog97/Catalog97ToolShell.tsx:4 | the build note's dynamic import has no loading fallback and no Suspense boundary of its own | add `loading` |
| src/components/ui/__tests__/ModernButton.test.tsx:123 | asserts Tailwind focus classes the unlayered rule overrides | assert the computed style |
| src/constants/__tests__/toolCategories.test.ts:26 | no test holds every case study to a bucket | add one |
| src/lib/analytics.ts:77 | five navigation locations and a docstring describe tracking nothing emits | delete |
| src/proxy.ts:49 | `connect-src` allows api.fantasypros.com though nothing in the browser calls it | remove |
| src/hooks/__tests__/useMountOnFirstOpen.test.ts:35 | the preload resolves outside act | await |
| src/hooks/useCachedSnapshot.ts:39 | a non JSON error body surfaces as a raw parse exception message | check `ok` first |
| src/hooks/useCachedSnapshot.ts:11 | golf and Formula 1 re-implement the hook inline | use it |
| src/lib/__tests__/logger.test.ts:40 | one test has no assertion and the other cannot fail | fix both |
| src/lib/__tests__/rateLimit.test.ts:82 | never sets the Netlify client IP header the precedence relies on | add the case |
| src/lib/date-formatters.ts:63 | `formatShortDate` has no caller and would print a day early | delete |
| src/lib/logger.ts:8 | `info` and `debug` have zero callers | delete |
| src/types/index.ts:75 | `Player` carries seven fields no builder emits (known) | delete |
| DESIGN_CHECKLIST.md:222 | the h1 rule still says `.c97-poster` while /writing uses the small step | update |
| SEO.md:270 | names theme colour values the layout does not set | update |
| src/components/catalog97/Catalog97Writing.tsx:652 | an off ladder 34px row gap | a ladder step |
| src/components/discoveries/discoveries.module.css:57 | the postscript paints the accent as a wash and sets off ladder type | tokens |

### Score pools, the job search tracker, the interactive tools, and the rest of SpaceX and travel

These five areas finished verification last, after the spend limit cut their first verifiers off, and they carry two of the nine P1s.

#### P1. Move the Food Map review date, or review the catalog

`FOOD_MAP_AS_OF` in [food-map-data.ts](../src/app/food-map/food-map-data.ts#L12) is still 2026-04-28 against a 180 day window, so the curated data audit marks the dataset overdue and the weekly lane has failed every Monday since October 26, which is issue #643. The five entries corrected on September 28 carry dated comments, but the constant, which is also what the page prints as its reviewed date, never moved. Review the catalog and set the date, bumping the route's `dateModified` and sitemap entry in the same change, or date the constant to the September 28 pass if that counts as the review.

#### P1. Read SpaceX cores, crew, and capsules from where Launch Library puts them

The raw launch type declares `launcher_stage` and `spacecraft_stage` at the launch root, and every reader in [spacexData.ts](../src/lib/spacexData.ts#L925) plus the image builder reads them there, but Launch Library 2.2.0 nests both under `rocket`, so every read is undefined on every launch and the cores, crew, capsules, spacecraft images, and the counts built from them are always empty. The tests pass because their rows put the fields at the root too, a shape the real fixture file never carries. Move the two fields onto the rocket type, read them there in both places, fix the test rows, and rebuild the snapshot and images. Two P2s follow from the same root. The payload count is a regex over the mission description with a fallback of one, so rideshares and crewed flights print one payload, and the masthead's hero is built from a list row that carries no webcast or article links, so the webcast is always missing and "Read article" opens the program homepage.

#### The other SpaceX P2s

A deep link to a launch past the board's ten cards is cleared on mount because the check compares against the cards on screen and not the snapshot's 24 per status ([spacex-mission-control-client.tsx](../src/app/spacex-mission-control/spacex-mission-control-client.tsx#L303)). The T-0 sequence says Launch Library publishes no timeline when every detail response carries one, and the template's typical times disagree with it ([MissionSequenceTimeline.tsx](../src/components/spacex/MissionSequenceTimeline.tsx#L23)). And day precision launch dates print the previous day, because the date formatters pin Los Angeles while an imprecise NET arrives as UTC midnight, against the rule the shared date formatters record for date only values ([formatters.ts](../src/components/spacex/formatters.ts#L18)).

#### The job search tracker

Every visit fires a "new roles" browser notification for anyone who granted permission, because the seen set is seeded from the server's first twelve roles and the first browser fetch counts everything outside that slice as new ([useMBAJobs.ts](../src/hooks/useMBAJobs.ts#L305)). Line breaks typed into notes and the fit rationale are flattened to single spaces on the next render, and the private pipeline file receives the flattened copy on the next push ([mba-applications.ts](../src/lib/mba-applications.ts#L99)). One malformed numeric entity in any posting body throws inside the snippet normalizer and takes the whole board's roles out of the feed, which a verifier reproduced ([mbaJobsServer.ts](../src/lib/mbaJobsServer.ts#L53)), and the hand rolled entity map knows six names, so `&rsquo;` and `&mdash;` reach visitors as literal text.

#### Score pools

A deep linked fixture outside the default round opens the drawer with prices and no recommendation, because only the active round is analyzed ([score-pools-client.tsx](../src/app/score-pools/score-pools-client.tsx#L178)). The pick sheet's expected points meter is always full, since the maximum is taken from the first candidate and the first candidate is the pick itself. "My points" means the full standing to the engine and points banked before tracking to the tracker, so once any tracked points exist no value makes both surfaces right ([tracker-client.tsx](../src/app/score-pools/tracker/tracker-client.tsx#L406)). And the recheck list prints raw camelCase flag identifiers to the visitor.

#### The interactive tools and the travel grid

Reactor Arcade's buttons take the frame's oxblood focus ring at 2.0 to 1 on the cabinet's void, because the module's own cyan ring loses to the unlayered shell rule and the route never redeclares `--c97-accent` ([arcade.module.css](../src/app/arcade/arcade.module.css#L258)). Decision Lab prints a SHIP verdict and a score of 68 beside a ledger total of 67.95 under fine print that says ship needs 68, because the gate runs on the rounded score and the ledger prints the exact sum ([decision-lab-data.ts](../src/app/decision-lab/decision-lab-data.ts#L180)). In the Enablement Assistant, unchecking and re-checking a test layer wipes a team's onboarding checklist, because the intake comparison is a JSON string that depends on array order ([teamRecords.ts](../src/app/enablement-assistant/teamRecords.ts#L134)). The March Madness pick copy says Duke is first in all eight systems in the same sentence that lists two systems where it is not, calls Michigan second in every metric, and gives Villanova a time zone penalty the page's own model does not produce ([march-madness-data.ts](../src/app/march-madness-2026/march-madness-data.ts#L449)). And the travel itinerary's time grid clips on paper past the eighth day with its scroll cue hidden under print ([travel.css](../src/app/travel/travel.css#L558)).

#### The smaller findings in these five areas

| Where | What | Fix in a few words |
| --- | --- | --- |
| src/app/arcade/ArcadeClient.tsx:273 | the arcade swallows digits typed anywhere on the page during a run | check the target |
| src/app/arcade/arcade.module.css:198 | HUD labels clamp to 6.7px on a phone | floor the size |
| src/app/decision-lab/SavedBetWorkspace.tsx:109 | the status line hides every message once storage is memory only | show both |
| src/app/decision-lab/decision-lab-client.tsx:525 | a canonicalizing effect repeats what the workbench does 200ms later | one |
| src/app/decision-lab/verdictStamp.ts:8 | a wrapper around a three entry map | inline |
| src/app/enablement-assistant/__tests__/teamRecords.test.ts:31 | both sides of every merge built from one object, so a reordered layer is never tested | add the case |
| src/app/march-madness-2026/march-madness-client.tsx:218 | tablist and tabs with no tabpanel or `aria-controls` | add them |
| src/app/march-madness-2026/march-madness-client.tsx:147 | `Matchup2` is `Matchup` without two props | one component |
| docs/JOB_SEARCH_PRIVATE_DATA.md:90 | describes a tracked skills symlink that main ignores | update |
| scripts/jobSearch/dumpCandidates.ts:61 | inbox files bypass the known roles check (known) | check them |
| src/app/api/mba-jobs/__tests__/route.test.ts:276 | snippet decoding tested for three entities only | add the faults |
| src/app/mba-internship-notifications/UpcomingInterviews.tsx:27 | the agenda prints the raw date key | format it |
| src/app/mba-internship-notifications/__tests__/mba-jobs-client.test.tsx:211 | the promote flow's fit transfer is never exercised | return a value |
| src/app/mba-internship-notifications/loading.tsx:4 | the loading state still names the MBA internship tracker | rename |
| src/app/mba-internship-notifications/mba-jobs-client.tsx:1662 | every keystroke in the search pushes a history entry | replace |
| src/app/mba-internship-notifications/mba-jobs-client.tsx:2035 | Save to pipeline removes the candidate at once and saves 500ms later (known) | one write |
| src/app/mba-internship-notifications/mba-jobs-client.tsx:271 | the text normaliser and date parser implemented in the client and two libs | import |
| src/app/mba-internship-notifications/mba-jobs-client.tsx:389 | two query builders share their first fifteen lines | one |
| src/app/mba-internship-notifications/mba-jobs-client.tsx:1033 | a "manual only" count that can only print 0 | delete |
| src/app/mba-internship-notifications/mba-jobs-client.tsx:1055 | a failed board's reason lives in a title on a non focusable chip | visible text |
| src/hooks/__tests__/useMBAJobs.test.tsx:95 | the notification branch has no test | add one |
| src/hooks/useMBAApplications.ts:404 | a record deleted from the file comes back from the open page's next sync | honour the file |
| src/hooks/useMBAApplications.ts:515 | a failed save is silent or shows only a status code (known) | a message |
| src/hooks/useMBAApplications.ts:265 | two helpers with no caller outside the hook and its tests | delete |
| src/hooks/useMBAApplications.ts:64 | re-implements the apply URL key rule | import |
| src/lib/mba-application-insights.ts:129 | seven insight fields computed and never read | delete |
| src/lib/mba-applications.ts:306 | a promoted browser sourced candidate is recorded as a live feed role | carry the source |
| src/lib/mba-applications.ts:573 | a one line delegating wrapper and unused storage parameters | delete |
| src/data/travelDealsSnapshot.ts:233 | the points tactic names a cent and a half while the checker uses 1.4 cents | one figure |
| src/hooks/useTravelPlanner.ts:120 | `isIsoDate` lives in two libs beside the shared one | import |
| src/lib/travelPlanner.ts:60 | a stored time like 25:99 passes the validator and prints as 2:39 AM | bound the digits |
| src/lib/travelPlanner.ts:439 | three trip summary fields nothing renders | delete |
| src/types/travelDeals.ts:24 | five region and tool fields never read | delete |
| scripts/buildScorePoolsSnapshot.ts:8 | three docs and the header say the builder runs without keys; the gate refuses to write | fix the claim |
| scripts/buildScorePoolsSnapshot.ts:79 | recounts fixtures and odds the quality check already returns | reuse |
| scripts/data/scorePoolsConfig.ts:22 | two identity aliases | delete |
| src/app/score-pools/score-pools-client.tsx:75 | three clients sample the clock in a `useState` initializer that runs on the server | `useClientNow` |
| src/app/score-pools/score-pools-ui.tsx:172 | single value class name constants | literals |
| src/app/score-pools/settings/page.tsx:56 | the whole snapshot, odds history included, serialized into every page's props | trim |
| src/app/score-pools/settings/settings-client.tsx:328 | the shootout checkbox is enabled under the 90 minute basis where it does nothing | disable or hint |
| src/app/score-pools/tracker/tracker-client.tsx:198 | the tracker asks for a result on postponed games | check the status |
| src/lib/scorePools/engine.ts:247 | odds age printed as 2572 hours beside days elsewhere | days |
| src/lib/scorePools/engine.ts:124 | field overrides and reference picks have no caller | delete |
| src/lib/scorePools/providers/manual.ts:187 | a hand entered kickoff is never validated and an unparseable one crashes the sheet | validate |
| src/lib/scorePools/scorelineModel.ts:471 | rebuilds the extra time rows the comparison already sets up | reuse |
| src/lib/scorePoolsSnapshot.ts:17 | a getter that wraps a constant the pages also import directly | delete |
| AGENTS.md:192 | says the SpaceX lane fails after four days stale; it fails at 36 hours | 36 hours |
| scripts/buildSpaceXImageSnapshots.ts:499 | an indexed launch is never re-hydrated, so detail only images are never downloaded | re-hydrate |
| scripts/buildSpaceXImageSnapshots.ts:407 | stores whatever the media host returns under the site's origin | the raster allow list above |
| scripts/buildSpaceXSnapshot.ts:84 | a kept cadence series prints under the fresh snapshot date | print its own date |
| src/app/spacex-mission-control/spacex-mission-control-client.tsx:223 | after Back, a failed board fetch leaves the other status's cards under the new toggle | clear on failure |
| src/app/spacex-mission-control/spacex-mission-control-client.tsx:331 | a five minute poll with backoff re-reads a committed file | delete |
| src/components/spacex/MissionCadenceStrip.tsx:27 | the last bar is a partial month printed as a full one | label it |
| src/components/spacex/MissionCadenceStrip.tsx:24 | the counts are reachable only by pointer tooltips | a hidden list |
| src/components/spacex/MissionCard.tsx:36 | a button holding an h3 and a definition list | restructure |
| src/components/spacex/MissionDetailPanel.tsx:68 | the tablist has no arrow key handling | add it |
| src/components/spacex/MissionDetailPanel.tsx:131 | "detail rail" copy survives the move to a drawer | rewrite |
| src/lib/spacexData.ts:539 | week and decade precision labelled day precision | map them |
| src/lib/spacexData.ts:1102 | the runtime Launch Library path is unreachable in production | delete |
| src/types/spacex.ts:15 | fields from the old r/SpaceX API never rendered or always null | delete |

## Contested and refuted

The contested findings are the ones where the verifiers split. Most are one of two shapes. Nine are duplicates the judge caught that the skeptic still called real on their own merits, and they are folded into the entries above. Fourteen are prose rule hits on documents that predate the rule or are kept as dated records, where the verifiers agreed on the counts and disagreed on whether they count, and I have taken the position above. The remainder have some substance worth a line each. The saved preset draft test flake was agreed to be real but the first reader's cause (a remount) was wrong and the smooth scroll cause above is the one that held. The football freshness windows open on August 1 while the builder keeps a rolled over season, which the reproducer showed as a fresh verdict on a June snapshot and the skeptic argued cannot happen on the live path. The sitemap inventory test reads the wall clock, so a scheduled post breaks main's CI on its publish date, which the judge reproduced by pinning the clock and the skeptic called a known shape. The IndexNow submission script has no caller and no runbook, which the skeptic read as a deliberate manual step. The résumé PDF predates the Juno entry the page shows, which is already in docs/TODO.md. Fixed waits stand in for readiness signals in four specs, CI retries hide flaky tests because the job stays green on a flake, and the retained FEATURE_ROADMAP breaks every hard rule while calling itself historical.

The second half's 40 contested and 22 refuted findings follow the same shapes. Twelve more duplicates were caught inside their batches and folded above. Of the ones with substance, Ashby postings are dated from their last edit so an edited old role sorts as newest, which the skeptic argued the feed never does in practice. The March Madness Avg column's formula does not reproduce its figures, and /score-pools ships only the fictional Sample Cup because its two provider keys are unset, both of which docs/TODO.md already tracks. Injury notes carried forward from a previous score pools snapshot never clear. And the SpaceX snapshot builder keeps the last private file reader in scripts after the shared helpers landed.

The refuted findings are worth a word because they show the verification biting. A claim that Netlify's secrets scan skips the build output was refuted by running Netlify's own scanner. A claim that CSV exports leave spreadsheet formula triggers in cells was refuted by tracing every input to the export and finding none untrusted. A claim that 391 single use tags weaken related post scoring was refuted by running the scorer with and without them. Two e2e findings, a transit alerts click race and a hydration retry pattern, were refuted by running the helpers. And fifteen prose findings on specs, plans, and reviews that are explicitly marked superseded or historical were refuted on that ground.

## What I did not do

No browser was driven during this audit. The WebKit and Mobile Safari failures are diagnosed from the CI logs, the specs, and the components, and the proposed fixes have not been run through the matrix. Firefox was not part of any check. The product areas in the second half ran with every lens combined in one reader per area, so their coverage is lighter than the first half's, and that is a budget decision that says nothing about the code. The branch moved after October 26, and where a verifier found the cited code had changed the note says so, but I have not re-audited the newer state. External facts the branch's copy relies on, such as museum exhibition dates and tool pricing, were checked where a page could be fetched and not otherwise. The history size finding was measured on the worktree, not on a fresh clone, and the Netlify deploy list was read through the CLI, with the dashboard unopened. Nothing was changed in either tree, no workflow was dispatched, and no issue was touched.
