/**
 * @jest-environment node
 */
import { getFantasyAdpUrl, parseFantasyAdpPayload } from "@/lib/fantasyAdpSource";
import { ADP_SOURCE_PAYLOAD_FIXTURE } from "./fixtures/adpSource.fixture";

const PARSE_OPTIONS = {
  scoringFormat: "PPR" as const,
  sourceUrl: "https://example.test/adp/ppr",
};

describe("getFantasyAdpUrl", () => {
  it("builds format-specific 12-team urls", () => {
    expect(getFantasyAdpUrl("PPR", 2026)).toBe(
      "https://fantasyfootballcalculator.com/api/v1/adp/ppr?teams=12&year=2026&position=all"
    );
    expect(getFantasyAdpUrl("HALF_PPR", 2026)).toContain("/adp/half-ppr?");
    expect(getFantasyAdpUrl("STANDARD", 2025)).toContain("/adp/standard?teams=12&year=2025");
  });
});

describe("parseFantasyAdpPayload", () => {
  it("parses entries and maps source positions onto site positions", () => {
    const board = parseFantasyAdpPayload(ADP_SOURCE_PAYLOAD_FIXTURE, PARSE_OPTIONS);

    expect(board.scoringFormat).toBe("PPR");
    expect(board.sourceUrl).toBe(PARSE_OPTIONS.sourceUrl);
    expect(board.sampleSize).toBe(421);
    expect(board.asOf).toBe("2026-06-07T00:00:00.000Z");

    const chase = board.entries.find((entry) => entry.name === "Ja'Marr Chase");
    expect(chase).toMatchObject({ team: "CIN", position: "WR", adp: 1.4, timesDrafted: 410 });

    const kicker = board.entries.find((entry) => entry.name === "Harrison Butker");
    expect(kicker?.position).toBe("K");

    const defense = board.entries.find((entry) => entry.name === "Pittsburgh Defense");
    expect(defense?.position).toBe("DST");
  });

  it("drops entries without a usable adp and unsupported positions", () => {
    const board = parseFantasyAdpPayload(ADP_SOURCE_PAYLOAD_FIXTURE, PARSE_OPTIONS);
    const names = board.entries.map((entry) => entry.name);

    expect(names).not.toContain("Practice Squad Guy");
    expect(names).not.toContain("Some Linebacker");
    expect(board.entries).toHaveLength(6);
  });

  it("throws when the payload has no players array", () => {
    expect(() => parseFantasyAdpPayload({ meta: {} }, PARSE_OPTIONS)).toThrow(
      /did not return a "players" array/
    );
  });

  it("throws when no entry survives validation", () => {
    const payload = {
      meta: ADP_SOURCE_PAYLOAD_FIXTURE.meta,
      players: [{ player_id: 1, name: "No Adp", position: "WR", team: "SF" }],
    };

    expect(() => parseFantasyAdpPayload(payload, PARSE_OPTIONS)).toThrow(/no usable players/);
  });

  it("tolerates a missing meta block by reporting null provenance fields", () => {
    const payload = { players: ADP_SOURCE_PAYLOAD_FIXTURE.players };
    const board = parseFantasyAdpPayload(payload, PARSE_OPTIONS);

    expect(board.asOf).toBeNull();
    expect(board.sampleSize).toBeNull();
  });
});
