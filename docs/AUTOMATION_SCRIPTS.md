# Automation Scripts

Current inventory of the checked-in scripts and operational automations in this repo.

**Last updated:** 2026-03-17

---

## Scripts Directory

Current files under `scripts/`:

| File | Purpose |
| --- | --- |
| `buildInvestmentsSnapshots.ts` | Convert fetched investments data into curated static snapshots |
| `fetch_investments_data.py` | Pull raw investment data before snapshot generation |
| `generate-pwa-icons.mjs` | Rebuild icon assets |
| `patch-nft-sharp.mjs` | Postbuild patch step used after `next-sitemap` |
| `updateFantasyRBTiers.ts` | Refresh RB tiers data |
| `investments_symbols.txt` | Curated input list for the investments data workflow |

---

## NPM Entry Points

| Command | Underlying workflow |
| --- | --- |
| `npm run update:investments` | Python fetch plus TypeScript snapshot build |
| `npm run update:fantasy-rb` | RB tiers update script |
| `npm run generate:icons` | PWA icon generation |

---

## Scheduled Automations

The repo also contains scheduled GitHub Actions and a Netlify scheduled function:

- `.github/workflows/update-fantasy-rb.yml`
- `.github/workflows/update-investments.yml`

- `netlify/functions/scheduled-fantasy-update.ts`

The GitHub workflow refreshes and commits:

- `public/data/investments/index.json`
- `public/data/investments/{SYMBOL}/snapshot.json`

The Netlify function calls:

- `/api/scheduled-update`

It is part of the fantasy refresh pipeline and depends on `CRON_SECRET`.

---

## Notes

- This repo does not currently contain the older “50+ script” automation surface described in previous docs.
- Treat `scripts/` as a small, task-focused toolkit tied to the current fantasy and investments workflows.
- If you add a new script, update this file and the relevant sections in `DEVELOPMENT.md`.

---

## Related References

- `docs/FANTASY_PLATFORM_SETUP.md`
- `docs/CRON_SETUP.md`
- `GETTING-STARTED.md`
- `DEVELOPMENT.md`
