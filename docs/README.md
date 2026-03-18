# Documentation Index

Current map of repo documentation.

**Last updated:** 2026-03-17

---

## Current Source Of Truth

Start here for live implementation context:

- `../AGENT.md`
- `../CLAUDE.md`
- `../README.md`
- `../PAGES.md`
- `../COMPONENTS.md`
- `../ARCHITECTURE.md`
- `../API.md`
- `../DEVELOPMENT.md`
- `../TESTING.md`
- `../STYLING.md`

AI-oriented technical references:

- `ai-context/PAGES.md`
- `ai-context/COMPONENTS.md`
- `ai-context/API-ROUTES.md`
- `ai-context/CONFIG.md`
- `ai-context/DATA-PIPELINE.md`
- `ai-context/HOOKS-AND-STATE.md`
- `ai-context/REDIRECTS-AND-NAVIGATION.md`
- `ai-context/SEO-AND-METADATA.md`
- `ai-context/STYLING.md`

---

## Supporting Operational Docs

- `ENVIRONMENT_CONFIGURATION.md`
- `DATABASE_SCHEMA.md`
- `FANTASY_PLATFORM_SETUP.md`
- `AUTOMATION_SCRIPTS.md`
- `CRON_SETUP.md`
- `SECURITY.md`
- `RELEASE_NOTES_2026-03-16_FINTECH_INVESTMENTS.md`

Use these when the task is specifically about setup, operations, or a documented release.

---

## Historical Or Planning Docs

These remain in the repo for context, but they should not be treated as live source-of-truth docs:

- `docs/plans/*`
- `docs/PROJECTS.md`
- `docs/UNDERUTILIZED_FEATURES.md`
- root-level SEO, UX, audit, and implementation-summary markdowns
- `content-redesign/*`
- non-live content reference/template markdowns under `content/`

Where possible, those files are marked with a historical banner and point back to the current docs above.

---

## Usage Guidance

- If a markdown file conflicts with the app code, trust the code.
- If a historical doc conflicts with a current doc, trust the current doc.
- For route truth, check `src/app/**/page.tsx`.
- For API truth, check `src/app/api/**/route.ts`.
- For shell and nav truth, check `StaticHeader.tsx`, `ConditionalLayout.tsx`, and `Footer.tsx`.
