import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import type { FantasySnapshot, FantasySnapshotSliceMetadata } from "@/lib/fantasy";
import type { Player } from "@/types";
import { TradeCalculatorClient } from "../trade-calculator-client";

const mockReplace = jest.fn();
const mockRetry = jest.fn();
const mockUseFantasySnapshot = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  usePathname: () => "/fantasy-football/trade-calculator",
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("@/hooks/useFantasySnapshot", () => ({
  useFantasySnapshot: () => mockUseFantasySnapshot(),
}));

const AVAILABLE_SLICE: FantasySnapshotSliceMetadata = {
  available: true,
  sourceKind: "position_consensus",
  rangeKind: "position",
  playerCount: 32,
};

function buildPlayer(rank: number): Player {
  return {
    id: `rb-${rank}`,
    name:
      rank === 1
        ? "Elite Runner"
        : rank === 32
          ? "Depth Runner"
          : `Test Runner ${rank}`,
    team: rank % 2 === 0 ? "NYJ" : "SF",
    position: "RB",
    averageRank: rank,
    rankEcr: rank,
    rankAverage: rank,
    standardDeviation: 0.25,
    minRank: Math.max(1, rank - 1),
    maxRank: rank + 1,
    positionRank: rank,
    tier: Math.ceil(rank / 8),
    adp: rank,
    adpHigh: Math.max(1, rank - 1),
    adpLow: rank + 1,
    adpStandardDeviation: 0.25,
    adpTimesDrafted: 100,
  };
}

function buildSnapshot({ stale = false }: { stale?: boolean } = {}): FantasySnapshot {
  const timestamp = stale
    ? "2000-01-01T00:00:00.000Z"
    : new Date().toISOString();
  const players = Array.from({ length: 32 }, (_, index) => buildPlayer(index + 1));
  const emptySlice: FantasySnapshotSliceMetadata = {
    ...AVAILABLE_SLICE,
    playerCount: 0,
  };

  return {
    schemaVersion: 7,
    season: new Date().getUTCFullYear(),
    week: 0,
    generatedAt: timestamp,
    upstreamUpdatedAt: timestamp,
    scoringFormat: "PPR",
    source: "Test expert consensus",
    adpSource: {
      provider: "Test draft market",
      url: "https://example.com/adp",
      asOf: timestamp,
      sampleSize: 3_200,
      matchedCount: players.length,
    },
    vorpSource: null,
    vorpRankings: {},
    overall: players,
    positions: {
      QB: [],
      RB: players,
      WR: [],
      TE: [],
      FLEX: players,
      K: [],
      DST: [],
    },
    sliceMetadata: {
      overall: {
        ...AVAILABLE_SLICE,
        sourceKind: "overall_consensus",
        rangeKind: "overall",
      },
      qb: emptySlice,
      rb: AVAILABLE_SLICE,
      wr: emptySlice,
      te: emptySlice,
      flex: {
        ...AVAILABLE_SLICE,
        sourceKind: "derived_flex",
        rangeKind: "overall",
      },
      k: emptySlice,
      dst: emptySlice,
    },
  };
}

function useSnapshot(snapshot: FantasySnapshot) {
  mockUseFantasySnapshot.mockReturnValue({
    players: snapshot.overall,
    snapshot,
    metadata: null,
    sliceMetadata: null,
    sliceMetadataMap: snapshot.sliceMetadata,
    isLoading: false,
    error: null,
    retry: mockRetry,
  });
}

async function addPlayerWithKeyboard(
  side: "you give" | "you get",
  playerName: string,
) {
  const input = screen.getByRole("combobox", {
    name: `Add a player to ${side}`,
  });

  fireEvent.change(input, { target: { value: playerName } });
  expect(screen.getByRole("option", { name: new RegExp(playerName) })).toBeEnabled();

  fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(input).toHaveAttribute("aria-activedescendant");
  fireEvent.keyDown(input, { key: "Enter" });

  await screen.findByRole("button", {
    name: `Remove ${playerName} from players ${side}`,
  });
}

describe("TradeCalculatorClient", () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
    resetBrowserStorageMemory();
    currentSearchParams = new URLSearchParams(
      "scoring=ppr&teams=8&rosterSize=13&lineup=traditional",
    );
    mockReplace.mockReset();
    mockRetry.mockReset();
    mockUseFantasySnapshot.mockReset();
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
  });

  afterEach(() => {
    cleanup();
    resetBrowserStorageMemory();
    window.localStorage.clear();
  });

  it("adds both sides by keyboard, evaluates the trade, and blocks a cross-side duplicate", async () => {
    useSnapshot(buildSnapshot());
    render(<TradeCalculatorClient />);

    await addPlayerWithKeyboard("you give", "Elite Runner");
    await addPlayerWithKeyboard("you get", "Depth Runner");

    const evaluation = screen.getByRole("complementary", {
      name: "Trade evaluation",
    });
    expect(within(evaluation).getByText("Clear edge to the other side")).toBeInTheDocument();
    expect(within(evaluation).getByText("supported coverage")).toBeInTheDocument();
    expect(within(evaluation).getByText("Expert consensus")).toBeInTheDocument();
    expect(within(evaluation).getByText("Draft market")).toBeInTheDocument();
    expect(within(evaluation).getByText("League fit")).toBeInTheDocument();

    const getInput = screen.getByRole("combobox", {
      name: "Add a player to you get",
    });
    fireEvent.change(getInput, { target: { value: "Elite Runner" } });
    const duplicate = screen.getByRole("option", {
      name: /Elite Runner.*Already added/,
    });
    expect(duplicate).toBeDisabled();

    fireEvent.keyDown(getInput, { key: "ArrowDown" });
    fireEvent.keyDown(getInput, { key: "Enter" });
    const getPlayers = screen.getByRole("list", { name: "You get players" });
    expect(within(getPlayers).getByText("Depth Runner")).toBeInTheDocument();
    expect(within(getPlayers).queryByText("Elite Runner")).not.toBeInTheDocument();
  });

  it("swaps the packages and requires confirmation before clearing them", async () => {
    useSnapshot(buildSnapshot());
    render(<TradeCalculatorClient />);

    await addPlayerWithKeyboard("you give", "Elite Runner");
    await addPlayerWithKeyboard("you get", "Depth Runner");
    fireEvent.click(screen.getByRole("button", { name: "Swap" }));

    expect(
      within(screen.getByRole("list", { name: "You give players" })).getByText(
        "Depth Runner",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "You get players" })).getByText(
        "Elite Runner",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear trade" }));
    expect(
      screen.getByRole("button", { name: "Confirm clear trade" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "You give players" })).getByText(
        "Depth Runner",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm clear trade" }));
    expect(screen.getAllByText("Search the overall board and add the first player.")).toHaveLength(
      2,
    );
    expect(screen.getByText("Build both sides")).toBeInTheDocument();
  });

  it("withholds the verdict and exact values when the expert snapshot is stale", async () => {
    useSnapshot(buildSnapshot({ stale: true }));
    render(<TradeCalculatorClient />);

    await addPlayerWithKeyboard("you give", "Elite Runner");
    await addPlayerWithKeyboard("you get", "Depth Runner");

    const evaluation = screen.getByRole("complementary", {
      name: "Trade evaluation",
    });
    expect(within(evaluation).getByText("Verdict withheld")).toBeInTheDocument();
    expect(within(evaluation).getByText("insufficient coverage")).toBeInTheDocument();
    expect(within(evaluation).getAllByText("Sensitivity unavailable")).toHaveLength(2);
    expect(
      within(screen.getByRole("list", { name: "You give players" })).getByText("--"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "You get players" })).getByText("--"),
    ).toBeInTheDocument();
  });

  it("renders instead of crashing when the lenient normalizer emits season 0", () => {
    // A snapshot missing its season field normalizes to season 0, which the
    // storage-key guard rejects. The route must fall back to the current
    // draft season rather than throw inside useSyncExternalStore.
    useSnapshot({ ...buildSnapshot(), season: 0 });

    render(<TradeCalculatorClient />);

    expect(
      screen.getByRole("complementary", { name: "Trade evaluation" })
    ).toBeInTheDocument();
  });

  it("warns when browser storage is unavailable while keeping the calculator usable", async () => {
    useSnapshot(buildSnapshot());
    const getItem = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    try {
      render(<TradeCalculatorClient />);

      const status = await screen.findByRole("status");
      expect(within(status).getByText("Browser storage is unavailable.")).toBeInTheDocument();
      expect(within(status).getByText(/will not survive a reload/i)).toBeInTheDocument();

      await addPlayerWithKeyboard("you give", "Elite Runner");
      expect(
        within(screen.getByRole("list", { name: "You give players" })).getByText(
          "Elite Runner",
        ),
      ).toBeInTheDocument();
    } finally {
      getItem.mockRestore();
    }
  });
});
