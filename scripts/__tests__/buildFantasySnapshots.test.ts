/**
 * @jest-environment node
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { FantasyRouteScoring } from "@/lib/fantasy";
import type { buildFantasySnapshot as buildFantasySnapshotType } from "@/lib/fantasySnapshotBuilder";
import { buildFantasySnapshots } from "../buildFantasySnapshots";

const SCORING_FORMATS = ["ppr", "half_ppr", "standard"] as const;
const tempRoots: string[] = [];

async function makeProjectRoot(): Promise<string> {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "fantasy-snapshot-publication-"));
  tempRoots.push(projectRoot);
  return projectRoot;
}

async function seedPublishedArtifacts(projectRoot: string) {
  const snapshotDir = path.join(projectRoot, "public", "data", "fantasy");
  const revisionDir = path.join(projectRoot, "src", "data");
  await fs.mkdir(snapshotDir, { recursive: true });
  await fs.mkdir(revisionDir, { recursive: true });

  const contents = {
    ppr: "old-ppr\n",
    half_ppr: "old-half-ppr\n",
    standard: "old-standard\n",
    revision: "old-revision\n",
  };
  await Promise.all([
    ...SCORING_FORMATS.map((scoring) =>
      fs.writeFile(path.join(snapshotDir, `${scoring}.json`), contents[scoring], "utf8")
    ),
    fs.writeFile(
      path.join(revisionDir, "fantasySnapshotRevision.generated.ts"),
      contents.revision,
      "utf8"
    ),
  ]);

  return contents;
}

async function readPublishedArtifacts(projectRoot: string) {
  const snapshotDir = path.join(projectRoot, "public", "data", "fantasy");
  const revisionPath = path.join(
    projectRoot,
    "src",
    "data",
    "fantasySnapshotRevision.generated.ts"
  );

  return {
    ppr: await fs.readFile(path.join(snapshotDir, "ppr.json"), "utf8"),
    half_ppr: await fs.readFile(path.join(snapshotDir, "half_ppr.json"), "utf8"),
    standard: await fs.readFile(path.join(snapshotDir, "standard.json"), "utf8"),
    revision: await fs.readFile(revisionPath, "utf8"),
    snapshotDirectoryEntries: await fs.readdir(snapshotDir),
    revisionDirectoryEntries: await fs.readdir(path.dirname(revisionPath)),
  };
}

function snapshotFor(scoring: FantasyRouteScoring) {
  return {
    scoringFormat: scoring,
    marker: `new-${scoring}`,
  } as unknown as ReturnType<typeof buildFantasySnapshotType>;
}

describe("buildFantasySnapshots", () => {
  afterEach(async () => {
    await Promise.all(
      tempRoots.splice(0).map((projectRoot) =>
        fs.rm(projectRoot, { recursive: true, force: true })
      )
    );
  });

  it("leaves every published artifact unchanged when the second format fails", async () => {
    const projectRoot = await makeProjectRoot();
    const existing = await seedPublishedArtifacts(projectRoot);
    const buildSnapshot = jest.fn((scoring: FantasyRouteScoring) => {
      if (scoring === "half_ppr") {
        throw new Error("Injected half-PPR build failure");
      }
      return snapshotFor(scoring);
    });

    await expect(
      buildFantasySnapshots({
        projectRoot,
        revision: "2026-08-09T12:00:00.000Z",
        buildSnapshot,
        logger: { log: jest.fn() },
      })
    ).rejects.toThrow("Injected half-PPR build failure");

    expect(buildSnapshot.mock.calls.map(([scoring]) => scoring)).toEqual([
      "ppr",
      "half_ppr",
    ]);
    const published = await readPublishedArtifacts(projectRoot);
    expect(published).toMatchObject(existing);
    expect(published.snapshotDirectoryEntries.some((entry) => entry.includes(".tmp-"))).toBe(
      false
    );
    expect(published.revisionDirectoryEntries.some((entry) => entry.includes(".tmp-"))).toBe(
      false
    );
  });

  it("publishes all three snapshots and then the shared revision", async () => {
    const projectRoot = await makeProjectRoot();
    await seedPublishedArtifacts(projectRoot);
    const revision = "2026-08-09T12:00:00.000Z";
    const buildSnapshot = jest.fn((scoring: FantasyRouteScoring) => snapshotFor(scoring));

    const result = await buildFantasySnapshots({
      projectRoot,
      revision,
      buildSnapshot,
      logger: { log: jest.fn() },
    });

    const published = await readPublishedArtifacts(projectRoot);
    for (const scoring of SCORING_FORMATS) {
      expect(JSON.parse(published[scoring])).toEqual(snapshotFor(scoring));
    }
    expect(published.revision).toContain(JSON.stringify(revision));
    expect(result.revision).toBe(revision);
    expect(published.snapshotDirectoryEntries.some((entry) => entry.includes(".tmp-"))).toBe(
      false
    );
    expect(published.revisionDirectoryEntries.some((entry) => entry.includes(".tmp-"))).toBe(
      false
    );
  });

  it("stamps rank movement onto the overall and flex boards and persists the history", async () => {
    const projectRoot = await makeProjectRoot();
    await seedPublishedArtifacts(projectRoot);
    const today = new Date().toISOString().slice(0, 10);
    const pastDate = new Date(Date.now() - 8 * 86_400_000).toISOString().slice(0, 10);
    const historyPath = path.join(
      projectRoot,
      "src",
      "data",
      "fantasyRankHistory.generated.json"
    );
    await fs.writeFile(
      historyPath,
      `${JSON.stringify({
        version: 1,
        formats: { ppr: [{ date: pastDate, players: { p1: { ecr: 12, adp: 14 } } }] },
      })}\n`,
      "utf8"
    );

    // The flex slice holds its own copies of the overall players, so the stamp
    // has to reach both arrays independently.
    const buildSnapshot = jest.fn(
      (scoring: FantasyRouteScoring) =>
        ({
          ...snapshotFor(scoring),
          overall: [{ id: "p1", rankEcr: 5, adp: 10 }],
          positions: { FLEX: [{ id: "p1", rankEcr: 5, adp: 10 }] },
        }) as unknown as ReturnType<typeof buildFantasySnapshotType>
    );

    await buildFantasySnapshots({
      projectRoot,
      revision: "2026-08-31T12:00:00.000Z",
      buildSnapshot,
      logger: { log: jest.fn() },
    });

    const published = JSON.parse(
      await fs.readFile(path.join(projectRoot, "public", "data", "fantasy", "ppr.json"), "utf8")
    );
    expect(published.overall[0].rankMove7d).toBe(7);
    expect(published.overall[0].adpMove7d).toBe(4);
    expect(published.positions.FLEX[0].rankMove7d).toBe(7);
    expect(published.positions.FLEX[0].adpMove7d).toBe(4);

    const history = JSON.parse(await fs.readFile(historyPath, "utf8"));
    expect(history.formats.ppr.map((day: { date: string }) => day.date)).toEqual([
      pastDate,
      today,
    ]);
  });
});
