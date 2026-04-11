# Performance Playbook

Current performance guidance for the live site, with emphasis on the routes that matter most: portfolio pages, investments, fantasy tools, football dashboards, standalone data tools, and March Madness.

**Last updated:** 2026-04-10

---

## Current Performance Model

### Route structure

- The site uses the Next.js App Router with route-level metadata and a shared shell in `src/app/layout.tsx`.
- `src/components/ConditionalLayout.tsx` keeps default pages inside a constrained wrapper while self-shell routes manage their own spacing:
  - `/about`
  - `/contact`
  - `/fantasy-football`
  - `/fantasy-football/draft-tracker`
  - `/fintech-tools/budget-planner`
  - `/investments`
  - `/la-liga`
  - `/march-madness-2026`
  - `/news-pulse`
  - `/polling-aggregator`
  - `/premier-league`
  - `/portfolio`
  - `/resume`
  - `/spacex-mission-control`
  - `/writing`

### Investments

- The investments UI is optimized around curated static snapshots in `public/data/investments`.
- The main page loads through `src/app/investments/investments-client.tsx`.
- Quote enrichment still uses live requests through `/api/investments/quotes`.
- Static asset caching for `public/data/investments/**` is configured in `netlify.toml`.

### March Madness

- `/march-madness-2026` is split into a server entry plus a client experience.
- Metadata and structured data render on the server.
- Deep-linkable client state keeps the interactive UI shareable without moving the entire route fully client-side.

### Football dashboards

- `/premier-league` and `/la-liga` read committed TypeScript snapshots at runtime.
- Avoid reintroducing live third-party API calls into page render or API handlers.
- Shared football components live in `src/components/football/` and should stay reusable across leagues.

### Standalone data tools

- `/news-pulse`, `/spacex-mission-control`, `/polling-aggregator`, and `/fintech-tools/*` are app-like routes with their own client islands.
- Keep heavy route-specific state, data normalization, and visual components out of the shared homepage/portfolio path.

### Fantasy football

- Fantasy routes mix API fetches, cached data, checked-in assets, and SQLite-backed helpers.
- Heavy datasets and player-image assets should stay out of shared marketing routes.

---

## Practical Checks

Use this loop before shipping UI or data-heavy changes:

```bash
npm run lint
npm test
npx playwright test
npm run build
```

Then spot-check:

- desktop and mobile nav behavior
- `/investments`
- `/premier-league`
- `/la-liga`
- `/march-madness-2026`
- one standalone data tool route
- one fantasy route
- one writing article

For browser-level inspection, run Lighthouse against a production build locally:

```bash
npm run build
npm run start
```

---

## Common Regression Areas

- Over-expanding shared layout wrappers or adding duplicate shell padding
- Turning static investments data back into many panel-level runtime requests
- Turning football snapshots back into live runtime provider calls
- Reintroducing horizontal overflow in chart-heavy or bracket-heavy routes
- Shipping large unoptimized images into homepage or portfolio surfaces
- Adding client-only dependencies to routes that can stay server-rendered

---

## Related References

- `ARCHITECTURE.md`
- `STYLING.md`
- `TESTING.md`
- `netlify.toml`
