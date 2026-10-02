/**
 * @jest-environment node
 */
import { recordSourceLabel } from "../buildFantasyPositionData";
import {
  FANTASY_PROS_PUBLIC_SOURCE,
  type FantasyProsPublicBoard,
} from "@/lib/fantasyProsPublicSource";

describe("buildFantasyPositionData", () => {
  it("rejects a build that mixes source paths across boards", () => {
    const otherBoard = {
      sourceLabel: "another source",
    } as FantasyProsPublicBoard;

    expect(() => recordSourceLabel(FANTASY_PROS_PUBLIC_SOURCE, otherBoard)).toThrow(
      /refresh mixed source paths/
    );
  });
});
