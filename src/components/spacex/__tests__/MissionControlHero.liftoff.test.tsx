import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { fireEvent } from "@testing-library/react";
import { MissionControlHero } from "../MissionControlHero";
import type { MissionControlSummary, MissionLaunchCard } from "@/types/spacex";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const NET = Date.parse("2026-09-26T11:56:00Z");

const launch = {
  id: "6243aec2af52800c6e91925d",
  name: "Test Mission",
  flightNumber: 1,
  dateUtc: new Date(NET).toISOString(),
  datePrecision: "hour",
  rocketName: "Falcon 9",
  launchpadName: "SLC-40",
  launchpadLocation: "Cape Canaveral, Florida",
  patchImage: null,
  vehicleImage: null,
  payloadCount: 1,
  hasExactTime: true,
  links: { webcast: null, article: null, wikipedia: null },
} as unknown as MissionLaunchCard;

const summary = {
  heroLaunch: launch,
  heroMode: "next",
  heroMessage: null,
} as unknown as MissionControlSummary;

function renderHero(root: Root, initialRenderTimestampMs: number) {
  act(() => {
    root.render(
      <MissionControlHero
        summary={summary}
        isLoading={false}
        error={null}
        initialRenderTimestampMs={initialRenderTimestampMs}
        onInspect={() => {}}
        onRetry={() => {}}
      />,
    );
  });
}

describe("MissionControlHero T-0 liftoff", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.useRealTimers();
  });

  it("launches the rocket once when a watched countdown crosses T-0", () => {
    jest.setSystemTime(NET - 2500);
    renderHero(root, NET - 2500);
    expect(container.querySelector('[data-testid="mission-countdown"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="mission-liftoff-note"]')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(container.querySelector('[data-testid="mission-countdown"]')).toBeNull();
    const note = container.querySelector('[data-testid="mission-liftoff-note"]');
    expect(note?.textContent).toContain("T-0 by the schedule");
    const rockets = container.querySelectorAll('div[aria-hidden="true"] > svg');
    expect(rockets).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(container.querySelectorAll('div[aria-hidden="true"] > svg')).toHaveLength(1);

    // The flame's flicker ending is not the rise ending, so the rocket stays.
    const rocket = rockets[0].parentElement!;
    act(() => {
      fireEvent.animationEnd(rocket.querySelector("path")!);
    });
    expect(container.querySelector('div[aria-hidden="true"] > svg')).not.toBeNull();

    // The rise ending unmounts the rocket and leaves the note.
    act(() => {
      fireEvent.animationEnd(rocket);
    });
    expect(container.querySelector('div[aria-hidden="true"] > svg')).toBeNull();
    expect(container.querySelector('[data-testid="mission-liftoff-note"]')?.textContent).toContain(
      "T-0 by the schedule",
    );
  });

  it("does nothing when the page opens after T-0", () => {
    // The server rendered before T-0, but the visitor's clock is already past it.
    jest.setSystemTime(NET + 1000);
    renderHero(root, NET - 60_000);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(container.querySelector('[data-testid="mission-countdown"]')).toBeNull();
    expect(container.querySelector('[data-testid="mission-liftoff-note"]')).toBeNull();
    expect(container.querySelector('div[aria-hidden="true"] > svg')).toBeNull();
  });
});
