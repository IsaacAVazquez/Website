import {
  getEarlySpecialistNote,
  getSecondSpecialistNote,
  getSpecialistNote,
} from "@/lib/draftEarlySpecialistNote";
import type { Position } from "@/types";

const USER_TEAM = 4;
const pick = (position: Position, round: number, teamNumber = USER_TEAM) => ({
  round,
  teamNumber,
  player: { position },
});

describe("getEarlySpecialistNote", () => {
  it("fires for the user's kicker in round 1", () => {
    expect(getEarlySpecialistNote(pick("K", 1), USER_TEAM)).toMatch(/kicker/);
  });

  it("fires for the user's defense in round 2", () => {
    expect(getEarlySpecialistNote(pick("DST", 2), USER_TEAM)).toMatch(/defense/);
  });

  it("stays quiet for a kicker in round 3", () => {
    expect(getEarlySpecialistNote(pick("K", 3), USER_TEAM)).toBeNull();
  });

  it("stays quiet for a running back in round 1", () => {
    expect(getEarlySpecialistNote(pick("RB", 1), USER_TEAM)).toBeNull();
  });

  it("stays quiet for another team's kicker in round 1", () => {
    expect(getEarlySpecialistNote(pick("K", 1, USER_TEAM + 1), USER_TEAM)).toBeNull();
  });

  it("fires only once per draft", () => {
    expect(getEarlySpecialistNote(pick("DST", 2), USER_TEAM, [pick("K", 1)])).toBeNull();
    expect(
      getEarlySpecialistNote(pick("K", 2), USER_TEAM, [pick("K", 1, USER_TEAM + 1)]),
    ).not.toBeNull();
  });
});

describe("getSecondSpecialistNote", () => {
  it("fires for the user's second kicker", () => {
    expect(getSecondSpecialistNote(pick("K", 14), USER_TEAM, [pick("K", 10)])).toBe(
      "A second kicker is a bold call. I'd want that roster spot back, but it's your league.",
    );
  });

  it("fires for the user's second defense", () => {
    expect(getSecondSpecialistNote(pick("DST", 15), USER_TEAM, [pick("DST", 12)])).toBe(
      "A second defense is a bold call. I'd want that roster spot back, but it's your league.",
    );
  });

  it("says too when the early note already ran in this draft", () => {
    expect(getSecondSpecialistNote(pick("K", 9), USER_TEAM, [pick("K", 1)])).toBe(
      "A second kicker is a bold call too. I'd want that roster spot back, but it's your league.",
    );
  });

  it("stays quiet for a first kicker, even with a defense on the roster", () => {
    expect(getSecondSpecialistNote(pick("K", 14), USER_TEAM)).toBeNull();
    expect(getSecondSpecialistNote(pick("K", 14), USER_TEAM, [pick("DST", 12)])).toBeNull();
  });

  it("stays quiet for a second running back", () => {
    expect(getSecondSpecialistNote(pick("RB", 2), USER_TEAM, [pick("RB", 1)])).toBeNull();
  });

  it("counts only the user's own picks", () => {
    const other = USER_TEAM + 1;
    expect(getSecondSpecialistNote(pick("K", 14), USER_TEAM, [pick("K", 10, other)])).toBeNull();
    expect(getSecondSpecialistNote(pick("K", 14, other), USER_TEAM, [pick("K", 10, other)])).toBeNull();
  });

  it("fires only once per draft", () => {
    const earlier = [pick("K", 10), pick("K", 12), pick("DST", 13)];
    expect(getSecondSpecialistNote(pick("K", 14), USER_TEAM, earlier)).toBeNull();
    expect(getSecondSpecialistNote(pick("DST", 15), USER_TEAM, earlier)).toBeNull();
  });
});

describe("getSpecialistNote", () => {
  it("gives the early note first and the second note later in the same draft", () => {
    expect(getSpecialistNote(pick("K", 1), USER_TEAM)).toMatch(/first two rounds/);
    expect(getSpecialistNote(pick("K", 2), USER_TEAM, [pick("K", 1)])).toMatch(
      /second kicker is a bold call too/,
    );
  });

  it("stays quiet for an ordinary pick", () => {
    expect(getSpecialistNote(pick("WR", 3), USER_TEAM, [pick("K", 1)])).toBeNull();
  });
});
