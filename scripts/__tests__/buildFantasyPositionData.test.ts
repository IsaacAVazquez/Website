/**
 * @jest-environment node
 */
import { recordSourceLabel } from "../buildFantasyPositionData";
import {
  FANTASY_PROS_OFFICIAL_API_SOURCE,
  FANTASY_PROS_PUBLIC_SOURCE,
  type FantasyProsPublicBoard,
} from "@/lib/fantasyProsPublicSource";

describe("buildFantasyPositionData", () => {
  it("rejects a build that mixes source paths across boards", () => {
    const officialBoard = {
      sourceLabel: FANTASY_PROS_OFFICIAL_API_SOURCE,
    } as FantasyProsPublicBoard;

    expect(() => recordSourceLabel(FANTASY_PROS_PUBLIC_SOURCE, officialBoard)).toThrow(
      /refresh mixed source paths/
    );
  });
});
