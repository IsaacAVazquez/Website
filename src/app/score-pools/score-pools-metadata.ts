export const SCORE_POOLS_INTERFACE_UPDATED_AT = "2026-07-23";

export function getScorePoolsModifiedDate(snapshotGeneratedAt: string): string {
  const snapshotDate = snapshotGeneratedAt.slice(0, 10);
  return snapshotDate > SCORE_POOLS_INTERFACE_UPDATED_AT
    ? snapshotDate
    : SCORE_POOLS_INTERFACE_UPDATED_AT;
}
