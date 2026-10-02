// Poisson helpers. Goal counts stay small (grids cap at 7 to 10 a side), so a
// direct incremental evaluation is exact enough and fast enough.

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
