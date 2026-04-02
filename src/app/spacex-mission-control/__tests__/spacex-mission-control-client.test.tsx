import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SpaceXMissionControlClient } from "../spacex-mission-control-client";
import { DEFAULT_MISSION_CONTROL_STATE } from "../spacex-mission-control-state";
import type {
  MissionControlSummary,
  MissionLaunchCard,
  MissionLaunchDetail,
} from "@/types/spacex";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

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
  patchImage: null,
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

function flushPromises() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("SpaceXMissionControlClient", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    currentSearchParams = new URLSearchParams();
    mockFetch.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  afterEach(() => {
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
    expect(container.querySelector('[data-testid="mission-hero"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="mission-board"]')).not.toBeNull();
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
