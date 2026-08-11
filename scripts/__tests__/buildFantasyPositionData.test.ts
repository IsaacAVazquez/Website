/**
 * @jest-environment node
 */
import { renderGeneratedModule } from "../buildFantasyPositionData";
import { FANTASY_PROS_OFFICIAL_API_SOURCE } from "@/lib/fantasyProsPublicSource";

describe("buildFantasyPositionData", () => {
  it("writes the selected source label into the generated module", () => {
    const rendered = renderGeneratedModule(
      {} as Parameters<typeof renderGeneratedModule>[0],
      "2026-08-11T12:00:00.000Z",
      FANTASY_PROS_OFFICIAL_API_SOURCE
    );

    expect(rendered).toContain(
      `export const fantasyPositionDataSource = ${JSON.stringify(FANTASY_PROS_OFFICIAL_API_SOURCE)};`
    );
    expect(rendered).not.toContain("FantasyPros public consensus cheatsheets");
  });
});
