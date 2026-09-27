import { nflSeeds, seedLadder, type SeedBandSpec } from "../seedLadder";

const NBA_BANDS: SeedBandSpec[] = [
  { label: "In", throughSeed: 6 },
  { label: "Play-in", throughSeed: 10 },
  { label: "Out" },
];

const NFL_BANDS: SeedBandSpec[] = [{ label: "In", throughSeed: 7 }, { label: "Out" }];

describe("seedLadder", () => {
  it("returns empty bands and null lines for an empty conference", () => {
    const result = seedLadder([], NBA_BANDS);
    expect(result.bands.map((band) => band.teams.length)).toEqual([0, 0, 0]);
    expect(result.lines).toEqual([{ gamesClear: null }, { gamesClear: null }]);
  });

  it("leaves later bands empty and their lines null when a conference has fewer teams than the bands", () => {
    const teams = [
      { seed: 1, wins: 10, losses: 2 },
      { seed: 2, wins: 9, losses: 3 },
      { seed: 3, wins: 8, losses: 4 },
    ];
    const result = seedLadder(teams, NBA_BANDS);
    expect(result.bands[0].teams).toHaveLength(3);
    expect(result.bands[1].teams).toHaveLength(0);
    expect(result.bands[2].teams).toHaveLength(0);
    expect(result.lines).toEqual([{ gamesClear: null }, { gamesClear: null }]);
  });

  it("computes a large gap correctly for a runaway leader", () => {
    const teams = [
      { seed: 1, wins: 70, losses: 5 },
      { seed: 2, wins: 50, losses: 25 },
      { seed: 3, wins: 45, losses: 30 },
      { seed: 4, wins: 40, losses: 35 },
      { seed: 5, wins: 38, losses: 37 },
      { seed: 6, wins: 35, losses: 40 },
      { seed: 7, wins: 20, losses: 55 },
    ];
    const result = seedLadder(teams, NBA_BANDS);
    // ((35-20)+(55-40))/2 = 15
    expect(result.lines[0].gamesClear).toBeCloseTo(15, 5);
  });

  it("counts ties as half a win and half a loss", () => {
    const teams = [
      { seed: 1, wins: 5, losses: 1 },
      { seed: 2, wins: 5, losses: 1 },
      { seed: 3, wins: 5, losses: 1 },
      { seed: 4, wins: 5, losses: 1 },
      { seed: 5, wins: 5, losses: 1 },
      { seed: 6, wins: 5, losses: 1 },
      { seed: 7, wins: 10, losses: 4, ties: 1 },
      { seed: 8, wins: 9, losses: 6, ties: 0 },
    ];
    const result = seedLadder(teams, NFL_BANDS);
    // above (10.5, 4.5) vs below (9, 6): ((10.5-9)+(6-4.5))/2 = 1.5
    expect(result.lines[0].gamesClear).toBeCloseTo(1.5, 5);
  });

  it("returns a zero gap when the teams on either side of the line are tied", () => {
    const teams = [
      { seed: 6, wins: 40, losses: 20 },
      { seed: 7, wins: 40, losses: 20 },
    ];
    const result = seedLadder(teams, NBA_BANDS);
    expect(result.lines[0].gamesClear).toBe(0);
  });
});

describe("nflSeeds", () => {
  it("gives division leaders seeds one to four in conference-rank order", () => {
    const teams = [
      { id: "a", conference: "AFC" as const, divisionRank: 1, conferenceRank: 5 },
      { id: "b", conference: "AFC" as const, divisionRank: 1, conferenceRank: 1 },
      { id: "c", conference: "AFC" as const, divisionRank: 1, conferenceRank: 3 },
      { id: "d", conference: "AFC" as const, divisionRank: 1, conferenceRank: 9 },
    ];
    const seeds = nflSeeds(teams);
    expect(seeds.get("b")).toBe(1);
    expect(seeds.get("c")).toBe(2);
    expect(seeds.get("a")).toBe(3);
    expect(seeds.get("d")).toBe(4);
  });

  it("gives the next three non-leaders by conference rank seeds five to seven, and no seed to the rest", () => {
    const leaders = [
      { id: "l1", conference: "AFC" as const, divisionRank: 1, conferenceRank: 2 },
      { id: "l2", conference: "AFC" as const, divisionRank: 1, conferenceRank: 4 },
      { id: "l3", conference: "AFC" as const, divisionRank: 1, conferenceRank: 6 },
      { id: "l4", conference: "AFC" as const, divisionRank: 1, conferenceRank: 8 },
    ];
    const wildcards = [
      { id: "w1", conference: "AFC" as const, divisionRank: 2, conferenceRank: 1 },
      { id: "w2", conference: "AFC" as const, divisionRank: 2, conferenceRank: 3 },
      { id: "w3", conference: "AFC" as const, divisionRank: 3, conferenceRank: 5 },
      { id: "w4", conference: "AFC" as const, divisionRank: 2, conferenceRank: 7 },
    ];
    const seeds = nflSeeds([...leaders, ...wildcards]);
    expect(seeds.get("w1")).toBe(5);
    expect(seeds.get("w2")).toBe(6);
    expect(seeds.get("w3")).toBe(7);
    expect(seeds.get("w4")).toBeUndefined();
  });

  it("seeds each conference independently", () => {
    const teams = [
      { id: "afc-leader", conference: "AFC" as const, divisionRank: 1, conferenceRank: 1 },
      { id: "nfc-leader", conference: "NFC" as const, divisionRank: 1, conferenceRank: 1 },
    ];
    const seeds = nflSeeds(teams);
    expect(seeds.get("afc-leader")).toBe(1);
    expect(seeds.get("nfc-leader")).toBe(1);
  });
});
