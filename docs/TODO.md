# To do

These are the open items that need Isaac, either because they need an account, a dashboard, or a secret only he can set, or because they wait on something scheduled to run. Each one says why it's blocked and what finishing it looks like. When an item is done, delete it from this file in the same change. Last checked on 2026-09-28.

## Blocked on Isaac

- [ ] Add `THE_ODDS_API_KEY` and `API_FOOTBALL_KEY` as repository secrets. `update-score-pools.yml` passes both to `scripts/buildScorePoolsSnapshot.ts`, which has no fallback, so the score pools refresh keeps failing until they exist. Both need an account with the provider.
- [ ] Add `SPACEDEVS_API_TOKEN` as a repository secret. Without it the SpaceX refresh calls Launch Library 2 anonymously, which works on its free rate limit. A token needs a paid Patreon tier, so this one is optional.
- [ ] Register a `BART_API_KEY` and add it to the repository secrets and the Netlify environment. Until then `src/lib/bayAreaTransitData.ts` uses BART's public demo key, which works but is shared by everyone.
- [ ] Decide whether the Job Search email digest should come back. The public button was removed in #502, since a browser cannot hold the secret the route checks. Bringing the digest back means `MBA_DIGEST_SECRET`, `RESEND_API_KEY`, and `MBA_DIGEST_ALLOWED_RECIPIENTS` in the Netlify environment and a caller that sends the secret, such as `/admin` or a scheduled job. See `docs/ENVIRONMENT_CONFIGURATION.md`.

- [ ] Swap in Isaac's new résumé PDF when he finishes it, since he said on 2026-09-29 he'd hand it over then. `public/Isaac_Vazquez_Resume.pdf` is still the April 2026 version with no Juno entry. The /now reading list came out the same day until he has a current one, and the repo's history keeps the old list. When his situation changes (an offer, or graduating in May 2027), sweep every time-bound line in one pass, from `Catalog97Home.tsx`, `Catalog97About.tsx`, the Contact subhead, /now, `AuthorBio.tsx`, and `profile.ts`, to `public/llms.txt`, the home Open Graph image, and the page metadata.

- [ ] Open the print preview in a release Firefox and in Safari and look at `/about` and `/investments`. The print fixes of 2026-09-29 were measured in Playwright's headless builds of Firefox and in the system WebKit, and neither app was checked, since Firefox is not installed on the Mac the work ran on. In Firefox the check is that the pages hold their text with "Print backgrounds" on, and in Safari that the retirement planner prints as one column from a wide window.

## Waiting on a scheduled run

- [ ] Confirm the `dashboard-snapshots` blob store fills. The #497 blob gate fix is live, and on 2026-09-28 `runtime-last-good` already held the Job Search keys, but `dashboard-snapshots` was still empty until the scheduled polling and frontier-model refresh functions run. Check with `NETLIFY_SITE_ID=212e9ee7-84c6-4db8-96f0-68780170c289 netlify blobs:list dashboard-snapshots --json`, then look for any "writeSnapshotBlob requires the Netlify runtime" errors left in the function logs.

## Open calls, not blocked

- [ ] The editorial notes on the frontier models added in #497 mostly restate the provider's own description, and could say what's actually different about each model.
- [ ] Decide how the shared grids should print from Safari. From a desktop window Safari's engine still prints `.c97-columns`, `.c97-mosaic`, and the footer tiles in their desktop arrangement on a page about 700px wide, because they widen on `min-width` queries that it answers with the window's width. `/investments` names `print` on its own width rules. The shared grids would need their wide rules held to `screen`, and that also changes a landscape print in Chrome, which is wide enough to take them today. See "Printing on paper" in `STYLING.md`.
