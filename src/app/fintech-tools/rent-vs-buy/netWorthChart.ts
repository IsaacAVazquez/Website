/**
 * Rent vs. Buy signature: the pure geometry for the net-worth-by-year chart.
 *
 * Isolated from NetWorthChart so the break-even marker, the zero line, and
 * the axis ticks are unit-tested without a DOM. Everything returned is a
 * pixel coordinate in the given viewBox; the component only draws what
 * comes back. The x scale runs continuously over [0, horizonYears], so a
 * fractional break-even year (4 years, 6 months) lands between its two
 * whole years rather than snapping to one of them.
 */

export interface NetWorthSeriesInput {
  horizonYears: number;
  upfrontCash: number;
  breakEvenYears: number | null;
  yearly: readonly { year: number; buyerNetWorth: number; renterNetWorth: number }[];
}

export interface NetWorthChartTick {
  value: number;
  y: number;
}

export interface NetWorthChartGeometry {
  width: number;
  height: number;
  /** Pixel x for a year in [0, horizonYears]; fractional years are fine. */
  xForYear: (year: number) => number;
  buyerLine: string;
  renterLine: string;
  buyerEndX: number;
  buyerEndY: number;
  renterEndX: number;
  renterEndY: number;
  /** Pixel y of the zero line, or null when nothing in the series dips below it. */
  zeroY: number | null;
  /** Pixel x of the break-even marker, or null with no break-even year in range. */
  breakEvenX: number | null;
  yTicks: NetWorthChartTick[];
}

// The left pad is wide enough to clear the $ tick labels, which sit inside
// it, so the plotted lines never start underneath their own axis text.
const PAD_LEFT = 56;
const PAD_RIGHT = 8;
// Generous because the $0 tick sits right on the plot floor, and the x-axis
// row below it has to clear that tick's own label at the larger mobile type
// size, not just the desktop one.
const PAD_Y_BOTTOM = 46;
const PAD_Y_TOP = 32;
const Y_TICK_COUNT = 4;

/** Round a step up to a "nice" 1/2/5-times-a-power-of-ten number. */
function niceStep(roughStep: number): number {
  if (!Number.isFinite(roughStep) || roughStep <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const residual = roughStep / magnitude;
  const stepMultiple = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return stepMultiple * magnitude;
}

function computeYTicks(min: number, max: number, count: number): number[] {
  const step = niceStep((max - min) / count);
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max + step * 1e-6; value += step) {
    ticks.push(Math.round(value));
  }
  return ticks.length > 0 ? ticks : [Math.round(min)];
}

export function netWorthChart(
  input: NetWorthSeriesInput,
  width = 640,
  height = 300,
): NetWorthChartGeometry {
  const horizonYears = Math.max(1, input.horizonYears);
  const years = [0, ...input.yearly.map((y) => y.year)];
  const buyer = [0, ...input.yearly.map((y) => y.buyerNetWorth)];
  const renter = [input.upfrontCash, ...input.yearly.map((y) => y.renterNetWorth)];

  // The domain always reaches down to 0 (the buyer starts there), so a
  // series that never actually goes negative leaves min at exactly 0 and
  // the zero line is skipped as redundant with the plot's own floor.
  const min = Math.min(0, ...buyer, ...renter);
  const max = Math.max(0, ...buyer, ...renter, 1);
  const hasZeroLine = min < 0;

  const plotLeft = PAD_LEFT;
  const plotRight = width - PAD_RIGHT;
  const plotTop = PAD_Y_TOP;
  const plotBottom = height - PAD_Y_BOTTOM;

  const xForYear = (year: number) =>
    plotLeft + (year / horizonYears) * (plotRight - plotLeft);
  const yForValue = (value: number) =>
    plotBottom - ((value - min) / (max - min || 1)) * (plotBottom - plotTop);

  const line = (values: number[]) =>
    values.map((value, i) => `${xForYear(years[i])},${yForValue(value)}`).join(" ");

  const lastIndex = years.length - 1;

  return {
    width,
    height,
    xForYear,
    buyerLine: line(buyer),
    renterLine: line(renter),
    buyerEndX: xForYear(years[lastIndex]),
    buyerEndY: yForValue(buyer[lastIndex]),
    renterEndX: xForYear(years[lastIndex]),
    renterEndY: yForValue(renter[lastIndex]),
    zeroY: hasZeroLine ? yForValue(0) : null,
    breakEvenX: input.breakEvenYears === null ? null : xForYear(input.breakEvenYears),
    yTicks: computeYTicks(min, max, Y_TICK_COUNT).map((value) => ({
      value,
      y: yForValue(value),
    })),
  };
}
