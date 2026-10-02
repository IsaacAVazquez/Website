# Codebase audit, October 2, 2026

The 12 numbered findings are now repaired. [The repair record](#repairs-on-october-2-2026) includes the changes, an additional repeated-build cache fix, verification results, and remaining limits. The original audit follows.

I found 12 issues worth fixing, including three high priority issues in imported investment data and automatic draft controls. The existing verification passes, but it does not cover these failure cases. I would fix the three high priority issues first, then the saved data loss and fantasy publication problems.

I audited commit `14c9072b9e299d740a3ca99548f466ffb899bdab`. The repository had 2,389 tracked files, including 1,198 code files across the application, builders, functions, extension, and root configuration, with 62 page files and 26 API handlers. This was a repository wide review of the major subsystems, supported by automated checks and focused reproductions. It was not a manual line by line examination of every generated snapshot, article, asset, or source file.

Priority P1 means I would address the issue before relying on the affected feature. P2 means a reproducible correctness or reliability problem. P3 means a smaller boundary or maintenance issue. I made no application changes during the audit.

## Findings

### 1. P1, restored investment symbols can execute script in chart tooltips

[AllocationChart.tsx](/Users/isaacvazquez/Website/src/components/investments/AllocationChart.tsx:86) interpolates a holding symbol directly into `tooltip.innerHTML`. The holding decoder in [useInvestments.ts](/Users/isaacvazquez/Website/src/hooks/useInvestments.ts:65) accepts any nonempty symbol string, and [localDataBackup.ts](/Users/isaacvazquez/Website/src/lib/localDataBackup.ts:94) restores string values without validating their contents. A holding can receive a positive allocation from its cost basis even if its quote request fails.

The trigger requires importing a crafted backup and hovering over that holding's allocation slice. The symbol then becomes executable markup in the site's origin. Uppercasing the symbol does not prevent this. The review reproduced an executable event handler in an isolated DOM, and a separate test using the actual restore helper, investment hook, and chart confirmed that symbol markup becomes a nested tooltip element.

Build the tooltip with text nodes or `textContent`, and validate symbols at the storage boundary. Encoding belongs at the rendering boundary even when storage validation is present. Add a regression test that restores a symbol containing markup and verifies that the tooltip displays literal text.

### 2. P1, automatic drafting remains armed after switching draft rooms

The content controller in [autodraft-controller.ts](/Users/isaacvazquez/Website/extension/src/autodraft-controller.ts:433) checks whether it is armed and whether the page says the user is on the clock, but it does not bind that permission to a draft room. [autodraft-content.ts](/Users/isaacvazquez/Website/extension/autodraft-content.ts:55) stops the controller on `pagehide`, which does not occur during same document navigation.

I reproduced arming in one Sleeper room, changing the URL to another room with `history.pushState`, and presenting a valid player row there. The controller clicked Draft in the second room. The panel's existing target filtering does not constrain the content controller's clicks.

Record the provider and room identity when arming, disarm when either changes, and verify both before and after asynchronous waits and before every click. Add a test for same document navigation between room IDs. This reproduction used a synthetic provider page; it did not submit a real pick.

### 3. P1, automatic drafting confirms dialogs without matching the player

[findConfirmationButton](/Users/isaacvazquez/Website/extension/src/autodraft-controller.ts:308) returns the first enabled generic confirmation button from any visible dialog. Its caller at [line 498](/Users/isaacvazquez/Website/extension/src/autodraft-controller.ts:498) clicks that button without checking the selected player's identity, the number of matching dialogs, or whether the user remains on the same turn.

I reproduced a player row opening a dialog naming a different player. The controller still clicked Confirm. It then records the intended candidate as submitted even though the dialog did not establish that candidate was the one being drafted.

Require exactly one confirmation dialog that matches the candidate, recheck the room and turn before clicking, and reconcile the completed provider pick before treating submission as confirmed. Stop when the dialog is uncertain. The reproduction used a synthetic DOM.

### 4. P2, edits in a second tab can erase saved data

Several tools hydrate their data once and later write the entire stale value back to storage. I reproduced sequential lost updates in five places, completing the first write and its storage event before making the second edit.

| Tool | Source | Reproduced result |
| --- | --- | --- |
| Museum log | [useMuseumLog.ts](/Users/isaacvazquez/Website/src/hooks/useMuseumLog.ts:98) | A saved visit disappears after another tab likes a museum. |
| Investment portfolio | [useInvestments.ts](/Users/isaacvazquez/Website/src/hooks/useInvestments.ts:759) | An AAPL holding disappears after another tab adds MSFT. |
| Retirement plan | [useRetirementPlan.ts](/Users/isaacvazquez/Website/src/hooks/useRetirementPlan.ts:203) | A saved age of 42 returns to the stale age of 35 after another tab edits spending. |
| Redraft tracker | [useDraftState.ts](/Users/isaacvazquez/Website/src/app/fantasy-football/draft-tracker/hooks/useDraftState.ts:536) | A second tab's pick replaces the previously saved pick sequence. |
| Best ball tracker | [use-best-ball-draft.ts](/Users/isaacvazquez/Website/src/app/fantasy-football/best-ball/draft-tracker/use-best-ball-draft.ts:75) | A second tab's pick replaces the previously saved pick sequence. |

Subscribe to the persisted data itself and apply edits to the latest validated snapshot. The existing shared player stores, wine cellar, and score pools code provide patterns to reuse. For draft logs, add revision checks so two active controllers cannot silently overwrite each other. The recipe pantry has a similar pattern on source inspection, but I did not separately reproduce it and have not included it in the five confirmed cases.

### 5. P2, searching for constructor crashes the results view

[findHiddenAnswer](/Users/isaacvazquez/Website/src/app/api/search/route.ts:868) indexes a normal object without checking whether the requested key is an own property. The query `constructor` resolves to an inherited function. The handler spreads that function into its results and serializes an empty object as the first result.

A direct call to the real handler returned HTTP 200 with `results[0]` equal to `{}`. [SearchResults.tsx](/Users/isaacvazquez/Website/src/components/search/SearchResults.tsx:174) expects a title string and calls string operations on the missing value, causing a render failure.

Use a `Map`, an object with no prototype, or `Object.hasOwn` before returning a hidden answer. Add an API and rendering regression for `constructor`.

### 6. P2, slower search requests overwrite newer results

[SearchInterface.tsx](/Users/isaacvazquez/Website/src/components/search/SearchInterface.tsx:154) starts requests without cancellation or a request identity check. Every response updates the same result state at [line 163](/Users/isaacvazquez/Website/src/components/search/SearchInterface.tsx:163).

I reproduced requesting one query, requesting a second query, resolving the second response first, and resolving the first response last. The input still displayed the second query while the results changed to the first query. Clearing the input can also be followed by a pending response restoring the old results.

Abort obsolete requests and reject responses whose request identity no longer matches the active search. Also check `response.ok` before treating the response as search results. Keep loading and error updates subject to the same identity check.

### 7. P2, incomplete golf results can receive a fresh timestamp

[buildGolfSnapshot.ts](/Users/isaacvazquez/Website/scripts/buildGolfSnapshot.ts:51) restamps an existing leaderboard when the source reports no live event and the prior tournament end date is within 45 days. It does not check whether the retained results are final. A future end date also passes the age predicate.

If the last successful refresh captured an event in progress and the final refresh failed before ESPN switched events, the retained partial board can repeatedly appear fresh. An isolated harness ran an unchanged copy of the builder against a mocked no event response. A five player board marked In Progress, Round 4, and through hole 12 kept those results, received a new timestamp, and passed the actual freshness and minimum content checks.

Persist a verified completion flag and require it before restamping a final board. Preserve the old timestamp when completion is unknown, or fetch the previous event's final results before asserting that the retained board is current.

### 8. P2, rejected best ball output can advance committed sitemap dates

[update-fantasy.yml](/Users/isaacvazquez/Website/.github/workflows/update-fantasy.yml:485) restores redraft artifacts that fail their gates, but it leaves a rewritten `best-ball.json` on disk when the best ball quality gate fails. Successful weekly or redraft commits call [commit-and-push-snapshot.sh](/Users/isaacvazquez/Website/scripts/ci/commit-and-push-snapshot.sh:31), which regenerates and stages the sitemap from the working tree. [sitemap.js](/Users/isaacvazquez/Website/src/lib/sitemap.js:292) reads the rejected best ball timestamp from that file.

A best ball build can therefore fail its publication gate while another lane commits sitemap dates derived from its rejected output. This is a source traced workflow finding; I did not dispatch an Action or make a real commit.

Restore rejected best ball output before any lane invokes the commit helper, or generate the sitemap from the exact inventory being committed. Test the case where best ball writes a snapshot, fails its gate, and weekly publication succeeds.

### 9. P2, draft build timeouts can prevent a successful weekly board from publishing

The fantasy job has a [30 minute limit](/Users/isaacvazquez/Website/.github/workflows/update-fantasy.yml:30), while its sequential weekly, redraft, and best ball build limits total 35 minutes. Weekly publication does not happen until [the commit step](/Users/isaacvazquez/Website/.github/workflows/update-fantasy.yml:503), after the other builds and checks.

A successful five minute weekly build followed by the permitted 15 minute redraft timeout and 10 minute best ball timeout reaches the job deadline before it can publish, even before installation and verification time are counted. The soft failure settings cannot protect publication from the outer job timeout.

Publish validated weekly output before the slower draft lanes, or put the lanes in separate jobs. If the job stays sequential, its time budget must cover the step budgets and publication overhead. This finding follows from the workflow's execution order and limits; I did not wait through a real timeout.

### 10. P3, newsletter JSON null produces an unhandled exception

[subscribe/route.ts](/Users/isaacvazquez/Website/src/app/api/newsletter/subscribe/route.ts:39) casts the result of `request.json()` to an interface, then reads `payload.company`. Valid JSON `null` passes parsing and causes a null dereference outside the catch block.

A direct invocation of the real handler reproduced the exception. Validate that the parsed body is a nonnull object before inspecting its fields and return the existing HTTP 400 validation response for invalid shapes.

### 11. P3, weekly fantasy sitemap dates come from the preseason board

[sitemap.js](/Users/isaacvazquez/Website/src/lib/sitemap.js:63) dates both the weekly and waiver pages using `readFantasyLastmod`, which reads `ppr.json`. Those pages read `weekly.json`, and the weekly workflow can publish that file independently.

Add a weekly timestamp reader with a defined missing file fallback and use it for these two routes. Verify that changing only the weekly snapshot changes both sitemap dates. This finding was confirmed from the route and sitemap data paths.

### 12. P3, the lockfile contains a vulnerable development dependency

[package-lock.json](/Users/isaacvazquez/Website/package-lock.json:5831) pins `brace-expansion` 5.0.9. The npm advisory audit returned one high severity affected package and no critical packages. Its advisories concern recursion and CPU denial of service. Version 5.0.12 covers the reported patched ranges. [Recursion advisory](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [CPU advisory](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr).

This package is marked as a development dependency and is reached through development tooling such as minimatch and ESLint. I found no public request path that passes user input into it, so I have rated the application finding P3 despite the advisory's high severity rating. Update the lockfile through the package manager, inspect the resulting dependency change, and rerun the checks. I did not change dependencies or run forced remediation.

## Verification

The installed checkout contained package versions older than its lockfile, including Next.js 16.3.5 versus 16.3.6 and React 19.2.8 versus 19.3.0. Its initial build failed. I created an isolated copy from the audited commit, installed the committed dependencies with installation scripts disabled, and verified that copy without changing the checkout's dependencies.

| Check | Result |
| --- | --- |
| ESLint | Passed in the original checkout and the clean copy. |
| TypeScript | Passed in the original checkout and the clean copy. |
| Unit and coverage suite | All 402 suites and 3,256 tests passed in the clean copy. |
| Coverage | Statements 77.93%, branches 66.97%, functions 75.39%, lines 79.95%. |
| Production build | Passed with Next.js 16.3.6, including postbuild and a sitemap containing 309 routes. |
| Chromium end to end | 277 passed, three skipped. |
| Focused reproduction tests | Nine passing tests confirmed the two extension issues, five saved state cases, search response ordering, and imported symbol markup rendering. These tests assert the existing faulty behavior. |
| Direct API probes | Confirmed the malformed constructor search result and newsletter null exception without contacting the email provider. |
| Golf reproduction | Confirmed incomplete results were restamped and passed the existing freshness and content gates. |
| Dependency advisory audit | One high severity development package, zero critical packages. |

The clean build and full unit suite ran with Node 24.19.0, which satisfies the declared engine range. CI uses Node 22, so this was not an exact CI runtime reproduction. The initial sandboxed test failures disappeared when local server and subprocess access was enabled. One clean archive test required read only access to the source repository's commit metadata.

## Repairs on October 2, 2026

I implemented all 12 numbered repairs after the audit. The findings above describe the inspected commit, and this section records the resulting changes.

| Finding | Repair |
| --- | --- |
| 1 | Allocation tooltips use text nodes, and restored holdings validate symbols with the same shape check as the quote client. |
| 2 | The extension binds arming to a provider room identity and checks that identity during asynchronous work and before clicks. Navigation to a different room disarms the controller. |
| 3 | Confirmation requires one visible dialog identifying the selected player and one enabled affirmative action. Every click rechecks the room, turn, target, and dialog state. A confirmed pick requires a successful fresh provider log, the exact next pick, and the configured user slot. |
| 4 | Museum, portfolio, and retirement edits read the latest validated save and subscribe to changes. Both draft trackers save synchronously, subscribe to changes, and reject actions based on an older revision. Unsaved local picks survive a conflicting external save, with a visible warning and an explicit reset path. |
| 5 | Hidden search answers require an own property, so inherited dictionary keys cannot become malformed results. |
| 6 | Both search interfaces cancel obsolete requests and guard success, error, and loading updates. They also reject failed HTTP responses and clear pending state immediately. |
| 7 | Golf snapshots record provider completion. Restamping requires verified final results with a tournament end date between zero and 45 days ago. An incomplete board keeps its original timestamp. |
| 8 | The fantasy workflow restores rejected best ball output before either draft lane commits. |
| 9 | The fantasy workflow publishes the weekly board before the draft builds and has a 45 minute job budget for 35 minutes of build limits plus setup, checks, and publication. |
| 10 | Newsletter requests validate the parsed JSON object before reading fields and return HTTP 400 for invalid shapes. |
| 11 | Weekly and waiver sitemap dates read the weekly snapshot. Before that snapshot exists, they retain the defined fantasy date fallback. |
| 12 | The package manager updated the locked development dependency to brace-expansion 5.0.12. Its lockfile entry is the only dependency change. |

The regression tests cover the original failures and the failure paths found during repair review. A portfolio share edit now keeps an in-flight price request valid and calculates the resulting history entry from the latest quantities. The extension also rejects a dialog that opens during a provider read or scrolling. Draft tests cover missed notifications, batched picks, undo and redo, failed writes, recovery, and preservation of unsaved picks when another tab saves a different draft.

The draft revision checks protect sequential edits and missed notifications. They do not supply an atomic transaction across browser processes, so a truly simultaneous read and write in separate tabs remains an operating limit. Provider confirmation also depends on the configured draft slot and order. Authenticated provider pages remain untested with real picks.

I also reproduced a build failure beyond the numbered findings. A production build passed with an empty generated cache, but the next build failed inside webpack's cached symlink context hashing with an undefined hash. The raw stack identified `FileSystemInfo._resolveContextTsh` and `WasmHash._updateWithBuffer`. Production now uses content hash snapshot checks for module, resolution, and build dependencies, retaining filesystem caching and invalidation checks. Development keeps its default settings. [Webpack's snapshot options](https://webpack.js.org/configuration/other-options/#snapshot) describe these checks.

I verified the repairs with Node 22.23.3 and the installed versions from the lockfile. Independent reviews caught and resolved the pending quote, unsaved draft, and last click dialog cases described above.

| Final check | Result |
| --- | --- |
| Unit and coverage suite | All 405 suites and 3,335 tests passed. |
| Coverage | Statements 78.25%, branches 67.21%, functions 75.64%, lines 80.28%. |
| TypeScript and ESLint | Passed, including the changed extension and build configuration. |
| Production builds | Two consecutive builds passed with the generated cache retained, including postbuild and the 309-route sitemap. |
| Build configuration regressions | All 16 tests across three suites passed after the cache repair. |
| Chromium end to end | 277 passed, three skipped. |
| Extension and companion regressions | All 88 tests across 11 suites passed, and the final extension bundle built successfully. |
| Dependency advisory audit | Zero advisories across all severities. |
| Diff whitespace | Passed. |

The repairs remain uncommitted in the workspace. I did not dispatch refresh workflows, refresh provider snapshots, send messages or emails, submit a real provider pick, push, or deploy. The generated sitemap changed only the two weekly fantasy dates, and historical snapshot data remained unchanged.

## Coverage and limits

I reviewed the shared shell, navigation, search, content rendering, metadata, structured data, security headers, authentication, public API boundaries, and the major browser state paths. The data review covered the refresh registry and verifier, commit and publication helpers, fantasy and investment workflows, sports builders and accessors, scheduled functions, and the blob overlays. The client review covered the fintech engines, fantasy models and trackers, extension controls and synchronization, and personal tools. Automated route tests covered the shared layout and the product surfaces represented in the Chromium suite.

The publication ledger's use of committed fallback revisions is intentional and tested, so I did not treat its difference from mutable blob data as a bug. The financial engines disclose their simplifications, and I did not classify those disclosed assumptions as implementation failures. The shared storage code already supports subscribing to changes, so the saved state repairs can reuse it.

There are unresolved operating limits beyond the numbered findings. Authentication and other rate limits are held in process memory, as the source already documents, so their counters are multiplied across serverless instances and reset when instances restart. I did not load test that behavior or verify deployment edge limits. Several large client files also combine state, UI, persistence, and orchestration; I would split those concerns when fixing the affected behavior, but file size alone is not a correctness finding.

I did not run real data refreshes, contact email recipients, submit provider draft picks, deploy, inspect production secrets, scan the full Git history for secrets, verify every article's factual claims or license, or execute the Firefox, WebKit, and mobile test projects. External provider and authenticated browser behavior remain unverified. The audit is evidence about the inspected commit and tested paths, and passing checks do not establish that every path is defect free.
