import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { FantasyFootballClient } from "../fantasy-football-client";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import type { FantasySnapshot } from "@/lib/fantasy";
import type { Player } from "@/types";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseFantasySnapshot = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("@/hooks/useFantasySnapshot", () => ({
  useFantasySnapshot: (options: unknown) => mockUseFantasySnapshot(options),
}));

function buildSliceMetadataMap() {
  return {
    overall: {
      available: true,
      sourceKind: "overall_consensus",
      rangeKind: "overall",
      playerCount: 0,
      updatedAt: "2026-08-16T15:29:20.000Z",
    },
    qb: {
      available: true,
      sourceKind: "shared_position_consensus",
      rangeKind: "position",
      playerCount: 0,
      updatedAt: "2026-08-16T15:29:20.000Z",
    },
    rb: {
      available: true,
      sourceKind: "position_consensus",
      rangeKind: "position",
      playerCount: 3,
      updatedAt: "2026-08-16T15:29:20.000Z",
    },
    wr: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
    te: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
    flex: { available: true, sourceKind: "derived_flex", rangeKind: "overall", playerCount: 0 },
    k: {
      available: true,
      sourceKind: "shared_position_consensus",
      rangeKind: "position",
      playerCount: 0,
    },
    dst: {
      available: true,
      sourceKind: "shared_position_consensus",
      rangeKind: "position",
      playerCount: 0,
    },
  };
}

function makePlayer(overrides: Partial<Player> & { id: string; name: string }): Player {
  return {
    team: "SF",
    position: "RB",
    averageRank: 1,
    rankEcr: 1,
    rankAverage: 1.2,
    standardDeviation: 0.1,
    tier: 1,
    positionRank: 1,
    minRank: 1,
    maxRank: 3,
    byeWeek: 9,
    lastUpdated: "2026-08-16T15:29:20.000Z",
    ...overrides,
  } as Player;
}

interface SnapshotOverrides {
  players: Player[];
  position?: string;
  season?: number;
  adpSource?: object | null;
  vorpSource?: object | null;
  vorpRankings?: object;
  sliceAvailable?: boolean;
  sliceReason?: string;
  isLoading?: boolean;
  error?: string | null;
  retry?: jest.Mock;
}

function mockSnapshot({
  players,
  position = "rb",
  season = 2026,
  adpSource = null,
  vorpSource = null,
  vorpRankings = {},
  sliceAvailable = true,
  sliceReason,
  isLoading = false,
  error = null,
  retry = jest.fn(),
}: SnapshotOverrides) {
  const slice = {
    available: sliceAvailable,
    sourceKind: "position_consensus",
    rangeKind: "position",
    playerCount: players.length,
    updatedAt: "2026-08-16T15:29:20.000Z",
    ...(sliceReason ? { reason: sliceReason } : {}),
  };
  mockUseFantasySnapshot.mockReturnValue({
    players: sliceAvailable ? players : [],
    snapshot: vorpSource ? { vorpSource, vorpRankings } : null,
    metadata: {
      season,
      week: 0,
      generatedAt: "2026-08-16T16:00:00.000Z",
      upstreamUpdatedAt: "2026-08-16T15:29:20.000Z",
      scoringFormat: "PPR",
      source: "snapshot",
      position,
      playerCount: players.length,
      ...(adpSource ? { adpSource } : {}),
      slice,
      slices: buildSliceMetadataMap(),
    },
    sliceMetadata: slice,
    sliceMetadataMap: buildSliceMetadataMap(),
    isLoading,
    error,
    retry,
  });
  return { retry };
}

const FRESH_ADP_SOURCE = {
  provider: "Fantasy Football Calculator",
  url: "https://example.test/adp",
  asOf: "2026-08-16T00:00:00.000Z",
  sampleSize: 6565,
  matchedCount: 260,
};

function renderClient(initial?: Partial<{
  position: string;
  scoring: string;
  ranking: "consensus" | "vorp";
  teams: 10 | 12 | 14;
  query: string;
}>) {
  return render(
    <FantasyFootballClient
      initialState={{
        position: (initial?.position ?? "rb") as never,
        scoring: (initial?.scoring ?? "ppr") as never,
        ranking: initial?.ranking ?? "consensus",
        teams: initial?.teams ?? 12,
        query: initial?.query ?? "",
      }}
    />
  );
}

describe("FantasyFootballClient", () => {
  it("hands the server-rendered seed to the snapshot hook", () => {
    mockSnapshot({ players: [] });
    const seed = { scoringFormat: "PPR" } as unknown as FantasySnapshot;

    render(
      <FantasyFootballClient
        initialState={{ position: "rb", scoring: "ppr", ranking: "consensus", teams: 12, query: "" }}
        initialSnapshot={seed}
      />
    );

    expect(mockUseFantasySnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ initialSnapshot: seed, position: "rb", scoring: "ppr" })
    );
  });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-18T10:00:00.000Z"));
    window.localStorage.clear();
    resetBrowserStorageMemory();
    currentSearchParams = new URLSearchParams("position=rb&scoring=ppr");
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUseFantasySnapshot.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders tier breaks with an avg-rank cliff and opens the player drawer", () => {
    mockSnapshot({
      players: [
        makePlayer({
          id: "rb-1",
          name: "Christian McCaffrey",
          rankAverage: 1.2,
          positionRank: 1,
        }),
        makePlayer({
          id: "rb-2",
          name: "Bijan Robinson",
          team: "ATL",
          rankAverage: 5.6,
          averageRank: 2,
          rankEcr: 2,
          positionRank: 2,
          tier: 2,
          minRank: 2,
          maxRank: 8,
          byeWeek: 5,
        }),
      ],
    });

    const { container } = renderClient();

    // The route root is the client's own first element, with no wrapper above it.
    expect(container.firstChild).toHaveAttribute("data-testid", "fantasy-football-shell");
    expect(screen.getByRole("heading", { name: /RB rankings/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /RB/i })).not.toBeDisabled();

    // One break per tier, its tab numbered with a leading zero.
    expect(screen.getByText("01")).toBeVisible();
    expect(screen.getByText("02")).toBeVisible();
    // The consensus drop between the tiers prints on the second tier's break.
    // The number is its own element there, so read the line it sits in.
    expect(screen.getByText("4.4").closest("p")).toHaveTextContent("4.4 avg-rank cliff");
    expect(screen.getByRole("region", { name: /^Tier 2, 1 player, ranks 2 to 2, 4\.4 average-rank cliff above$/ })).toBeInTheDocument();
    // The heading's three parts are separate words, not one run of text.
    expect(screen.getByRole("heading", { level: 3, name: "Tier 01 1 player Rank 1" })).toHaveTextContent(
      "Tier 01 1 player Rank 1"
    );
    // Each tier draws on a scale of its own, and prints that scale's labels in its head.
    const tierLabels = (name: RegExp) =>
      Array.from(screen.getByRole("region", { name }).querySelectorAll(".ffb-rk-scale > span")).map(
        (label) => label.textContent
      );
    expect(tierLabels(/^Tier 1,/)).toEqual(["RB1", "RB13", "RB25"]);
    expect(tierLabels(/^Tier 2,/)).toEqual(["RB1", "RB13", "RB25"]);
    // The plot is named for its range, with no pronoun. The average is in the column beside it.
    expect(screen.getByRole("img", { name: "Expert rank range 1 to 3" })).toHaveAttribute(
      "title",
      "Expert rank range 1 to 3"
    );
    // The full name rides in a title, for the widths where the cell can still cut it.
    expect(screen.getByText("Christian McCaffrey")).toHaveAttribute("title", "Christian McCaffrey");
    // The phone's position label hides with its select, so a desktop does not read the name twice.
    expect(screen.getByText("Position board", { selector: "label" })).toHaveClass("sr-only", "md:hidden");

    // No ADP source in this snapshot, so no ADP surfaces anywhere.
    expect(screen.queryByText("ADP")).not.toBeInTheDocument();
    expect(screen.queryByText("vs ADP")).not.toBeInTheDocument();

    // The product bar in the fantasy layout carries the tool links now, so the
    // board repeats none of them. "My team" is the one destination the bar does
    // not list, and it stays as a single link under the board.
    expect(screen.queryByRole("link", { name: /Draft tracker/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My team" })).toHaveAttribute("href", "/fantasy-football/weekly#my-team");

    fireEvent.click(screen.getByRole("button", { name: "Open Christian McCaffrey detail" }));
    const dialog = screen.getByRole("dialog", { name: "Christian McCaffrey detail" });
    expect(dialog).toBeVisible();
    expect(within(dialog).getByText("Consensus avg")).toBeVisible();
    // "1.2" appears in the stat card and again in the board-neighborhood row.
    expect(within(dialog).getAllByText("1.2").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("Expert range")).toBeVisible();
    // No average column sits beside the drawer's plot, so its name carries the average.
    expect(within(dialog).getByRole("img", { name: "Expert rank range 1 to 3, average 1.2" })).toBeInTheDocument();
    // The drawer's plot is the shared drawer's, fitted to this player. On a
    // position board its divisions are position ranks, and the drawer says so once.
    const axisLabels = (panel: HTMLElement) =>
      Array.from(panel.querySelectorAll(".ffb-ov-axis-labels > span")).map((label) => label.textContent);
    expect(axisLabels(dialog)).toEqual(["RB1", "RB13", "RB25"]);
    expect(within(dialog).getByText("Each division is 12 RB ranks.")).toBeVisible();
    // The range and the average print once, as facts, so the plot carries no Best, Avg, Worst line.
    expect(within(dialog).queryByText(/^(Best|Avg|Worst) \d/)).not.toBeInTheDocument();
    // The help for the range sits on the plot's heading and nowhere else in the drawer.
    expect(within(dialog).getByRole("heading", { level: 3, name: "Expert spread" })).toContainElement(
      within(dialog).getByRole("button", { name: "What is Expert spread?" })
    );
    expect(within(dialog).queryByRole("button", { name: "What is Expert range?" })).not.toBeInTheDocument();
    // Without an ADP source the market cards stay hidden in the drawer too.
    expect(within(dialog).queryByText("Market ADP")).not.toBeInTheDocument();
  });

  it("restores focus to the player row after opening its content with a pointer", () => {
    mockSnapshot({ players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })] });
    renderClient();
    const opener = screen.getByRole("button", { name: "Open Christian McCaffrey detail" });
    const row = opener.closest("li") as HTMLElement;

    fireEvent.click(within(row).getByText("Christian McCaffrey"));
    expect(screen.getByRole("dialog", { name: "Christian McCaffrey detail" })).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Christian McCaffrey detail" })).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("renders ADP columns and a gated value signal when the snapshot carries fresh ADP", () => {
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({
      position: "overall",
      adpSource: FRESH_ADP_SOURCE,
      players: [
        makePlayer({
          id: "wr-1",
          name: "Ja'Marr Chase",
          team: "CIN",
          position: "WR",
          rankEcr: 12,
          averageRank: 12,
          rankAverage: 12.4,
          positionRank: 4,
          minRank: 8,
          maxRank: 16,
          adp: 30,
          adpStandardDeviation: 5,
          adpTimesDrafted: 120,
          standardDeviation: 3,
        }),
        makePlayer({
          id: "wr-2",
          name: "Tee Higgins",
          team: "CIN",
          position: "WR",
          rankEcr: 20,
          averageRank: 20,
          rankAverage: 20.1,
          positionRank: 7,
          tier: 2,
          minRank: 15,
          maxRank: 26,
          adp: 21,
          adpStandardDeviation: 5,
          adpTimesDrafted: 120,
          standardDeviation: 3,
        }),
      ],
    });

    renderClient({ position: "overall" });

    // "ADP" appears in the column header and again as an sr-only cell label.
    expect(screen.getAllByText("ADP").length).toBeGreaterThan(0);
    expect(screen.getByText("vs ADP")).toBeInTheDocument();
    expect(screen.getByText(/ADP Fantasy Football Calculator/)).toBeVisible();

    // Rows expose their data outside the overlay open button, so scope
    // metric queries to the row's list item.
    const chaseButton = screen.getByRole("button", { name: "Open Ja'Marr Chase detail" });
    const chaseRow = chaseButton.closest("li") as HTMLElement;
    // Chase: ADP 30 vs rank 12 clears the noise threshold, so the delta is heavy
    // and takes the good ink.
    // The gap prints one decimal on every row, so the column's decimal points line up.
    expect(within(chaseRow).getByText("+18.0")).toHaveClass("ffb-is-strong", "ffb-good");
    // The word rides in the same cell, since the signed delta alone is what a
    // drafter has to translate.
    expect(within(chaseRow).getByText("Value")).toBeVisible();
    expect(within(chaseRow).getByText("+18.0")).toContainElement(within(chaseRow).getByText("Value"));
    // A real space sits between the number and the word, so the pair reads as two words aloud.
    expect(within(chaseRow).getByText("+18.0")).toHaveTextContent("versus ADP +18.0 Value");
    // Higgins: one pick of separation stays inside the noise band, muted.
    const higginsRow = screen
      .getByRole("button", { name: "Open Tee Higgins detail" })
      .closest("li") as HTMLElement;
    const higginsDelta = within(higginsRow).getByText("+1.0");
    expect(higginsDelta).toHaveClass("ffb-is-flat");
    expect(higginsDelta).not.toHaveClass("ffb-is-strong");
    expect(higginsDelta).not.toHaveClass("ffb-good");
    expect(higginsDelta).not.toHaveClass("ffb-bad");
    expect(within(higginsRow).queryByText(/^(Value|Reach)$/)).not.toBeInTheDocument();

    fireEvent.click(chaseButton);
    const dialog = screen.getByRole("dialog", { name: "Ja'Marr Chase detail" });
    expect(within(dialog).getByText("Market ADP")).toBeVisible();
    expect(within(dialog).getByText(/picks after the consensus rank/)).toBeVisible();
    // On the overall board the plot is in rounds. Chase's experts run 8 to 16,
    // which is rounds one and two, with a round of room on the right.
    expect(
      Array.from(dialog.querySelectorAll(".ffb-ov-axis-labels > span")).map((label) => label.textContent)
    ).toEqual(["R1", "R2", "R3"]);
    expect(within(dialog).getByText("Each division is a round of a 12-team draft.")).toBeVisible();
  });

  it("reads the flex board's expert ranks as overall ranks, in rounds", () => {
    currentSearchParams = new URLSearchParams("position=flex&scoring=ppr");
    mockSnapshot({
      position: "flex",
      players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey", minRank: 2, maxRank: 30 })],
    });

    renderClient({ position: "flex" });

    // The flex board carries the overall board's ranges, so its tiers are labelled in rounds.
    expect(screen.getByText("In rounds of a 12-team draft")).toBeInTheDocument();
    expect(
      Array.from(document.querySelectorAll(".ffb-rk-scale > span")).map((label) => label.textContent)
    ).toEqual(["R1", "R2", "R3"]);
    fireEvent.click(screen.getByRole("button", { name: "Open Christian McCaffrey detail" }));
    expect(
      within(screen.getByRole("dialog")).getByText("Each division is a round of a 12-team draft.")
    ).toBeVisible();
  });

  it("draws the drawer's plot in rounds of the VORP view's league size", () => {
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr&ranking=vorp&teams=14");
    mockSnapshot({
      position: "overall",
      vorpSource: {
        provider: "FantasyPros projected VORP",
        asOf: "2026-08-17T00:00:00.000Z",
        urls: { "14": "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php" },
        matchedCounts: { "14": 1 },
      },
      vorpRankings: { "14": [{ playerId: "rb-1", rank: 1, value: 70 }] },
      players: [makePlayer({ id: "rb-1", name: "Consensus First", rankEcr: 1, minRank: 1, maxRank: 20 })],
    });

    renderClient({ position: "overall", ranking: "vorp", teams: 14 });

    fireEvent.click(screen.getByRole("button", { name: "Open Consensus First detail" }));
    const dialog = screen.getByRole("dialog", { name: "Consensus First detail" });
    expect(within(dialog).getByText("Each division is a round of a 14-team draft.")).toBeVisible();
    // Ranks 1 to 20 are rounds one and two of fourteen picks, with a round of room on the right.
    const plot = within(dialog).getByRole("img", { name: /^Expert rank range 1 to 20/ });
    expect(plot.style.getPropertyValue("--ffb-max")).toBe("47.62%");
    expect(
      Array.from(dialog.querySelectorAll(".ffb-ov-axis-labels > span")).map((label) => label.textContent)
    ).toEqual(["R1", "R2", "R3"]);
  });

  it("orders the VORP view by sourced points above replacement for the selected league size", () => {
    currentSearchParams = new URLSearchParams(
      "position=overall&scoring=ppr&ranking=vorp&teams=12"
    );
    mockSnapshot({
      position: "overall",
      vorpSource: {
        provider: "FantasyPros projected VORP",
        asOf: "2026-08-17T00:00:00.000Z",
        urls: {
          "12": "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php",
        },
        matchedCounts: { "12": 2 },
      },
      vorpRankings: {
        "12": [
          { playerId: "rb-2", rank: 1, value: 90 },
          { playerId: "rb-1", rank: 2, value: 70 },
        ],
      },
      players: [
        makePlayer({ id: "rb-1", name: "Consensus First", rankEcr: 1 }),
        makePlayer({
          id: "rb-2",
          name: "VORP First",
          rankEcr: 2,
          averageRank: 2,
          positionRank: 2,
        }),
        makePlayer({
          id: "rb-3",
          name: "No Projected VORP",
          rankEcr: 3,
          averageRank: 3,
          positionRank: 3,
        }),
      ],
    });

    renderClient({ position: "overall", ranking: "vorp", teams: 12 });

    expect(screen.getByText(/^12-team PPR VORP ·/)).toBeVisible();
    expect(screen.getByText(/projected season points above the same-position waiver replacement/i)).toBeVisible();
    const playerButtons = screen.getAllByRole("button", { name: /Open .* detail/ });
    expect(playerButtons[0]).toHaveAccessibleName("Open VORP First detail");
    const vorpFirstRow = playerButtons[0].closest("li") as HTMLElement;
    expect(within(vorpFirstRow).getByText("90")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Open No Projected VORP detail" })
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/1 without a published VORP/)[0]).toBeInTheDocument();

    fireEvent.change(screen.getAllByRole("combobox", { name: "VORP league size" })[0], {
      target: { value: "14" },
    });
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("teams=14"),
      expect.anything()
    );
  });

  it("carries the VORP rank, value, and neighborhood into the drawer in VORP mode", () => {
    currentSearchParams = new URLSearchParams(
      "position=overall&scoring=ppr&ranking=vorp&teams=12"
    );
    mockSnapshot({
      position: "overall",
      vorpSource: {
        provider: "FantasyPros projected VORP",
        asOf: "2026-08-17T00:00:00.000Z",
        urls: { "12": "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php" },
        matchedCounts: { "12": 2 },
      },
      vorpRankings: {
        "12": [
          { playerId: "rb-2", rank: 1, value: 90.4 },
          { playerId: "rb-1", rank: 2, value: 70 },
        ],
      },
      players: [
        makePlayer({ id: "rb-1", name: "Consensus First", rankEcr: 1 }),
        makePlayer({
          id: "rb-2",
          name: "VORP First",
          rankEcr: 2,
          averageRank: 2,
          positionRank: 2,
          rankAverage: 2.3,
        }),
      ],
    });

    renderClient({ position: "overall", ranking: "vorp", teams: 12 });

    fireEvent.click(screen.getByRole("button", { name: "Open VORP First detail" }));
    const dialog = screen.getByRole("dialog", { name: "VORP First detail" });
    // The kicker leads with the rank the board is sorted by, and the consensus
    // rank stays on the next line rather than disappearing.
    expect(within(dialog).getByText("VORP #1 · 12-team")).toBeVisible();
    expect(within(dialog).getByText("Rank 2 overall · Tier 1 of 1")).toBeVisible();
    // The VORP card reuses the column definition and rounds like the row does.
    expect(within(dialog).getByRole("button", { name: "What is VORP?" })).toBeInTheDocument();
    expect(within(dialog).getByText("VORP · 12-team")).toBeVisible();
    // "90" is the stat card and again the neighborhood value for the same player.
    expect(within(dialog).getAllByText("90").length).toBeGreaterThan(0);
    // The neighborhood is labelled and numbered on the VORP scale, so the list
    // reads monotonic instead of 2, 1 with consensus averages beside it.
    expect(within(dialog).getByText("VORP rank · VORP")).toBeVisible();
    const neighbors = within(dialog)
      .getAllByRole("button", { name: /VORP First|Consensus First/ })
      .map((button) => button.textContent?.trim());
    // Each neighbor reads rank, position chip, name, value, in that order.
    expect(neighbors).toEqual(["1RB2VORP First90", "2RB1Consensus First70"]);
  });

  it("keeps the drawer on the consensus scale when the board is sorted by consensus", () => {
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({
      position: "overall",
      vorpSource: {
        provider: "FantasyPros projected VORP",
        asOf: "2026-08-17T00:00:00.000Z",
        urls: { "12": "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php" },
        matchedCounts: { "12": 1 },
      },
      vorpRankings: { "12": [{ playerId: "rb-1", rank: 1, value: 70 }] },
      players: [makePlayer({ id: "rb-1", name: "Consensus First", rankEcr: 1 })],
    });

    renderClient({ position: "overall" });

    fireEvent.click(screen.getByRole("button", { name: "Open Consensus First detail" }));
    const dialog = screen.getByRole("dialog", { name: "Consensus First detail" });
    expect(within(dialog).getByText("Rank 1 overall · Tier 1 of 1")).toBeVisible();
    expect(within(dialog).queryByText(/VORP #/)).not.toBeInTheDocument();
    // The row shows VORP in both modes, so the drawer carries the card in both.
    expect(within(dialog).getByText("VORP · 12-team")).toBeVisible();
  });

  it("leads the drawer's facts with the rank the board is sorted by, and shows only the facts the state has", () => {
    const vorpSource = {
      provider: "FantasyPros projected VORP",
      asOf: "2026-08-17T00:00:00.000Z",
      urls: { "12": "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php" },
      matchedCounts: { "12": 1 },
    };
    const players = [
      makePlayer({
        id: "wr-1",
        name: "Ja'Marr Chase",
        team: "CIN",
        position: "WR",
        rankEcr: 12,
        averageRank: 12,
        rankAverage: 12.4,
        positionRank: 4,
        minRank: 8,
        maxRank: 16,
        adp: 30,
        adpStandardDeviation: 5,
        adpTimesDrafted: 120,
        standardDeviation: 3,
      }),
      makePlayer({
        id: "wr-2",
        name: "No Published VORP",
        team: "CIN",
        position: "WR",
        rankEcr: 20,
        averageRank: 20,
        rankAverage: 20.1,
        positionRank: 7,
        tier: 2,
        minRank: 15,
        maxRank: 26,
        adp: 21,
        adpStandardDeviation: 5,
        adpTimesDrafted: 120,
        standardDeviation: 3,
      }),
    ];
    const vorpRankings = { "12": [{ playerId: "wr-1", rank: 1, value: 70 }] };
    const cardOf = (dialog: HTMLElement, label: string) =>
      within(dialog).getByText(label).closest("div") as HTMLElement;
    const gridOf = (dialog: HTMLElement) => cardOf(dialog, "Consensus avg").parentElement as HTMLElement;

    // Consensus board, five facts: Consensus avg leads and VORP comes last.
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({ position: "overall", adpSource: FRESH_ADP_SOURCE, vorpSource, vorpRankings, players });
    const consensus = renderClient({ position: "overall" });
    fireEvent.click(screen.getByRole("button", { name: "Open Ja'Marr Chase detail" }));
    let dialog = screen.getByRole("dialog", { name: "Ja'Marr Chase detail" });
    let grid = gridOf(dialog);
    // The facts are one definition list, each fact a label over its value.
    expect(grid.tagName).toBe("DL");
    expect(grid.children).toHaveLength(5);
    expect(grid.children[0]).toBe(cardOf(dialog, "Consensus avg"));
    expect(Array.from(grid.children).map((fact) => fact.querySelector("dt")?.textContent)).toEqual([
      "Consensus avg",
      "Expert range",
      "Market ADP",
      "vs ADP",
      "VORP · 12-team",
    ]);
    expect(grid.children[4]).toBe(cardOf(dialog, "VORP · 12-team"));
    // The lead fact keeps its focusable definition trigger.
    expect(within(grid.children[0] as HTMLElement).getByRole("button", { name: "What is Consensus avg?" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    // Four facts when the player has ADP but no published VORP.
    fireEvent.click(screen.getByRole("button", { name: "Open No Published VORP detail" }));
    dialog = screen.getByRole("dialog", { name: "No Published VORP detail" });
    grid = gridOf(dialog);
    expect(grid.children).toHaveLength(4);
    expect(within(dialog).queryByText("VORP · 12-team")).not.toBeInTheDocument();
    consensus.unmount();

    // VORP board, five facts: VORP leads, since it is the rank the board is
    // sorted by, and the consensus facts follow.
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr&ranking=vorp&teams=12");
    mockSnapshot({ position: "overall", adpSource: FRESH_ADP_SOURCE, vorpSource, vorpRankings, players });
    renderClient({ position: "overall", ranking: "vorp", teams: 12 });
    fireEvent.click(screen.getByRole("button", { name: "Open Ja'Marr Chase detail" }));
    dialog = screen.getByRole("dialog", { name: "Ja'Marr Chase detail" });
    grid = gridOf(dialog);
    expect(grid.children).toHaveLength(5);
    expect(grid.children[0]).toBe(cardOf(dialog, "VORP · 12-team"));
    expect(grid.children[1]).toBe(cardOf(dialog, "Consensus avg"));
    expect(within(grid.children[0] as HTMLElement).getByRole("button", { name: "What is VORP?" })).toBeInTheDocument();
  });

  it("weights the VORP value only when VORP is the ranking, and marks a queued row on its rank", () => {
    const vorpSource = {
      provider: "FantasyPros projected VORP",
      asOf: "2026-08-17T00:00:00.000Z",
      urls: { "12": "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php" },
      matchedCounts: { "12": 1 },
    };
    const vorpRankings = { "12": [{ playerId: "rb-1", rank: 1, value: 70 }] };
    const players = [makePlayer({ id: "rb-1", name: "Consensus First", rankEcr: 1 })];

    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({ position: "overall", vorpSource, vorpRankings, players });
    const consensus = renderClient({ position: "overall" });
    const consensusRow = screen
      .getByRole("button", { name: "Open Consensus First detail" })
      .closest("li") as HTMLElement;
    // On the consensus board the column is data in plain ink, not forty weighted numbers.
    const consensusVorp = within(consensusRow).getByTitle(/replacement/i);
    expect(consensusVorp).not.toHaveClass("ffb-is-strong");
    expect(consensusVorp).not.toHaveClass("ffb-is-flat");
    // A queued row carries the state on the row, which is what puts the kit's
    // highlighter behind the rank. The rank's title says so in words.
    expect(consensusRow).not.toHaveClass("ffb-is-queued");
    fireEvent.click(screen.getByRole("button", { name: "Queue Consensus First" }));
    expect(within(consensusRow).getByTitle("Board rank · in your queue").closest("li")).toHaveClass("ffb-is-queued");
    consensus.unmount();

    currentSearchParams = new URLSearchParams(
      "position=overall&scoring=ppr&ranking=vorp&teams=12"
    );
    mockSnapshot({ position: "overall", vorpSource, vorpRankings, players });
    renderClient({ position: "overall", ranking: "vorp", teams: 12 });
    const vorpRow = screen
      .getByRole("button", { name: "Open Consensus First detail (in your queue)" })
      .closest("li") as HTMLElement;
    expect(within(vorpRow).getByTitle(/replacement/i)).toHaveClass("ffb-is-strong");
    expect(within(vorpRow).getByTitle("VORP rank · in your queue").closest("li")).toHaveClass("ffb-is-queued");
  });

  it("drives ranking and league size from the phone's single ranking select", () => {
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({
      position: "overall",
      vorpSource: {
        provider: "FantasyPros projected VORP",
        asOf: "2026-08-17T00:00:00.000Z",
        urls: { "12": "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php" },
        matchedCounts: { "12": 1 },
      },
      vorpRankings: { "12": [{ playerId: "rb-1", rank: 1, value: 70 }] },
      players: [makePlayer({ id: "rb-1", name: "Consensus First", rankEcr: 1 })],
    });

    renderClient({ position: "overall" });

    const select = screen.getByRole("combobox", { name: "Ranking method" });
    expect(select).toHaveValue("consensus");
    expect(within(select).getByRole("option", { name: "VORP 14-team" })).not.toBeDisabled();

    fireEvent.change(select, { target: { value: "vorp-14" } });
    expect(mockReplace).toHaveBeenLastCalledWith(
      expect.stringContaining("ranking=vorp&teams=14"),
      expect.anything()
    );

    // The count line keeps the phone's only live region, visible, on the same row.
    const counts = screen.getAllByText("1 of 1 shown");
    expect(counts.some((count) => count.getAttribute("aria-live") === "polite")).toBe(true);
    expect(counts.every((count) => !count.className.includes("sr-only"))).toBe(true);
  });

  it("says VORP is not published only once the snapshot has loaded without it, and never presses a disabled button", () => {
    // Still loading: the button is disabled and claims nothing.
    mockUseFantasySnapshot.mockReturnValue({
      players: [],
      snapshot: null,
      metadata: null,
      sliceMetadata: null,
      sliceMetadataMap: null,
      isLoading: true,
      error: null,
      retry: jest.fn(),
    });
    const loading = renderClient();
    const method = () => within(screen.getByRole("group", { name: "Ranking method" }));
    expect(method().getByRole("button", { name: "VORP" })).toBeDisabled();
    expect(method().getByRole("button", { name: "VORP" })).toHaveTextContent(/^VORP$/);
    expect(screen.queryByRole("button", { name: "VORP, not published in the current snapshot" })).not.toBeInTheDocument();
    loading.unmount();

    // Loaded with no VORP source, on a link that asks for VORP: the board is
    // consensus, so Consensus is the pressed one and the disabled VORP is not.
    currentSearchParams = new URLSearchParams("position=rb&scoring=ppr&ranking=vorp");
    mockSnapshot({ players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })] });
    renderClient({ ranking: "vorp" });
    const unpublished = method().getByRole("button", { name: "VORP, not published in the current snapshot" });
    expect(unpublished).toBeDisabled();
    expect(unpublished).toHaveTextContent("VORPNA");
    expect(unpublished).toHaveAttribute("aria-pressed", "false");
    expect(method().getByRole("button", { name: "Consensus" })).toHaveAttribute("aria-pressed", "true");
    // The league size select and the phone select keep the URL's choice, as before.
    expect(screen.getByRole("combobox", { name: "VORP league size" })).toHaveValue("12");
    expect(screen.getByRole("combobox", { name: "Ranking method" })).toHaveValue("vorp-12");
  });

  it("disables the VORP options on the phone select when no VORP is published", () => {
    mockSnapshot({ players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })] });

    renderClient();

    const select = screen.getByRole("combobox", { name: "Ranking method" });
    expect(within(select).getByRole("option", { name: "Consensus" })).not.toBeDisabled();
    expect(within(select).getByRole("option", { name: "VORP 12-team" })).toBeDisabled();
  });

  it("points the in-season note at both live boards", () => {
    jest.setSystemTime(new Date("2026-09-11T10:00:00.000Z"));
    mockSnapshot({ players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })] });

    renderClient();

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(/Week 1 of the 2026 season/);
    expect(note).toHaveTextContent(/kept as a reference once games begin/);
    expect(within(note).getByRole("link", { name: "weekly board" })).toHaveAttribute(
      "href",
      "/fantasy-football/weekly"
    );
    expect(within(note).getByRole("link", { name: "waiver targets" })).toHaveAttribute(
      "href",
      "/fantasy-football/waivers"
    );
  });

  it("reports a frozen source in season instead of grading it stale", () => {
    // The seed metadata is dated 2026-08-16, 26 days before this clock, which
    // the daily thresholds would grade "Stale". From Week 1 the board is kept
    // as a reference on purpose, so the freshness line says so in neutral tone
    // rather than contradicting the note beside it.
    jest.setSystemTime(new Date("2026-09-11T10:00:00.000Z"));
    mockSnapshot({ players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })] });

    renderClient();

    const frozen = screen.getByText("Frozen since Aug 16");
    expect(frozen).toBeVisible();
    expect(frozen).not.toHaveClass("ffb-warn");
    expect(frozen).not.toHaveClass("ffb-bad");
    expect(screen.queryByText(/^Stale/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Aging/)).not.toBeInTheDocument();
    // The frozen date prints once, in the freshness line. The line under the
    // board keeps the site's own snapshot date and drops the refresh cadence,
    // which would read against a frozen board.
    expect(screen.getByText(/^Snapshot Aug 16/)).toBeVisible();
    expect(screen.queryByText(/Refreshes daily/)).not.toBeInTheDocument();
  });

  it("dates the frozen board by the consensus source in the VORP view, not by the VORP check", () => {
    jest.setSystemTime(new Date("2026-09-11T10:00:00.000Z"));
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr&ranking=vorp&teams=12");
    mockSnapshot({
      position: "overall",
      vorpSource: {
        provider: "FantasyPros projected VORP",
        asOf: "2026-09-10T00:00:00.000Z",
        urls: { "12": "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php" },
        matchedCounts: { "12": 1 },
      },
      vorpRankings: { "12": [{ playerId: "rb-1", rank: 1, value: 70 }] },
      players: [makePlayer({ id: "rb-1", name: "Consensus First", rankEcr: 1 })],
    });

    renderClient({ position: "overall", ranking: "vorp", teams: 12 });

    // The consensus source is dated Aug 16 and the VORP check Sep 10. What
    // froze at kickoff is the consensus, and the VORP date has its own part.
    expect(screen.getByText("VORP checked Sep 10")).toBeVisible();
    expect(screen.getByText("Frozen since Aug 16")).toBeVisible();
    expect(screen.queryByText("Frozen since Sep 10")).not.toBeInTheDocument();
  });

  it("does not grade a board that has not loaded as stale", () => {
    mockUseFantasySnapshot.mockReturnValue({
      players: [],
      snapshot: null,
      metadata: null,
      sliceMetadata: null,
      sliceMetadataMap: null,
      isLoading: true,
      error: null,
      retry: jest.fn(),
    });

    renderClient();

    expect(screen.getByText("Loading players…")).toBeVisible();
    expect(screen.queryByText(/^Stale/)).not.toBeInTheDocument();
    expect(screen.queryByText(/source date unknown/)).not.toBeInTheDocument();
  });

  it("suppresses the value chip on a position board, where the rank is not overall scale", () => {
    currentSearchParams = new URLSearchParams("position=wr&scoring=ppr");
    mockSnapshot({
      position: "wr",
      adpSource: FRESH_ADP_SOURCE,
      players: [
        makePlayer({
          id: "wr-1",
          name: "Ja'Marr Chase",
          team: "CIN",
          position: "WR",
          // On a position board rankEcr is the position rank, so comparing it
          // with an overall ADP would manufacture a huge fake value gap.
          rankEcr: 1,
          averageRank: 1,
          rankAverage: 1.4,
          positionRank: 1,
          minRank: 1,
          maxRank: 3,
          adp: 30,
          adpStandardDeviation: 5,
          adpTimesDrafted: 120,
          standardDeviation: 3,
        }),
      ],
    });

    renderClient({ position: "wr" });

    const row = screen
      .getByRole("button", { name: "Open Ja'Marr Chase detail" })
      .closest("li") as HTMLElement;
    expect(within(row).queryByText(/^(Value|Reach) /)).not.toBeInTheDocument();
    // The vs ADP cell is gone entirely on position boards, and the ADP column
    // label says which scale the number is on.
    expect(within(row).queryByText("versus ADP")).not.toBeInTheDocument();
    expect(screen.getByText("ADP (overall)")).toBeInTheDocument();
  });

  it("never calls a thin ADP sample market agreement", () => {
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({
      position: "overall",
      adpSource: FRESH_ADP_SOURCE,
      players: [
        makePlayer({
          id: "rb-thin",
          name: "Tyler Allgeier",
          team: "ATL",
          rankEcr: 129,
          averageRank: 129,
          rankAverage: 129.4,
          positionRank: 30,
          minRank: 110,
          maxRank: 150,
          adp: 155.3,
          adpStandardDeviation: 6,
          adpTimesDrafted: 19,
          standardDeviation: 8,
        }),
      ],
    });

    renderClient({ position: "overall" });

    // The +26.3 delta renders muted because the sample cannot be judged.
    const row = screen
      .getByRole("button", { name: "Open Tyler Allgeier detail" })
      .closest("li") as HTMLElement;
    const thinDelta = within(row).getByText("+26.3");
    expect(thinDelta).toHaveClass("ffb-is-flat");
    expect(thinDelta).not.toHaveClass("ffb-is-strong");
    expect(within(row).queryByText(/^(Value|Reach)$/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open Tyler Allgeier detail" }));
    const dialog = screen.getByRole("dialog", { name: "Tyler Allgeier detail" });
    expect(within(dialog).getByText(/Too few mock selections/)).toBeVisible();
    expect(within(dialog).queryByText(/noise band/)).not.toBeInTheDocument();
  });

  it("hides ADP surfaces and flags the staleness when the mock-draft sample is old", () => {
    mockSnapshot({
      players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })],
      adpSource: { ...FRESH_ADP_SOURCE, asOf: "2026-08-01T00:00:00.000Z" },
    });

    renderClient();

    expect(screen.getByText("ADP stale · signals hidden")).toBeVisible();
    expect(screen.queryByText("vs ADP")).not.toBeInTheDocument();
  });

  it("does not say the board pairs with market ADP on the line above the chip that hides it", () => {
    mockSnapshot({
      players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })],
      adpSource: { ...FRESH_ADP_SOURCE, asOf: "2026-08-01T00:00:00.000Z" },
    });

    renderClient();

    expect(screen.getByText("ADP stale · signals hidden")).toBeVisible();
    expect(screen.queryByText(/expert consensus with market ADP,/)).not.toBeInTheDocument();
    expect(screen.getByText(/with market ADP when a current sample is published,/)).toBeInTheDocument();
  });

  it("shows prior-season ADP only as a dated reference", () => {
    jest.setSystemTime(new Date("2027-05-01T10:00:00.000Z"));
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({
      position: "overall",
      season: 2027,
      adpSource: { ...FRESH_ADP_SOURCE, asOf: "2026-09-01T00:00:00.000Z" },
      players: [
        makePlayer({
          id: "wr-reference",
          name: "Reference Receiver",
          team: "CIN",
          position: "WR",
          rankEcr: 12,
          averageRank: 12,
          adp: 30,
          adpStandardDeviation: 5,
          adpTimesDrafted: 120,
        }),
      ],
    });

    renderClient({ position: "overall" });

    expect(screen.getByText("ADP prior season")).toBeVisible();
    expect(screen.getAllByText("ADP").length).toBeGreaterThan(0);
    expect(screen.queryByText("vs ADP")).not.toBeInTheDocument();
    const row = screen
      .getByRole("button", { name: "Open Reference Receiver detail" })
      .closest("li") as HTMLElement;
    expect(within(row).queryByText(/^(Value|Reach) /)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open Reference Receiver detail" }));
    const dialog = screen.getByRole("dialog", { name: "Reference Receiver detail" });
    expect(within(dialog).getByText("Prior-season ADP · Sep 1, 2026")).toBeVisible();
    // The explanation used to ride on `title` on a non-interactive div, which never
    // fires on touch and is unreachable by keyboard. It is now MetricTooltip's
    // focusable trigger, so assert it is a real control naming the prior-season term
    // and that focusing it surfaces the definition.
    const priorSeasonHelp = within(dialog).getByRole("button", {
      name: "What is Prior-season ADP?",
    });
    fireEvent.focus(priorSeasonHelp);
    expect(
      screen.getByText(/final mock-draft average from the prior season/i)
    ).toBeVisible();
    expect(within(dialog).queryByText(/picks after the consensus rank/)).not.toBeInTheDocument();
  });

  it("keeps scoring controls available when the selected position slice is unavailable", () => {
    mockSnapshot({
      players: [],
      sliceAvailable: false,
      sliceReason: "FantasyPros does not publish this board.",
    });

    renderClient();

    expect(screen.getByText(/PPR RB rankings are unavailable/)).toBeVisible();
    expect(screen.getByText("FantasyPros does not publish this board.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Search the current rankings board" })).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: "Half PPR" })[0]);
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("scoring=half_ppr"),
      expect.anything()
    );
  });

  it("preserves the published rank when search filters the board down to one player", () => {
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({
      position: "overall",
      players: [
        makePlayer({ id: "rb-1", name: "Christian McCaffrey", rankEcr: 1 }),
        makePlayer({
          id: "rb-2",
          name: "Joe Mixon",
          team: "HOU",
          rankEcr: 47,
          averageRank: 47,
          rankAverage: 47.3,
          tier: 6,
          positionRank: 14,
          minRank: 40,
          maxRank: 55,
        }),
      ],
    });

    renderClient({ position: "overall" });

    fireEvent.change(screen.getByRole("textbox", { name: "Search the current rankings board" }), {
      target: { value: "Mixon" },
    });

    expect(screen.getByText("Joe Mixon")).toBeVisible();
    expect(screen.queryByText("Christian McCaffrey")).not.toBeInTheDocument();
    expect(screen.getByText("47")).toBeVisible();
    expect(screen.getAllByText("1 of 2 shown")[0]).toBeVisible();
  });

  it("shows the template empty state and clears the search from it", () => {
    mockSnapshot({
      players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })],
    });

    renderClient();

    fireEvent.change(screen.getByRole("textbox", { name: "Search the current rankings board" }), {
      target: { value: "nobody" },
    });
    expect(screen.getByText("No players match on this board.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    // Clearing the search must not silently change the position filter too.
    expect(mockReplace).toHaveBeenLastCalledWith(
      expect.not.stringContaining("q="),
      expect.anything()
    );
    expect(mockReplace).toHaveBeenLastCalledWith(
      expect.stringContaining("position=rb"),
      expect.anything()
    );
  });

  it("keeps a cleared search cleared once the URL write lands and the debounce settles", () => {
    // The App Router applies a replace after the transition commits, not in the
    // same tick, so the mock lands each write on the next timer tick and the
    // test steps the clock in small increments, re-rendering after each so
    // useSearchParams sees the new URL the way it does in the browser.
    mockReplace.mockImplementation((href: string) => {
      setTimeout(() => {
        currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
      }, 0);
    });
    mockSnapshot({
      players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })],
    });
    // A fresh element each time, because React bails out of re-rendering an
    // identical element and would never re-read the mocked search params.
    const element = () => (
      <FantasyFootballClient
        initialState={{ position: "rb", scoring: "ppr", ranking: "consensus", teams: 12, query: "" }}
      />
    );
    const { rerender } = render(element());
    const settle = () => {
      for (let step = 0; step < 8; step += 1) {
        act(() => {
          jest.advanceTimersByTime(50);
        });
        rerender(element());
      }
    };

    const input = screen.getByRole("textbox", { name: "Search the current rankings board" });
    fireEvent.change(input, { target: { value: "nobody" } });
    settle();
    expect(currentSearchParams.get("q")).toBe("nobody");
    expect(screen.getByText("No players match on this board.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    settle();

    expect(input).toHaveValue("");
    expect(currentSearchParams.get("q")).toBeNull();
    expect(screen.queryByText("No players match on this board.")).not.toBeInTheDocument();
    expect(screen.getByText("Christian McCaffrey")).toBeVisible();
  });

  it("bounds the initial rankings render and reveals the next window on demand", () => {
    mockSnapshot({
      players: Array.from({ length: 45 }, (_, index) =>
        makePlayer({
          id: `rb-${index + 1}`,
          name: `Player ${index + 1}`,
          rankEcr: index + 1,
          averageRank: index + 1,
          rankAverage: index + 1.1,
          positionRank: index + 1,
          minRank: index + 1,
          maxRank: index + 5,
        })
      ),
    });

    renderClient();

    expect(screen.getByText("Player 40")).toBeVisible();
    expect(screen.queryByText("Player 41")).not.toBeInTheDocument();
    expect(screen.getAllByText("40 of 45 shown")[0]).toBeVisible();
    // The tier break describes the whole tier, not the 40 rows mounted so far.
    expect(screen.getByRole("region", { name: "Tier 1, 45 players, ranks 1 to 45" })).toBeInTheDocument();
    expect(screen.getByText("45 players")).toBeVisible();
    expect(screen.getByText("Ranks 1–45")).toBeVisible();
    // The tier's plots share one scale, fitted to all 45 players of the tier and
    // not to the 40 mounted. Their experts run from 1 to 49, which is five
    // divisions of twelve ranks, labelled by the rank each starts at.
    const tier = screen.getByRole("region", { name: "Tier 1, 45 players, ranks 1 to 45" });
    expect(Array.from(tier.querySelectorAll(".ffb-rk-scale > span")).map((label) => label.textContent)).toEqual([
      "RB1",
      "RB13",
      "RB25",
      "RB37",
      "RB49",
    ]);
    // Player 1's experts run 1 to 5 on a scale of 1 to 60.
    const firstPlot = screen.getByRole("img", { name: "Expert rank range 1 to 5" });
    expect(firstPlot.style.getPropertyValue("--ffb-min")).toBe("0.00%");
    expect(firstPlot.style.getPropertyValue("--ffb-max")).toBe("8.33%");
    expect(firstPlot.style.getPropertyValue("--ffb-rounds")).toBe("5");
    const drawnBeforeLoad = firstPlot.getAttribute("style");

    fireEvent.click(screen.getByRole("button", { name: "Load more (5 left)" }));
    expect(screen.getByText("Player 45")).toBeVisible();
    // Loading the rest of the tier moves nothing that was already drawn.
    expect(screen.getByRole("img", { name: "Expert rank range 1 to 5" }).getAttribute("style")).toBe(drawnBeforeLoad);
    expect(tier.querySelectorAll(".ffb-rk-scale > span")).toHaveLength(5);
  });

  it("offers an in-place retry when rankings fail to load", () => {
    const { retry } = mockSnapshot({
      players: [],
      error: "Fantasy rankings are unavailable right now.",
    });

    renderClient();

    expect(screen.getByRole("alert")).toHaveTextContent("Fantasy rankings are unavailable right now.");
    expect(screen.getAllByText("Rankings unavailable")[0]).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry rankings" }));
    expect(retry).toHaveBeenCalled();
    // The button leaves with the notice once the retry starts, so focus goes to the search and not to the page body.
    expect(document.getElementById("fantasy-search")).toHaveFocus();
  });

  it("queues from the row edge and filters the board to the queue", () => {
    mockSnapshot({
      players: [
        makePlayer({ id: "p-1", name: "Bijan Robinson" }),
        makePlayer({ id: "p-2", name: "Jahmyr Gibbs", rankEcr: 2, averageRank: 2, positionRank: 2 }),
      ],
    });

    renderClient();

    fireEvent.click(screen.getByRole("button", { name: "Queue Bijan Robinson" }));
    const removeButton = screen.getByRole("button", { name: "Remove Bijan Robinson from queue" });
    expect(removeButton).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Open Bijan Robinson detail (in your queue)" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Show only queued players (1 on this board)" })[0]);
    expect(screen.queryByText("Jahmyr Gibbs")).not.toBeInTheDocument();
    expect(screen.getByText("Bijan Robinson")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Remove Bijan Robinson from queue" }));
    expect(screen.getByText("No queued players on this board.")).toBeVisible();
    // The star left with its row, so focus goes to the Queued toggle and not to the page body.
    const queuedToggle = screen.getByRole("button", { name: "Show only queued players (0 on this board)" });
    expect(queuedToggle).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Show all players" }));
    expect(screen.getByText("Jahmyr Gibbs")).toBeVisible();
    expect(queuedToggle).toHaveFocus();
  });

  it("moves focus to the next queued row when one is unqueued from the queued view", () => {
    mockSnapshot({
      players: [
        makePlayer({ id: "p-1", name: "Bijan Robinson" }),
        makePlayer({ id: "p-2", name: "Jahmyr Gibbs", rankEcr: 2, averageRank: 2, positionRank: 2 }),
      ],
    });

    renderClient();

    fireEvent.click(screen.getByRole("button", { name: "Queue Bijan Robinson" }));
    fireEvent.click(screen.getByRole("button", { name: "Queue Jahmyr Gibbs" }));
    fireEvent.click(screen.getByRole("button", { name: "Show only queued players (2 on this board)" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Bijan Robinson from queue" }));

    expect(screen.queryByText("Bijan Robinson")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Jahmyr Gibbs from queue" })).toHaveFocus();
  });

  it("returns focus to the search after Clear, and to the search button after Done", () => {
    mockSnapshot({
      players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })],
    });

    renderClient();

    // The empty state's Clear removes itself, and focus goes back to the field it cleared.
    const desktopSearch = document.getElementById("fantasy-search") as HTMLInputElement;
    fireEvent.change(desktopSearch, { target: { value: "nobody" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(desktopSearch).toHaveValue("");
    expect(desktopSearch).toHaveFocus();

    // The phone's search: its own Clear keeps focus in its input.
    const searchButton = screen.getByRole("button", { name: "Search the current rankings board" });
    fireEvent.click(searchButton);
    const phoneSearch = document.getElementById("fantasy-search-compact") as HTMLInputElement;
    fireEvent.change(phoneSearch, { target: { value: "mcc" } });
    const phoneClear = phoneSearch.parentElement?.querySelector("button") as HTMLButtonElement;
    expect(phoneClear).toHaveAccessibleName("Clear search");
    phoneClear.focus();
    fireEvent.click(phoneClear);
    expect(phoneSearch).toHaveValue("");
    expect(phoneSearch).toHaveFocus();

    // Done closes the search row, and focus goes to the button that reopens it.
    fireEvent.change(phoneSearch, { target: { value: "mcc" } });
    fireEvent.click(screen.getByRole("button", { name: "Done searching, keep the filter" }));
    expect(document.getElementById("fantasy-search-compact")).toBeNull();
    expect(screen.getByRole("button", { name: "Search the current rankings board, filtering by mcc" })).toHaveFocus();
  });

  it("queues a player and saves a note from the drawer", () => {
    mockSnapshot({
      players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })],
    });

    renderClient();

    fireEvent.click(screen.getByRole("button", { name: "Open Christian McCaffrey detail" }));
    const dialog = screen.getByRole("dialog", { name: "Christian McCaffrey detail" });

    const queueButton = within(dialog).getByRole("button", { name: /Add to queue/ });
    fireEvent.click(queueButton);
    expect(within(dialog).getByRole("button", { name: /Queued/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.change(within(dialog).getByLabelText("Private note"), {
      target: { value: "target round 6" },
    });
    expect(within(dialog).getByText(/14\/280 · saved on this device/)).toBeVisible();
    // This player has no game log, so the footnote says nothing about per-game scoring.
    expect(
      within(dialog).getByText(
        "Ranks, tiers, and expert ranges come from the published snapshot. Queue and notes stay on this device."
      )
    ).toBeVisible();

    // The queue action leads the drawer, right after Close, and the note is the last control.
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>("button, textarea"));
    expect(controls[0]).toHaveAccessibleName("Close");
    expect(controls[1]).toHaveAccessibleName("Queued");
    expect(controls[1]).toHaveClass("ffb-btn", "ffb-btn-toggle");
    expect(controls[controls.length - 1]).toBe(within(dialog).getByLabelText("Private note"));
  });

  it("names the season's per-game source in the footnote only when the drawer prints a per-game block", () => {
    mockSnapshot({
      players: [
        makePlayer({
          id: "rb-1",
          name: "Christian McCaffrey",
          gameLog: { season: 2025, throughWeek: 18, games: 17, low: 2.4, median: 12.5, average: 11.9, high: 22.6 },
        } as Partial<Player> & { id: string; name: string }),
      ],
    });

    renderClient();

    fireEvent.click(screen.getByRole("button", { name: "Open Christian McCaffrey detail" }));
    const dialog = screen.getByRole("dialog", { name: "Christian McCaffrey detail" });
    expect(within(dialog).getByText("2025 season · PPR · 17 games")).toBeVisible();
    // The block is the shared drawer's, with its help on the heading and the four numbers under it.
    expect(within(dialog).getByRole("heading", { level: 3, name: "Points per game" })).toContainElement(
      within(dialog).getByRole("button", { name: "What is Points per game?" })
    );
    expect(Array.from(dialog.querySelectorAll(".ffb-ov-ppg dd")).map((value) => value.textContent)).toEqual([
      "2.4",
      "12.5",
      "11.9",
      "22.6",
    ]);
    expect(
      within(dialog).getByText(
        "Ranks, tiers, and expert ranges come from the published snapshot, and per-game scoring comes from nflverse for the season named beside it. Queue and notes stay on this device."
      )
    ).toBeVisible();
  });

  it("says the note is kept in this tab only when browser storage is blocked", () => {
    const blocked = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    try {
      mockSnapshot({
        players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })],
      });

      renderClient();

      expect(screen.getByRole("status")).toHaveTextContent("Browser storage is unavailable.");
      fireEvent.click(screen.getByRole("button", { name: "Open Christian McCaffrey detail" }));
      const dialog = screen.getByRole("dialog", { name: "Christian McCaffrey detail" });
      fireEvent.change(within(dialog).getByLabelText("Private note"), {
        target: { value: "target round 6" },
      });

      expect(within(dialog).getByText("14/280 · kept in this tab only")).toBeVisible();
      expect(within(dialog).queryByText(/saved on this device/)).not.toBeInTheDocument();
      expect(
        within(dialog).getByText(
          "Ranks, tiers, and expert ranges come from the published snapshot. Queue and notes last only in this tab."
        )
      ).toBeVisible();
    } finally {
      blocked.mockRestore();
    }
  });

  it("walks the board neighborhood from the drawer", () => {
    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({
      position: "overall",
      players: ["Ashton Jeanty", "Nico Collins", "De'Von Achane", "Drake London", "A.J. Brown"].map(
        (name, index) =>
          makePlayer({
            id: `p-${index + 1}`,
            name,
            rankEcr: index + 11,
            averageRank: index + 11,
            rankAverage: index + 11.2,
            tier: 3,
            positionRank: index + 1,
            minRank: index + 9,
            maxRank: index + 16,
          })
      ),
    });

    renderClient({ position: "overall" });

    fireEvent.click(screen.getByRole("button", { name: "Open De'Von Achane detail" }));
    let dialog = screen.getByRole("dialog", { name: "De'Von Achane detail" });
    expect(within(dialog).getByText("Board neighborhood")).toBeVisible();

    fireEvent.click(within(dialog).getByRole("button", { name: /Nico Collins/ }));
    dialog = screen.getByRole("dialog", { name: "Nico Collins detail" });
    expect(dialog).toBeVisible();
  });
});
