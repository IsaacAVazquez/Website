# Performance Playbook

Current performance guidance for the live site, with emphasis on the routes that matter most: portfolio pages, investments, fantasy tools, and March Madness.

**Last updated:** 2026-03-17

---

## Current Performance Model

### Route structure

- The site uses the Next.js App Router with route-level metadata and a shared shell in `src/app/layout.tsx`.
- `src/components/ConditionalLayout.tsx` keeps default pages inside a constrained wrapper while self-shell routes manage their own spacing:
  - `/about`
  - `/contact`
  - `/investments`
  - `/march-madness-2026`
  - `/portfolio`
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
- `/march-madness-2026`
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
- Reintroducing horizontal overflow in chart-heavy or bracket-heavy routes
- Shipping large unoptimized images into homepage or portfolio surfaces
- Adding client-only dependencies to routes that can stay server-rendered

---

## Related References

- `ARCHITECTURE.md`
- `STYLING.md`
- `TESTING.md`
- `netlify.toml`
