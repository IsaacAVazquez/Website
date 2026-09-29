/**
 * @jest-environment node
 */
import { newestPollDate } from "@/app/polling-aggregator/polling-aggregator-helpers";
import { buildPollingSnapshotData } from "@/lib/pollingData";
import {
  votehubApprovalPolls,
  votehubGenericBallotPolls,
} from "./fixtures/votehubPolls.fixture";

describe("buildPollingSnapshotData against VoteHub rows saved on 2026-09-27", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-27T19:02:00.000Z"));
    jest.spyOn(global, "fetch").mockImplementation(async (input) =>
      Response.json(
        String(input).includes("poll_type=approval")
          ? votehubApprovalPolls
          : votehubGenericBallotPolls
      )
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("stamps generatedAt at build time, however old the newest poll is", async () => {
    const snapshot = await buildPollingSnapshotData();

    expect(snapshot.generatedAt).toBe("2026-09-27T19:02:00.000Z");
    expect(snapshot.sourceAsOf).toBe("2026-09-08");
  });

  it("keeps each series' newest poll date readable from its own rows", async () => {
    const snapshot = await buildPollingSnapshotData();

    expect(newestPollDate(snapshot.approvalPolls)).toBe("2026-08-28");
    expect(newestPollDate(snapshot.genericBallotPolls)).toBe("2026-09-08");
  });
});
