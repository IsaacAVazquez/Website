import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SpaceXMissionControlClient } from "../spacex-mission-control-client";
import { DEFAULT_MISSION_CONTROL_STATE } from "../spacex-mission-control-state";
import type {
  MissionControlInitialData,
  MissionControlSummary,
  MissionControlSearchState,
  MissionLaunchCard,
  MissionLaunchDetail,
} from "@/types/spacex";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();
let documentVisibility: DocumentVisibilityState = "visible";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

(
  globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT: boolean;
  }
).IS_REACT_ACT_ENVIRONMENT = true;
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const baseLinks = {
  webcast: "https://youtu.be/test",
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
};

const upcomingLaunch: MissionLaunchCard = {
  id: "6243aec2af52800c6e91925d",
  name: "USSF-44",
  flightNumber: 188,
  upcoming: true,
  success: null,
  details: null,
  dateUtc: "2026-05-01T12:00:00.000Z",
  dateUnix: 1777636800,
  dateLocal: "2026-05-01T08:00:00-04:00",
  datePrecision: "hour",
  tbd: false,
  net: false,
  rocketName: "Falcon Heavy",
  launchpadName: "KSC LC 39A",
  launchpadLocation: "Cape Canaveral, Florida",
  patchImage: "https://images.example.com/ussf44-patch.png",
  vehicleImage: "https://images.example.com/falcon-heavy.png",
  crewCount: 0,
  payloadCount: 1,
  capsuleCount: 0,
  coreCount: 3,
  hasExactTime: true,
  isStaleSchedule: false,
  links: baseLinks,
};

const impreciseLaunch: MissionLaunchCard = {
  ...upcomingLaunch,
  id: "62dd70d5202306255024d139",
  name: "Starlink Batch",
  dateUtc: "2026-06-01T00:00:00.000Z",
  datePrecision: "day",
  hasExactTime: false,
};

const patchFallbackLaunch: MissionLaunchCard = {
  ...upcomingLaunch,
  id: "5eb87d47ffd86e000604b389",
  name: "Patch Fallback Mission",
  vehicleImage: null,
  patchImage: "https://images.example.com/fallback-patch.png",
};

const launchWithoutPatch: MissionLaunchCard = {
  ...upcomingLaunch,
  id: "5eb87d47ffd86e000604b390",
  name: "Vehicle Only Mission",
  patchImage: null,
  vehicleImage: "https://images.example.com/falcon-heavy.png",
};

const pastLaunch: MissionLaunchCard = {
  ...upcomingLaunch,
  id: "5eb87d46ffd86e000604b388",
  name: "CCtCap Demo Mission 2",
  flightNumber: 94,
  upcoming: false,
  success: true,
  dateUtc: "2020-05-30T19:22:00.000Z",
  dateUnix: 1590866520,
  dateLocal: "2020-05-30T15:22:00-04:00",
  rocketName: "Falcon 9",
  coreCount: 1,
  crewCount: 2,
  capsuleCount: 1,
  patchImage: "https://images.example.com/ccrew-patch.png",
  vehicleImage: "https://images.example.com/falcon9-launch.png",
};

const summary: MissionControlSummary = {
  heroLaunch: upcomingLaunch,
  nextLaunch: upcomingLaunch,
  fallbackLaunch: pastLaunch,
  heroMode: "next",
  heroMessage: null,
  insights: [
    {
      id: "upcoming",
      label: "Upcoming queue",
      value: "4",
      description: "missions currently marked upcoming by the upstream API",
    },
  ],
  generatedAt: "2026-04-01T00:00:00.000Z",
};

const impreciseSummary: MissionControlSummary = {
  ...summary,
  heroLaunch: impreciseLaunch,
  nextLaunch: impreciseLaunch,
};

const refreshedUpcomingLaunch: MissionLaunchCard = {
  ...impreciseLaunch,
  id: "6243aec2af52800c6e91925e",
  name: "Starlink Group 10-58",
  flightNumber: 189,
  rocketName: "Falcon 9 Block 5",
  vehicleImage: "https://images.example.com/starlink-group-10-58.png",
};

const refreshedSummary: MissionControlSummary = {
  ...summary,
  heroLaunch: refreshedUpcomingLaunch,
  nextLaunch: refreshedUpcomingLaunch,
  generatedAt: "2026-04-01T00:02:00.000Z",
};

const detail: MissionLaunchDetail = {
  ...pastLaunch,
  links: {
    ...baseLinks,
    webcast: null,
  },
  details: "Crewed demo mission",
  staticFireDateUtc: null,
  window: 0,
  failures: [],
  rocket: {
    id: "5e9d0d95eda69973a809d1ec",
    name: "Falcon 9",
    type: "rocket",
    active: true,
    boosters: 0,
    stages: 2,
    costPerLaunch: 50000000,
    successRatePct: 98,
    firstFlight: "2010-06-04",
    company: "SpaceX",
    country: "United States",
    description: "Reusable two-stage rocket.",
    wikipedia: "https://en.wikipedia.org/wiki/Falcon_9",
    heightMeters: 70,
    diameterMeters: 3.7,
    massKg: 549054,
    image: "https://images.example.com/falcon9-vehicle.png",
    flickrImages: [],
  },
  launchpad: {
    id: "5e9e4502f509094188566f88",
    name: "KSC LC 39A",
    fullName: "Kennedy Space Center Historic Launch Complex 39A",
    locality: "Cape Canaveral",
    region: "Florida",
    timezone: "America/New_York",
    status: "active",
    details: "Historic crew launch complex.",
    image: null,
  },
  crew: [],
  payloads: [],
  capsules: [],
  cores: [],
};

const detailWithoutImage: MissionLaunchDetail = {
  ...detail,
  vehicleImage: null,
  rocket: detail.rocket
    ? {
        ...detail.rocket,
        image: null,
      }
    : null,
};

const detailWithoutAnyImage: MissionLaunchDetail = {
  ...detailWithoutImage,
  patchImage: null,
};

const updatedDetail: MissionLaunchDetail = {
  ...detail,
  details: "Updated detail narrative from the live refresh.",
};

function createInitialData(
  overrides: Partial<MissionControlInitialData> = {}
): MissionControlInitialData {
  return {
    summary,
    summaryError: null,
    launches: [upcomingLaunch],
    launchesError: null,
    detail: null,
    detailError: null,
    ...overrides,
  };
}

function flushPromises() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function queryMissionImage(container: ParentNode, testId: string): HTMLImageElement | null {
  return container.querySelector(`[data-testid="${testId}"] img`);
}

function queryMissionImageFrame(container: ParentNode, testId: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${testId}"]`);
}

describe("SpaceXMissionControlClient", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    currentSearchParams = new URLSearchParams();
    documentVisibility = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => documentVisibility,
    });
    mockFetch.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    act(() => root.unmount());
    container.remove();
  });

  it("renders the hero and board from local API responses", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => summary,
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [upcomingLaunch] }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(container.textContent).toContain("USSF-44");
    expect(container.textContent).toContain("Falcon Heavy");
    expect(container.querySelector("h1")?.textContent).toContain(
      "A launch board built like an operations room, not a brochure."
    );
    expect(container.textContent).toContain("Refresh data");
    expect(container.querySelector('[data-testid="mission-hero"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="mission-board"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="mission-detail-panel"]')).not.toBeNull();
    expect(queryMissionImage(container, "mission-hero-visual")?.getAttribute("src")).toContain(
      "https://images.example.com/falcon-heavy.png"
    );
    expect(queryMissionImage(container, "mission-hero-visual")?.getAttribute("referrerpolicy")).toBe(
      "no-referrer"
    );
    expect(queryMissionImageFrame(container, "mission-hero-visual")?.getAttribute("data-image-fit")).toBe(
      "cover"
    );
    expect(
      queryMissionImage(container, "mission-board-visual-6243aec2af52800c6e91925d")?.getAttribute(
        "src"
      )
    ).toContain("https://images.example.com/ussf44-patch.png");
    expect(
      queryMissionImageFrame(container, "mission-board-visual-6243aec2af52800c6e91925d")?.getAttribute(
        "data-image-fit"
      )
    ).toBe("contain");
  });

  it("renders server-hydrated summary, board, and detail data without mount-time browser fetches", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse("2026-04-30T12:00:00.000Z"));

    const deepLinkedState: MissionControlSearchState = {
      status: "past",
      launch: pastLaunch.id,
      panel: "vehicle",
    };

    currentSearchParams = new URLSearchParams(
      "status=past&launch=5eb87d46ffd86e000604b388&panel=vehicle"
    );

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient
          initialState={deepLinkedState}
          initialData={createInitialData({
            launches: [pastLaunch],
            detail,
          })}
          renderedAtMs={Date.now()}
        />
      );
    });
    await flushPromises();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(container.textContent).toContain("CCtCap Demo Mission 2");
    expect(container.textContent).toContain("T-1d 00h 00m 00s");
    expect(container.querySelector('[data-testid="mission-detail-panel"]')).not.toBeNull();
    expect(
      queryMissionImage(container, "mission-vehicle-photo")?.getAttribute("src")
    ).toContain("https://images.example.com/falcon9-launch.png");
  });

  it("falls back to mission patch art in the hero when no vehicle photo is available", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...summary,
            heroLaunch: patchFallbackLaunch,
            nextLaunch: patchFallbackLaunch,
          }),
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [patchFallbackLaunch] }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(
      queryMissionImage(container, "mission-hero-visual")?.getAttribute("src")
    ).toContain("https://images.example.com/fallback-patch.png");
  });

  it("keeps the board patch tile in placeholder mode when a launch has no patch art", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...summary,
            heroLaunch: launchWithoutPatch,
            nextLaunch: launchWithoutPatch,
          }),
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [launchWithoutPatch] }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(
      queryMissionImage(container, "mission-board-visual-5eb87d47ffd86e000604b390")
    ).toBeNull();
    expect(
      queryMissionImageFrame(container, "mission-board-visual-5eb87d47ffd86e000604b390")?.getAttribute(
        "data-image-state"
      )
    ).toBe("placeholder");
  });

  it("falls back to mission patch art when the hero image errors", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => summary,
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [upcomingLaunch] }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    const heroImage = queryMissionImage(container, "mission-hero-visual");

    await act(async () => {
      heroImage?.dispatchEvent(new Event("error"));
    });
    await flushPromises();

    expect(queryMissionImage(container, "mission-hero-visual")?.getAttribute("src")).toContain(
      "https://images.example.com/ussf44-patch.png"
    );
  });

  it("refreshes the hero and board when newer launch data arrives on the live interval", async () => {
    jest.useFakeTimers();

    let summaryCalls = 0;
    let launchesCalls = 0;

    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        summaryCalls += 1;
        return Promise.resolve({
          ok: true,
          json: async () => (summaryCalls === 1 ? impreciseSummary : refreshedSummary),
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        launchesCalls += 1;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            launches: launchesCalls === 1 ? [impreciseLaunch] : [refreshedUpcomingLaunch],
          }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="mission-hero"]')?.textContent).toContain(
      "Starlink Batch"
    );

    await act(async () => {
      jest.advanceTimersByTime(300_000);
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="mission-hero"]')?.textContent).toContain(
      "Starlink Group 10-58"
    );
    expect(container.querySelector('[data-testid="mission-board"]')?.textContent).toContain(
      "Starlink Group 10-58"
    );
  });

  it("updates the URL and refetches when the board status changes", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => summary,
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [upcomingLaunch] }),
        });
      }

      if (url.includes("/api/spacex/launches?status=past")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [pastLaunch] }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    await act(async () => {
      const button = Array.from(container.querySelectorAll('button[role="tab"]')).find(
        (tab) => tab.textContent?.includes("Past")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    expect(mockPush).toHaveBeenCalledWith("/spacex-mission-control?status=past", {
      scroll: false,
    });

    currentSearchParams = new URLSearchParams("status=past");
    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(container.textContent).toContain("CCtCap Demo Mission 2");
  });

  it("keeps the hero pinned to the global next mission when the board switches to past launches", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => summary,
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [upcomingLaunch] }),
        });
      }

      if (url.includes("/api/spacex/launches?status=past")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [pastLaunch] }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    await act(async () => {
      const button = Array.from(container.querySelectorAll('button[role="tab"]')).find(
        (tab) => tab.textContent?.includes("Past")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    currentSearchParams = new URLSearchParams("status=past");
    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="mission-hero"]')?.textContent).toContain(
      "USSF-44"
    );
    expect(container.querySelector('[data-testid="mission-hero"]')?.textContent).not.toContain(
      "CCtCap Demo Mission 2"
    );
    expect(container.querySelector('[data-testid="mission-board"]')?.textContent).toContain(
      "CCtCap Demo Mission 2"
    );
  });

  it("loads detail panels from the deep-linked launch id and shows empty-state fallbacks", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => summary,
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [upcomingLaunch] }),
        });
      }

      if (url.includes("/api/spacex/launches/5eb87d46ffd86e000604b388")) {
        return Promise.resolve({
          ok: true,
          json: async () => detail,
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    currentSearchParams = new URLSearchParams("launch=5eb87d46ffd86e000604b388&panel=payloads");

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(container.textContent).toContain("No payloads listed.");

    await act(async () => {
      const button = Array.from(container.querySelectorAll('button[role="tab"]')).find(
        (tab) => tab.textContent?.includes("Links")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/spacex-mission-control?launch=5eb87d46ffd86e000604b388&panel=links",
      { scroll: false }
    );

    currentSearchParams = new URLSearchParams(
      "launch=5eb87d46ffd86e000604b388&panel=links"
    );
    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(container.textContent).toContain("No external references are listed for this mission.");
  });

  it("refreshes the selected mission detail when a global live refresh is triggered", async () => {
    let detailCalls = 0;

    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => summary,
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [upcomingLaunch] }),
        });
      }

      if (url.includes("/api/spacex/launches/5eb87d46ffd86e000604b388")) {
        detailCalls += 1;
        return Promise.resolve({
          ok: true,
          json: async () => (detailCalls === 1 ? detail : updatedDetail),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    currentSearchParams = new URLSearchParams("launch=5eb87d46ffd86e000604b388");

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(container.textContent).toContain("Crewed demo mission");

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await flushPromises();

    expect(container.textContent).toContain("Updated detail narrative from the live refresh.");
    expect(detailCalls).toBe(2);
  });

  it("renders a vehicle photo card in the vehicle panel when imagery is available", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => summary,
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [upcomingLaunch] }),
        });
      }

      if (url.includes("/api/spacex/launches/5eb87d46ffd86e000604b388")) {
        return Promise.resolve({
          ok: true,
          json: async () => detail,
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    currentSearchParams = new URLSearchParams("launch=5eb87d46ffd86e000604b388&panel=vehicle");

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="mission-vehicle-photo"]')).not.toBeNull();
    expect(
      queryMissionImage(container, "mission-vehicle-photo")?.getAttribute("src")
    ).toContain("https://images.example.com/falcon9-launch.png");
  });

  it("renders a placeholder state when no vehicle imagery is available", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => summary,
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [upcomingLaunch] }),
        });
      }

      if (url.includes("/api/spacex/launches/5eb87d46ffd86e000604b388")) {
        return Promise.resolve({
          ok: true,
          json: async () => detailWithoutAnyImage,
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    currentSearchParams = new URLSearchParams("launch=5eb87d46ffd86e000604b388&panel=vehicle");

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(queryMissionImageFrame(container, "mission-vehicle-photo")).not.toBeNull();
    expect(queryMissionImageFrame(container, "mission-vehicle-photo")?.getAttribute("data-image-state")).toBe(
      "placeholder"
    );
    expect(queryMissionImage(container, "mission-vehicle-photo")).toBeNull();
    expect(container.textContent).toContain("Reusable two-stage rocket.");
  });

  it("uses source-agnostic degraded-state copy when a background refresh partially fails", async () => {
    let detailCalls = 0;

    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => summary,
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [upcomingLaunch] }),
        });
      }

      if (url.includes("/api/spacex/launches/5eb87d46ffd86e000604b388")) {
        detailCalls += 1;

        if (detailCalls === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => detail,
          });
        }

        return Promise.reject(new Error("Launch detail timed out"));
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    currentSearchParams = new URLSearchParams("launch=5eb87d46ffd86e000604b388");

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await flushPromises();

    expect(container.textContent).toContain(
      "Countdown timers are intentionally suppressed"
    );
    expect(container.textContent).not.toContain("April 1, 2026");
    expect(container.textContent).not.toContain("outdated");
  });

  it("suppresses the live countdown for imprecise launch dates", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/spacex/summary")) {
        return Promise.resolve({
          ok: true,
          json: async () => impreciseSummary,
        });
      }

      if (url.includes("/api/spacex/launches?status=upcoming")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ launches: [impreciseLaunch] }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(
        <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} />
      );
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="mission-countdown"]')).toBeNull();
    expect(container.textContent).toContain("Scheduled for");
  });
});
