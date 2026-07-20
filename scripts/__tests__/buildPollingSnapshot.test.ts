import { buildPollingSnapshot } from "../buildPollingSnapshot";

function poll(id: string, type: "approval" | "generic-ballot", day: number) {
  return {
    id,
    poll_type: type,
    sample_size: 1_000,
    population: "rv",
    start_date: `2026-07-${String(day - 1).padStart(2, "0")}`,
    end_date: `2026-07-${String(day).padStart(2, "0")}`,
    pollster: `Pollster ${id}`,
    sponsors: [],
    answers:
      type === "approval"
        ? [
            { choice: "Approve", pct: 42 },
            { choice: "Disapprove", pct: 55 },
          ]
        : [
            { choice: "Dem", pct: 47 },
            { choice: "Rep", pct: 43 },
          ],
  };
}

describe("buildPollingSnapshot", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    if (originalFetch) globalThis.fetch = originalFetch;
    else delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  it("maps real VoteHub response fields without inventing race metadata", async () => {
    const approval = Array.from({ length: 6 }, (_, index) =>
      poll(`a${index}`, "approval", 10 + index)
    );
    const generic = Array.from({ length: 6 }, (_, index) =>
      poll(`g${index}`, "generic-ballot", 10 + index)
    );
    globalThis.fetch = jest.fn(async (input) => {
      const url = String(input);
      return {
        ok: true,
        status: 200,
        json: async () =>
          url.includes("poll_type=approval") ? approval : generic,
      } as Response;
    }) as typeof fetch;

    const snapshot = await buildPollingSnapshot();

    expect(snapshot.sourceLabel).toMatch(/VoteHub/);
    expect(snapshot.sourceAsOf).toBe("2026-07-15");
    expect(snapshot.approvalPolls).toHaveLength(6);
    expect(snapshot.genericBallotPolls).toHaveLength(6);
    expect(snapshot.approvalPolls[0].moe).toBeNull();
    expect(snapshot.senateRaces).toEqual([]);
    expect(snapshot.governorRaces).toEqual([]);
  });

  it("rejects a thin upstream response", async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [poll("one", "approval", 15)],
    }) as Response) as typeof fetch;

    await expect(buildPollingSnapshot()).rejects.toThrow(/too little usable data/i);
  });
});
