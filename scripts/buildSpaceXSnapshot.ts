import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildMissionControlSnapshot } from "../src/lib/spacexData";
import type { MissionControlSnapshot } from "../src/types/spacex";

export interface BuildSpaceXSnapshotOptions {
  projectRoot?: string;
  logger?: Pick<Console, "log" | "error">;
}

export interface BuildSpaceXSnapshotResult {
  snapshotPath: string;
  snapshot: MissionControlSnapshot;
}

const SNAPSHOT_PATH_SEGMENTS = ["src", "data", "spacexSnapshot.generated.json"] as const;

function hasSnapshotContents(snapshot: MissionControlSnapshot | null): boolean {
  if (!snapshot) {
    return false;
  }

  return Boolean(
    snapshot.summary ||
      snapshot.upcomingLaunches.length > 0 ||
      snapshot.pastLaunches.length > 0 ||
      Object.keys(snapshot.launchDetails).length > 0
  );
}

async function readExistingSnapshot(
  snapshotPath: string
): Promise<MissionControlSnapshot | null> {
  try {
    const rawSnapshot = await fs.readFile(snapshotPath, "utf8");
    return JSON.parse(rawSnapshot) as MissionControlSnapshot;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function buildSpaceXSnapshot(
  options: BuildSpaceXSnapshotOptions = {}
): Promise<BuildSpaceXSnapshotResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const logger = options.logger ?? console;
  const snapshotPath = path.join(projectRoot, ...SNAPSHOT_PATH_SEGMENTS);
  const existingSnapshot = await readExistingSnapshot(snapshotPath);

  let snapshot: MissionControlSnapshot;

  try {
    snapshot = await buildMissionControlSnapshot();
  } catch (error) {
    const err = error as Error & { status?: number };

    if (err.status === 429 && hasSnapshotContents(existingSnapshot)) {
      logger.log("SpaceX snapshot refresh hit rate limiting. Keeping the existing snapshot.");
      return {
        snapshotPath,
        snapshot: existingSnapshot as MissionControlSnapshot,
      };
    }

    throw error;
  }

  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
  // Atomic write: write to a temp file first, then rename. This prevents
  // readers from seeing a partial/truncated snapshot if the process is
  // interrupted mid-write.
  const tmpPath = `${snapshotPath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmpPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, snapshotPath);

  logger.log(
    `SpaceX snapshot written: ${snapshot.upcomingLaunches.length} upcoming, ${snapshot.pastLaunches.length} past, ${Object.keys(snapshot.launchDetails).length} details.`
  );

  return {
    snapshotPath,
    snapshot,
  };
}

async function main() {
  await buildSpaceXSnapshot();
}

const isMainModule =
  process.argv[1] !== undefined &&
  // @ts-expect-error - import.meta works at runtime via tsx (not via tsc-emitted CJS)
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error("Failed to build SpaceX snapshot:", error);
    process.exitCode = 1;
  });
}
