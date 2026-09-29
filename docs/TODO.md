# To do

These are the open items that need Isaac, either because they need an account, a dashboard, or a secret only he can set, or because they wait on something scheduled to run. Each one says why it's blocked and what finishing it looks like. When an item is done, delete it from this file in the same change. Last checked on 2026-09-28.

## Blocked on Isaac

- [ ] Let the publish check past Cloudflare. The `Verify the complete ledger` step in `publish-data.yml` calls `https://isaacvazquez.com/api/data-revisions`, and Cloudflare has been answering GitHub's runners with HTTP 403 since the #497 deploy, which opened incident #500 even though the deploy itself was fine. The same request from a laptop gets 200. The quickest fix is the secret the workflow already reads, which points the check at the Netlify origin, since `isaacvazquez.netlify.app` serves the same live deploy without Cloudflare in front. Run `printf '%s' "https://isaacvazquez.netlify.app/api/data-revisions" | gh secret set PRODUCTION_DATA_REVISION_URL -R IsaacAVazquez/Website`. The other route is a Cloudflare rule that lets the `WebsiteDataPublicationHealth/1.0` user agent through to `/api/data-revisions`. Either way, incident #500 closes itself on the next publish that passes.
- [ ] Add `THE_ODDS_API_KEY` and `API_FOOTBALL_KEY` as repository secrets. `update-score-pools.yml` passes both to `scripts/buildScorePoolsSnapshot.ts`, which has no fallback, so the score pools refresh keeps failing until they exist. Both need an account with the provider.
- [ ] Add `SPACEDEVS_API_TOKEN` as a repository secret. Without it the SpaceX refresh calls Launch Library 2 anonymously, which works on its free rate limit. A token needs a paid Patreon tier, so this one is optional.
- [ ] Register a `BART_API_KEY` and add it to the repository secrets and the Netlify environment. Until then `src/lib/bayAreaTransitData.ts` uses BART's public demo key, which works but is shared by everyone.
- [ ] Decide whether the Job Search email digest should come back. The public button was removed in #502, since a browser cannot hold the secret the route checks. Bringing the digest back means `MBA_DIGEST_SECRET`, `RESEND_API_KEY`, and `MBA_DIGEST_ALLOWED_RECIPIENTS` in the Netlify environment and a caller that sends the secret, such as `/admin` or a scheduled job. See `docs/ENVIRONMENT_CONFIGURATION.md`.

- [ ] Confirm the bio claims that shipped unconfirmed in #505. Haas@Work still reads as current on the résumé ("Jan 2026 to now") and feeds `profile.currentRole`, which becomes the Person schema's `worksFor`, and nobody has checked whether it ended in spring. `public/Isaac_Vazquez_Resume.pdf` is the April 2026 version with no Juno entry, and the newer résumés in `~/Desktop/Resumes` can't be read from the agent sandbox. The /now reading list is from spring 2026. About's "I'm most interested in products where people make decisions from data they need to be able to trust" was restored from the April copy. When his situation changes (an offer, or graduating in May 2027), sweep every time-bound line in one pass, from `Catalog97Home.tsx`, `Catalog97About.tsx`, the Contact subhead, /now, `AuthorBio.tsx`, and `profile.ts`, to `public/llms.txt`, the home Open Graph image, and the page metadata.
- [ ] Decide whether to publish the backdated Anthropic, Apple, and Microsoft company series. It lives uncommitted in the `Website-company-series` worktree, and the session writing it is holding it for that decision, since the repo is public and the pieces are backdated.

## Waiting on a scheduled run

- [ ] Confirm the `dashboard-snapshots` blob store fills. The #497 blob gate fix is live, and on 2026-09-28 `runtime-last-good` already held the Job Search keys, but `dashboard-snapshots` was still empty until the scheduled polling and frontier-model refresh functions run. Check with `NETLIFY_SITE_ID=212e9ee7-84c6-4db8-96f0-68780170c289 netlify blobs:list dashboard-snapshots --json`, then look for any "writeSnapshotBlob requires the Netlify runtime" errors left in the function logs.

## Open calls, not blocked

- [ ] The editorial notes on the frontier models added in #497 mostly restate the provider's own description, and could say what's actually different about each model.
- [ ] Whether to stop committing `public/sitemap.xml`. It drifts after every snapshot refresh and makes pull requests fail the sitemap check until main is merged back in.
- [ ] Delete the local `fix/lane-curated-finance` branch once it's no longer wanted. It holds the J.P. Morgan capital market matrix, which was left out of #497 because it's marked not for retail use or distribution. It was never pushed, so it exists only on this machine. The other lane branches were deleted on 2026-09-28 after their work was confirmed on main.
