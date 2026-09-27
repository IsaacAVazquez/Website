import { fireEvent, render, screen } from "@testing-library/react";
import { TransitSignature } from "../TransitSignature";

const station = (id: string, abbr: string, lat: number, lon: number) =>
  ({ id, abbr, name: `${abbr} station`, latitude: lat, longitude: lon, city: "SF", lines: ["Yellow"] }) as never;
const stations = [station("s1", "EMBR", 37.79, -122.39), station("s2", "MONT", 37.78, -122.4)];
const lines = [{ id: "y", colorName: "Yellow", hexColor: "#ffe800", originAbbr: "EMBR", destinationAbbr: "MONT", stationCount: 2 }] as never;
const board = (delay: number, status = "fresh") =>
  ({
    station: stations[0],
    departures: [{ destination: "Antioch", minutes: 4, delaySeconds: delay, colorName: "Yellow", hexColor: "#ffe800", platform: "2", direction: "North", cars: 8, bikesAllowed: true }],
    status,
  }) as never;

function renderSignature(props: Partial<Parameters<typeof TransitSignature>[0]> = {}) {
  return render(
    <TransitSignature
      stations={stations}
      lines={lines}
      selectedStation={stations[0]}
      stationBoard={board(0)}
      isLoading={false}
      error={null}
      onSelect={() => {}}
      onRetry={() => {}}
      {...props}
    />,
  );
}

it("keeps the station dots out of the tab order, since the station list is the keyboard path", () => {
  const { container } = renderSignature();
  const svg = container.querySelector('svg[role="img"]')!;
  expect(svg.querySelectorAll("[tabindex]")).toHaveLength(0);
});

it("still selects a station from a pointer click on its dot", () => {
  const onSelect = jest.fn();
  const { container } = renderSignature({ onSelect });
  fireEvent.click(container.querySelectorAll('svg[role="img"] g')[1]);
  expect(onSelect).toHaveBeenCalledWith("s2");
});

it("shows a late train's delay on the platform board", () => {
  renderSignature({ stationBoard: board(180) });
  expect(screen.getByText(/3 min late/i)).toBeInTheDocument();
});

it("warns on the board when departures come from the last good snapshot", () => {
  renderSignature({ departuresStatus: "stale-fallback" });
  expect(screen.getByText(/last good snapshot/i)).toBeInTheDocument();
});

it("says so on the board when BART has no departures to give", () => {
  renderSignature({ departuresStatus: "unavailable" });
  expect(screen.getByText(/departures are unavailable/i)).toBeInTheDocument();
});
