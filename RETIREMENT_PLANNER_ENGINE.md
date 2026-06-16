# Retirement Planner Engine

Technical reference for the retirement projection engine in
`src/lib/retirement/`. The engine is **pure and framework-free** (no React, no
DOM, no fetch) so it is unit-testable and could run server-side. The UI never
does math — it calls `project()` and renders the result.

**Last updated:** 2026-06-16

Surfaced as the `#retirement` band inside the investments dashboard
(`InvestmentsDashboard.tsx`), backed by browser-local state. Output is
**educational only** — see *Compliance* below.

---

## Entry points

`src/lib/retirement/index.ts`:

```ts
project(input: RetirementPlanInput, referenceYear?): RetirementResult
projectCore(input: RetirementPlanInput, referenceYear?): RetirementCore  // = RetirementResult minus `levers`
```

- **`projectCore`** is the **fast path**: deterministic projection + headline
  Monte Carlo + target number + verdict. The UI calls this synchronously so the
  verdict gauge and chart paint immediately.
- **`project`** = `projectCore` **plus** `computeLevers(...)`. The lever
  sensitivity analysis is heavier (many extra simulations), so the UI computes it
  **off the critical path** and fills the levers panel in after first paint.

Both return real (today's-dollar) figures for display; the engine computes
internally in **nominal** dollars and exposes real values alongside.

### Output shape (`RetirementResult`)

| Field | Meaning |
|------|---------|
| `expectedReturn`, `volatility` | Annualized nominal return + std dev **derived from the allocation** (not hardcoded) |
| `targetNestEgg` | Real-dollar nest egg needed at retirement: `netSpend / safeWithdrawalRate` |
| `safeWithdrawalRate` | SWR used for the target number (override or default) |
| `deterministic` | Single expected-return path: year-by-year `path`, balance at retirement, ending balance, `depletionAge` |
| `monteCarlo` | `successRate` (fraction funded through the horizon), per-year `bands` (p10–p90), balance triples, `medianDepletionAge` |
| `levers` | The four what-if dials (see below) — only on `project()` |
| `verdict` | `on-track` / `good` / `fair` / `at-risk`, tied to the user's own success threshold |
| `assumptions` | Meta for disclosure: CMA source + as-of + `cmaVerified`, expected return/vol, inflation, threshold, RMD start age |

---

## Module map

| Module | Responsibility |
|--------|----------------|
| `index.ts` | `project` / `projectCore` orchestration; verdict + target-number math; re-exports |
| `types.ts` | All input/output types. Inputs computed in nominal dollars, real exposed for display |
| `capitalMarketAssumptions.ts` | Dated per-asset-class CMAs (return + std dev). `CMA_SOURCE`, `CMA_AS_OF`, `CMA_VERIFIED` |
| `assumptions.ts` | `expandAllocation` (4 UI buckets → 6 CMA asset classes) and `computePortfolioAssumptions(allocation)` → blended `{ expectedReturn, volatility }` |
| `projection.ts` | `simulatePath` / `runDeterministic`: two-phase (accumulation/decumulation) single-path projection in nominal dollars |
| `monteCarlo.ts` | `runMonteCarlo`: N seeded lognormal return paths → success rate + percentile bands |
| `random.ts` | `mulberry32` seeded PRNG + `makeNormalSampler` (Box–Muller) — deterministic for a fixed seed |
| `tax.ts` | Account-aware withdrawals (`withdrawForYear`), effective tax by account type, RMD divisors + start age |
| `socialSecurity.ts` | Claim-age benefit factor, COLA, `FULL_RETIREMENT_AGE`, real benefit at age |
| `levers.ts` | The four sensitivity dials and their "how far to reach target" solving |
| `defaults.ts` | `createDefaultPlan`, `DEFAULT_TAX_RATES`, `DEFAULT_SAFE_WITHDRAWAL_RATE` |
| `format.ts` | `formatCurrency`, `formatCompactCurrency`, `formatPercent`, `formatScenarioCount` |

---

## How a projection runs

1. **Allocation → assumptions.** `computePortfolioAssumptions(input.allocation)`
   expands the four UI buckets (stocks/bonds/cash/other) into the six CMA asset
   classes and blends their per-class return/volatility into a portfolio
   `expectedReturn` + `volatility`. There is deliberately **no single "stocks do
   10%" constant** — the number always traces to dated, citable CMAs.

2. **Deterministic path.** `runDeterministic` walks one path from `currentAge` to
   `horizonAge`:
   `balance[t+1] = (balance[t] + contribution[t] − withdrawal[t]) · (1 + r[t])`.
   Accumulation adds contributions + employer match; decumulation withdraws to
   cover desired spend net of guaranteed income, applies account-aware taxes and
   RMDs, layers in Social Security / pension / part-time income, pre-Medicare
   healthcare (age < 65), and any lumpy expenses.

3. **Monte Carlo.** `runMonteCarlo` draws `simulations` (default **1,000**)
   lognormal return paths from `{ expectedReturn, volatility }` using the seeded
   `mulberry32` PRNG, then reports the **success rate** (fraction of paths funded
   through the horizon) and per-year **p10/p25/p50/p75/p90 bands**. Seeded, so a
   given input always yields identical output (unit-testable, stable UI).

4. **Withdrawal strategy** (decumulation), from `assumptions.withdrawalStrategy`:
   - `fixed-real` — fixed real spend (4%-rule mental model). Default.
   - `fixed-percent` — fixed % of the *current* balance (never depletes; income
     swings with the market).
   - `guardrails` — Guyton-Klinger inflation rule + capital-preservation /
     prosperity guardrails.

5. **Verdict + target.** `verdictFor(successRate, threshold)` ties the badge to
   the user's own success threshold; `targetNestEgg = netSpend / SWR`.

6. **Levers** (`project` only). Four dials, each reporting its marginal effect on
   the success rate and — where it's a clean single dial — how far to push it to
   reach the threshold: `save-more`, `retire-later`, `spend-less`, `more-stocks`.
   Lever rows run at the headline simulation count (`LEVER_SIMS = 1000`) so their
   absolute success figures agree with the gauge; only the threshold-solving
   binary search uses a cheaper `TO_REACH_SIMS = 250`.

---

## State and UI

- **State:** `src/hooks/useRetirementPlan.ts`, browser-local under localStorage
  key `retirement_plan` (mirrors `useInvestments`). Offers the live portfolio
  value as a one-click starting balance.
- **UI:** `src/components/investments/retirement/` — `RetirementPlanner` (shell),
  `RetirementInputs` / `RetirementFields` (progressive-disclosure inputs),
  `RetirementVerdict` (headline gauge), `RetirementProjectionChart` (D3
  confidence-band chart), `RetirementLevers`, `RetirementAssumptions` (editable
  assumptions footer), `RetirementDisclaimer`.
- **Headline vs. levers:** the verdict + chart use `projectCore` synchronously;
  the levers panel runs `computeLevers` off the critical path and fills in after
  paint.

---

## Capital market assumptions (unverified)

`capitalMarketAssumptions.ts` ships **illustrative** long-term (10–15yr) nominal
estimates shaped to align with published 2025 assumption sets (e.g. J.P. Morgan
LTCMA, Research Affiliates, Vanguard VCMM). They are **not yet pinned to a
primary source**:

```ts
export const CMA_AS_OF = "2026-06";
export const CMA_VERIFIED = false;   // flip to true only after re-pinning
```

Before relying on the figures, re-pin them to a current dated primary source,
update the numbers, **and** flip `CMA_VERIFIED` to `true` with the real source
string + as-of date. The UI already surfaces the source, the as-of date, and the
unverified state (spec §4.2, §9).

---

## Compliance (keep intact)

Output is **educational only, not financial advice.** The disclaimer
(`RetirementDisclaimer`), the honest "N of 100 scenarios" framing
(`formatScenarioCount`), and the assumption disclosure (source + as-of +
unverified state) are spec requirements (§9). Do not remove or soften them when
editing the engine or its UI.

---

## Testing

`src/lib/retirement/__tests__/retirement.test.ts` covers the pure engine. Because
everything is seeded and framework-free, assertions are exact — add cases when
changing projection math, tax/RMD logic, withdrawal strategies, or the lever
solver. The engine should never need DOM or network mocks.
