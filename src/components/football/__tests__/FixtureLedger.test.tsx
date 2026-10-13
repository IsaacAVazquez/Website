import { render, screen } from "@testing-library/react";
import type { GenericFixture } from "../FixtureCard";
import { FixtureLedgerSection } from "../FixtureLedger";

function fixture(overrides: Partial<GenericFixture> = {}): GenericFixture {
  return {
    id: "game-1",
    utcDate: "2026-09-27T17:25:00Z",
    status: "SCHEDULED",
    matchday: null,
    homeTeam: { id: "home", shortName: "Home", crest: null },
    awayTeam: { id: "away", shortName: "Away", crest: null },
    score: { winner: null, home: null, away: null },
    ...overrides,
  };
}

function renderLedger(fixtures: GenericFixture[]) {
  return render(
    <FixtureLedgerSection groups={[{ key: "stage", label: "Regular season", fixtures }]} />
  );
}

describe("FixtureLedgerSection dates", () => {
  it("distinguishes upcoming games on consecutive Sundays within one stage", () => {
    renderLedger([
      fixture(),
      fixture({ id: "game-2", utcDate: "2026-10-04T17:25:00Z" }),
    ]);

    expect(screen.getByText("Sep 27, 1:25 PM EDT")).toBeVisible();
    expect(screen.getByText("Oct 4, 1:25 PM EDT")).toBeVisible();
  });

  it("keeps a finished game's date alongside its score and shootout", () => {
    const { container } = renderLedger([
      fixture({
        status: "FINISHED",
        score: { winner: "HOME_TEAM", home: 0, away: 0, shootoutHome: 4, shootoutAway: 3 },
      }),
    ]);

    expect(screen.getByText("Sep 27, 1:25 PM EDT")).toBeVisible();
    expect(container).toHaveTextContent("0–0");
    expect(screen.getByText("4–3 pens")).toBeVisible();
  });

  it.each([
    ["SCHEDULED", "Oct 18 · time TBD · if necessary"],
    ["FINISHED", "Oct 18"],
  ])("keeps a %s placeholder on its calendar day without printing a clock", (status, label) => {
    renderLedger([
      fixture({ utcDate: "2026-10-18T00:00:00Z", status, startTimeTbd: true, ifNecessary: true }),
    ]);

    expect(screen.getByText(label)).toBeVisible();
  });
});
