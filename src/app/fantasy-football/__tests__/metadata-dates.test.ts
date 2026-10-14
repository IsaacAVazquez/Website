import type { Metadata } from "next";
import { metadata as rankings } from "../page";
import { metadata as bestBall } from "../best-ball/page";
import { metadata as bestBallDraft } from "../best-ball/draft-tracker/page";
import { metadata as draftTracker } from "../draft-tracker/page";
import { metadata as mockDraft } from "../mock-draft/page";
import { metadata as tradeCalculator } from "../trade-calculator/page";
import { metadata as waivers } from "../waivers/page";
import { metadata as weekly } from "../weekly/page";

// A board older than the pages' last redesign. The sitemap dates each of these
// routes at the later of the two, and a page's own date has to agree with it.
jest.mock("@/data/fantasySnapshotRevision.generated", () => ({
  fantasySnapshotRevision: "2026-10-01T00:00:00.000Z",
}));

// Only the metadata is read, so the boards themselves stay out of the import.
jest.mock("../fantasy-football-client", () => ({ FantasyFootballClient: () => null }));
jest.mock("../best-ball/best-ball-client", () => ({ BestBallClient: () => null }));
jest.mock("../best-ball/draft-tracker/draft-tracker-client", () => ({
  BestBallDraftTrackerClient: () => null,
}));
jest.mock("../draft-tracker/draft-tracker-client", () => ({ DraftTrackerClient: () => null }));
jest.mock("../mock-draft/mock-draft-client", () => ({ MockDraftClient: () => null }));
jest.mock("../trade-calculator/trade-calculator-client", () => ({
  TradeCalculatorClient: () => null,
}));
jest.mock("../weekly/weekly-client", () => ({ WeeklyBoardClient: () => null }));

const PAGES: Array<[string, Metadata]> = [
  ["/fantasy-football", rankings],
  ["/fantasy-football/best-ball", bestBall],
  ["/fantasy-football/best-ball/draft-tracker", bestBallDraft],
  ["/fantasy-football/draft-tracker", draftTracker],
  ["/fantasy-football/mock-draft", mockDraft],
  ["/fantasy-football/trade-calculator", tradeCalculator],
  ["/fantasy-football/waivers", waivers],
  ["/fantasy-football/weekly", weekly],
];

describe("fantasy football page dates", () => {
  it.each(PAGES)("%s keeps the redesign date while the board is older", (_route, metadata) => {
    expect(metadata.other?.["og:updated_time"]).toBe("2026-10-13");
  });
});
