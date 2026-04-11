# Fantasy Update Cron Setup

Current reference for the scheduled fantasy football refresh flow.

**Last updated:** 2026-04-10

---

## What Exists Today

Two pieces work together:

- Netlify scheduled function: `netlify/functions/scheduled-fantasy-update.ts`
- protected API endpoint: `src/app/api/scheduled-update/route.ts`

The Netlify function calls the API endpoint with a bearer token.

Current schedule in the checked-in function:

- `0 8 * * 3`
- Wednesday at 08:00 UTC
- intended to align with midnight Pacific time during standard time

If the schedule changes, update the function file and redeploy.

---

## Required Environment Variables

- `CRON_SECRET`
- `URL` or `NEXTAUTH_URL`
- `FANTASYPROS_USERNAME`
- `FANTASYPROS_PASSWORD`

`CRON_SECRET` is required for both the Netlify function and any manual request to `/api/scheduled-update`.

---

## Auth Contract

Send:

```http
Authorization: Bearer <CRON_SECRET>
```

Without that header, both `GET` and `POST` return `401`.

---

## Useful Checks

### Readiness check

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/scheduled-update
```

### Manual run

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/scheduled-update
```

---

## What The Update Does

The scheduled update route:

- resolves the current fantasy week
- loops through fantasy positions
- fetches FantasyPros-backed rankings by scoring format
- persists position data through `/api/data-manager`
- generates overall rankings files through `DataFileWriter`

This is an operational workflow. Treat failures here as seasonal-data issues, not generic app outages.

This Netlify cron path is separate from the checked-in `npm run update:fantasy` / `npm run update:fantasy-rb` snapshot generation commands. Verify the exact route or script before assuming one fantasy refresh path updates every published artifact.

---

## Troubleshooting

- `401 Unauthorized`: `CRON_SECRET` missing or wrong bearer token
- `500` with credentials note: `FANTASYPROS_USERNAME` or `FANTASYPROS_PASSWORD` missing
- wrong target URL: `URL` or `NEXTAUTH_URL` not aligned with the deployed hostname

Related docs:

- `docs/FANTASY_PLATFORM_SETUP.md`
- `docs/ENVIRONMENT_CONFIGURATION.md`
- `docs/SECURITY.md`
