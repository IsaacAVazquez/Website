---
version: 1
slug: "shell-tool"
primary_target: "shell:.tool-*"
related_targets:
  - "src/app/travel/travel-planner-client.tsx"
  - "src/app/wine-cellar/wine-cellar-client.tsx"
  - "src/app/museum-log/museum-log-client.tsx"
  - "src/app/recipe-finder/recipe-finder-client.tsx"
  - "src/app/travel-deals/travel-deal-lab-client.tsx"
  - "src/app/decision-lab/decision-lab-client.tsx"
  - "src/app/fintech-tools/budget-planner/budget-planner-client.tsx"
  - "src/app/fintech-tools/rent-vs-buy/rent-vs-buy-client.tsx"
  - "src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx"
---

# Tool shell brief

**Scope.** The shared `.tool-*` shell in `src/app/globals.css` (roughly lines
2500–2820): `.tool-shell`, `.tool-band`, `.tool-sidebar`, `.tool-nav-link`,
`.tool-card`, `.tool-card-hero`, `.tool-empty`, and the topbar/crumb furniture. It backs
the fintech calculators and the browser-persisted personal tools, about a dozen routes.
It is not its own component; it is a class contract that each client renders into.

**Visual world: The Working Instrument.** Unlike Catalog 97 and `/food-map`, the tool
shell has no independent token world. It is built on `--home-*` tokens and hairline
rules, so `DESIGN.md` governs it fully. Treat any `--home-*` rule as binding here.

**Visitor mode.** Operate. These are working tools, so scanability and the state of the
data outrank expression. The shell should be quiet and let the calculator or the list be
the loudest thing on screen.

**Settled 2026-08-13 (site-wide rollout, live Playwright).**

- **Radii are sharp now, and this was a real defect.** The shell had shipped 28px, 22px,
  20px, 14px, and 12px corners against the 10px Sharp Plate ceiling. It was
  pre-editorial drift, not a scoped aesthetic, because nothing here declared an
  exception and everything else is on `--home-*`. `.tool-shell`, `.tool-band`,
  `.tool-card`, `.tool-card-hero`, and `.tool-empty` moved to `var(--radius-3xl)` (8px);
  `.tool-brand-mark` to `var(--radius-3xl)`; `.tool-nav-link` to `var(--radius-2xl)`
  (6px); and the related `.section-panel` on `/mba-internship-notifications` to
  `var(--radius-3xl)`. The post-fix sweep of `/travel`, `/decision-lab`,
  `/fintech-tools/rent-vs-buy`, and `/mba-internship-notifications` measured zero card
  corners above 10px. **Do not reintroduce soft corners here.**

- **The label token was too light, fixed at the token level.** Field labels in the shell
  ("Home price", "Monthly income", "Itemize deductions") render `--home-ink-soft`, which
  was 45% ink and measured 2.88:1. That was fixed globally by raising `--home-ink-soft`
  to 66% ink, not locally in the shell, so do not add a shell-specific label color.

**Still open.**

- **The `.tool-shell` and `.tool-band` decorative signal gradients.** Both paint
  `radial-gradient` washes of `--home-signal-soft` and `--home-signal` at the corners.
  That violates the One Signal Rule, which bars the accent as a decorative background
  wash. It was left in place because removing it re-textures the whole family and is an
  aesthetic call, not a cleanup. **Decision needed:** either the washes come off and the
  shell earns its warmth from paper and hairlines like the rest of the system, or they
  are declared intentional shell character and this brief records them as an exception.
  Until then, do not add more accent washes.

- **`--home-ink-muted` on the shell's tinted plates.** On `/decision-lab` the
  recommendation kicker sits on a strong signal-soft tint and measures 3.91:1. This is
  the site-wide ink-muted-on-tint headroom issue, not shell-specific, and is tracked in
  the 2026-08-13 audit.

**Commands worth running.** `audit` and `critique` to find, then only what the findings
name. `quieter` is the candidate for the signal washes. Never `document` from here (it
would regenerate `DESIGN.md` from a shell, not the world).

**Tooling note.** `detect.mjs` returns nothing useful on these routes; they style
through Tailwind utilities and inline style objects it cannot read. Measure the live DOM
through Playwright. The parser must be sanity-checked against ink-on-paper (~16.3:1)
before any finding is believed, because this palette serves `color(srgb …)` and
`oklab()` values that a naive parser mis-resolves.
