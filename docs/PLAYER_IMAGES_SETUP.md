# Player Images Setup

Current reference for the fantasy player-image asset system.

**Last updated:** 2026-03-17

---

## What Exists Today

The live fantasy UI uses checked-in player image assets and mapping files:

- image files under `public/player-images/`
- primary mapping in `src/data/player-images.json`
- team-change overrides in `src/data/player-team-updates.json`
- runtime resolver in `src/lib/playerImageService.ts`

These assets are already part of the repo and are used by fantasy UI components during rendering.

---

## Runtime Usage

Current usage points include:

- `src/lib/playerImageService.ts`
- `src/components/ui/LazyPlayerImage.tsx`
- `src/components/TierDisplay.tsx`
- `src/components/TierChartEnhanced.tsx`

The service normalizes player names and team abbreviations before mapping to a local image path.

---

## Important Limitation

There is no maintained `npm run scrape-player-images` command in the current `package.json`.

That means the repo currently documents a checked-in asset workflow, not a polished one-command refresh pipeline.

If player-image assets need to be refreshed:

- update the source files intentionally
- keep `src/data/player-images.json` aligned with `public/player-images/`
- verify the affected fantasy UI locally before shipping

---

## Validation Tips

- check image URLs in the browser network panel
- verify a few known players across different teams and naming variations
- confirm mobile layouts still work when images are present or missing

---

## Related References

- `docs/FANTASY_PLATFORM_SETUP.md`
- `docs/AUTOMATION_SCRIPTS.md`
- `src/lib/playerImageService.ts`
