import { render, screen } from "@testing-library/react";
import type { ScorePoolsSnapshot, SnapshotFixture } from "@/types/scorePools";
import { ScorePoolsClient } from "../score-pools-client";
import { SettingsClient } from "../settings/settings-client";
import { TrackerClient } from "../tracker/tracker-client";

const SAMPLE_NOTICE =
  "This page is showing sample data only. The sample was built on July 20, 2026, and no live odds feed is connected.";

function fixture(id: string, manual: boolean): SnapshotFixture {
  return {
    id,
    kickoff: "2026-08-04T19:00:00.000Z",
    homeTeam: "Harbor City",
    awayTeam: "Ironvale",
    stage: "Quarterfinal",
    round: null,
    knockout: true,
    status: "scheduled",
    result: null,
    lineupsConfirmed: null,
    injuryNotes: [],
    odds: [
      {
        fetchedAt: "2026-07-19T08:00:00.000Z",
        bookmaker: manual ? null : "pinnacle",
        manual,
        moneyline: { home: 2.55, draw: 3.05, away: 3 },
        totals: { line: 2.5, over: 2.1, under: 1.78 },
      },
    ],
  };
}

// Shaped like the committed snapshot: a provider league and the Sample Cup.
function snapshot(premierLeagueFixtures: SnapshotFixture[]): ScorePoolsSnapshot {
  const generatedAt = "2026-07-20T06:27:09.599Z";
  const league = {
    sport: "soccer",
    sources: { fixtures: "manual entry", odds: "manual entry" },
    generatedAt,
    notes: [],
    standings: [],
  };
  return {
    generatedAt,
    leagues: [
      {
        ...league,
        key: "premier-league",
        name: "Premier League",
        season: "2026-27",
        sample: false,
        fixtures: premierLeagueFixtures,
      },
      {
        ...league,
        key: "sample-cup",
        name: "Sample Cup",
        season: "2026 demo",
        sample: true,
        fixtures: [fixture("sc-qf-1", true)],
      },
    ],
  };
}

describe("score pools sample data disclosure", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("says the landing state is sample data before any pool exists", () => {
    render(<ScorePoolsClient snapshot={snapshot([])} initialFixtureId={null} />);

    expect(screen.getByText("Set up your first pool")).toBeInTheDocument();
    expect(screen.getByText(SAMPLE_NOTICE)).toBeInTheDocument();
    expect(screen.getByText(/Data as of/)).toBeInTheDocument();
  });

  it("shows the same notice on the tracker and on settings", () => {
    const tracker = render(<TrackerClient snapshot={snapshot([])} />);
    expect(screen.getByText(SAMPLE_NOTICE)).toBeInTheDocument();
    tracker.unmount();

    render(<SettingsClient snapshot={snapshot([])} />);
    expect(screen.getByText(SAMPLE_NOTICE)).toBeInTheDocument();
  });

  it("does not call hand-entered fixtures in a real league a sample", () => {
    render(
      <ScorePoolsClient snapshot={snapshot([fixture("pl-1", true)])} initialFixtureId={null} />,
    );

    expect(screen.queryByText(SAMPLE_NOTICE)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "No live odds feed is connected. The odds on this page were entered by hand, and the snapshot was built on July 20, 2026.",
      ),
    ).toBeInTheDocument();
  });

  it("drops the notice once a provider league carries fetched odds", () => {
    render(
      <ScorePoolsClient snapshot={snapshot([fixture("af-1", false)])} initialFixtureId={null} />,
    );

    expect(screen.queryByText(/No live odds feed is connected|sample data only/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Data as of/)).toBeInTheDocument();
  });
});

describe("score pools league choice", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it.each([
    [
      "the pick sheet",
      <ScorePoolsClient key="p" snapshot={snapshot([])} initialFixtureId={null} />,
      "Sample Cup (sample)",
    ],
    ["settings", <SettingsClient key="s" snapshot={snapshot([])} />, "Sample Cup (sample)"],
  ])("does not offer a league with no fixtures on %s", (_name, element, sampleLabel) => {
    render(element);

    expect(screen.getByRole("option", { name: "Premier League · no fixtures" })).toBeDisabled();
    expect(screen.getByRole("option", { name: sampleLabel })).toBeEnabled();
    expect(screen.getByLabelText("League")).toHaveValue("sample-cup");
  });
});
