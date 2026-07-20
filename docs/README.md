# Documentation Index

Current map of tracked Markdown documentation.

**Last updated:** 2026-06-16

Tracked Markdown audit scope: `git ls-files '*.md'` returned 216 tracked files before the 2026-04-15 content coverage sync. That sync adds 16 new markdown files under `content/projects/` and `content/sections/`.

The 2026-05-03 project coverage pass adds markdown snapshots for the remaining live portfolio projects listed in `src/constants/caseStudies.ts`.

---

## Current Source Of Truth

Start here for live implementation and agent context:

- `../AGENTS.md`
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
- `../SEO.md`
- `../WRITING_VOICE.md`
- `README.md`

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

Subsystem references (current):

- `../SNAPSHOT_DRIVEN_DASHBOARDS.md` — shared snapshot-driven dashboard architecture
- `../PERSONAL_INTEREST_TOOLS.md` — browser-persisted localStorage tools
- `../RETIREMENT_PLANNER_ENGINE.md` — pure retirement projection engine (`src/lib/retirement/`)

---

## Supporting Operational Docs

Use these when the task is specifically about setup, deployment, data operations, security, or troubleshooting:

- `../DEPLOYMENT.md`
- `../GETTING-STARTED.md`
- `../PERFORMANCE.md`
- `../TROUBLESHOOTING.md`
- `AUTOMATION_SCRIPTS.md`
- `CRON_SETUP.md`
- `DATA_UPDATE_OPERATIONS.md` (consolidated command → artifact → schedule runbook)
- `INVESTMENTS_DATA_SOURCES.md` (investments provider, licensing, provenance, and migration ledger)
- `ENVIRONMENT_CONFIGURATION.md`
- `FANTASY_PLATFORM_SETUP.md`
- `SECURITY.md`

Historical release notes and changelogs:

- `../CHANGELOG.md`
- `RELEASE_NOTES_2026-03-16_FINTECH_INVESTMENTS.md`

Planning and strategy references:

- `SPRING_2026_ROADMAP.md` (current cross-site feature/fix roadmap)
- `2026-seo-opportunity-ai-tech-blogs.md`
- `content-plan-ai-mba-pm-cluster.md`
- `SPACEX_API_CODEBASE_README.md`

---

## Historical Or Reference Docs

These remain in the repo for context, but they should not be treated as live source-of-truth docs:

- `../ACCESSIBILITY_AUDIT.md`
- `../DARK_MODE_USAGE_GUIDE.md`
- `../DEPLOYMENT_GUIDE.md`
- `../FANTASY_RB_TIERS.md`
- `../INVESTMENT_TRACKER.md`
- `../NFLVERSE_INTEGRATION.md`
- `../PERFORMANCE-SEO.md`
- `../PERFORMANCE_REPORT.md`
- `DATABASE_SCHEMA.md` (historical SQLite fantasy layer; no live `src/lib/database.ts`)
- `PLAYER_IMAGES_SETUP.md` (historical fantasy player-image workflow; referenced assets no longer exist)
- `FEATURE_ROADMAP.md`
- `PROJECTS.md`
- `UNDERUTILIZED_FEATURES.md`
- `archive/*` (includes `archive/plans/*` — implementation plans that have shipped)
- `superpowers/specs/*`
- `../content-redesign/*`
- `../content/*`
- `../public/project-screenshots/README.md`
- `../src/app/admin/README_scoring_format.md`
- `../.open-next/assets/project-screenshots/README.md`

Historical files should have an explicit banner where practical. If one conflicts with code or a current doc, trust the current doc and then the code.

The historical `../content/` tree now includes additional project and homepage-section snapshots to close documentation gaps. Those snapshots are still mirrors, not primary sources of truth.

---

## Bundled Skill Docs

The repo tracks 104 Markdown files under `../.agents/skills/**`.

These are bundled skill-library docs, not website implementation docs. They are included in the all-Markdown inventory, but they should not be rewritten during website documentation sync work unless they contain a repo-specific reference that directly contradicts `AGENTS.md`, `CLAUDE.md`, or this index.

Root `../SKILL.md` is different: it is a repo-level skill entry and may be updated when the site copy or agent guidance changes.

---

## Usage Guidance

- If a Markdown file conflicts with app code, trust the code.
- If a historical doc conflicts with a current doc, trust the current doc.
- For route truth, check `src/app/**/page.tsx`.
- For API truth, check `src/app/api/**/route.ts`.
- For shell and nav truth, check `StaticHeader.tsx`, `ConditionalLayout.tsx`, and `Footer.tsx`.
- For scripts, check `package.json` first.
- For styling, check `STYLING.md` and `src/app/globals.css`.
