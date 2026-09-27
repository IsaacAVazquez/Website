import { render, screen } from "@testing-library/react";
import { EarthquakeSignature } from "../EarthquakeSignature";
import { EARTHQUAKE_RECENT_LIMIT, type QuakeEvent } from "@/types/earthquake";

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
      windowEnd={end}
      strongest={{ magnitude: 6.4, place: "Kermadec Islands" }}
      selectedId={null}
      onSelect={() => {}}
    />,
  );
  expect(container.querySelector(".c97-quake-label")?.textContent).toMatch(/M6\.4 Kermadec Islands/);
});

it("marks the part of the day a capped log cannot show", () => {
  const quakes = Array.from({ length: EARTHQUAKE_RECENT_LIMIT }, (_, i) => quake(`q${i}`, i * 0.2, 3));
  const { container } = render(
    <EarthquakeSignature
      quakes={quakes}
      windowEnd={end}
      strongest={{ magnitude: 3, place: "q0 place" }}
      selectedId={null}
      onSelect={() => {}}
    />,
  );
  expect(screen.getByText(/Older quakes are outside the log/i)).toBeInTheDocument();
  expect(container.querySelector("desc")?.textContent).toMatch(new RegExp(`${EARTHQUAKE_RECENT_LIMIT} most recent`));
});
