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

  it("renders tier plates with an avg-rank cliff and opens the player drawer", () => {
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

    expect(container.firstChild).toHaveClass("home-page");
    expect(screen.getByRole("heading", { name: /RB rankings/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /RB/i })).not.toBeDisabled();

    // One plate per tier, numbered with a leading zero like the template.
    expect(screen.getByText("01")).toBeVisible();
    expect(screen.getByText("02")).toBeVisible();
    // The consensus drop between the tiers is annotated between the plates.
    expect(screen.getByText(/4\.4 avg-rank cliff/)).toBeInTheDocument();

    // No ADP source in this snapshot, so no ADP surfaces anywhere.
    expect(screen.queryByText("ADP")).not.toBeInTheDocument();
    expect(screen.queryByText("vs ADP")).not.toBeInTheDocument();

    // The tool links render once, in the footer nav. The chip row that used to
    // repeat them under the header cost 160px before the first row at 390.
    expect(screen.getByRole("link", { name: /Draft tracker/i })).toHaveAttribute(
      "href",
      "/fantasy-football/draft-tracker"
    );
    expect(screen.queryByRole("navigation", { name: "Fantasy tools" })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "More fantasy tools" })).getAllByRole("link")
    ).toHaveLength(6);

    fireEvent.click(screen.getByRole("button", { name: "Open Christian McCaffrey detail" }));
    const dialog = screen.getByRole("dialog", { name: "Christian McCaffrey detail" });
    expect(dialog).toBeVisible();
    expect(within(dialog).getByText("Consensus avg")).toBeVisible();
    // "1.2" appears in the stat card and again in the board-neighborhood row.
    expect(within(dialog).getAllByText("1.2").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("Expert range")).toBeVisible();
    // Without an ADP source the market cards stay hidden in the drawer too.
    expect(within(dialog).queryByText("Market ADP")).not.toBeInTheDocument();
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
    // Chase: ADP 30 vs rank 12 clears the noise threshold, so the delta is toned.
    expect(within(chaseRow).getByText("+18")).toHaveStyle({ color: "var(--home-positive)" });
    // The named chip rides beside the player, since the signed delta alone is
    // what a drafter has to translate. It carries the word only, because the
    // delta is already in the row's vs ADP cell above.
    expect(within(chaseRow).getByText("Value")).toBeVisible();
    // Higgins: one pick of separation stays inside the noise band, muted.
    const higginsRow = screen
      .getByRole("button", { name: "Open Tee Higgins detail" })
      .closest("li") as HTMLElement;
    expect(within(higginsRow).getByText("+1")).toHaveStyle({ color: "var(--home-ink-muted)" });
    expect(within(higginsRow).queryByText(/^(Value|Reach)$/)).not.toBeInTheDocument();

    fireEvent.click(chaseButton);
    const dialog = screen.getByRole("dialog", { name: "Ja'Marr Chase detail" });
    expect(within(dialog).getByText("Market ADP")).toBeVisible();
    expect(within(dialog).getByText(/picks after the consensus rank/)).toBeVisible();
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
    expect(within(dialog).getByText("R2 overall · Tier 1 of 1")).toBeVisible();
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
    expect(neighbors).toEqual(["1VORP First90", "2Consensus First70"]);
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
    expect(within(dialog).getByText("R1 overall · Tier 1 of 1")).toBeVisible();
    expect(within(dialog).queryByText(/VORP #/)).not.toBeInTheDocument();
    // The row shows VORP in both modes, so the drawer carries the card in both.
    expect(within(dialog).getByText("VORP · 12-team")).toBeVisible();
  });

  it("accents the VORP value only when VORP is the ranking, and keeps signal text AA-safe", () => {
    const vorpSource = {
      provider: "FantasyPros projected VORP",
      asOf: "2026-08-17T00:00:00.000Z",
      urls: { "12": "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php" },
      matchedCounts: { "12": 1 },
    };
    const vorpRankings = { "12": [{ playerId: "rb-1", rank: 1, value: 70 }] };
    const players = [makePlayer({ id: "rb-1", name: "Consensus First", rankEcr: 1 })];
    const signalText = "color-mix(in srgb, var(--home-signal) 72%, var(--home-ink))";

    currentSearchParams = new URLSearchParams("position=overall&scoring=ppr");
    mockSnapshot({ position: "overall", vorpSource, vorpRankings, players });
    const consensus = renderClient({ position: "overall" });
    const consensusRow = screen
      .getByRole("button", { name: "Open Consensus First detail" })
      .closest("li") as HTMLElement;
    // On the consensus board the column is data in ink, not forty accented numbers.
    expect(within(consensusRow).getByTitle(/replacement/i)).toHaveStyle({ color: "var(--home-ink)" });
    // The queued rank digit takes the 72%-toward-ink mix: bare signal on
    // paper-raised measured 4.61:1 at rest and 4.41:1 on hover in light mode.
    fireEvent.click(screen.getByRole("button", { name: "Queue Consensus First" }));
    expect(within(consensusRow).getByTitle("Board rank · in your queue")).toHaveStyle({
      color: signalText,
    });
    consensus.unmount();

    currentSearchParams = new URLSearchParams(
      "position=overall&scoring=ppr&ranking=vorp&teams=12"
    );
    mockSnapshot({ position: "overall", vorpSource, vorpRankings, players });
    renderClient({ position: "overall", ranking: "vorp", teams: 12 });
    const vorpRow = screen
      .getByRole("button", { name: "Open Consensus First detail (in your queue)" })
      .closest("li") as HTMLElement;
    expect(within(vorpRow).getByTitle(/replacement/i)).toHaveStyle({ color: signalText });
    expect(within(vorpRow).getByTitle("VORP rank · in your queue")).toHaveStyle({ color: signalText });
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
    // as a reference on purpose, so the chip and footer say so in neutral tone
    // rather than contradicting the note beside them.
    jest.setSystemTime(new Date("2026-09-11T10:00:00.000Z"));
    mockSnapshot({ players: [makePlayer({ id: "rb-1", name: "Christian McCaffrey" })] });

    renderClient();

    expect(screen.getByText("Frozen since Aug 16")).toBeVisible();
    expect(screen.queryByText(/^Stale/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Aging/)).not.toBeInTheDocument();
    expect(screen.getByText(/^Frozen since Aug 16 · draft consensus kept as a reference/)).toBeVisible();
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
    expect(within(row).getByText("+26.3")).toHaveStyle({ color: "var(--home-ink-muted)" });

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

    fireEvent.click(screen.getByRole("button", { name: "Load more (5 left)" }));
    expect(screen.getByText("Player 45")).toBeVisible();
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
    fireEvent.click(screen.getByRole("button", { name: "Show all players" }));
    expect(screen.getByText("Jahmyr Gibbs")).toBeVisible();
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
