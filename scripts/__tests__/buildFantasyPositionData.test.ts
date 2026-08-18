/**
 * @jest-environment node
 */
import {
  recordSourceLabel,
  renderGeneratedModule,
} from "../buildFantasyPositionData";
import {
  FANTASY_PROS_OFFICIAL_API_SOURCE,
  FANTASY_PROS_PUBLIC_SOURCE,
  type FantasyProsPublicBoard,
} from "@/lib/fantasyProsPublicSource";

describe("buildFantasyPositionData", () => {
  it.each([
    FANTASY_PROS_PUBLIC_SOURCE,
    FANTASY_PROS_OFFICIAL_API_SOURCE,
  ])("writes the selected source label into the generated module", (sourceLabel) => {
    const rendered = renderGeneratedModule(
      {} as Parameters<typeof renderGeneratedModule>[0],
      "2026-08-11T12:00:00.000Z",
      sourceLabel
    );

    expect(rendered).toContain(
      `export const fantasyPositionDataSource = ${JSON.stringify(sourceLabel)};`
    );
  });

  it("rejects a build that mixes source paths across boards", () => {
    const officialBoard = {
      sourceLabel: FANTASY_PROS_OFFICIAL_API_SOURCE,
    } as FantasyProsPublicBoard;

    expect(() => recordSourceLabel(FANTASY_PROS_PUBLIC_SOURCE, officialBoard)).toThrow(
      /refresh mixed source paths/
    );
  });
});
