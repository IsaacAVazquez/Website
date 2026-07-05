/**
 * Client-side DCF recompute for the interactive research panel.
 *
 * Mirrors the server-side ramped-growth model in `computeDcf`
 * (investmentTransforms.ts) exactly: cash flow grows from a near-term rate
 * toward the terminal rate over `years`, discounted at `discountRatePct`,
 * plus a Gordon-growth terminal value. Feeding this the same
 * `baseFcf`/`nearTermGrowthPct`/`discountRatePct`/`terminalGrowthPct` the
 * server used reproduces its `fairValue` exactly — that identity is what
 * makes "reset to baseline" meaningful rather than an approximation.
 *
 * Pure and framework-free so it can run in the browser (DCFPanel) without a
 * request, and is unit-testable on its own.
 */

export interface DcfAssumptions {
  /** Per-share cash-flow base the projection compounds forward. */
  baseFcf: number;
  /** Growth rate applied in year 1, ramping linearly to terminal by the final year (%). */
  nearTermGrowthPct: number;
  /** Discount rate / WACC (%). */
  discountRatePct: number;
  /** Terminal (perpetuity) growth rate (%). */
  terminalGrowthPct: number;
  /** Projection horizon in years. Defaults to 5, matching the server model. */
  years?: number;
}

export interface DcfRecomputeResult {
  /** Fair value per share. */
  fairValue: number;
  /** Present value of the projected years' cash flows (per share). */
  pvProjected: number;
  /** Present value of the terminal value (per share). */
  pvTerminal: number;
  /** Share of fair value contributed by the terminal value, 0-100. */
  terminalSharePct: number;
}

/**
 * Returns `null` when the discount rate does not clear the terminal growth
 * rate by a sane margin — the perpetuity term is undefined/explosive
 * otherwise, same guard the server model applies.
 */
export function recomputeDcf(assumptions: DcfAssumptions): DcfRecomputeResult | null {
  const { baseFcf, years = 5 } = assumptions;
  const g = assumptions.nearTermGrowthPct / 100;
  const r = assumptions.discountRatePct / 100;
  const tg = assumptions.terminalGrowthPct / 100;

  if (!(r > tg) || !Number.isFinite(baseFcf) || baseFcf <= 0) {
    return null;
  }

  let fcf = baseFcf;
  let pvSum = 0;
  for (let i = 1; i <= years; i++) {
    const yearGrowth = g + (tg - g) * (i / years);
    fcf *= 1 + yearGrowth;
    pvSum += fcf / Math.pow(1 + r, i);
  }

  const terminalValue = (fcf * (1 + tg)) / (r - tg);
  const pvTerminal = terminalValue / Math.pow(1 + r, years);
  const fairValue = pvSum + pvTerminal;

  if (!Number.isFinite(fairValue) || fairValue <= 0) {
    return null;
  }

  return {
    fairValue,
    pvProjected: pvSum,
    pvTerminal,
    terminalSharePct: (pvTerminal / fairValue) * 100,
  };
}
