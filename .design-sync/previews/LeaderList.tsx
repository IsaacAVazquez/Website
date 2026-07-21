import * as React from "react";
import { LeaderList, type LeaderEntry } from "isaac-vazquez-portfolio";

const countryLookup = new Map<string, string>([
  ["c-fra", "France"],
  ["c-eng", "England"],
  ["c-bra", "Brazil"],
  ["c-arg", "Argentina"],
  ["c-usa", "United States"],
]);

const goldenBoot: LeaderEntry[] = [
  { rank: 1, name: "Kylian Mbappé", clubId: "c-fra", clubCode: "FRA", total: 5, appearances: 4, perMatch: 1.25 },
  { rank: 2, name: "Harry Kane", clubId: "c-eng", clubCode: "ENG", total: 4, appearances: 4, perMatch: 1.0 },
  { rank: 3, name: "Vinícius Júnior", clubId: "c-bra", clubCode: "BRA", total: 4, appearances: 4, perMatch: 1.0 },
  { rank: 4, name: "Julián Álvarez", clubId: "c-arg", clubCode: "ARG", total: 3, appearances: 4, perMatch: 0.75 },
  { rank: 5, name: "Christian Pulisic", clubId: "c-usa", clubCode: "USA", total: 3, appearances: 4, perMatch: 0.75 },
];

export const GoldenBootRace = () => (
  <div className="max-w-md">
    <LeaderList leaders={goldenBoot} statLabel="goals" clubLookup={countryLookup} />
  </div>
);

const assistLeaders: LeaderEntry[] = [
  { rank: 1, name: "Lamine Yamal", clubId: "t-bar", clubCode: "BAR", total: 12, appearances: 33, perMatch: 0.36 },
  { rank: 2, name: "Antoine Griezmann", clubId: "t-atm", clubCode: "ATM", total: 10, appearances: 34, perMatch: 0.29 },
  { rank: 3, name: "Jude Bellingham", clubId: "t-rma", clubCode: "RMA", total: 9, appearances: 31, perMatch: 0.29 },
];

export const AssistLeadersClubCodes = () => (
  <div className="max-w-md">
    <LeaderList leaders={assistLeaders} statLabel="assists" />
  </div>
);
