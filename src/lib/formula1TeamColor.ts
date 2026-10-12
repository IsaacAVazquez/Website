/**
 * A team colour as CSS can use it. Some snapshots store the hex without its
 * leading "#" or with stray whitespace; null or empty means no colour.
 * Formula 1 Pulse and Fantasy Formula 1 both draw liveries through this.
 */
export function normaliseTeamColor(color: string | null): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (trimmed.length === 0) return null;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}
