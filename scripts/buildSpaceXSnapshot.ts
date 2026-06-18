import { config } from "dotenv";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
// Load SPACEDEVS_API_TOKEN (and any other secrets) from .env.local for local
// runs. The token is read lazily at fetch time, so this only needs to run
// before main() — not before the lib import.
config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local"),
});
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

    // Any fetch failure (rate limiting, 5xx, network/timeout) should preserve
    // a good existing snapshot rather than crashing the build. We only rethrow
    // when there is no usable snapshot to fall back to.
    if (hasSnapshotContents(existingSnapshot)) {
      const reason =
        err.status === 429
          ? "hit rate limiting"
          : `failed (${err.status ? `HTTP ${err.status}` : err.message || "network error"})`;
      logger.log(`SpaceX snapshot refresh ${reason}. Keeping the existing snapshot.`);
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
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error("Failed to build SpaceX snapshot:", error);
    process.exitCode = 1;
  });
}
