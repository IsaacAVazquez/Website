import {
  getMissionLaunchCards,
  getMissionLaunchDetail,
} from "@/lib/spacexData";

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const baseLaunch = {
  id: "63aa7636-d2b7-457f-a3e6-27e564e42941",
  name: "Falcon 9 Block 5 | Starlink Group 10-58",
  status: {
    id: 1,
    name: "Go",
    abbrev: "Go",
  },
  net: "2027-04-02T11:55:10Z",
  net_precision: {
    id: 0,
    name: "Second",
    abbrev: "SEC",
  },
  launch_service_provider: {
    id: 121,
    name: "SpaceX",
  },
  rocket: {
    id: 8951,
    configuration: {
      id: 164,
      name: "Falcon 9",
      full_name: "Falcon 9 Block 5",
      family: "Falcon",
      variant: "Block 5",
      manufacturer: {
        id: 121,
        name: "SpaceX",
      },
      image_url: "https://images.example.com/rocket-config.png",
      successful_launches: 566,
      failed_launches: 1,
      pending_launches: 104,
      launch_cost: "52000000",
      launch_mass: 549,
      length: 70,
      diameter: 3.65,
      maiden_flight: "2018-05-11",
      description: "Falcon 9 Block 5 launch vehicle.",
      wiki_url: "https://en.wikipedia.org/wiki/Falcon_9",
    },
  },
  mission: {
    id: 7546,
    name: "Starlink Group 10-58",
    description: "A batch of 29 satellites for the Starlink constellation.",
    type: "Communications",
    orbit: {
      id: 8,
      name: "Low Earth Orbit",
      abbrev: "LEO",
    },
    agencies: [
      {
        id: 121,
        name: "SpaceX",
        country_code: "USA",
      },
    ],
  },
  pad: {
    id: 80,
    name: "Space Launch Complex 40",
    location: {
      id: 12,
      name: "Cape Canaveral SFS, FL, USA",
      timezone_name: "America/New_York",
    },
  },
  image: "https://images.example.com/launch-photo.png",
  mission_patches: [
    {
      id: 7,
      priority: 10,
      image_url: "https://images.example.com/mission-patch.png",
    },
  ],
  spacecraft_stage: {
    spacecraft: {
      id: 6,
      name: "Crew Dragon Freedom",
      serial_number: "C212",
      status: {
        id: 1,
        name: "Active",
      },
      flights_count: 5,
      spacecraft_config: {
        id: 6,
        name: "Crew Dragon 2",
        type: {
          id: 2,
          name: "Capsule",
        },
        image_url: "https://images.example.com/spacecraft.png",
        payload_capacity: 6000,
      },
    },
    launch_crew: [],
    onboard_crew: [],
    landing_crew: [],
  },
  infoURLs: [],
  vidURLs: [],
  launcher_stage: [],
  agency_launch_attempt_count: 660,
  orbital_launch_attempt_count: 7247,
};

describe("spacexData image normalization", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("prefers the rocket configuration image for launch cards", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 1,
        results: [baseLaunch],
      }),
    });

    const launches = await getMissionLaunchCards("upcoming", 1);

    expect(launches[0]?.vehicleImage).toBe("https://images.example.com/rocket-config.png");
  });

  it("falls back to the launch image when the rocket image is missing", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 1,
        results: [
          {
            ...baseLaunch,
            rocket: {
              ...baseLaunch.rocket,
              configuration: {
                ...baseLaunch.rocket.configuration,
                image_url: null,
              },
            },
          },
        ],
      }),
    });

    const launches = await getMissionLaunchCards("upcoming", 1);

    expect(launches[0]?.vehicleImage).toBe("https://images.example.com/launch-photo.png");
  });

  it("falls back to the spacecraft image when rocket and launch images are missing", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 1,
        results: [
          {
            ...baseLaunch,
            image: null,
            rocket: {
              ...baseLaunch.rocket,
              configuration: {
                ...baseLaunch.rocket.configuration,
                image_url: null,
              },
            },
          },
        ],
      }),
    });

    const launches = await getMissionLaunchCards("upcoming", 1);

    expect(launches[0]?.vehicleImage).toBe("https://images.example.com/spacecraft.png");
  });

  it("exposes the rocket image separately on launch detail", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => baseLaunch,
    });

    const detail = await getMissionLaunchDetail("63aa7636-d2b7-457f-a3e6-27e564e42941");

    expect(detail.vehicleImage).toBe("https://images.example.com/rocket-config.png");
    expect(detail.rocket?.image).toBe("https://images.example.com/rocket-config.png");
  });
});
