# Repository review, October 14, 2026

I reviewed the feature and fix commits from October 7 through October 12, including the job search workflow, article search, the project sweep, and both stages of the project redesign. I found five additional issues. I would address the private API access check first, then the saved data risks and the navigation regressions.

I preserved the existing uncommitted sports fixes and the October 12 audit. The five findings below record the original reproductions. I then fixed them and added regression tests for the saved data and navigation failures.

## Fixes on October 14

The normal development command now binds to loopback, and an explicit hostname override disables the private file bridge. The API validates the raw Host and Origin headers, rejects malformed arrays and invalid records, and uses a content hash for each revision. Sourcing reads the latest candidate and pipeline files after fetching, and its final write shares a lock with API saves. Interrupted writers leave a lock with recovery instructions, so recovery requires stopping writers before removing it.

AI Dev Tools and Food Map resolve the current empty query to their defaults. The NFL, NBA, and MLB drawers restore the selected team on browser history navigation. The existing sports edits remain in place. The earlier audit's ten other findings are outside this set of fixes.

## P1. Protect the private job search API with a real access boundary

The development route checks `request.nextUrl.hostname` against localhost addresses, but that value describes the request URL and does not identify the computer making the request. In the local Next development server, a request with `Host: 192.0.2.40:3014` passed this check. I requested the invalid file key `targets`, which returned the route's 400 validation response instead of its 404 access response, so this check did not reject the request. This reproduction did not read or write personal files.

The normal `PORT=3014 npm run dev` command used for this review bound to `0.0.0.0` and advertised a network address. If another client can reach that development server, this check cannot protect the private pipeline and candidates files. The route permits both reads and replacement writes. Production correctly returns 404, so this finding concerns the local development workflow.

The check is in [route.ts](/Users/isaacvazquez/Website/src/app/api/job-search/route.ts:35). Restrict the development server to loopback and use an explicit access credential if this private bridge needs to work through a network connection. A URL hostname allowlist alone cannot establish that a request came from this machine.

## P2. Preserve candidate decisions made during sourcing

The sourcing script reads the candidate and pipeline files before it waits for job boards, then writes the original candidate list after the fetch finishes. A dismissal, promotion, or new candidate saved during that interval can be overwritten even when the dashboard's own save succeeded.

I reproduced this with a temporary directory and a delayed, mocked job feed. After the script read a sourced candidate, I saved a newer dismissed copy to the file, then completed the feed request with no new jobs. The script changed that candidate back to sourced. No personal data was used.

The stale list is written in [dumpCandidates.ts](/Users/isaacvazquez/Website/scripts/jobSearch/dumpCandidates.ts:59), and its initial read is at line 40. Read the latest candidate and pipeline state after the fetch, and coordinate the final write with the API through a shared revision or lock so saved removals and decisions survive.

## P2. Reject malformed saves before replacing a private file

The job search API validates the revision but does not require `items` to be an array. Its sanitizer turns a missing, null, or non-array `items` value into an empty list, and the route replaces the entire file with that list.

I created a synthetic pipeline with one application, read its revision, and submitted a PUT containing only that revision. The route returned 200 and saved a pipeline with zero applications. A malformed request therefore has the same destructive effect as an intentional empty-list save.

The boundary validation is in [route.ts](/Users/isaacvazquez/Website/src/app/api/job-search/route.ts:90), and the replacement follows at line 97. Require an array before sanitizing its records, return 400 for an invalid envelope, and leave the file untouched on rejection.

## P2. Resolve empty query parameters from the current URL

AI Dev Tools and Food Map fall back to the server's `initialState` whenever the URL has no managed query parameters. Their redesign changed navigation to native history replacement, which updates the query without refreshing that server prop. Removing the last parameter restores the original deep link's state.

I reproduced two cases in the browser after hydration. Opening `/ai-dev-tools?category=terminal-agent` and clicking Reset cleared the URL, but Terminal agent remained selected and the page still showed four of sixteen tools. Opening `/ai-dev-tools?tool=cursor` and clicking Close cleared the URL, but the Cursor dialog stayed open. On `/food-map?city=tokyo`, choosing Austin changed the URL to `/food-map`, while Tokyo remained selected and the map still showed its four places.

The stale fallbacks are in [ai-dev-tools-client.tsx](/Users/isaacvazquez/Website/src/app/ai-dev-tools/ai-dev-tools-client.tsx:186) and [food-map-client.tsx](/Users/isaacvazquez/Website/src/app/food-map/food-map-client.tsx:536). Normalize the current query when it becomes empty after hydration. Decision Lab has the same source pattern at [decision-lab-client.tsx](/Users/isaacvazquez/Website/src/app/decision-lab/decision-lab-client.tsx:506), but I did not reproduce that route in the browser.

The existing client tests commonly pass the default initial state even for a nondefault query. Add cases that use the actual server state for a deep link, then clear its final parameter.

## P2. Restore sports team detail on browser history navigation

The sports drawers retain their own selected team ID, and browser history changes only the URL's team selection. The October 12 redesign removed the inline selected-team detail, which had previously displayed the selected team when the drawer was closed.

I reproduced this on NFL Pulse. I opened Ravens, closed the drawer, opened Jaguars, then pressed Back. The URL returned to `?team=bal` and the Ravens row became selected, but no dialog or inline team detail appeared. Reloading that same URL opened Ravens correctly. The drawer's local ID still referred to Jaguars, so its equality check prevented it from opening.

The gate is in [nfl-client.tsx](/Users/isaacvazquez/Website/src/app/nfl/nfl-client.tsx:248). MLB and NBA have the same gate in [mlb-client.tsx](/Users/isaacvazquez/Website/src/app/mlb/mlb-client.tsx:203) and [nba-client.tsx](/Users/isaacvazquez/Website/src/app/nba/nba-client.tsx:212). Synchronize drawer selection with history navigation, or include whether the detail is open in the route state.

## Existing findings and verification

The [October 12 audit](/Users/isaacvazquez/Website/docs/PROJECT_AUDIT_2026-10-12.md) documents ten other open issues, including Interchange IQ comparing different payment channels, expense dates being saved under the wrong budget month, candidate removals returning after a save conflict, and incorrect calendar or measurement intervals. That report remains the reference for those findings; the five above are additional findings from this pass.

After the fixes, all 443 Jest suites and all 4,201 tests passed. Lint, standalone TypeScript, and the production build passed, including the sitemap, essay export, and NFT postbuild steps. New regressions cover malformed saves, a file replacement during a read, concurrent candidate decisions, file locking, deep link resets, and drawer history.

Browser checks confirmed that Reset shows all sixteen tools, Close dismisses a tool opened from a deep link, and Austin replaces Tokyo after clearing the city parameter. Browser Back restored Ravens, Celtics, and Yankees detail on NFL, NBA, and MLB respectively. The browser reported no errors in those checks. The live private API accepted the default loopback request for validation, returned 404 for foreign Host and Origin headers, and stayed disabled after an explicit hostname override. These probes used an invalid file key and did not read or write personal records.

The checks ran with the installed Node 26.10.0 runtime. I did not run the full browser matrix. This review checked recent changes and selected interactions across the project tools; it does not establish that every control or provider fact is correct.

## Status on October 14, 2026

This review was written against a checkout from before #596, which by the evening of October 14 sat 199 commits behind main, so I checked each fix against current main before merging it. The three job search fixes went in as written, meaning the launcher that binds `npm run dev` to `127.0.0.1`, the Host and Origin checks, the 400 for a malformed save, the revision taken from the file's contents, and the write lock that the sourcing script shares with the API. The Food Map fix went in too, since main still kept Tokyo selected after Austin cleared the city, and its test fails without the fix.

Two fixes were left out because main already handles those cases. #596 made the URL the only source for AI Dev Tools, so Reset and Close already work there, and its tests cover both. On NFL, NBA, and MLB, a team's drawer shuts when Back changes the team in the URL, and a row is marked only while its drawer is open, so the half-selected row described above no longer appears. The history hook proposed here would have reopened a drawer whenever Back landed on a team in the URL, and a conference view's URL always names the team it selects, so Back from a drawer opened straight from that view opened the view's first team instead. A test now holds the board to shutting it. Decision Lab shares the source pattern but rebuilds its scenario from the browser's own URL on Back and Forward, so it does not show the problem, and a test covers that case too. The October 12 audit's own status section has where its ten issues stand, and nine of them were fixed in #596.
