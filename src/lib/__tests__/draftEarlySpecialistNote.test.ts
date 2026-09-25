import { getEarlySpecialistNote } from "@/lib/draftEarlySpecialistNote";
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
