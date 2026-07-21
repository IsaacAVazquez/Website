import * as React from "react";
import { StatFascia } from "isaac-vazquez-portfolio";

const seasonPulse = [
  { eyebrow: "Leader", metric: "Arsenal · 86 pts", detail: "3 clear of Man City" },
  { eyebrow: "Top scorer", metric: "24 goals", detail: "Haaland, Man City" },
  { eyebrow: "Most goals", metric: "88 scored", detail: "Man City" },
  { eyebrow: "Best defense", metric: "27 conceded", detail: "Arsenal" },
];

export const SeasonPulse = () => (
  <div className="max-w-2xl">
    <StatFascia items={seasonPulse} />
  </div>
);

const clubSeason = [
  { eyebrow: "Points", metric: "86", detail: "1st of 20" },
  { eyebrow: "Record", metric: "26-8-4" },
  { eyebrow: "Goals for", metric: "84" },
  { eyebrow: "Goals against", metric: "27" },
  { eyebrow: "Goal diff", metric: "+57" },
  { eyebrow: "Clean sheets", metric: "17" },
  { eyebrow: "Home", metric: "14-3-2" },
  { eyebrow: "Away", metric: "12-5-2" },
];

export const DenseClubGrid = () => (
  <div className="max-w-2xl">
    <StatFascia items={clubSeason} dense />
  </div>
);
