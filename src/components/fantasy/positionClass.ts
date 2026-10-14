const POSITION_CLASSES = new Set(["QB", "RB", "WR", "TE", "K", "DST"]);

/** The kit class that sets a position's fill and ink (`--ffb-pos`, `--ffb-pos-ink`), or "" for anything else. */
export function positionClass(position: string): string {
  return POSITION_CLASSES.has(position) ? `ffb-pos-${position.toLowerCase()}` : "";
}
