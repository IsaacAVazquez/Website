import { render, screen } from "@testing-library/react";
import { MissionCadenceStrip } from "../MissionCadenceStrip";
import { aggregateLaunchCadence } from "@/lib/spacexCadence";

const cadence = aggregateLaunchCadence(
  ["2026-10-02T00:00:00Z", "2026-10-20T00:00:00Z", "2026-11-03T00:00:00Z"],
  Date.parse("2026-11-23T21:34:13Z")
);

describe("MissionCadenceStrip", () => {
  it("says where the count stops, since the newest month is still running", () => {
    render(<MissionCadenceStrip cadence={cadence} />);

    expect(
      screen.getByRole("img", { name: "Launches per month, Dec 25 – Nov 26, counted through Nov 23" })
    ).toBeInTheDocument();
    expect(screen.getByTitle("Nov 26 to date: 1 launch")).toBeInTheDocument();
    expect(screen.getByTitle("Oct 26: 2 launches")).toBeInTheDocument();
  });

  it("prints every month's count as a list beside the bars", () => {
    render(<MissionCadenceStrip cadence={cadence} />);

    const counts = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(counts).toHaveLength(12);
    expect(counts.slice(-2)).toEqual(["Oct 26: 2 launches", "Nov 26 to date: 1 launch"]);
  });

  it("renders nothing without a series", () => {
    const { container } = render(<MissionCadenceStrip cadence={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
