/**
 * Symbol shape shared by stored holdings and the server quote client.
 * Reject leading or consecutive separators and limit symbols to 10 characters.
 * Accepts AAPL, BRK-B, BRK.B, and BF.B.
 */
export function isValidSymbol(symbol: string): boolean {
  if (typeof symbol !== "string" || symbol.length === 0 || symbol.length > 10) {
    return false;
  }
  return /^[A-Z][A-Z0-9]*([.-][A-Z0-9]+)*$/.test(symbol);
}
