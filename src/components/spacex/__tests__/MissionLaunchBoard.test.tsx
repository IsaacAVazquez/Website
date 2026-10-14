import { fireEvent, render, screen } from "@testing-library/react";
import type { MissionLaunchCard } from "@/types/spacex";
import { MissionLaunchBoard } from "../MissionLaunchBoard";

function makeLaunch(id: string, rocketName: string, upcoming: boolean): MissionLaunchCard {
  return {
    id,
    name: `Mission ${id}`,
    flightNumber: 1,
    upcoming,
    success: upcoming ? null : true,
    details: null,
    dateUtc: "2026-05-01T12:00:00.000Z",
    dateUnix: 1777636800,
    dateLocal: "2026-05-01T08:00:00-04:00",
    datePrecision: "hour",
    tbd: false,
    net: false,
    rocketName,
    launchpadName: "KSC LC 39A",
    launchpadLocation: "Cape Canaveral, Florida",
    patchImage: null,
    vehicleImage: null,
    crewCount: 0,
    payloadCount: 1,
    capsuleCount: 0,
    coreCount: 1,
    hasExactTime: true,
    isStaleSchedule: false,
    links: {
      webcast: null,
      article: null,
      wikipedia: null,
      presskit: null,
      redditLaunch: null,
      redditCampaign: null,
      redditMedia: null,
      youtubeId: null,
      patchSmall: null,
      patchLarge: null,
      flickrOriginal: [],
    },
  };
}

const noop = () => undefined;

function board(launches: MissionLaunchCard[], status: "upcoming" | "past") {
  return (
    <MissionLaunchBoard
      launches={launches}
      status={status}
      selectedLaunchId={null}
      isLoading={false}
      error={null}
      onStatusChange={noop}
      onSelectLaunch={noop}
      onRetry={noop}
    />
  );
}

describe("MissionLaunchBoard", () => {
  it("drops a vehicle filter the new board cannot offer, so its missions still show", () => {
    const upcoming = [
      makeLaunch("a", "Falcon 9 Block 5", true),
      makeLaunch("b", "Starship", true),
      makeLaunch("c", "Falcon Heavy", true),
    ];
    const { rerender } = render(board(upcoming, "upcoming"));

    fireEvent.click(screen.getByRole("button", { name: "Starship" }));
    expect(screen.getAllByTestId(/^mission-card-/)).toHaveLength(1);

    // Ten Falcon 9 flights leave two options, so the filter row is not offered.
    const past = Array.from({ length: 10 }, (_, index) => makeLaunch(`p${index}`, "Falcon 9 Block 5", false));
    rerender(board(past, "past"));

    expect(screen.queryByRole("group", { name: "Filter by vehicle" })).toBeNull();
    expect(screen.getAllByTestId(/^mission-card-/)).toHaveLength(10);
    expect(screen.queryByText(/No Starship missions/)).toBeNull();
  });

  it("keeps the picked vehicle when the next board still flies it", () => {
    const upcoming = [
      makeLaunch("a", "Falcon 9 Block 5", true),
      makeLaunch("b", "Starship", true),
      makeLaunch("c", "Falcon Heavy", true),
    ];
    const { rerender } = render(board(upcoming, "upcoming"));
    fireEvent.click(screen.getByRole("button", { name: "Starship" }));

    rerender(
      board(
        [makeLaunch("p1", "Falcon 9 Block 5", false), makeLaunch("p2", "Starship", false), makeLaunch("p3", "Falcon Heavy", false)],
        "past"
      )
    );

    expect(screen.getByRole("button", { name: "Starship" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByTestId(/^mission-card-/)).toHaveLength(1);
  });
});
