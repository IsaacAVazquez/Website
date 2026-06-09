# Player Images Setup

Historical reference for a removed fantasy player-image asset workflow.

**Last updated:** 2026-06-08

---

## Status

The current app tree does not include the older player-image mapping system documented here previously:

- no `public/player-images/` directory
- no `src/data/player-images.json`
- no `src/data/player-team-updates.json`
- no `src/lib/playerImageService.ts`

`src/components/ui/LazyPlayerImage.tsx` still exists as a reusable image component, but it is not proof of an active fantasy player-image refresh pipeline.

---

## Current Fantasy Context

The live fantasy football surface is snapshot-backed:

- `npm run update:fantasy`
- `src/data/fantasyPositionData.generated.ts`
- `src/data/fantasySnapshotRevision.generated.ts`
- `public/data/fantasy/{ppr,half_ppr,standard}.json`
- `/api/fantasy-data`

If player images are reintroduced, document the new source files, refresh workflow, and runtime usage points in this file before treating it as an operational guide again.

---

## Related References

- `docs/FANTASY_PLATFORM_SETUP.md`
- `docs/AUTOMATION_SCRIPTS.md`
- `COMPONENTS.md`
