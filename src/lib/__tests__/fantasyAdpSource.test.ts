/**
 * @jest-environment node
 */
import {
  FantasyAdpFetchError,
  fetchFantasyAdpBoard,
  getFantasyAdpUrl,
  parseFantasyAdpPayload,
} from "@/lib/fantasyAdpSource";
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

  it("validates provider status, scoring, team count, and sample metadata in strict mode", () => {
    const board = parseFantasyAdpPayload(ADP_SOURCE_PAYLOAD_FIXTURE, {
      ...PARSE_OPTIONS,
      strict: true,
      expectedTeams: 12,
    });

    expect(board.entries).toHaveLength(6);
    expect(() =>
      parseFantasyAdpPayload(
        { ...ADP_SOURCE_PAYLOAD_FIXTURE, status: "Error" },
        { ...PARSE_OPTIONS, strict: true, expectedTeams: 12 }
      )
    ).toThrow(/status/i);
    expect(() =>
      parseFantasyAdpPayload(
        {
          ...ADP_SOURCE_PAYLOAD_FIXTURE,
          meta: { ...ADP_SOURCE_PAYLOAD_FIXTURE.meta, teams: 10 },
        },
        { ...PARSE_OPTIONS, strict: true, expectedTeams: 12 }
      )
    ).toThrow(/10 teams, expected 12/);
  });

  it("maps the provider's Non-PPR metadata onto Standard scoring", () => {
    const standardPayload = {
      ...ADP_SOURCE_PAYLOAD_FIXTURE,
      meta: { ...ADP_SOURCE_PAYLOAD_FIXTURE.meta, type: "Non-PPR" },
    };

    expect(
      parseFantasyAdpPayload(standardPayload, {
        scoringFormat: "STANDARD",
        sourceUrl: "https://example.test/adp/standard",
        strict: true,
        expectedTeams: 12,
      }).scoringFormat
    ).toBe("STANDARD");

    expect(() =>
      parseFantasyAdpPayload(standardPayload, {
        ...PARSE_OPTIONS,
        strict: true,
        expectedTeams: 12,
      })
    ).toThrow(/returned format "Non-PPR" for PPR/);
  });
});

const STRICT_OPTIONS = { ...PARSE_OPTIONS, strict: true, expectedTeams: 12 };

function withMeta(meta: Record<string, unknown>) {
  return { ...ADP_SOURCE_PAYLOAD_FIXTURE, meta: { ...ADP_SOURCE_PAYLOAD_FIXTURE.meta, ...meta } };
}

function withPlayers(players: unknown[]) {
  return { ...ADP_SOURCE_PAYLOAD_FIXTURE, players };
}

const CHASE = ADP_SOURCE_PAYLOAD_FIXTURE.players[0];

describe("parseFantasyAdpPayload input handling", () => {
  it("rejects a payload that is not an object", () => {
    expect(() => parseFantasyAdpPayload(null, PARSE_OPTIONS)).toThrow(/"players" array/);
    expect(() => parseFantasyAdpPayload("players", PARSE_OPTIONS)).toThrow(/"players" array/);
  });

  it("maps every supported provider position spelling and skips malformed rows", () => {
    const board = parseFantasyAdpPayload(
      withPlayers([
        null,
        "junk",
        { name: 42, position: "WR", adp: 5 },
        { name: "No Position", position: 7, adp: 6 },
        { name: "  Quarter Back  ", position: " qb ", team: " buf ", adp: "12.5" },
        { name: "Tight End", position: "TE", adp: 40 },
        { name: "Kicker", position: "K", adp: 150 },
        { name: "Defense One", position: "DST", adp: 151 },
        { name: "Defense Two", position: "D/ST", adp: 152 },
        { name: "No Team", position: "RB", team: null, adp: 20, high: "x" },
      ]),
      PARSE_OPTIONS
    );

    expect(board.entries.map((entry) => [entry.name, entry.position])).toEqual([
      ["Quarter Back", "QB"],
      ["Tight End", "TE"],
      ["Kicker", "K"],
      ["Defense One", "DST"],
      ["Defense Two", "DST"],
      ["No Team", "RB"],
    ]);
    expect(board.entries[0]).toMatchObject({ team: "BUF", adp: 12.5 });
    expect(board.entries[5].team).toBe("");
    expect(board.entries[5].high).toBeUndefined();
  });

  it("skips an ADP below one outside strict mode but rejects it in strict mode", () => {
    const payload = withPlayers([CHASE, { ...CHASE, name: "Zero Adp", adp: 0 }]);

    expect(parseFantasyAdpPayload(payload, PARSE_OPTIONS).entries).toHaveLength(1);
    expect(() => parseFantasyAdpPayload(payload, STRICT_OPTIONS)).toThrow(
      /invalid ADP for "Zero Adp"/
    );
  });

  it("reports a null as-of date for a malformed end date", () => {
    expect(parseFantasyAdpPayload(withMeta({ end_date: "not a date" }), PARSE_OPTIONS).asOf).toBeNull();
    expect(parseFantasyAdpPayload(withMeta({ end_date: 20260607 }), PARSE_OPTIONS).asOf).toBeNull();
    expect(
      parseFantasyAdpPayload(withMeta({ end_date: "2026-06-07T12:30:00Z" }), PARSE_OPTIONS).asOf
    ).toBe("2026-06-07T12:30:00.000Z");
  });
});

describe("parseFantasyAdpPayload strict validation", () => {
  it("accepts the provider's half-PPR label variants", () => {
    for (const type of ["Half-PPR", "half_ppr", "HALF"]) {
      expect(
        parseFantasyAdpPayload(withMeta({ type }), { ...STRICT_OPTIONS, scoringFormat: "HALF_PPR" })
          .scoringFormat
      ).toBe("HALF_PPR");
    }
  });

  it("rejects a missing format label", () => {
    expect(() => parseFantasyAdpPayload(withMeta({ type: undefined }), STRICT_OPTIONS)).toThrow(
      /format "undefined" for PPR/
    );
  });

  it("skips the team check when no team count is expected", () => {
    const board = parseFantasyAdpPayload(withMeta({ teams: 10 }), { ...PARSE_OPTIONS, strict: true });
    expect(board.entries).toHaveLength(6);
  });

  it.each([
    [{ total_drafts: 0 }],
    [{ total_drafts: "many" }],
    [{ rounds: undefined }],
    [{ rounds: 0 }],
  ])("rejects invalid sample or round metadata %p", (meta) => {
    expect(() => parseFantasyAdpPayload(withMeta(meta), STRICT_OPTIONS)).toThrow(
      /invalid sample or round metadata/
    );
  });

  it.each([[{ start_date: "garbage" }], [{ end_date: "" }]])(
    "rejects an invalid sample window %p",
    (meta) => {
      expect(() => parseFantasyAdpPayload(withMeta(meta), STRICT_OPTIONS)).toThrow(
        /invalid sample window/
      );
    }
  );

  it("rejects a duplicate player at the same position, ignoring case and spacing", () => {
    const payload = withPlayers([CHASE, { ...CHASE, name: " ja'marr chase ", adp: 3 }]);
    expect(() => parseFantasyAdpPayload(payload, STRICT_OPTIONS)).toThrow(/duplicate player/);
    // Outside strict mode both readings are kept.
    expect(parseFantasyAdpPayload(payload, PARSE_OPTIONS).entries).toHaveLength(2);
  });

  it.each([
    ["a best pick below one", { high: 0, low: 3 }, /invalid range/],
    ["a worst pick ahead of the best pick", { high: 5, low: 2 }, /invalid range/],
    ["a negative deviation", { stdev: -0.1 }, /invalid deviation/],
    ["a negative sample count", { times_drafted: -1 }, /invalid sample count/],
  ])("rejects %s", (_label, overrides, message) => {
    const payload = withPlayers([{ ...CHASE, ...overrides }]);
    expect(() => parseFantasyAdpPayload(payload, STRICT_OPTIONS)).toThrow(message);
  });
});

describe("fetchFantasyAdpBoard", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches the 12-team board and parses it strictly", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(ADP_SOURCE_PAYLOAD_FIXTURE), { status: 200 }));

    const board = await fetchFantasyAdpBoard("PPR", 2026);

    expect(fetchSpy).toHaveBeenCalledWith(getFantasyAdpUrl("PPR", 2026), {
      headers: { Accept: "application/json" },
    });
    expect(board.sourceUrl).toBe(getFantasyAdpUrl("PPR", 2026));
    expect(board.entries).toHaveLength(6);
  });

  it("enforces strict metadata on the fetched payload", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(withMeta({ teams: 10 })), { status: 200 }));

    await expect(fetchFantasyAdpBoard("PPR", 2026)).rejects.toThrow(/10 teams, expected 12/);
  });

  it("throws a typed error carrying the status, headers, and url on a non-2xx response", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response("slow down", { status: 429, headers: { "Retry-After": "30" } })
    );

    const error = await fetchFantasyAdpBoard("STANDARD", 2026).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(FantasyAdpFetchError);
    expect(error).toMatchObject({
      name: "FantasyAdpFetchError",
      status: 429,
      url: getFantasyAdpUrl("STANDARD", 2026),
    });
    expect((error as FantasyAdpFetchError).headers.get("retry-after")).toBe("30");
    expect((error as Error).message).toContain(": 429");
  });
});
