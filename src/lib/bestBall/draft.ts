/** Returns the team on the clock for a one-indexed snake-draft pick. */
export function getSnakeTeamNumber(pickNumber: number, totalTeams = 12): number {
  if (!Number.isInteger(pickNumber) || pickNumber < 1) {
    throw new RangeError("pickNumber must be a positive integer.");
  }
  if (!Number.isInteger(totalTeams) || totalTeams < 2) {
    throw new RangeError("totalTeams must be an integer of at least 2.");
  }

  const round = Math.floor((pickNumber - 1) / totalTeams) + 1;
  const slot = ((pickNumber - 1) % totalTeams) + 1;
  return round % 2 === 1 ? slot : totalTeams - slot + 1;
}

/**
 * Finds the user's next pick at or after currentPickNumber. Passing 13 means
 * pick 12 is complete and pick 13 is on the clock.
 */
export function getNextUserPick(
  currentPickNumber: number,
  userTeamNumber: number,
  totalTeams = 12,
  totalRounds = 18
): number | null {
  if (!Number.isInteger(userTeamNumber) || userTeamNumber < 1 || userTeamNumber > totalTeams) {
    throw new RangeError("userTeamNumber must be inside the draft's team range.");
  }
  if (!Number.isInteger(totalRounds) || totalRounds < 1) {
    throw new RangeError("totalRounds must be a positive integer.");
  }

  const firstCandidate = Math.max(1, Math.ceil(currentPickNumber));
  const finalPick = totalTeams * totalRounds;
  for (let pick = firstCandidate; pick <= finalPick; pick += 1) {
    if (getSnakeTeamNumber(pick, totalTeams) === userTeamNumber) return pick;
  }
  return null;
}
