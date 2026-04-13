/**
 * @jest-environment node
 */
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import {
  buildSpaceXImageSnapshots,
  type SpaceXImageReferenceIndex,
} from "../buildSpaceXImageSnapshots";

function createJsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
    },
  });
}

function createImageResponse(body: string, contentType = "image/png"): Response {
  return new Response(Buffer.from(body, "utf8"), {
    headers: {
      "content-type": contentType,
    },
  });
}

async function makeProjectRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "spacex-image-snapshot-"));
}

async function readManifest(projectRoot: string): Promise<Record<string, string>> {
  const manifestPath = path.join(projectRoot, "src", "data", "spacexImageManifest.generated.json");
  const rawManifest = await fs.readFile(manifestPath, "utf8");
  return JSON.parse(rawManifest) as Record<string, string>;
}

async function readReferenceIndex(projectRoot: string): Promise<SpaceXImageReferenceIndex> {
  const referenceIndexPath = path.join(
    projectRoot,
    "public",
    "data",
    "spacex",
    "image-reference-index.json"
  );
  const rawReferenceIndex = await fs.readFile(referenceIndexPath, "utf8");
  return JSON.parse(rawReferenceIndex) as SpaceXImageReferenceIndex;
}

describe("buildSpaceXImageSnapshots", () => {
  afterEach(async () => {
    const tempRootEntries = await fs.readdir(os.tmpdir());
    await Promise.all(
      tempRootEntries
        .filter((entry) => entry.startsWith("spacex-image-snapshot-"))
        .map((entry) => fs.rm(path.join(os.tmpdir(), entry), { recursive: true, force: true }))
    );
  });

  it("collects detail-aware images and writes a deterministic manifest and reference index", async () => {
    const projectRoot = await makeProjectRoot();
    const fetchMock = jest.fn(async (input: string | URL) => {
      const url = String(input);

      if (url.includes("/launch/upcoming/")) {
        return createJsonResponse({
          results: [
            {
              id: "upcoming-launch",
              name: "Crew-11",
              image: "https://images.example.com/upcoming-list-launch.png",
            },
          ],
        });
      }

      if (url.includes("/launch/previous/")) {
        return createJsonResponse({
          results: [],
        });
      }

      if (url.includes("/launch/upcoming-launch/")) {
        return createJsonResponse({
          id: "upcoming-launch",
          name: "Crew-11",
          image: "https://images.example.com/upcoming-launch.png",
          mission_patches: [
            {
              name: "Crew-11 Patch",
              priority: 10,
              image_url: "https://images.example.com/crew-11-patch.png",
            },
          ],
          program: [
            {
              name: "Commercial Crew",
              mission_patches: [
                {
                  name: "Program Patch",
                  priority: 2,
                  image_url: "https://images.example.com/program-patch.png",
                },
              ],
            },
          ],
          rocket: {
            configuration: {
              full_name: "Falcon 9 Block 5",
              image_url: "https://images.example.com/falcon-9.png",
            },
          },
          spacecraft_stage: {
            spacecraft: {
              name: "Dragon Freedom",
              spacecraft_config: {
                name: "Crew Dragon 2",
                image_url: "https://images.example.com/dragon.png",
              },
            },
            launch_crew: [
              {
                astronaut: {
                  name: "Zena Cardman",
                  profile_image: "https://images.example.com/cardman.png",
                },
              },
            ],
            onboard_crew: [
              {
                astronaut: {
                  name: "Mike Fincke",
                  profile_image: "https://images.example.com/fincke.png",
                },
              },
            ],
          },
          pad: {
            name: "Launch Complex 39A",
            map_image: "https://images.example.com/lc39a.png",
          },
        });
      }

      if (url === "https://images.example.com/upcoming-launch.png") {
        return createImageResponse("launch-image", "image/png");
      }

      if (url === "https://images.example.com/crew-11-patch.png") {
        return createImageResponse("patch-image", "image/png");
      }

      if (url === "https://images.example.com/program-patch.png") {
        return createImageResponse("program-patch-image", "image/png");
      }

      if (url === "https://images.example.com/falcon-9.png") {
        return createImageResponse("rocket-image", "image/png");
      }

      if (url === "https://images.example.com/dragon.png") {
        return createImageResponse("spacecraft-image", "image/png");
      }

      if (url === "https://images.example.com/lc39a.png") {
        return createImageResponse("pad-image", "image/png");
      }

      if (url === "https://images.example.com/cardman.png") {
        return createImageResponse("crew-image-1", "image/png");
      }

      if (url === "https://images.example.com/fincke.png") {
        return createImageResponse("crew-image-2", "image/png");
      }

      throw new Error(`Unhandled fetch in test: ${url}`);
    }) as typeof fetch;

    const result = await buildSpaceXImageSnapshots({
      projectRoot,
      fetchImpl: fetchMock,
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    const manifest = await readManifest(projectRoot);
    const referenceIndex = await readReferenceIndex(projectRoot);

    expect(result.partial).toBe(false);
    expect(Object.keys(manifest)).toEqual([
      "https://images.example.com/cardman.png",
      "https://images.example.com/crew-11-patch.png",
      "https://images.example.com/dragon.png",
      "https://images.example.com/falcon-9.png",
      "https://images.example.com/fincke.png",
      "https://images.example.com/lc39a.png",
      "https://images.example.com/program-patch.png",
      "https://images.example.com/upcoming-launch.png",
    ]);
    expect(result.downloaded).toEqual(Object.keys(manifest));
    expect(referenceIndex["upcoming-launch"]).toEqual({
      launchId: "upcoming-launch",
      launchName: "Crew-11",
      window: "upcoming",
      images: {
        launch: [
          {
            label: "Crew-11",
            localPath: manifest["https://images.example.com/upcoming-launch.png"],
            remoteUrl: "https://images.example.com/upcoming-launch.png",
          },
        ],
        patch: [
          {
            label: "Crew-11 Patch",
            localPath: manifest["https://images.example.com/crew-11-patch.png"],
            remoteUrl: "https://images.example.com/crew-11-patch.png",
          },
          {
            label: "Program Patch",
            localPath: manifest["https://images.example.com/program-patch.png"],
            remoteUrl: "https://images.example.com/program-patch.png",
          },
        ],
        rocket: [
          {
            label: "Falcon 9 Block 5",
            localPath: manifest["https://images.example.com/falcon-9.png"],
            remoteUrl: "https://images.example.com/falcon-9.png",
          },
        ],
        spacecraft: [
          {
            label: "Crew Dragon 2",
            localPath: manifest["https://images.example.com/dragon.png"],
            remoteUrl: "https://images.example.com/dragon.png",
          },
        ],
        pad: [
          {
            label: "Launch Complex 39A",
            localPath: manifest["https://images.example.com/lc39a.png"],
            remoteUrl: "https://images.example.com/lc39a.png",
          },
        ],
        crew: [
          {
            label: "Mike Fincke",
            localPath: manifest["https://images.example.com/fincke.png"],
            remoteUrl: "https://images.example.com/fincke.png",
          },
          {
            label: "Zena Cardman",
            localPath: manifest["https://images.example.com/cardman.png"],
            remoteUrl: "https://images.example.com/cardman.png",
          },
        ],
      },
    });
  });

  it("reuses unchanged image mappings when the source URL already exists locally", async () => {
    const projectRoot = await makeProjectRoot();
    const imageDir = path.join(projectRoot, "public", "data", "spacex", "images");
    const existingRelativePath = "/data/spacex/images/existing-patch.png";

    await fs.mkdir(path.join(projectRoot, "src", "data"), { recursive: true });
    await fs.mkdir(path.join(projectRoot, "public", "data", "spacex"), { recursive: true });
    await fs.mkdir(imageDir, { recursive: true });
    await fs.writeFile(
      path.join(projectRoot, "src", "data", "spacexImageManifest.generated.json"),
      `${JSON.stringify(
        {
          "https://images.example.com/existing-patch.png": existingRelativePath,
        },
        null,
        2
      )}\n`,
      "utf8"
    );
    await fs.writeFile(path.join(imageDir, "existing-patch.png"), "existing-image", "utf8");

    const fetchMock = jest.fn(async (input: string | URL) => {
      const url = String(input);

      if (url.includes("/launch/upcoming/")) {
        return createJsonResponse({
          results: [{ id: "launch-1", name: "Transporter-20" }],
        });
      }

      if (url.includes("/launch/previous/")) {
        return createJsonResponse({ results: [] });
      }

      if (url.includes("/launch/launch-1/")) {
        return createJsonResponse({
          id: "launch-1",
          name: "Transporter-20",
          mission_patches: [
            {
              name: "Transporter-20 Patch",
              priority: 10,
              image_url: "https://images.example.com/existing-patch.png",
            },
          ],
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    const result = await buildSpaceXImageSnapshots({
      projectRoot,
      fetchImpl: fetchMock,
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    expect(result.partial).toBe(false);
    expect(result.reused).toEqual(["https://images.example.com/existing-patch.png"]);
    expect(result.downloaded).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("preserves existing files, manifest entries, and reference rows when part of the source window fails", async () => {
    const projectRoot = await makeProjectRoot();
    const imageDir = path.join(projectRoot, "public", "data", "spacex", "images");

    await fs.mkdir(path.join(projectRoot, "src", "data"), { recursive: true });
    await fs.mkdir(path.join(projectRoot, "public", "data", "spacex"), { recursive: true });
    await fs.mkdir(imageDir, { recursive: true });
    await fs.writeFile(
      path.join(projectRoot, "src", "data", "spacexImageManifest.generated.json"),
      `${JSON.stringify(
        {
          "https://images.example.com/existing.png": "/data/spacex/images/existing.png",
        },
        null,
        2
      )}\n`,
      "utf8"
    );
    await fs.writeFile(path.join(imageDir, "existing.png"), "existing-image", "utf8");
    await fs.writeFile(
      path.join(projectRoot, "public", "data", "spacex", "image-reference-index.json"),
      `${JSON.stringify(
        {
          "existing-launch": {
            launchId: "existing-launch",
            launchName: "Archived Mission",
            window: "previous",
            images: {
              launch: [
                {
                  label: "Archived Mission",
                  localPath: "/data/spacex/images/existing.png",
                  remoteUrl: "https://images.example.com/existing.png",
                },
              ],
              patch: [],
              rocket: [],
              spacecraft: [],
              pad: [],
              crew: [],
            },
          },
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const fetchMock = jest.fn(async (input: string | URL) => {
      const url = String(input);

      if (url.includes("/launch/upcoming/")) {
        return createJsonResponse({
          results: [{ id: "launch-2", name: "Current Mission" }],
        });
      }

      if (url.includes("/launch/previous/")) {
        return new Response("rate limited", { status: 429 });
      }

      if (url.includes("/launch/launch-2/")) {
        return createJsonResponse({
          id: "launch-2",
          name: "Current Mission",
          image: "https://images.example.com/current.png",
        });
      }

      if (url === "https://images.example.com/current.png") {
        return createImageResponse("current-image", "image/png");
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    const result = await buildSpaceXImageSnapshots({
      projectRoot,
      fetchImpl: fetchMock,
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    const manifest = await readManifest(projectRoot);
    const referenceIndex = await readReferenceIndex(projectRoot);

    expect(result.partial).toBe(true);
    expect(result.removed).toEqual([]);
    expect(manifest["https://images.example.com/existing.png"]).toBe(
      "/data/spacex/images/existing.png"
    );
    expect(manifest["https://images.example.com/current.png"]).toMatch(
      /^\/data\/spacex\/images\/[a-f0-9]{16}\.png$/
    );
    expect(referenceIndex["existing-launch"]?.launchName).toBe("Archived Mission");
    expect(referenceIndex["launch-2"]?.images.launch[0]?.remoteUrl).toBe(
      "https://images.example.com/current.png"
    );
    await expect(fs.access(path.join(imageDir, "existing.png"))).resolves.toBeUndefined();
  });

  it("prunes obsolete files only after a fully successful bounded refresh", async () => {
    const projectRoot = await makeProjectRoot();
    const imageDir = path.join(projectRoot, "public", "data", "spacex", "images");

    await fs.mkdir(path.join(projectRoot, "src", "data"), { recursive: true });
    await fs.mkdir(path.join(projectRoot, "public", "data", "spacex"), { recursive: true });
    await fs.mkdir(imageDir, { recursive: true });
    await fs.writeFile(
      path.join(projectRoot, "src", "data", "spacexImageManifest.generated.json"),
      `${JSON.stringify(
        {
          "https://images.example.com/obsolete.png": "/data/spacex/images/obsolete.png",
        },
        null,
        2
      )}\n`,
      "utf8"
    );
    await fs.writeFile(path.join(imageDir, "obsolete.png"), "obsolete-image", "utf8");

    const fetchMock = jest.fn(async (input: string | URL) => {
      const url = String(input);

      if (url.includes("/launch/upcoming/")) {
        return createJsonResponse({
          results: [{ id: "launch-3", name: "Current Mission" }],
        });
      }

      if (url.includes("/launch/previous/")) {
        return createJsonResponse({ results: [] });
      }

      if (url.includes("/launch/launch-3/")) {
        return createJsonResponse({
          id: "launch-3",
          name: "Current Mission",
          image: "https://images.example.com/current.png",
        });
      }

      if (url === "https://images.example.com/current.png") {
        return createImageResponse("current-image", "image/png");
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    const result = await buildSpaceXImageSnapshots({
      projectRoot,
      fetchImpl: fetchMock,
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    const manifest = await readManifest(projectRoot);

    expect(result.partial).toBe(false);
    expect(manifest["https://images.example.com/obsolete.png"]).toBeUndefined();
    expect(manifest["https://images.example.com/current.png"]).toMatch(
      /^\/data\/spacex\/images\/[a-f0-9]{16}\.png$/
    );
    expect(result.removed).toEqual(["/data/spacex/images/obsolete.png"]);
    await expect(fs.access(path.join(imageDir, "obsolete.png"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
