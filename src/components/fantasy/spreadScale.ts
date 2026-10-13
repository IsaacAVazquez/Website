/**
 * The scale an expert spread plot is drawn on. A plot on screen keeps the
 * scale it was fitted with, so nothing moves when more rows load, and the
 * labels for that scale print beside the plots that use it.
 */
export interface SpreadScale {
  /** First and last rank the plot covers, inclusive. */
  min: number;
  max: number;
  /** The start of each labelled division, in ranks, with the label printed over it. */
  ticks: { at: number; label: string }[];
}

/** Past this many divisions the labels would crowd, so the ticks double their spacing. */
const MAX_TICKS = 16;

/**
 * Fits a window of whole divisions around the ranks `lo` to `hi`.
 *
 * A division is `unit` ranks (12 by default, a round of a 12-team draft), and
 * division `d` covers ranks `d * unit + 1` to `(d + 1) * unit`. `pad` adds
 * that many divisions each side where they exist. The window is never fewer
 * than `minDivisions` wide (3 by default) and grows to the right to get there.
 * Past sixteen divisions the ticks double their spacing, and the window grows
 * to a whole number of ticks, so every tick stands over the same width.
 *
 * A rank is a slot one wide. Rank `r` runs from `(r - min) / (max - min + 1)`
 * to `(r - min + 1) / (max - min + 1)` of the plot.
 */
export function fitSpreadScale(
  lo: number,
  hi: number,
  options: {
    unit?: number;
    pad?: number;
    minDivisions?: number;
    label?: (rank: number, division: number) => string;
  } = {}
): SpreadScale {
  const unit = Math.max(1, Math.floor(options.unit ?? 12));
  const pad = Math.max(0, Math.floor(options.pad ?? 0));
  const minDivisions = Math.max(1, Math.floor(options.minDivisions ?? 3));
  const label = options.label ?? ((_rank: number, division: number) => `R${division + 1}`);

  const low = Math.max(1, Math.floor(Math.min(lo, hi)));
  const high = Math.max(low, Math.ceil(Math.max(lo, hi)));
  const first = Math.max(0, Math.floor((low - 1) / unit) - pad);
  let last = Math.floor((high - 1) / unit) + pad;
  if (last - first + 1 < minDivisions) last = first + minDivisions - 1;

  let step = 1;
  while ((last - first + 1) / step > MAX_TICKS) step *= 2;
  last = first + Math.ceil((last - first + 1) / step) * step - 1;

  const ticks: SpreadScale["ticks"] = [];
  for (let division = first; division <= last; division += step) {
    const at = division * unit + 1;
    ticks.push({ at, label: label(at, division) });
  }
  return { min: first * unit + 1, max: (last + 1) * unit, ticks };
}
