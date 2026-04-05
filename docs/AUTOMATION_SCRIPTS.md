# Automation Scripts

Current inventory of the checked-in scripts and operational automations in this repo.

**Last updated:** 2026-04-05

---

## Scripts Directory

Current files under `scripts/`:

| File | Purpose |
| --- | --- |
| `buildFantasyPositionData.ts` | Build per-position fantasy data files |
| `buildFantasySnapshots.ts` | Generate static fantasy ranking snapshots |
| `buildInvestmentsSnapshots.ts` | Convert fetched investments data into curated static snapshots |
| `buildPremierLeagueSnapshot.ts` | Rebuild `src/data/premierLeagueSnapshot.ts` from football-data.org (~8 min) |
| `fetch_investments_data.py` | Pull raw investment data before snapshot generation |
| `generate-pwa-icons.mjs` | Rebuild icon assets |
| `patch-nft-sharp.mjs` | Postbuild patch step used after `next-sitemap` |
| `updateFantasyRBTiers.ts` | Refresh RB tiers data |
| `updateFootballSnapshots.ts` | Orchestrates full football refresh (both PL and La Liga); with `--league-only` flag runs standings-only fast path used in prebuild |
| `updateLaLigaSnapshot.ts` | Rebuild `src/data/laLigaSnapshot.ts` from football-data.org (~8 min) |
| `investments_symbols.txt` | Curated input list for the investments data workflow |

---

## NPM Entry Points

| Command | Underlying workflow |
| --- | --- |
| `npm run update:football` | Full football snapshot refresh — both PL and La Liga (~16 min) |
| `npm run update:premier-league` | PL snapshot only — `buildPremierLeagueSnapshot.ts` (~8 min) |
| `npm run update:investments` | Python fetch plus TypeScript snapshot build |
| `npm run update:fantasy-rb` | Fantasy position data + snapshot build |
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
