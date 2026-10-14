import { render, screen } from "@testing-library/react";
import { EarthquakeSignature, EpicentrePlot } from "../EarthquakeSignature";
import { EARTHQUAKE_RECENT_LIMIT, type QuakeEvent } from "@/types/earthquake";
import { seismogramSpikes } from "../seismogram";

const end = new Date("2026-09-24T12:00:00Z");
const quake = (id: string, hoursAgo: number, magnitude: number, place = `${id} place`): QuakeEvent =>
  ({
    id,
    magnitude,
    place,
    time: new Date(end.getTime() - hoursAgo * 3600e3).toISOString(),
    latitude: 0,
    longitude: 0,
    depthKm: 10,
  }) as QuakeEvent;

it("labels the trace with the day's strongest quake even when the log no longer holds it", () => {
  const { container } = render(
    <EarthquakeSignature
      quakes={[quake("a", 1, 3.1), quake("b", 2, 2.9)]}
      spikes={seismogramSpikes([quake("a", 1, 3.1), quake("b", 2, 2.9)], end)}
      strongest={{ magnitude: 6.4, place: "Kermadec Islands" }}
      selectedId={null}
      onSelect={() => {}}
    />,
  );
  expect(container.querySelector(".eq-trace-label")?.textContent).toMatch(/M6\.4 Kermadec Islands/);
});

it("marks the part of the day a capped log cannot show", () => {
  const quakes = Array.from({ length: EARTHQUAKE_RECENT_LIMIT }, (_, i) => quake(`q${i}`, i * 0.2, 3));
  const { container } = render(
    <EarthquakeSignature
      quakes={quakes}
      spikes={seismogramSpikes(quakes, end)}
      strongest={{ magnitude: 3, place: "q0 place" }}
      selectedId={null}
      onSelect={() => {}}
    />,
  );
  expect(screen.getByText(/Older quakes are outside the log/i)).toBeInTheDocument();
  expect(container.querySelector("desc")?.textContent).toMatch(new RegExp(`${EARTHQUAKE_RECENT_LIMIT} most recent`));
});

it("counts a single quake on the trace in the singular", () => {
  const quakes = [quake("a", 1, 3.1)];
  const { container } = render(
    <EarthquakeSignature
      quakes={quakes}
      spikes={seismogramSpikes(quakes, end)}
      strongest={{ magnitude: 3.1, place: "a place" }}
      selectedId={null}
      onSelect={() => {}}
    />,
  );
  expect(container.querySelector("desc")?.textContent).toMatch(/^1 quake of magnitude 2\.5 or more/);
});

describe("the epicentre plot's name", () => {
  const plotName = (quakes: QuakeEvent[]) => {
    render(<EpicentrePlot quakes={quakes} spikes={seismogramSpikes(quakes, end)} selectedId={null} onSelect={() => {}} />);
    return screen.getByRole("img").getAttribute("aria-label");
  };

  it("says a capped log holds the most recent quakes, not the whole day's", () => {
    const name = plotName(Array.from({ length: EARTHQUAKE_RECENT_LIMIT }, (_, i) => quake(`q${i}`, i * 0.2, 3)));
    expect(name).toMatch(new RegExp(`the ${EARTHQUAKE_RECENT_LIMIT} most recent quakes of magnitude 2\\.5 or more`));
    expect(name).not.toMatch(/past day/);
  });

  it("names the whole day when the log holds all of it, and counts one quake in the singular", () => {
    expect(plotName([quake("a", 1, 3.1)])).toMatch(/the past day's 1 quake on a latitude and longitude grid/);
  });
});
