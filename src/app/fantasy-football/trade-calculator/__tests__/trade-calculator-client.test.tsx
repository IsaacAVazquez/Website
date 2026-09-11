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

// The engine and the season note both read the wall clock, and the 2026
// season opened on September 9, so the calendar decides whether a fresh
// snapshot evaluates as preseason or in season. Pin it explicitly, faking only
// Date so the reset-arm timer and the combobox's rAF keep running for real.
const PRESEASON_NOW = "2026-08-10T12:00:00.000Z";
const IN_SEASON_NOW = "2026-09-11T12:00:00.000Z";
function pinClock(iso: string) {
  jest.useFakeTimers({
    now: new Date(iso),
    doNotFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "setImmediate",
      "clearImmediate",
      "nextTick",
      "queueMicrotask",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "requestIdleCallback",
      "cancelIdleCallback",
      "performance",
      "hrtime",
    ],
  });
}

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
    season: 2026,
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
    pinClock(PRESEASON_NOW);
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
    jest.useRealTimers();
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
    // An idle rail has evaluated nothing, so it must not call the sources the
    // header just stamped as fresh "Not current".
    const evaluation = screen.getByRole("complementary", { name: "Trade evaluation" });
    expect(within(evaluation).getAllByText("Waiting for players")).toHaveLength(2);
    expect(within(evaluation).queryByText("Not current")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trade-verdict-strip")).not.toBeInTheDocument();
  });

  it("keeps the season note and the verdict strip off the page before kickoff", async () => {
    useSnapshot(buildSnapshot());
    render(<TradeCalculatorClient />);

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    await addPlayerWithKeyboard("you give", "Elite Runner");
    await addPlayerWithKeyboard("you get", "Depth Runner");
    const strip = screen.getByTestId("trade-verdict-strip");
    expect(within(strip).getByText("Clear edge to the other side")).toBeInTheDocument();
    expect(within(strip).getByRole("link", { name: "Evidence" })).toHaveAttribute(
      "href",
      "#trade-evaluation",
    );
  });

  it("from Week 1 says the feed is still updating, links to the live boards, and never issues a clear edge", async () => {
    pinClock(IN_SEASON_NOW);
    useSnapshot(buildSnapshot());
    render(<TradeCalculatorClient />);

    const note = screen.getByRole("note");
    expect(within(note).getByText("Week 1 of the 2026 season.")).toBeInTheDocument();
    expect(note).toHaveTextContent("was still sampling real drafts as of Sep 11, 2026");
    expect(note).toHaveTextContent("reports balanced or leaning at most and never a clear edge");
    expect(note).toHaveTextContent("I would rather it say nothing than say something I cannot support");
    expect(within(note).getByRole("link", { name: "weekly board" })).toHaveAttribute(
      "href",
      "/fantasy-football/weekly",
    );
    expect(within(note).getByRole("link", { name: "waivers page" })).toHaveAttribute(
      "href",
      "/fantasy-football/waivers",
    );
    expect(screen.getByRole("link", { name: "View rankings" })).toBeInTheDocument();

    await addPlayerWithKeyboard("you give", "Elite Runner");
    await addPlayerWithKeyboard("you get", "Depth Runner");

    const evaluation = screen.getByRole("complementary", { name: "Trade evaluation" });
    // The same deal is a clear edge in August; in season the coverage cap
    // holds it to a lean under a limited chip.
    expect(within(evaluation).getByText("You are giving more")).toBeInTheDocument();
    expect(within(evaluation).getByText("limited coverage")).toBeInTheDocument();
    expect(within(evaluation).queryByText(/Clear edge/)).not.toBeInTheDocument();
    expect(
      within(evaluation).getByText(/prices what these players would cost in a draft this week/),
    ).toBeInTheDocument();
    // Both sources still cover both players; the cap is the season, not the feed.
    expect(within(evaluation).getAllByText(/^2\/2/)).toHaveLength(2);
    expect(within(screen.getByTestId("trade-verdict-strip")).getByText("You are giving more")).toBeInTheDocument();
  });

  it("from Week 1 explains a withheld verdict as the feed stopping", async () => {
    pinClock(IN_SEASON_NOW);
    const snapshot = buildSnapshot();
    snapshot.adpSource = { ...snapshot.adpSource!, asOf: "2026-09-05T00:00:00.000Z" };
    useSnapshot(snapshot);
    render(<TradeCalculatorClient />);

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(
      "last sampled real drafts on Sep 5, 2026, which is past the four-day window the estimate needs, so the verdict is withheld",
    );
    expect(within(note).getByRole("link", { name: "weekly board" })).toBeInTheDocument();

    await addPlayerWithKeyboard("you give", "Elite Runner");
    await addPlayerWithKeyboard("you get", "Depth Runner");
    const evaluation = screen.getByRole("complementary", { name: "Trade evaluation" });
    expect(within(evaluation).getByText("Verdict withheld")).toBeInTheDocument();
    expect(within(evaluation).getByText("Not current")).toBeInTheDocument();
    expect(
      within(evaluation).queryByText(/prices what these players would cost in a draft this week/),
    ).not.toBeInTheDocument();
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
