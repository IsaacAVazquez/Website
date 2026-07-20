import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  getDataFreshnessPolicy,
  type DataSurfaceId,
} from "../src/lib/dataFreshnessPolicy";
import { DATA_REFRESH_ARTIFACTS } from "./dataRefreshRegistry";
import { readGeneratedSnapshot } from "./snapshotFallback";

export interface RefreshManifest {
  schemaVersion: 1;
  surface: DataSurfaceId;
  attemptedAt: string;
  artifact: string;
  sourceAsOf: string | null;
  ageSeconds: number | null;
  maxAgeSeconds: number;
  revision: string | null;
  outcome: "fresh" | "stale-fallback" | "unavailable";
}

function readPath(value: unknown, segments: readonly string[]): unknown {
  let current = value;
  for (const segment of segments) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

async function readArtifact(
  artifactPath: string,
  exportName?: string
): Promise<unknown> {
  if (exportName) {
    return readGeneratedSnapshot<unknown>(artifactPath, exportName);
  }
  return JSON.parse(await fs.readFile(artifactPath, "utf8"));
}

export async function buildRefreshManifest(
  surface: DataSurfaceId,
  now = new Date()
): Promise<RefreshManifest> {
  const artifact = DATA_REFRESH_ARTIFACTS[surface];
  if (!artifact) {
    throw new Error(`No refresh artifact is registered for ${surface}.`);
  }

  const payload = await readArtifact(artifact.artifactPath, artifact.exportName);
  const sourceAsOfValue = readPath(payload, artifact.sourceAsOfPath);
  const sourceAsOf =
    typeof sourceAsOfValue === "string" && sourceAsOfValue.trim()
      ? sourceAsOfValue
      : null;
  const sourceTime = sourceAsOf ? Date.parse(sourceAsOf) : Number.NaN;
  const policy = getDataFreshnessPolicy(surface, now);
  const ageMs = Number.isFinite(sourceTime)
    ? now.getTime() - sourceTime
    : Number.NaN;
  const revisionPayload = artifact.revisionPayloadPath
    ? readPath(payload, artifact.revisionPayloadPath)
    : payload;
  const revision = payload
    ? createHash("sha256")
        .update(JSON.stringify(revisionPayload))
        .digest("hex")
    : null;
  const outcome =
    !sourceAsOf || !Number.isFinite(ageMs)
      ? "unavailable"
      : ageMs < -5 * 60 * 1000 || ageMs > policy.maxAgeMs
        ? "stale-fallback"
        : "fresh";

  return {
    schemaVersion: 1,
    surface,
    attemptedAt: now.toISOString(),
    artifact: path.relative(process.cwd(), artifact.artifactPath),
    sourceAsOf,
    ageSeconds: Number.isFinite(ageMs) ? Math.floor(Math.max(0, ageMs) / 1000) : null,
    maxAgeSeconds: Math.floor(policy.maxAgeMs / 1000),
    revision,
    outcome,
  };
}

async function main() {
  const surface = process.argv[2] as DataSurfaceId | undefined;
  if (!surface) {
    throw new Error("Usage: verifyDataRefresh.ts <surface>");
  }

  const manifest = await buildRefreshManifest(surface);
  const manifestDir = process.env.RUNNER_TEMP ?? path.join(process.cwd(), ".tmp");
  await fs.mkdir(manifestDir, { recursive: true });
  const manifestPath = path.join(manifestDir, `refresh-manifest-${surface}.json`);
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(manifest, null, 2));
  if (process.env.GITHUB_OUTPUT) {
    await fs.appendFile(
      process.env.GITHUB_OUTPUT,
      `outcome=${manifest.outcome}\nrevision=${manifest.revision ?? ""}\nmanifest=${manifestPath}\n`,
      "utf8"
    );
  }

  if (manifest.outcome !== "fresh") {
    throw new Error(
      `${surface} refresh preserved an unavailable or stale artifact (${manifest.sourceAsOf ?? "missing timestamp"}).`
    );
  }
}

if (process.argv[1]?.endsWith("verifyDataRefresh.ts")) {
  void main().catch((error) => {
    console.error(`::error::${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
