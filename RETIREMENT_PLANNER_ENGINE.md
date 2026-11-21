# Retirement Planner Engine

Technical reference for the retirement projection engine in
`src/lib/retirement/`. The engine is **pure and framework-free** (no React, no
DOM, no fetch) so it is unit-testable and could run server-side. The UI never
does math. Its hook, `useRetirementPlan`, calls `projectCore()` and
`computeLevers()`, and the components render the result.

**Last updated:** 2026-11-16

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
  Only the engine tests call `project()`, since the hook runs `projectCore` and
  `computeLevers` separately.

Both return real (today's-dollar) figures for display; the engine computes
internally in **nominal** dollars and exposes real values alongside.

`referenceYear` is the current calendar year. The engine subtracts the current
age from it to get the birth year behind the RMD start age, and it falls back to
`DEFAULT_REFERENCE_YEAR` (2026) when left out. The hook passes
the current year in the site's display time zone, `America/Los_Angeles`, so the
server render and the browser agree on it.

### Output shape (`RetirementResult`)

| Field | Meaning |
|------|---------|
| `input` | The plan the result was computed from |
| `expectedReturn`, `volatility` | Annualized nominal return + std dev **derived from the allocation** (not hardcoded) |
| `targetNestEgg` | Real-dollar nest egg needed at retirement: `netSpend / safeWithdrawalRate` |
| `safeWithdrawalRate` | SWR used for the target number (override or default) |
| `deterministic` | Single expected-return path: year-by-year `path`, balance at retirement, ending balance, `depletionAge` (the first shortfall year under `fixed-percent`) |
| `monteCarlo` | `simulations` (the trial count), `successRate` (fraction funded through the horizon), per-year `bands` (p10–p90), balance triples, `medianDepletionAge` |
| `levers` | The four what-if dials (see below) — only on `project()` |
| `verdict` | `on-track` / `good` / `fair` / `at-risk`, tied to the user's own success threshold |
| `assumptions` | Meta for disclosure: CMA source + as-of + `cmaVerified`, expected return/vol, inflation, threshold, RMD start age |

---

## Module map

| Module | Responsibility |
|--------|----------------|
| `index.ts` | `project` / `projectCore` orchestration; verdict + target-number math; re-exports |
| `types.ts` | All input/output types. Inputs are in today's dollars, and outputs carry real values beside the nominal ones the engine computes |
| `capitalMarketAssumptions.ts` | Dated per-asset-class CMAs (return + std dev), the pairwise correlation matrix read through `correlation`, and `CMA_SOURCE`, `CMA_AS_OF`, `CMA_VERIFIED` |
| `assumptions.ts` | `expandAllocation` (4 UI buckets → 6 CMA asset classes) and `computePortfolioAssumptions(allocation)` → blended `{ expectedReturn, volatility }` |
| `projection.ts` | `simulatePath` / `runDeterministic`: two-phase (accumulation/decumulation) single-path projection in nominal dollars |
| `monteCarlo.ts` | `runMonteCarlo`: N seeded lognormal return paths → success rate + percentile bands |
| `random.ts` | `mulberry32` seeded PRNG + `makeNormalSampler` (Box–Muller) — deterministic for a fixed seed |
| `tax.ts` | Account-aware withdrawals (`withdrawForYear`), effective tax by account type, RMD divisors + start age |
| `socialSecurity.ts` | Claim-age benefit factor (`socialSecurityClaimFactor`), `FULL_RETIREMENT_AGE`, and `otherIncomeRealAtAge` (Social Security, pension, and part-time income at an age, in today's dollars). `projection.ts` applies the COLA |
| `levers.ts` | The four sensitivity dials and their "how far to reach target" solving |
| `defaults.ts` | `createDefaultPlan`, `DEFAULT_TAX_RATES`, `DEFAULT_SAFE_WITHDRAWAL_RATE`, `FIXED_PERCENT_SPEND_FLOOR` |
| `persistence.ts` | `decodeRetirementPlan`, which repairs a stored plan field by field, clamping each number to a range, falling back to `createDefaultPlan()` values, and keeping the retirement age above the current age and the horizon above the retirement age |
| `format.ts` | `formatCurrency`, `formatCompactCurrency`, `formatPercent`, `formatScenarioCount` |

Other surfaces import two of these modules directly. `/score-pools`,
`/fintech-tools/rent-vs-buy`, and `/tech-startup-tracker` use `format.ts`, and
the `/fantasy-football/mock-draft` pick logic seeds its randomness with
`mulberry32` from `random.ts`, so a change to either module reaches past the
planner.

---

## How a projection runs

1. **Allocation → assumptions.** `computePortfolioAssumptions(input.allocation)`
   expands the four UI buckets (stocks/bonds/cash/other) into the six CMA asset
   classes, with stocks split 55% US large-cap, 30% international developed, and
   15% emerging markets, bonds as US aggregate bonds, cash as cash, and other as
   real assets, and it rescales the weights when the buckets do not sum to 100.
   It then blends their per-class return/volatility into a portfolio
   `expectedReturn` + `volatility`, the volatility through the pairwise
   correlation matrix. There is deliberately **no single "stocks do
   10%" constant** — the number always traces to dated, citable CMAs.

2. **Deterministic path.** `runDeterministic` walks one path from `currentAge` to
   `horizonAge`:
   `balance[t+1] = (balance[t] + contribution[t] − withdrawal[t]) · (1 + r[t])`.
   Accumulation adds contributions + employer match, each growing at the
   account's `contributionGrowth` (inflation when unset); decumulation withdraws
   to cover desired spend net of guaranteed income, applies account-aware taxes
   and RMDs, and layers in Social Security / pension / part-time income and
   pre-Medicare healthcare (age < 65). A lumpy expense lands in either phase, and
   one before retirement draws down the portfolio through the same tax-aware
   withdrawal. Each withdrawal takes any RMD first, putting a surplus into the
   taxable account, then draws the taxable, traditional, Roth, and HSA balances
   in that order. Taxes are a flat effective rate per account type, by default
   8% on taxable, 18% on traditional, and nothing on Roth or HSA. RMDs start at
   72, 73, or 75 depending on the birth year (SECURE 2.0) and divide the
   traditional balance by the IRS Uniform Lifetime Table period. The pre-Medicare
   healthcare cost grows at `healthcareInflation`, 5% by default against 2.5%
   for general inflation.

3. **Monte Carlo.** `runMonteCarlo` draws `simulations` (default **1,000**)
   lognormal return paths from `{ expectedReturn, volatility }` using the seeded
   `mulberry32` PRNG. The log-returns center on ln(1 + `expectedReturn`), so the
   median path tracks the deterministic line, and no year can lose more than
   95%. It then reports the **success rate** (fraction of paths funded
   through the horizon) and per-year **p10/p25/p50/p75/p90 bands**. Seeded, so a
   given input always yields identical output (unit-testable, stable UI).

4. **Withdrawal strategy** (decumulation), from `assumptions.withdrawalStrategy`:
   - `fixed-real` — fixed real spend (4%-rule mental model). Default.
   - `fixed-percent` spends the safe withdrawal rate (4% unless overridden) of
     the *current* balance each year, with guaranteed income paying its share
     before the portfolio covers the rest, so the balance never runs out and
     income swings with the market. A path counts as a shortfall from the first
     year its real income, the larger of that spend and the year's Social Security,
     pension, and part-time income, falls below
     `FIXED_PERCENT_SPEND_FLOOR` (80%) of the desired spend, and that shortfall
     is what the success rate measures for this strategy.
   - `guardrails` follows Guyton-Klinger. Spending starts at the desired amount,
     skips the inflation raise after a down year while the withdrawal rate sits
     above its starting rate, and is cut 10% when the rate climbs more than 20%
     above that starting rate or raised 10% when it falls more than 20% below it.

5. **Verdict + target.** `verdictFor(successRate, threshold)` ties the badge to
   the user's own success threshold; `targetNestEgg = netSpend / SWR`. The
   verdict is `on-track` at or above the threshold, `good` within 10 points below
   it, `fair` within 25 points, and `at-risk` past that. The threshold is 85%
   unless the visitor changes it. `netSpend` is the
   desired spend minus Social Security (adjusted for claim age) and any pension,
   floored at zero, and part-time income does not count toward it.

6. **Levers** (`project` only). Four dials, each reporting its marginal effect on
   the success rate and — where it's a clean single dial — how far to push it to
   reach the threshold: `save-more`, `retire-later`, `spend-less`, `more-stocks`.
   Lever rows and the threshold-solving binary search both run at the plan's
   own simulation count (`input.assumptions.simulations`, default **1,000**), so
   their absolute success figures agree with the gauge and a printed target
   reaches the threshold on the gauge when the visitor applies it. The nudges are $5,000 a year more saved (added
   to the account that already receives the most), retiring two years later,
   10% less spending, and 15 points moved from cash and then bonds into stocks.
   The threshold search runs only while the plan sits below its threshold, looks
   up to $50,000 a year more, 12 years later, or half the spending, and has no
   counterpart for `more-stocks`.

---

## State and UI

- **State:** `src/hooks/useRetirementPlan.ts`, browser-local under localStorage
  key `retirement_plan` (mirrors `useInvestments`). Offers the live portfolio
  value as a one-click starting balance. The key holds `{ version: 1, plan }`,
  and every read runs through `decodeRetirementPlan`. A first visit with a
  portfolio value starts from a taxable account holding that value. Until the
  visitor edits a field or a stored plan loads, `isSampleScenario` stays true
  and the verdict and inputs label the figures as an example. Reset deletes the
  key and starts again from the seeded plan, and when browser storage is
  unavailable, the planner says the changes may not outlast the tab.
- **UI:** the components in `src/components/investments/retirement/` are
  `RetirementPlanner` (shell),
  `RetirementInputs` / `RetirementFields` (progressive-disclosure inputs),
  `RetirementVerdict` (headline gauge), `RetirementProjectionChart` (D3
  confidence-band chart), `RetirementLevers`, `RetirementAssumptions` (the
  read-only record of every assumption with the CMA source and date, while the
  values are edited in the form's Assumptions section), and
  `RetirementDisclaimer`.
- **Headline vs. levers:** the verdict + chart use `projectCore` synchronously;
  the levers panel runs `computeLevers` off the critical path and fills in after
  paint. The hook recomputes 200 ms after the last edit, and `RetirementPlanner`
  holds the projection back until the section comes within 600px of the
  viewport. A print runs it either way.

---

## Capital market assumptions (unverified)

`capitalMarketAssumptions.ts` ships **illustrative** long-term (10–15yr) nominal
estimates shaped to match published 2025 assumption sets (e.g. J.P. Morgan
LTCMA, Research Affiliates, Vanguard VCMM). On 2026-09-28 the US large-cap and
emerging-market returns were set to the 6.7% and 7.8% in J.P. Morgan's 2026
Long-Term Capital Market Assumptions release, dated 2025-10-20. The other four
returns, every volatility, and the correlations are still June 2026 estimates
tied to no single publication, so the set is **not yet pinned to a primary
source**. `CMA_AS_OF` holds the date of the oldest published source behind the
set, the J.P. Morgan release:

```ts
export const CMA_AS_OF = "2025-10-20";
export const CMA_VERIFIED = false;   // flip to true only once every figure is pinned
```

Before relying on the figures, re-pin them to a current dated primary source,
update the numbers, **and** flip `CMA_VERIFIED` to `true` with the real source
string + as-of date. The UI already surfaces the source, the as-of date, and the
unverified state (spec §4.2, §9). The weekly curated-data audit
(`scripts/auditCuratedData.ts`) marks the set overdue once `CMA_AS_OF` is more
than 400 days old, which for the 2025-10-20 release means from 2026-11-25 on.
The release is annual, and the file's header asks for it to be read again every
autumn.

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
solver. The engine should never need DOM or network mocks. `format.test.ts`
beside it pins `formatCompactCurrency`,
`src/hooks/__tests__/useRetirementPlan.test.tsx` covers persistence, the repair
of malformed stored plans, the viewport gate, and printing, and
`src/components/investments/retirement/__tests__/` covers the inputs, the
planner shell, and the chart. `e2e/investments.spec.ts` prints the projection
without scrolling to it, keeps the disclaimers and assumptions on the printed
page, and holds the chart's labels inside the drawing across plan lengths and
viewports.
