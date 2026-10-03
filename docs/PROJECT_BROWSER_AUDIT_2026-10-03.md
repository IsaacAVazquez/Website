# Project browser audit

I tested the website on October 3, 2026 and found bugs in Safari hydration, trade calculator control sizing, and Fantasy Formula 1 persistence. The fixes and new browser coverage are in [pull request 559](https://github.com/IsaacAVazquez/Website/pull/559).

## Final results

The original full browser matrix had 59 failing test cases. After the fixes and added coverage, the final production run completed on October 3, 2026 at 07:30 UTC with 1,807 passed, 168 skipped, zero failed, and zero flaky tests. No test needed a retry. The build and browser scripts ran under Node 22.23.3.

| Browser profile | Passed | Skipped | Failed | Flaky |
| --- | ---: | ---: | ---: | ---: |
| Chromium | 392 | 3 | 0 | 0 |
| Firefox | 325 | 70 | 0 | 0 |
| WebKit | 349 | 46 | 0 | 0 |
| Mobile Chrome | 392 | 3 | 0 | 0 |
| Mobile Safari | 349 | 46 | 0 | 0 |
| Total | 1,807 | 168 | 0 | 0 |

The 168 skips are existing browser-specific conditions for print checks, Firefox SVG measurements, and layout checks assigned to Chromium. The expanded suite has 395 test cases across five browser profiles, for 1,975 scheduled cases.

The production build, lint, and TypeScript checks pass. I also ran 42 targeted unit suites under Node 22, with all 330 tests passing.

## Bugs I fixed

I found a shared Safari hydration bug across the dashboard pages. Node and WebKit printed the connector between the date and time differently, which made React replace the content sent by the server. I added a shared formatter that normalizes that connector and spacing while keeping the date, time, and timezone. I applied it to the shared timestamps, football fixtures, Formula 1, SpaceX, news, golf, museums, MBA jobs, polling, earthquakes, and weekly fantasy pages.

The trade calculator's native selects rendered at 22 pixels high in Safari despite their minimum-height class. I changed them to the shared Catalog 97 field style, and the browser check measures them at 48 pixels.

Fantasy Formula 1 saved selections in a passive effect after updating the screen, so an immediate reload could lose the edit. I moved it to the existing browser storage helpers, which commit before rendering, keep edits usable when durable storage fails, and receive changes from other tabs. The browser test now verifies reload persistence and synchronization between two tabs, and the unit tests cover blocked storage and merging another tab's edit into the next save.

## What I tested

I added 116 test cases, consisting of 89 URL checks and 27 workflow checks. The URL set includes 56 page paths discovered from the app directory and all 33 portfolio paths from the project catalog. The URL set includes portfolio redirects, and some paths resolve to the same tool.

Each discovered URL is checked in both themes at a 360 pixel viewport, with one heading, one main landmark, no page overflow, and no uncaught browser or hydration errors. The existing suite also checks project hydration in Los Angeles and Tokyo timezones and layout at wider screen sizes.

| Area | Browser coverage |
| --- | --- |
| Sports dashboards | Standings, club and player selection, detail API responses, tabs, and URL filters |
| Fantasy football | Scoring and position changes, search, queue and notes, trade persistence, redraft and best ball room state, weekly search, waiver availability, and mock draft actions |
| Fantasy Formula 1 | Add and remove assets, reload persistence, and synchronization between tabs |
| Investments and financial tools | Symbol search and validation, price fallback, research sections, retirement chart and print layout, calculator inputs, budget ledger, and rent versus buy persistence |
| Personal tools | Wine tasting edits and deletion, trips and journal entries, pantry ingredients, restaurant selection, museum visits, and travel deal inputs |
| Catalogs and planning tools | Search and empty states, saved catalog filters, decision sliders with keyboard input, and enablement intake |
| Operational dashboards | News views, earthquake and transit tabs, polling links, and SpaceX views |
| MBA tracker and arcade | Saved applications and status changes, game start, and keyboard hits |
| Site shell and content | Navigation, search, portfolio and writing pages, resume, accessibility checks, printing, themes, and reduced motion |

I corrected the new tests to wait for the tool's form controls to hydrate after each navigation and reload. The header and tool can hydrate separately, so the header alone was an insufficient readiness signal. Before deliberately reloading or replacing a document, the persistence tests also let background route prefetches finish. Earlier Safari runs reported canceled prefetches as page errors during those transitions.

## Live availability and limits

I checked the deployed [Netlify origin](https://isaacvazquez.netlify.app) separately on October 3, 2026 at 06:51 UTC, before publication of these fixes. Chromium passed all 89 URL checks. WebKit passed 59 and failed 30, covering 16 tool routes and portfolio aliases with hydration errors.

I also crawled 56 local page paths and checked 136 unique internal link destinations, with no broken responses.

The published mock draft rankings have a September 10, 2026 source date, so the freshness rule disables normal simulations. I verified that disabled state and tested pick, take-back, and completion actions with the real player data and a fresh timestamp fixture. Normal use still depends on a newer published source board.

The full suite runs against the production Next.js build. The mobile projects are browser device profiles, and I did not test physical phones. Some browser checks use controlled API responses or committed snapshots, so passing them does not establish that every external provider or scheduled refresh is working. I did not send emails, create newsletter subscriptions, or test the private draft companion extension.

## Reproducing the browser run

With Node 22 selected, build the production site before running the full matrix.

```sh
npm run build
CI=1 E2E_PORT=3100 npm run test:e2e:full -- --workers=3 --reporter=list,html
```

The new coverage is in [all-projects.spec.ts](../e2e/all-projects.spec.ts) and [project-workflows.spec.ts](../e2e/project-workflows.spec.ts). The local HTML results are in [playwright-report/index.html](../playwright-report/index.html).

## Publication and operational follow-up

I rebased the fixes onto the October 3 main branch before publication. That branch added the Before You Buy investment page and changed the decision lab reset label and enablement view controls. I updated the browser checks to use those controls, and all fifteen focused cases passed across the five browser profiles.

The rebased production matrix finished on October 3 at 08:46:41 UTC with 1,849 passed, 171 browser-specific skips, zero failed, and zero flaky tests. It scheduled 404 cases across five browser profiles, for 2,020 cases, and discovered 91 page and portfolio URLs. Chromium and Mobile Chrome each passed 401 cases, Firefox passed 333, and WebKit and Mobile Safari each passed 357. The final controlled application storage check also passed once in each profile. The pull request's build, lint, full unit suite, and all three Chromium browser shards passed before I added these operational notes.

The latest completed fantasy, investments, football, MLB, NFL, golf, transit, Formula 1, SpaceX, earthquake, polling, GitHub trending, and publication workflows were successful when I checked on October 3 at 08:35 UTC. A successful score pools run skips its refresh because the repository has neither `THE_ODDS_API_KEY` nor `API_FOOTBALL_KEY`. Live score pools data remains unavailable until both providers are configured.

The production polling blob was saved on October 2 at 18:45:20 UTC, and the frontier models blob was saved on October 2 at 07:30:33 UTC. Both scheduled stores are populated. The investment index has recent prices for all 151 symbols, with an October 1 market date. The fantasy refresh log confirms that the preseason draft and best ball lanes are frozen after the season opens, while the weekly lane keeps refreshing. That policy leaves the September 10 board too old for the mock draft's stricter freshness gate. A normal refresh will not make that simulation usable without a newer supported draft source.

I kept the four existing Formula 1 accent borders after reviewing their use for team liveries, session types, and error status. Their colors communicate data and status permitted by the design rules. The design detector exception is scoped to the `side-tab` rule in that file, and I added no rule-wide or file-wide suppression.

The production MBA jobs API returned 1,945 jobs fetched on October 3 at 06:53:34 UTC, with all 28 requested sources reporting success. The same providers were unavailable from the first GitHub browser runner, which returned a 503. The manual application persistence test now uses a controlled empty jobs response because its saved applications live in browser storage. I checked provider availability separately against production.

I attempted the single authorized delivery test. Resend rejected it with HTTP 403 because `isaacvazquez.com` is not verified, so no test email was delivered. Read-only API checks also returned HTTP 401 because the production key is restricted to sending emails, which blocks the newsletter route's contact creation. The protected MBA digest endpoint returns HTTP 503 because `MBA_DIGEST_SECRET` and `MBA_DIGEST_ALLOWED_RECIPIENTS` are absent. Domain verification, a contact-capable credential, and the digest's protected caller configuration remain account setup work.
