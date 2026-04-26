# Design & UX Audit — Status & Remaining Work

**Originally audited:** 2026-04-25
**Last updated:** 2026-04-26
**Scope:** Full application — all routes, shared components, global shell

This document tracked every design, styling, UI/UX, and accessibility issue found across the site. After five remediation PRs the audit is essentially complete; this revision keeps the original IDs and shipped log so future audits can cross-reference.

---

## Status Summary

| Bucket | Total | Shipped | No-op / superseded | Outstanding |
|---|---|---|---|---|
| **P0** | 30 | 30 | 0 | 0 |
| **P1** | 39 | 31 | 7 | 1 |
| **P2** | ~60 | 39 | 11 | ~10 |

**Shipped via:**
- **PR #88** — P0 pass (shell, writing, dashboard cross-cuts, fantasy/fintech/MBA P0s)
- **PR #89** — P1 pass (shell, writing, portfolio, investments, MM, dashboards, fantasy/fintech/MBA P1s)
- **PR #90** — Deferred items (DB-5 aria-controls, PA-4 polls dedup, SX-2/3 backoff + validation, NP-4 pagination, MM-5/PL-3 URL state, AW-4 button cleanup, AW-6 contrast bump)
- **PR #91** — P1 cleanup (PL-4 empty/error states, PA-3 polling aria-live, NP-3 dropdown verification + polish, AW-5 legacy token policy banner)
- **PR #92** — P2 polish (shell + pages + writing + investments + MM + dashboards + fantasy + fintech + MBA — see commit log for the per-section breakdown)

---

## Severity Legend

| Tag | Meaning |
|-----|---------|
| **P0** | Broken or inaccessible — ships nothing until fixed |
| **P1** | Clear design/UX bug — fix before next release |
| **P2** | Polish or consistency — tackle in a dedicated pass |

---

## 1. Outstanding P1 Items

| # | Issue | Surface | File | Notes |
|---|-------|---------|------|-------|
| CT-1 | No contact form exists — only email and LinkedIn CTAs. Either implement with labels/validation/error/success states or document the links-only choice. | Contact | `src/components/ContactContent.tsx` | Product decision required before implementation. |

---

## 2. Outstanding P2 Items

These either need a meaningful refactor or a tooling/data shape change before they're worth doing — left as deliberate follow-ups rather than backlog rot.

| # | Issue | Surface | Why deferred |
|---|-------|---------|--------------|
| WR-13 | No syntax-highlighting plugin in remark/rehype pipeline | Writing | Adds a dep (shiki/prism); needs theme integration with editorial palette |
| WR-14 | No footnote plugin configured — `[^1]` renders as plain text | Writing | Same as WR-13 — its own remark plugin PR |
| MM-8 | Injury cards lack severity badge | March Madness | Needs a `status` field on `InjuryEntry`; current `note` is unstructured prose |
| PL-5 | Zone pill style (`getZonePillStyle`) duplicated between PL and La Liga | PL/LL | Each league has different zone cutoffs (PL 4/5/6/7 vs LL 4/5/6); a real shared util needs a config-driven API |
| LL-4 | `getClubStoryline` / `getClubPressurePoints` copy-pasted from PL | PL/LL | Same as PL-5 — leagues hold different storyline copy and ranking inputs |
| FF-16 | Filter state (selected position) not URL-persisted in DraftBoard | Fantasy | Requires lifting state to the page + URL params (moderate refactor) |
| FF-19 | `draftPlayer()` maps over all teams on every pick — O(n²) for 200+ picks | Fantasy | Theoretical perf concern at scale; measure first before refactoring storage |

Everything else flagged P2 in the original audit is either shipped (PR #92) or already resolved by code that landed in another PR — see "No-ops" below.

---

## 3. No-ops / Superseded by Other Fixes

These were tagged in the original audit but either don't apply to current code or were resolved by another fix. Kept for traceability so future audits don't redo the analysis.

| # | Original concern | Why it's not actionable |
|---|------------------|-------------------------|
| F1-1 | Inline `MetricCard` may double-apply border/shadow. | DB-1 fix removed the inline `MetricCard` — F1 now imports the shared one. |
| F1-3 | Gradient inline styles don't adapt to dark mode. | Gradient already uses `--home-paper`/`--home-paper-alt`/`--home-haze`, all of which flip via the `.dark` class. |
| FC-3 | Shared `MetricCard` has no `variant` prop. | Resolved by DB-1: the shared component now accepts optional `icon`/`detail` props that cover the F1 variant. |
| DB-4 | `<p class="home-kicker">` used where `<h3>`/`<span>` belongs. | Kicker is intentional — typographic label, not a document-outline heading. Promoting to `<h3>` would fragment the outline. |
| FF-2 | "No dark mode CSS — page renders broken in dark mode." | All `--home-*` variables flip via `.dark`, so `color-mix()` values adapt automatically. Smoke test confirms. |
| FF-4 | `EnhancedPlayerCard` broken image fallback. | Component no longer exists post-fantasy overhaul (PR #86). |
| FF-7 | "Two h1s, no `<main>` landmark." | `ConditionalLayout` provides `<main>`; only one h1 in the current code. |
| FF-8 | Draft tracker no `<main>` or `<aside>` landmarks. | Same — `ConditionalLayout` wraps it. |
| FF-9 | Search cleared on position change but text stays. | Current code preserves search across position changes. |
| FF-10/11/14/15 | RB tiers chart concerns. | `/fantasy-football/rb-tiers` is a redirect; chart files don't exist post-overhaul. |
| FF-18 | Undo history not persisted to localStorage. | `draftState.undoHistory` is part of the saved state object — already persists. |
| FF-21 | `getPositionTone()` duplicated in three files. | Already a single export in `src/lib/fantasyUtils.ts` post-overhaul. |
| MB-5 | Sort dropdown focus return. | Radix `DropdownMenu` already returns focus to the trigger on close. |
| MB-8 | Email digest endpoint no client-side throttle. | Trigger button + dialog submit both disable on `emailSending`. |
| IN-6 | Quote cache age not surfaced. | Already surfaced via `DataFreshnessIndicator` in `PortfolioTracker`. |
| IN-9 | Edit/delete buttons hidden behind hover. | Buttons are already always visible (audit out of date). |
| NP-5 | Sentiment / readability recalculated on every render. | Already wrapped in `useMemo`. |
| AW-12/HP-2/WR-9 | Reduced-motion gaps on theme toggle / home reveal / writing transitions. | `globals.css`'s `prefers-reduced-motion` `*` rule reduces animation-duration + transition-duration to 0.01ms. |
| AW-13 | Footer external links missing `rel=noopener noreferrer`. | Social links already have it. |
| AW-14 | Mobile menu hover/active states differ from desktop. | Intentional design choice — popover quiet vs. acid bar. |
| DB-8 | F1 reduced-motion gap; News Pulse `fadeIn` FOUC. | F1 has no Framer Motion; News Pulse `fadeIn` is gated on `useReducedMotion()`. |
| SX-4 | `color-mix()` gradient has no fallback for older browsers. | Browsers without `color-mix` support degrade to no-gradient solid background — graceful. |

---

## 4. Suggested Next Steps

1. **Make a CT-1 call** — decide between a contact form and the current links-only treatment. If form, scope a small PR with labels/validation/server action; if links, drop a one-line comment in `ContactContent.tsx` documenting the choice and close out the audit.
2. **Run an axe / Lighthouse pass** on every surface to verify the contrast and WCAG margins ended up where we wanted (especially IQ-7 "Cheapest" badge, MB-11 notification badge, AW-6 `--text-tertiary`).
3. **WR-13 syntax highlighting + WR-14 footnotes** — bundled remark-plugin PR. Pick one lib (shiki for highlighting, remark-gfm covers most footnote needs).
4. **Optional refactor PR** for PL-5/LL-4/FF-16 — config-driven shared zone helper + URL state for the draft board filter.
