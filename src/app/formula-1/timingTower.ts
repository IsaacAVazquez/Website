/** The subset of a driver or constructor standing the timing tower needs. */
export interface TimingTowerEntry {
  position: number;
  previousPosition: number | null;
  points: number;
  pointsDelta: number;
  teamColor: string | null;
}

/** A standing plus the broadcast-style marks the tower draws. */
export interface TimingTowerRow {
  gapToLeader: number;
  intervalToAhead: number | null;
  movement: number | null;
  /** Team colour normalised to a leading "#", or null when the snapshot has none. */
  livery: string | null;
}

function normaliseLivery(color: string | null): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (trimmed.length === 0) return null;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

/**
 * The broadcast timing tower: each row's gap to the leader (its full points
 * deficit), the interval to the car directly ahead (the deficit to the next
 * row up), the round's movement from `previousPosition`, and its livery
 * normalised to a usable hex string. Sorts by `position` first so a caller's
 * unsorted array still draws correctly.
 */
export function timingTower<T extends TimingTowerEntry>(standings: T[]): (T & TimingTowerRow)[] {
  const sorted = [...standings].sort((a, b) => a.position - b.position);
  const leaderPoints = sorted[0]?.points ?? 0;

  return sorted.map((row, index) => ({
    ...row,
    gapToLeader: Math.max(0, leaderPoints - row.points),
    intervalToAhead: index === 0 ? null : Math.max(0, sorted[index - 1].points - row.points),
    movement: row.previousPosition === null ? null : row.previousPosition - row.position,
    livery: normaliseLivery(row.teamColor),
  }));
}

/** A points deficit as the tower prints it. Level on points reads "Level", never "−0". */
export function formatDeficit(points: number): string {
  return points === 0 ? "Level" : `−${points}`;
}
