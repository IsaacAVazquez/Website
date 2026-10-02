import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  FRONTIER_MODELS_AS_OF,
  FRONTIER_MODELS_SOURCE,
  FRONTIER_MODELS_VERIFIED,
  PROVIDER_LABELS,
} from "./data/frontierModels.source";
import { buildFrontierModelsSnapshot as buildSnapshotData } from "../src/lib/frontierModels";
import type { FrontierModelsSnapshot } from "../src/types/frontierModels";
import { writeFileAtomic } from "./snapshotFallback";

interface BuildOptions {
  projectRoot?: string;
  generatedAt?: string;
  logger?: Pick<Console, "log">;
}

interface BuildResult {
  snapshotPath: string;
  snapshot: FrontierModelsSnapshot;
}

const SNAPSHOT_PATH_SEGMENTS = [
  "src",
  "data",
  "frontierModelsSnapshot.json",
] as const;

export async function buildFrontierModelsSnapshot(
  options: BuildOptions = {}
): Promise<BuildResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const logger = options.logger ?? console;
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const snapshotPath = path.join(projectRoot, ...SNAPSHOT_PATH_SEGMENTS);

  const snapshot = buildSnapshotData(
    FRONTIER_MODELS_SOURCE,
    PROVIDER_LABELS,
    generatedAt,
    "Curated by Isaac Vazquez",
    FRONTIER_MODELS_AS_OF,
    FRONTIER_MODELS_VERIFIED
  );

  const fileContents = JSON.stringify(snapshot, null, 2) + "\n";

  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
  writeFileAtomic(snapshotPath, fileContents);

  logger.log(
    `Frontier models snapshot written: ${snapshot.models.length} models across ${snapshot.providers.length} providers.`
  );

  return { snapshotPath, snapshot };
}

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMainModule) {
  buildFrontierModelsSnapshot().catch((error) => {
    console.error("Failed to build frontier models snapshot:", error);
    process.exitCode = 1;
  });
}
