# Troubleshooting Guide

Common issues, quick diagnostics, and the documents/scripts that usually resolve them.

## 1. Installation or Build Fails

- **`npm install` errors** – Ensure Node v18+. Remove `node_modules` and reinstall; many packages rely on optional native bindings (better-sqlite3). Use `npm install --build-from-source better-sqlite3` if prebuild download fails.
- **`next build` fails on TypeScript errors** – Run `npm run lint` first to surface issues in isolated components. Check `tsconfig.json` paths when moving files.
- **Missing environment variables** – Copy `.env.example` to `.env.local` (see `GETTING-STARTED.md`). Undefined keys cause runtime errors in API routes.

## 2. API & Data Layer Issues

- Run `npm run dev` and hit `http://localhost:3000/api/fantasy-data` to confirm sample data loads. See `API.md` for endpoint descriptions.
- If SQLite queries fail, make sure `fantasy-data.db` exists and matches the schema outlined in `docs/DATABASE_SCHEMA.md`.
- Automation scripts (documented in `docs/AUTOMATION_SCRIPTS.md`) log to the console; rerun with `DEBUG=1` for verbose output.

## 3. UI/Rendering Problems

- Components stuck in loading states usually indicate Suspense boundaries waiting on fetches. Check the server logs for warnings.
- Broken layouts? Tailwind tokens are defined in `globals.css` and `tailwind.config.ts`. Restart `npm run dev` if new tokens are added.
- Check `src/app/layout.tsx` for global providers (Theme, Analytics, Metadata). An invalid import there will blank the entire app.

## 4. Deployment / Netlify

- Confirm the build command is `npm run build` and the publish dir is `.next`. See `DEPLOYMENT_GUIDE.md` for the Netlify UI screenshots.
- If environment variables differ between local and production, update Netlify’s site settings and redeploy.
- Use the Netlify UI log search for `next-sitemap` to confirm the sitemap step ran.

## 5. Helpful References

- `GETTING-STARTED.md` – environment setup.
- `DEVELOPMENT.md` – full-stack architecture and tooling.
- `docs/ENVIRONMENT_CONFIGURATION.md` – secrets management, CI variables.
- `docs/FANTASY_PLATFORM_SETUP.md` – data ingestion and cron jobs.
- `docs/AUTOMATION_SCRIPTS.md` – automation entry points + clean-up tasks.
