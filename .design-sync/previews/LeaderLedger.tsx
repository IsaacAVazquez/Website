import * as React from "react";
import { LeaderLedger, type LeaderLedgerEntry } from "isaac-vazquez-portfolio";

const topScorers: LeaderLedgerEntry[] = [
  { rank: 1, name: "Erling Haaland", clubCode: "MCI", value: 26 },
  { rank: 2, name: "Mohamed Salah", clubCode: "LIV", value: 22 },
  { rank: 3, name: "Alexander Isak", clubCode: "NEW", value: 19 },
  { rank: 4, name: "Cole Palmer", clubCode: "CHE", value: 17 },
  { rank: 5, name: "Bukayo Saka", clubCode: "ARS", value: 15 },
  { rank: 6, name: "Ollie Watkins", clubCode: "AVL", value: 14 },
  { rank: 7, name: "Kai Havertz", clubCode: "ARS", value: 12 },
  { rank: 8, name: "Chris Wood", clubCode: "NFO", value: 12 },
];

export const TopScorers = () => (
  <div className="max-w-md">
    <LeaderLedger title="Top scorers" unit="G" entries={topScorers} />
  </div>
);

const mostAssists: LeaderLedgerEntry[] = [
  { rank: 1, name: "Mohamed Salah", clubCode: "LIV", value: 13 },
  { rank: 2, name: "Bukayo Saka", clubCode: "ARS", value: 11 },
  { rank: 3, name: "Bruno Fernandes", clubCode: "MUN", value: 10 },
  { rank: 4, name: "Cole Palmer", clubCode: "CHE", value: 9 },
  { rank: 5, name: "Morgan Rogers", clubCode: "AVL", value: 8 },
];

export const MostAssists = () => (
  <div className="max-w-md">
    <LeaderLedger title="Most assists" unit="A" entries={mostAssists} />
  </div>
);

export const EmptySeason = () => (
  <div className="max-w-md">
    <LeaderLedger title="Clean sheets" unit="CS" entries={[]} />
  </div>
);
