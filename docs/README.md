# Documentation Index

Current map of tracked Markdown documentation.

**Last updated:** 2026-08-16

Tracked Markdown audit scope: `git ls-files '*.md'` returned 300 tracked files on 2026-08-16, split across `.agents/skills/` (104), `docs/` (51), `ds-bundle/` (44), `content/` outside the blog (44), the repository root (36), `.impeccable/` (15), and six elsewhere. Only the root and `docs/` files are website documentation, so the working set this index governs is about 87 files. Published articles are `.mdx` under `content/blog/` and are counted separately. Re-run the command rather than trusting these numbers.

The 2026-05-03 project coverage pass adds markdown snapshots for the remaining live portfolio projects listed in `src/constants/caseStudies.ts`.

---

## Current Source Of Truth

Start here for live implementation and agent context:

- `../AGENTS.md`
- `../CLAUDE.md`
- `../README.md`
- `../PAGES.md`
- `../COMPONENTS.md`
- `../ARCHITECTURE.md`
- `../API.md`
- `../DEVELOPMENT.md`
- `../TESTING.md`
- `../STYLING.md`
- `../DESIGN_CHECKLIST.md` (the single pre-merge UI checklist)
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
- `../SCORE_POOLS_ENGINE.md` — exact-score prediction engine behind `/score-pools` (`src/lib/scorePools/`)
- `FANTASY_DRAFT_MODEL.md` - fantasy draft and trade metrics, formulas, data limits, and validation contract
- `FANTASY_DRAFT_COMPANION.md` - private Chrome and Edge side panel build, installation, and operating limits
- `ARTICLE_IMAGE_WORKFLOW.md` - blog cover-image plan, the fetch builder, and the writing-time step

---

## Supporting Operational Docs

Use these when the task is specifically about setup, deployment, data operations, security, or troubleshooting:

- `../DEPLOYMENT.md`
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

Dated audits and research dossiers. Each one is a point-in-time snapshot rather than a live contract, so read the date in the title first and confirm anything still open against the code. Several carry fix backlogs that are partly worked through:

- `DESIGN_AUDIT_2026-06.md` (the audit `../DESIGN_CHECKLIST.md` is derived from)
- `DESIGN_REVIEW_2026-07.md`
- `REDESIGN_BRIEF.md`
- `dashboard-spatial-system.md`
- `component-reusability-audit.md`
- `accessibility-audit-2026-06.md`
- `DATA_SOURCE_AUDIT_2026-07.md` (data source fix backlog)
- `seo-aeo-audit.md`
- `SEO_CONTENT_MAP.md`
- `website-improvement-suggestions.md`
- `research/*` (World Cup 2026 contender dossier and rerank template)
- `web-design-research/*` (portfolio and web design reference reading, with its own `README.md`)

---

## Historical Or Reference Docs

These remain in the repo for context, but they should not be treated as live source-of-truth docs:

- `DATABASE_SCHEMA.md` (historical SQLite fantasy layer; no live `src/lib/database.ts`)
- `PLAYER_IMAGES_SETUP.md` (historical fantasy player-image workflow; referenced assets no longer exist)
- `FEATURE_ROADMAP.md`
- `PROJECTS.md`
- `UNDERUTILIZED_FEATURES.md`
- `superpowers/specs/*`
- `../content/*`
- `../public/project-screenshots/README.md`

Historical files should have an explicit banner where practical. If one conflicts with code or a current doc, trust the current doc and then the code.

The historical `../content/` tree now includes additional project and homepage-section snapshots to close documentation gaps. Those snapshots are still mirrors, not primary sources of truth.

---

## Bundled Skill Docs

The repo tracks 104 Markdown files under `../.agents/skills/**`.

These are bundled skill-library docs, not website implementation docs. They are included in the all-Markdown inventory, but they should not be rewritten during website documentation sync work unless they contain a repo-specific reference that directly contradicts `AGENTS.md`, `CLAUDE.md`, or this index.

Two more root files are owned by tooling rather than by this index, and a documentation sync pass should leave them alone unless the tool that owns them is the thing being changed. `../PRODUCT.md` and `../DESIGN.md` are the per-repository context files the impeccable design skill loads automatically, and `../DESIGN.md` carries the Working Instrument token frontmatter.

`../.impeccable/` holds that same skill's per-surface briefs and its dated critique output. Those are working artifacts, not documentation, and the critique files are written by the tool.

`../ds-bundle/` is the design-system bundle that feeds the synced design project. Its component `*.prompt.md` files are generated, but `../ds-bundle/guidelines/STYLING.md`, `DESIGN_CHECKLIST.md`, and `WRITING_VOICE.md` are plain copies of the three root files of the same name, and nothing regenerates them. The root files are canonical. When one of them changes, copy it over its bundle twin in the same pass, because a stale copy in there can hand the design project guidance the root file has already retired.

---

## Usage Guidance

- If a Markdown file conflicts with app code, trust the code.
- If a historical doc conflicts with a current doc, trust the current doc.
- For route truth, check `src/app/**/page.tsx`.
- For API truth, check `src/app/api/**/route.ts`.
- For shell and nav truth, check `StaticHeader.tsx`, `ConditionalLayout.tsx`, and `Footer.tsx`.
- For scripts, check `package.json` first.
- For styling, check `STYLING.md` and `src/app/globals.css`.
