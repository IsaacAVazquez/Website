import * as React from "react";
import { GoalsPulseStrip, type GoalsPulseEntry } from "isaac-vazquez-portfolio";

const midSeason: GoalsPulseEntry[] = [
  { matchday: 1, totalGoals: 31 },
  { matchday: 2, totalGoals: 28 },
  { matchday: 3, totalGoals: 35 },
  { matchday: 4, totalGoals: 24 },
  { matchday: 5, totalGoals: 30 },
  { matchday: 6, totalGoals: 27 },
  { matchday: 7, totalGoals: 33 },
  { matchday: 8, totalGoals: 29 },
  { matchday: 9, totalGoals: 22 },
  { matchday: 10, totalGoals: 38 },
  { matchday: 11, totalGoals: 26 },
  { matchday: 12, totalGoals: 31 },
  { matchday: 13, totalGoals: 25 },
  { matchday: 14, totalGoals: 34 },
];

export const MidSeason = () => (
  <div style={{ width: 200 }}>
    <GoalsPulseStrip data={midSeason} capLabel="MD 01–14" />
  </div>
);

const fullSeason: GoalsPulseEntry[] = [
  31, 28, 35, 24, 30, 27, 33, 29, 22, 38, 26, 31, 25, 34, 28, 32, 23, 36, 29,
  27, 31, 24, 33, 30, 26, 35, 28, 21, 32, 29, 34, 25, 30, 37, 27, 31, 26, 39,
].map((totalGoals, index) => ({ matchday: index + 1, totalGoals }));

export const FullSeason = () => (
  <div style={{ width: 420 }}>
    <GoalsPulseStrip data={fullSeason} capLabel="MD 01–38" />
  </div>
);

export const PreSeasonEmpty = () => (
  <div style={{ width: 220 }}>
    <GoalsPulseStrip data={[]} />
  </div>
);
