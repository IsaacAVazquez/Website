// ============================================================
// Poisson helpers
//
// Goal counts stay small (grids cap at 7-10 a side), so direct
// evaluation with a precomputed factorial table is exact enough
// and fast enough — no special-function machinery needed.
// ============================================================

const FACTORIALS: number[] = (() => {
  const table = [1];
  for (let k = 1; k <= 24; k++) table.push(table[k - 1] * k);
  return table;
})();

/** pmf values for k = 0..maxK, in one pass. */
export function poissonRow(lambda: number, maxK: number): number[] {
  const row = new Array<number>(maxK + 1);
  let value = Math.exp(-lambda);
  row[0] = value;
  for (let k = 1; k <= maxK; k++) {
    value = (value * lambda) / k;
    row[k] = value;
  }
  return row;
}
