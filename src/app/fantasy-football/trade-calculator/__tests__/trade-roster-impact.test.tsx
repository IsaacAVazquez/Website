import { render, screen, within } from "@testing-library/react";

import {
  FANTASY_TRADE_MODEL_VERSION,
  type FantasyTradeEvaluation,
  type FantasyTradePlayerEvaluation,
  type FantasyTradeSideEvaluation,
} from "@/lib/fantasyTrade";
import { TradeRosterImpact } from "../trade-roster-impact";

function player(
  id: string,
  {
    expertRank,
    marketAdp,
    expertStarter = 20,
    marketStarter = 20,
  }: {
    expertRank: number | null;
    marketAdp: number | null;
    expertStarter?: number | null;
    marketStarter?: number | null;
  },
): FantasyTradePlayerEvaluation {
  return {
    id,
    name: id,
    team: "SF",
    position: "RB",
    expertRank,
    marketAdp,
    expertValue: 50,
    marketValue: 50,
    blendedValue: 50,
    range: { low: 48, high: 52 },
    coverage: "supported",
    marketReliability: 1,
    replacementCutoffs: {
      expertStarter,
      expertRoster: 40,
      marketStarter,
      marketRoster: 40,
    },
    warnings: [],
  };
}

function side(players: FantasyTradePlayerEvaluation[]): FantasyTradeSideEvaluation {
  return {
    players,
    value: players.length * 50,
    range: { low: players.length * 48, high: players.length * 52 },
    coverage: "supported",
    marketPlayerCount: players.length,
    valuedPlayerCount: players.length,
  };
}

function evaluation(): FantasyTradeEvaluation {
  return {
    modelVersion: FANTASY_TRADE_MODEL_VERSION,
    scope: "preseason-one-qb-redraft",
    league: {
      scoring: "ppr",
      teams: 8,
      rosterSize: 13,
      lineup: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1 },
    },
    coverage: "supported",
    verdict: "leans-side-a",
    winner: "side-a",
    relativeGap: 0.1,
    rangesOverlap: true,
    sideA: side([
      player("A starter", { expertRank: 8, marketAdp: 10 }),
      player("A depth", { expertRank: 24, marketAdp: 18 }),
      player("A missing market", { expertRank: 7, marketAdp: null }),
    ]),
    sideB: side([
      player("B starter one", { expertRank: 5, marketAdp: 7 }),
      player("B starter two", { expertRank: 18, marketAdp: 19 }),
    ]),
    sources: {
      expert: { asOf: "2026-08-13T00:00:00.000Z", freshness: "fresh" },
      market: {
        provider: "Test market",
        asOf: "2026-08-13T00:00:00.000Z",
        freshness: "fresh",
        usable: true,
      },
    },
    warnings: [],
  };
}

function rowFor(label: string): HTMLElement {
  const rowHeader = screen.getByRole("rowheader", { name: label });
  const row = rowHeader.closest<HTMLElement>('[role="row"]');
  if (!row) throw new Error(`Missing row for ${label}`);
  return row;
}

describe("TradeRosterImpact", () => {
  it("maps each package to the correct before and after roster measurements", () => {
    render(
      <TradeRosterImpact
        result={evaluation()}
        valuesAvailable
        giveCount={3}
        getCount={2}
      />,
    );

    const yourRoster = within(rowFor("Your roster"));
    expect(
      yourRoster.getByRole("cell", { name: "Starter-level assets: 1 → 2" }),
    ).toBeInTheDocument();
    expect(
      yourRoster.getByRole("cell", { name: "Depth assets: 2 → 0" }),
    ).toBeInTheDocument();
    expect(
      yourRoster.getByRole("cell", { name: "Roster spots opened: 1" }),
    ).toBeInTheDocument();
    expect(
      yourRoster.getByRole("cell", { name: "Required cuts: 0" }),
    ).toBeInTheDocument();

    const otherRoster = within(rowFor("Other roster"));
    expect(
      otherRoster.getByRole("cell", { name: "Starter-level assets: 2 → 1" }),
    ).toBeInTheDocument();
    expect(
      otherRoster.getByRole("cell", { name: "Depth assets: 0 → 2" }),
    ).toBeInTheDocument();
    expect(
      otherRoster.getByRole("cell", { name: "Roster spots opened: 0" }),
    ).toBeInTheDocument();
    expect(
      otherRoster.getByRole("cell", { name: "Required cuts: 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This compares the assets in the offer against league-specific starter and roster lines. It does not project either full roster.",
      ),
    ).toBeInTheDocument();
  });

  it("withholds asset measurements while preserving exact package-size effects", () => {
    render(
      <TradeRosterImpact
        result={evaluation()}
        valuesAvailable={false}
        giveCount={1}
        getCount={3}
      />,
    );

    const yourRoster = within(rowFor("Your roster"));
    expect(
      yourRoster.getByRole("cell", { name: "Starter-level assets: -- → --" }),
    ).toBeInTheDocument();
    expect(
      yourRoster.getByRole("cell", { name: "Depth assets: -- → --" }),
    ).toBeInTheDocument();
    expect(
      yourRoster.getByRole("cell", { name: "Roster spots opened: 0" }),
    ).toBeInTheDocument();
    expect(
      yourRoster.getByRole("cell", { name: "Required cuts: 2" }),
    ).toBeInTheDocument();

    const otherRoster = within(rowFor("Other roster"));
    expect(
      otherRoster.getByRole("cell", { name: "Roster spots opened: 2" }),
    ).toBeInTheDocument();
    expect(
      otherRoster.getByRole("cell", { name: "Required cuts: 0" }),
    ).toBeInTheDocument();
  });
});
