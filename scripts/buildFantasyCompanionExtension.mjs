import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const extensionDist = path.join(projectRoot, "extension", "dist");
const snapshotSource = path.join(projectRoot, "public", "data", "fantasy");
const snapshotOutput = path.join(extensionDist, "data", "fantasy");

const snapshots = [
  { file: "ppr.json", kind: "redraft", scoring: "PPR" },
  { file: "half_ppr.json", kind: "redraft", scoring: "HALF_PPR" },
  { file: "standard.json", kind: "redraft", scoring: "STANDARD" },
  { file: "best-ball.json", kind: "best-ball" },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validateDatedSource(source, file, label, { required = false } = {}) {
  if (source === null || source === undefined) {
    assert(!required, `${file} must contain ${label} provenance`);
    return;
  }

  assert(isObject(source), `${file} has invalid ${label} provenance`);
  assert(
    typeof source.provider === "string" && source.provider.trim().length > 0,
    `${file} ${label} must name its provider`,
  );
  assert(
    typeof source.url === "string" && source.url.trim().length > 0,
    `${file} ${label} must include its source URL`,
  );
  assert(
    isValidDate(source.asOf),
    `${file} ${label} has an invalid asOf date`,
  );

  if (source.matchedCount !== undefined) {
    assert(
      Number.isFinite(source.matchedCount) && source.matchedCount >= 0,
      `${file} ${label} has an invalid matchedCount`,
    );
  }
  if (source.expertCount !== undefined) {
    assert(
      Number.isFinite(source.expertCount) && source.expertCount >= 0,
      `${file} ${label} has an invalid expertCount`,
    );
  }
}

function validateCommon(snapshot, file) {
  assert(
    snapshot && typeof snapshot === "object" && !Array.isArray(snapshot),
    `${file} must contain a JSON object`,
  );
  assert(
    Number.isInteger(snapshot.schemaVersion) && snapshot.schemaVersion > 0,
    `${file} has an invalid schemaVersion`,
  );
  assert(
    Number.isInteger(snapshot.season) && snapshot.season >= 2020,
    `${file} has an invalid season`,
  );
  assert(
    typeof snapshot.generatedAt === "string" &&
      Number.isFinite(Date.parse(snapshot.generatedAt)),
    `${file} has an invalid generatedAt value`,
  );
}

function validateRedraft(snapshot, file, scoring) {
  assert(
    snapshot.scoringFormat === scoring,
    `${file} must use the ${scoring} scoring format`,
  );
  assert(
    Array.isArray(snapshot.overall) && snapshot.overall.length > 0,
    `${file} must contain an overall player board`,
  );
  assert(
    snapshot.positions && typeof snapshot.positions === "object",
    `${file} must contain position boards`,
  );

  for (const position of ["QB", "RB", "WR", "TE", "FLEX", "K", "DST"]) {
    assert(
      Array.isArray(snapshot.positions[position]) &&
        snapshot.positions[position].length > 0,
      `${file} must contain a non-empty ${position} board`,
    );
  }

  assert(
    typeof snapshot.source === "string" && snapshot.source.trim().length > 0,
    `${file} must describe its ranking source`,
  );
  assert(
    isValidDate(snapshot.upstreamUpdatedAt),
    `${file} has an invalid ranking source date`,
  );
  assert(
    isObject(snapshot.sliceMetadata) && isObject(snapshot.sliceMetadata.overall),
    `${file} must contain overall ranking slice metadata`,
  );
  assert(
    snapshot.sliceMetadata.overall.available === true &&
      isValidDate(snapshot.sliceMetadata.overall.updatedAt),
    `${file} has invalid overall ranking slice provenance`,
  );

  if (snapshot.adpSource !== null && snapshot.adpSource !== undefined) {
    validateDatedSource(snapshot.adpSource, file, "ADP source");
    assert(
      Number.isFinite(snapshot.adpSource.matchedCount) &&
        snapshot.adpSource.matchedCount > 0,
      `${file} ADP source has an invalid matchedCount`,
    );
    assert(
      snapshot.adpSource.sampleSize === null ||
        (Number.isFinite(snapshot.adpSource.sampleSize) &&
          snapshot.adpSource.sampleSize >= 0),
      `${file} ADP source has an invalid sampleSize`,
    );
  }
}

function validateBestBall(snapshot, file) {
  assert(
    Array.isArray(snapshot.players) && snapshot.players.length > 0,
    `${file} must contain a player board`,
  );
  validateDatedSource(snapshot.rankingSource, file, "ranking source", {
    required: true,
  });
  validateDatedSource(snapshot.superflexSource, file, "Superflex source");
  validateDatedSource(snapshot.adpSource, file, "ADP source");
  validateDatedSource(snapshot.scheduleSource, file, "schedule source");

  // Week 17 is a capability, not a prerequisite for the player board. A
  // partial or missing schedule map is packaged unchanged, then the Companion
  // pauses only schedule-dependent guidance until the source refreshes.
  if (snapshot.week17Opponents !== null && snapshot.week17Opponents !== undefined) {
    assert(
      isObject(snapshot.week17Opponents),
      `${file} has invalid Week 17 opponent data`,
    );
  }
}

async function readAndMinify({ file, kind, scoring }) {
  const sourcePath = path.join(snapshotSource, file);
  let snapshot;

  try {
    snapshot = JSON.parse(await readFile(sourcePath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read valid JSON from ${sourcePath}`, {
      cause: error,
    });
  }

  validateCommon(snapshot, file);

  if (kind === "redraft") {
    validateRedraft(snapshot, file, scoring);
  } else {
    validateBestBall(snapshot, file);
  }

  return {
    file,
    contents: `${JSON.stringify(snapshot)}\n`,
  };
}

async function main() {
  try {
    await access(extensionDist);
  } catch (error) {
    throw new Error(
      `The Vite build output is missing at ${extensionDist}. Run the extension build before this packaging step.`,
      { cause: error },
    );
  }

  const minifiedSnapshots = await Promise.all(snapshots.map(readAndMinify));
  await mkdir(snapshotOutput, { recursive: true });

  await Promise.all(
    minifiedSnapshots.map(({ file, contents }) =>
      writeFile(path.join(snapshotOutput, file), contents, "utf8"),
    ),
  );

  for (const { file, contents } of minifiedSnapshots) {
    const sizeKb = (Buffer.byteLength(contents) / 1024).toFixed(1);
    console.log(`Bundled ${file} (${sizeKb} KB)`);
  }
}

main().catch((error) => {
  console.error(error.message);
  if (error.cause instanceof Error) {
    console.error(error.cause.message);
  }
  process.exitCode = 1;
});
