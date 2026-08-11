import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFantasySnapshot } from "@/lib/fantasySnapshotBuilder";
import type { FantasyRouteScoring } from "@/lib/fantasy";

const SCORING_FORMATS = ["ppr", "half_ppr", "standard"] as const;
const SNAPSHOT_OUTPUT_PATH_SEGMENTS = ["public", "data", "fantasy"] as const;
const REVISION_OUTPUT_PATH_SEGMENTS = [
  "src",
  "data",
  "fantasySnapshotRevision.generated.ts",
] as const;

type FantasySnapshotBuilder = typeof buildFantasySnapshot;

export interface BuildFantasySnapshotsOptions {
  projectRoot?: string;
  revision?: string;
  buildSnapshot?: FantasySnapshotBuilder;
  logger?: Pick<Console, "log">;
}

export interface BuildFantasySnapshotsResult {
  revision: string;
  snapshotPaths: Record<FantasyRouteScoring, string>;
  revisionOutputPath: string;
}

interface StagedOutput {
  targetPath: string;
  tempPath: string;
  contents: string;
}

function renderRevisionModule(revision: string): string {
  return `/**
 * Generated fantasy snapshot revision.
 * Do not edit manually. Regenerate with \`npm run update:fantasy\`.
 */

export const fantasySnapshotRevision = ${JSON.stringify(revision)};
`;
}

export async function buildFantasySnapshots(
  options: BuildFantasySnapshotsOptions = {}
): Promise<BuildFantasySnapshotsResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const buildSnapshot = options.buildSnapshot ?? buildFantasySnapshot;
  const logger = options.logger ?? console;
  const revision = options.revision ?? new Date().toISOString();
  const outputDir = path.join(projectRoot, ...SNAPSHOT_OUTPUT_PATH_SEGMENTS);
  const revisionOutputPath = path.join(projectRoot, ...REVISION_OUTPUT_PATH_SEGMENTS);
  const snapshotPaths: Record<FantasyRouteScoring, string> = {
    ppr: path.join(outputDir, "ppr.json"),
    half_ppr: path.join(outputDir, "half_ppr.json"),
    standard: path.join(outputDir, "standard.json"),
  };

  // Finish every build and serialization before creating directories or staging
  // files. A failure in any format therefore leaves the complete published set
  // and its shared revision untouched.
  const serializedSnapshots = SCORING_FORMATS.map((scoring) => ({
    scoring,
    contents: `${JSON.stringify(buildSnapshot(scoring), null, 2)}\n`,
  }));
  const revisionContents = renderRevisionModule(revision);

  const tempSuffix = `${process.pid}-${randomUUID()}`;
  const snapshotOutputs: StagedOutput[] = serializedSnapshots.map(({ scoring, contents }) => {
    const targetPath = snapshotPaths[scoring];
    return {
      targetPath,
      tempPath: `${targetPath}.tmp-${tempSuffix}`,
      contents,
    };
  });
  const revisionOutput: StagedOutput = {
    targetPath: revisionOutputPath,
    tempPath: `${revisionOutputPath}.tmp-${tempSuffix}`,
    contents: revisionContents,
  };
  const stagedOutputs = [...snapshotOutputs, revisionOutput];

  try {
    await mkdir(outputDir, { recursive: true });
    await mkdir(path.dirname(revisionOutputPath), { recursive: true });

    for (const output of stagedOutputs) {
      await writeFile(output.tempPath, output.contents, "utf8");
    }

    // The revision is the publication marker consumed by clients and deploy
    // checks, so it moves only after all three scoring files are in place.
    for (const output of snapshotOutputs) {
      await rename(output.tempPath, output.targetPath);
    }
    await rename(revisionOutput.tempPath, revisionOutput.targetPath);
  } catch (error) {
    await Promise.allSettled(
      stagedOutputs.map((output) => rm(output.tempPath, { force: true }))
    );
    throw error;
  }

  for (const scoring of SCORING_FORMATS) {
    logger.log(`Wrote fantasy snapshot: ${snapshotPaths[scoring]}`);
  }
  logger.log(`Wrote fantasy snapshot revision: ${revisionOutputPath}`);

  return {
    revision,
    snapshotPaths,
    revisionOutputPath,
  };
}

async function main() {
  await buildFantasySnapshots();
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
