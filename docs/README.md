# Documentation Index

Current map of tracked Markdown documentation.

**Last updated:** 2026-11-24

Tracked Markdown audit scope: `git ls-files -- '*.md' '*.mdx'` returned 438 tracked files on 2026-11-02, split across `content/blog/` (249 live articles), `content/changelog/` (59), `docs/` (55), `.impeccable/surfaces/` (51), the repository root (23), and `public/project-screenshots/README.md`. `ds-bundle/` is gitignored and not tracked. Only the root and `docs/` files are website documentation, so the working set this index governs is 78 files. On 2026-09-30 the same command returned 621. The cleanups of 2026-10-01 and 2026-10-02 then deleted old docs and the historical `content/` snapshots, and untracked `.agents/` and the Impeccable critique output. Re-run the command rather than trusting these numbers.

The 2026-05-03 project coverage pass adds markdown snapshots for the remaining live portfolio projects listed in `src/constants/caseStudies.ts`. As of 2026-11-02 those snapshots are gone, since the historical `content/` tree was deleted on 2026-10-02, and git history keeps them.

---

## Current source of truth

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

- `PROJECT_TOOL_WORKFLOWS.md` - the workflows added to the project tools from 2026-10-22 to 2026-10-24, from saved decisions, meal planning, trip costs and calendar export, transit commutes, own team records, and payment channel comparisons, to the budget, wine inventory, news history, and repository shortlist workflows, the frontier workload comparisons, and the saved rent scenarios, restaurants, flight quotes, Formula 1 lineups, and favorite teams
- `PROJECT_FOLLOWING_WORKFLOWS.md` - following and saved research on the developer tools, startup tracker, SpaceX, golf, polling, and earthquake routes
- `PROJECT_COMPARISON_WORKFLOWS.md` - saved retirement plans, score pool pick review, and the weekly agent index archive
- `../SNAPSHOT_DRIVEN_DASHBOARDS.md` - shared snapshot-driven dashboard architecture
- `../PERSONAL_INTEREST_TOOLS.md` - browser-persisted localStorage tools
- `../RETIREMENT_PLANNER_ENGINE.md` - pure retirement projection engine (`src/lib/retirement/`)
- `../SCORE_POOLS_ENGINE.md` - exact-score prediction engine behind `/score-pools` (`src/lib/scorePools/`)
- `BEFORE_YOU_BUY.md` - the comparison model and saved state behind `/investments/before-you-buy`
- `FANTASY_DRAFT_MODEL.md` - fantasy draft and trade metrics, formulas, data limits, and validation contract
- `FANTASY_DRAFT_COMPANION.md` - private Chrome and Edge side panel build, installation, and operating limits
- `FANTASY_FOOTBALL_KIT.md` - the stylesheet kit the eight fantasy football pages draw with, its cascade, and its shared parts
- `ARTICLE_IMAGE_WORKFLOW.md` - blog cover-image plan, the fetch builder, and the writing-time step
- `EASTER_EGGS.md` - every easter egg on the site, with its trigger, what it shows, and its code
- `JOB_SEARCH_PRIVATE_DATA.md` - private job-search pipeline contract, local directory structure (`private/job-search/`), ATS candidates extraction script, and development sync route
- `TODO.md` - open items that need Isaac or a scheduled run, each with why it is blocked

---

## Supporting operational docs

Use these when the task is specifically about setup, deployment, data operations, security, or troubleshooting:

- `../DEPLOYMENT.md`
- `../TROUBLESHOOTING.md`
- `CRON_SETUP.md`
- `DATA_UPDATE_OPERATIONS.md` (consolidated command → artifact → schedule runbook)
- `INVESTMENTS_DATA_SOURCES.md` (investments provider, licensing, provenance, and migration ledger)
- `ENVIRONMENT_CONFIGURATION.md`
- `EMAIL_DELIVERY.md` (the newsletter's Resend settings in Netlify)
- `FANTASY_PLATFORM_SETUP.md`
- `SECURITY.md` (day-to-day security operations)
- `../SECURITY.md` (the public vulnerability disclosure policy)

Historical release notes and changelogs:

- `../CHANGELOG.md` (a dated bullet for each merged pull request without the `skip-changelog` label, appended on `main` by `.github/workflows/changelog-on-merge.yml`)

Planning and strategy references:

- `content-plan-ai-mba-pm-cluster.md`
- `SEO_CONTENT_MAP.md` (the search intent each writing topic hub owns, the guardrails against articles competing for one query, and the checklist for adding an article)
- `superpowers/specs/2026-10-07-job-search-system-design.md` (job search system design specification)

Dated audits and research dossiers. Each one is a point-in-time snapshot rather than a live contract, so read the date in the title first and confirm anything still open against the code. Several carry fix backlogs that are partly worked through:

- `DESIGN_AUDIT_2026-06.md` (the audit `../DESIGN_CHECKLIST.md` is derived from)
- `DESIGN_REVIEW_2026-07.md`
- `codebase-audit-2026-10-02.md` (code correctness, security, persistence, and publication audit with verified repairs)
- `PROJECT_AUDIT_2026-10-12.md` (37 project surfaces checked after #595, with ten verified issues, nine of them fixed in #596 and the tenth, the Interchange IQ payment channel comparison, on 2026-10-22)
- `REPOSITORY_AUDIT_2026-11-03.md` (the whole repository at f591b5fff plus the project tools branch, 720 verified findings with 9 rated P1)
- `REPOSITORY_REVIEW_2026-10-14.md` (five more findings from a second look at the October 7 to 12 changes, with the job search and empty-query fixes merged, two left out because main already handled them, and three smaller problems still open)
- `accessibility-audit-2026-06.md`
- `research/world-cup-2026-top-ten.md` (the World Cup 2026 contender dossier, compiled 2026-06-08)
- `research/world-cup-2026-rerank-template.md` (the template and cadence plan for re-ranking the field as the tournament played out)

Older audits, roadmaps, and research reading were removed on 2026-10-01 and are still in git history.

---

## Historical or reference docs

These remain in the repo for context, but they should not be treated as live source-of-truth docs:

- `DATABASE_SCHEMA.md` (historical SQLite fantasy layer; no live `src/lib/database.ts`)
- `PLAYER_IMAGES_SETUP.md` (historical fantasy player-image workflow; referenced assets no longer exist)
- `FEATURE_ROADMAP.md`
- `PROJECTS.md`
- `PROJECT_PLATES.md` (where the Before You Buy plate image came from, with the prompt that made it)
- `dashboard-spatial-system.md` (the April 2026 note on the shared three-column tool layout, whose classes and tokens were deleted on 2026-09-27)
- `../public/project-screenshots/README.md`

The dated design specs and the one implementation plan under `superpowers/` record decisions as they were made. Each opens with its date and a status line, so read that first. The job search spec is listed under planning above.

- `superpowers/specs/2026-04-03-about-writing-voice-design.md` (the About copy pass, since superseded)
- `superpowers/specs/2026-04-05-md-docs-sync-design.md` (the one-time documentation sync of 2026-04-05)
- `superpowers/specs/2026-04-13-website-copy-improvements-design.md` (the site copy pass, whose target components were mostly rebuilt or deleted since)
- `superpowers/specs/2026-04-21-hot-topic-articles-design.md` (the four-article batch of 2026-04-21)
- `superpowers/specs/2026-06-08-food-map-multi-city-design.md` (the multi-city Food Map data and state model, shipped with the deviations its status line lists)
- `superpowers/specs/2026-09-16-catalog97-unification-design.md` (the move onto Catalog 97, complete on 2026-09-27)
- `superpowers/specs/2026-09-25-project-specific-ui-design.md` (the first per-project designs, complete on 2026-09-27 and replaced by the 2026-10-11 spec)
- `superpowers/specs/2026-10-11-project-sovereign-design.md` (project routes own their design inside the site frame, merged in #582 and #595, with its contract kept in the "Project routes" section of `../DESIGN_CHECKLIST.md`)
- `superpowers/specs/2026-10-13-fantasy-football-redesign-design.md` (the eight fantasy football routes rebuilt as one product, merged in #598 on 2026-10-14)
- `superpowers/specs/2026-10-18-about-resume-contact-design.md` (superseded on 2026-10-19 by the next spec)
- `superpowers/specs/2026-10-19-about-resume-contact-objects-design.md` (About, Résumé, and Contact as three objects, merged in #613 on 2026-10-19)
- `superpowers/plans/2026-10-19-about-resume-contact-objects.md` (the implementation plan for that spec)

Historical files should have an explicit banner where practical. If one conflicts with code or a current doc, trust the current doc and then the code.

The historical snapshots under `../content/` were deleted on 2026-10-02, and git history keeps them. `../content/` now holds only the live articles in `blog/` and the changelog entries that `/changelog` reads from `changelog/`.

---

## Bundled skill docs

`../.agents/` held the bundled skill-library docs until 2026-10-02, when it was untracked and added to `.gitignore`, so a checkout may still hold a local copy that is no longer part of this inventory. Those are skill-library docs, not website implementation docs, and website documentation sync work leaves them alone.

Two more root files are owned by tooling rather than by this index, and a documentation sync pass should leave them alone unless the tool that owns them is the thing being changed. `../PRODUCT.md` and `../DESIGN.md` are the per-repository context files the impeccable design skill loads automatically, and `../DESIGN.md` carries the Catalog 97 token frontmatter.

`../.impeccable/` holds that same skill's per-surface briefs, which are tracked under `surfaces/`, and its dated critique output under `critique/`, which has been gitignored since 2026-10-02. Those are working artifacts, not documentation, and the critique files are written by the tool.

`../ds-bundle/` is a gitignored local leftover from the design-sync tooling, which was retired and removed from the repository on 2026-10-01 along with `../.design-sync/`, so nothing in the repository builds it, reads it, or keeps it in step with the root files, and a documentation pass leaves it alone.

---

## Usage guidance

- If a Markdown file conflicts with app code, trust the code.
- If a historical doc conflicts with a current doc, trust the current doc.
- For route truth, check `src/app/**/page.tsx`.
- For API truth, check `src/app/api/**/route.ts`.
- For shell and nav truth, check `ConditionalLayout.tsx` and `Catalog97ToolShell.tsx`.
- For scripts, check `package.json` first.
- For styling, check `STYLING.md`, `src/app/globals.css`, and `src/app/catalog97.css`.
