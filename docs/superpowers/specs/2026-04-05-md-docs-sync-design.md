# Design: MD Documentation Sync

**Date:** 2026-04-05
**Status:** Approved

---

## Context

The codebase contains ~80 Markdown files. Several core documentation files were last updated 2026-03-17 and are now stale after significant recent changes:

- Premier League dashboard refactored from live API calls to snapshot-backed data
- La Liga dashboard added as a new product surface
- Shared `src/components/football/` component group created
- New football update scripts and a Netlify/cron-job.org auto-refresh pattern added
- New blog articles published
- Football route state regression fixed with new test patterns

Additionally, ~20 root-level MD files are one-time implementation summaries (SEO fixes, color updates, UX audits) that are no longer useful as ongoing reference but are cluttering the root directory.

**Goal:** Bring all documentation into sync with the current code state and reduce root-level noise by archiving stale one-time summaries.

---

## Approach: Triage-First Sync

Three-phase approach:
1. Archive legacy summary files to `docs/archive/`
2. Update stale core docs against current source code
3. Verify no broken cross-references

---

## File Classification

### Keep as-is (already current as of 2026-04-03)

- `README.md`
- `PAGES.md`
- `STYLING.md`
- `API.md`
- `CLAUDE.md`
- `WRITING_VOICE.md`
- `AGENTS.md`, `AGENT.md`
- `ACCESSIBILITY_AUDIT.md`
- `CHANGELOG.md`
- `DEPLOYMENT.md`, `DEPLOYMENT_GUIDE.md`
- `PERFORMANCE.md`, `PERFORMANCE_REPORT.md`, `PERFORMANCE-SEO.md`
- `GETTING-STARTED.md`
- `TROUBLESHOOTING.md`
- `DARK_MODE_USAGE_GUIDE.md`
- `FANTASY_RB_TIERS.md`, `NFLVERSE_INTEGRATION.md`
- `INVESTMENT_TRACKER.md`
- `SKILL.md`

### Needs update (stale — last modified 2026-03-17 or missing new features)

| File | What to update |
|---|---|
| `ARCHITECTURE.md` | Add La Liga surface, document snapshot-driven pattern, update major app areas table |
| `COMPONENTS.md` | Add `src/components/football/` shared component group |
| `DEVELOPMENT.md` | Add `npm run update:football`, per-league scripts, weekly workflow, Netlify auto-refresh, dotenv dep |
| `TESTING.md` | Document football route state regression test pattern |
| `docs/AUTOMATION_SCRIPTS.md` | Add PL + La Liga snapshot scripts with usage and timing |
| `docs/ENVIRONMENT_CONFIGURATION.md` | Add `FOOTBALL_DATA_API_TOKEN`, Netlify env var setup, cron-job.org hook |
| `docs/FEATURE_ROADMAP.md` | Mark shipped features (La Liga, snapshot football), refresh remaining roadmap |

### Archive to `docs/archive/` (one-time summaries, no ongoing reference value)

**SEO:**
- `AI_SEO_GUIDE.md`
- `README_SEO.md`
- `SEO_IMPROVEMENTS_2025.md`
- `SEO_IMPROVEMENTS_SUMMARY.md`
- `SEO_OPTIMIZATION.md`
- `SEO_IMPLEMENTATION_SUMMARY.md`
- `SEO_QUICK_WINS.md`
- `AI_OPTIMIZATION_SUMMARY.md`

**Theme/color/UI:**
- `COLOR_MODERNIZATION_SUMMARY.md`
- `CLAUDE_THEME_UPDATE.md`
- `DARK_MODE_QUICK_REFERENCE.md`
- `HOMEPAGE_IMPROVEMENTS.md`
- `OG_IMAGE_REQUIREMENTS.md`
- `OG_IMAGE_TEMPLATE.md`
- `UX_AUDIT_REPORT.md`
- `UI_UX_RESEARCH.md`
- `UI_UX_IMPLEMENTATION_PLAN.md`

**Feature/fix summaries:**
- `FANTASY_FIX_SUMMARY.md`
- `NFLVERSE_FIX_DOCUMENTATION.md`
- `IMPLEMENTATION_PROGRESS.md`

---

## Key Source Files to Read Per Update

| Doc to update | Source files to read |
|---|---|
| `ARCHITECTURE.md` | `src/app/` route structure, `src/data/premierLeagueSnapshot.ts`, `src/data/laLigaSnapshot.ts`, `scripts/buildPremierLeagueSnapshot.ts`, `scripts/updateLaLigaSnapshot.ts` |
| `COMPONENTS.md` | `src/components/football/` directory, `src/components/` top-level listing |
| `DEVELOPMENT.md` | `package.json` scripts section, `scripts/` directory |
| `TESTING.md` | `src/app/fantasy-football/**/*.test.*`, recent test additions |
| `docs/AUTOMATION_SCRIPTS.md` | `scripts/buildPremierLeagueSnapshot.ts`, `scripts/updateLaLigaSnapshot.ts`, `package.json` |
| `docs/ENVIRONMENT_CONFIGURATION.md` | `.env.example`, `CLAUDE.md` football section |
| `docs/FEATURE_ROADMAP.md` | `src/app/` for shipped routes, current `docs/FEATURE_ROADMAP.md` |

---

## Execution Order

1. `mkdir docs/archive/`
2. `git mv` each archive file to `docs/archive/`
3. For each stale file: read source → update doc
4. Grep active docs for references to archived file names and update or remove them
5. Spot-check that file paths mentioned in updated docs actually exist in `src/`

---

## Verification

- Each updated doc's file paths and component names resolvable via `grep` in `src/`
- `docs/archive/` contains all 21 moved files
- No remaining references to archived files in active docs
- No broken cross-references between ARCHITECTURE, COMPONENTS, DEVELOPMENT, TESTING
