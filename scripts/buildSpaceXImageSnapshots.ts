import { config } from "dotenv";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load SPACEDEVS_API_TOKEN from .env.local for local runs (read lazily at fetch
// time). In CI the token is provided via the workflow env block instead.
config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local"),
});

const LAUNCH_LIBRARY_API_BASE = "https://ll.thespacedevs.com/2.2.0";
const SPACEX_AGENCY_ID = 121;

// Optional Launch Library 2 API key. Anonymous requests (especially from shared
// CI IPs) get throttled hard; authenticating with a token raises the limit.
// thespacedevs uses DRF token auth: `Authorization: Token <key>`. Read lazily so
// a dotenv-loaded value is picked up regardless of import order.
function getLaunchLibraryAuthHeaders(): Record<string, string> {
  const token = process.env.SPACEDEVS_API_TOKEN?.trim();
  return token ? { Authorization: `Token ${token}` } : {};
}
const REQUEST_TIMEOUT_MS = 12000;
const LIST_FETCH_LIMIT = 30;
const ACTIVE_WINDOW_LIMIT = 24;
const UPCOMING_STALE_GRACE_MS = 30 * 60 * 1000;
const IMAGE_DIRECTORY_SEGMENTS = ["public", "data", "spacex", "images"] as const;
const MANIFEST_PATH_SEGMENTS = ["src", "data", "spacexImageManifest.generated.json"] as const;
const REFERENCE_INDEX_PATH_SEGMENTS = [
  "public",
  "data",
  "spacex",
  "image-reference-index.json",
] as const;
const IMAGE_ROLES = ["launch", "patch", "rocket", "spacecraft", "pad", "crew"] as const;

type LaunchCollectionMode = "upcoming" | "previous";
type ImageRole = (typeof IMAGE_ROLES)[number];
type SpaceXImageManifest = Record<string, string>;

interface RawLl2ListResponse<T> {
  results: T[];
}

interface RawLl2MissionPatch {
  name?: string | null;
  priority?: number | null;
  image_url?: string | null;
}

interface RawLl2Program {
  name?: string | null;
  mission_patches?: RawLl2MissionPatch[] | null;
}

interface RawLl2LauncherConfiguration {
  name?: string | null;
  full_name?: string | null;
  image_url?: string | null;
}

interface RawLl2Rocket {
  configuration?: RawLl2LauncherConfiguration | null;
}

interface RawLl2Astronaut {
  name?: string | null;
  profile_image?: string | null;
}

interface RawLl2CrewAssignment {
  astronaut?: RawLl2Astronaut | null;
}

interface RawLl2SpacecraftConfig {
  name?: string | null;
  image_url?: string | null;
}

interface RawLl2Spacecraft {
  name?: string | null;
  spacecraft_config?: RawLl2SpacecraftConfig | null;
}

interface RawLl2SpacecraftStage {
  spacecraft?: RawLl2Spacecraft | null;
  launch_crew?: RawLl2CrewAssignment[] | null;
  onboard_crew?: RawLl2CrewAssignment[] | null;
  landing_crew?: RawLl2CrewAssignment[] | null;
}

interface RawLl2Pad {
  name?: string | null;
  map_image?: string | null;
}

interface RawLl2Launch {
  id?: string | null;
  name?: string | null;
  net?: string | null;
  image?: string | null;
  mission_patches?: RawLl2MissionPatch[] | null;
  program?: RawLl2Program[] | null;
  rocket?: RawLl2Rocket | null;
  spacecraft_stage?: RawLl2SpacecraftStage | null;
  pad?: RawLl2Pad | null;
}

interface DraftReferenceEntry {
  label: string;
  remoteUrl: string;
}

interface DraftLaunchImageReference {
  launchId: string;
  launchName: string;
  window: LaunchCollectionMode;
  images: Record<ImageRole, DraftReferenceEntry[]>;
}

export interface SpaceXImageReferenceEntry {
  label: string;
  localPath: string | null;
  remoteUrl: string;
}

export interface SpaceXLaunchImageReference {
  launchId: string;
  launchName: string;
  window: LaunchCollectionMode;
  images: Record<ImageRole, SpaceXImageReferenceEntry[]>;
}

export type SpaceXImageReferenceIndex = Record<string, SpaceXLaunchImageReference>;

export interface BuildSpaceXImageSnapshotsOptions {
  projectRoot?: string;
  fetchImpl?: typeof fetch;
  logger?: Pick<Console, "log" | "warn" | "error">;
}

export interface SpaceXImageSnapshotResult {
  manifestPath: string;
  referenceIndexPath: string;
  downloaded: string[];
  reused: string[];
  removed: string[];
  partial: boolean;
}

class SpaceXFetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SpaceXFetchError";
    this.status = status;
  }
}

function createEmptyRoleBuckets<T>(): Record<ImageRole, T[]> {
  return {
    launch: [],
    patch: [],
    rocket: [],
    spacecraft: [],
    pad: [],
    crew: [],
  };
}

function sortByPriority<T extends { priority?: number | null }>(items: T[]): T[] {
  return [...items].sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));
}

function sortEntries<T extends { label: string; remoteUrl: string }>(entries: T[]): T[] {
  return [...entries].sort((left, right) => {
    const labelComparison = left.label.localeCompare(right.label);
    if (labelComparison !== 0) {
      return labelComparison;
    }

    return left.remoteUrl.localeCompare(right.remoteUrl);
  });
}

function sortManifest(manifest: SpaceXImageManifest): SpaceXImageManifest {
  return Object.fromEntries(
    Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right))
  );
}

function sortReferenceIndex(
  references: SpaceXImageReferenceIndex
): SpaceXImageReferenceIndex {
  return Object.fromEntries(
    Object.entries(references)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([launchId, reference]) => [
        launchId,
        {
          ...reference,
          images: Object.fromEntries(
            IMAGE_ROLES.map((role) => [role, sortEntries(reference.images[role] ?? [])])
          ) as Record<ImageRole, SpaceXImageReferenceEntry[]>,
        },
      ])
  );
}

function normalizeRemoteImageUrl(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue || !/^https?:\/\//i.test(trimmedValue)) {
    return null;
  }

  return trimmedValue;
}

function isPastDate(dateUtc?: string | null, graceMs = 0): boolean {
  if (!dateUtc) {
    return false;
  }

  const timestamp = Date.parse(dateUtc);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return timestamp < Date.now() - graceMs;
}

function dedupeLaunches(launches: RawLl2Launch[]): RawLl2Launch[] {
  const seen = new Set<string>();

  return launches.filter((launch) => {
    const id = launch.id?.trim();
    if (!id || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

function filterLaunchCollection(
  launches: RawLl2Launch[],
  mode: LaunchCollectionMode
): RawLl2Launch[] {
  return dedupeLaunches(launches).filter((launch) =>
    mode === "upcoming"
      ? !isPastDate(launch.net, UPCOMING_STALE_GRACE_MS)
      : !launch.net || Date.parse(launch.net) <= Date.now()
  );
}

function buildLaunchCollectionPath(mode: LaunchCollectionMode, limit: number): string {
  const params = new URLSearchParams({
    format: "json",
    limit: `${limit}`,
    ordering: mode === "upcoming" ? "net" : "-net",
    lsp__ids: `${SPACEX_AGENCY_ID}`,
  });

  return `/launch/${mode}/?${params.toString()}`;
}

async function fetchLaunchLibraryJson<T>(
  fetchImpl: typeof fetch,
  requestPath: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(`${LAUNCH_LIBRARY_API_BASE}${requestPath}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...getLaunchLibraryAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new SpaceXFetchError(
        `Launch Library request failed with status ${response.status}`,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new SpaceXFetchError("Launch Library request timed out", 504);
    }

    if (error instanceof SpaceXFetchError) {
      throw error;
    }

    throw new SpaceXFetchError("Unable to reach Launch Library", 502);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchLaunchCollection(
  fetchImpl: typeof fetch,
  mode: LaunchCollectionMode
): Promise<RawLl2Launch[]> {
  const response = await fetchLaunchLibraryJson<RawLl2ListResponse<RawLl2Launch>>(
    fetchImpl,
    buildLaunchCollectionPath(mode, LIST_FETCH_LIMIT)
  );

  return filterLaunchCollection(response.results ?? [], mode).slice(0, ACTIVE_WINDOW_LIMIT);
}

async function fetchLaunchDetail(
  fetchImpl: typeof fetch,
  launchId: string
): Promise<RawLl2Launch> {
  return fetchLaunchLibraryJson<RawLl2Launch>(fetchImpl, `/launch/${launchId}/?format=json`);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const rawValue = await fs.readFile(filePath, "utf8");
    return JSON.parse(rawValue) as T;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function readExistingManifest(
  manifestPath: string,
  projectRoot: string
): Promise<SpaceXImageManifest> {
  const manifest = (await readJsonFile<SpaceXImageManifest>(manifestPath)) ?? {};
  const entries: Array<readonly [string, string]> = [];

  for (const [remoteUrl, localPath] of Object.entries(manifest)) {
    if (!normalizeRemoteImageUrl(remoteUrl) || !localPath.startsWith("/data/spacex/images/")) {
      continue;
    }

    if (await fileExists(path.join(projectRoot, "public", localPath.replace(/^\//, "")))) {
      entries.push([remoteUrl, localPath]);
    }
  }

  return sortManifest(Object.fromEntries(entries));
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  // Atomic write: write to a temp file first, then rename. This prevents
  // readers from seeing a partial/truncated JSON file if the process is
  // interrupted mid-write.
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, filePath);
}

function hashRemoteUrl(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function inferExtension(contentType: string | null, remoteUrl: string): string {
  const normalizedContentType = contentType?.split(";")[0].trim().toLowerCase() ?? "";
  const extensionFromContentType: Record<string, string> = {
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
  };

  if (normalizedContentType in extensionFromContentType) {
    return extensionFromContentType[normalizedContentType];
  }

  try {
    const urlPath = new URL(remoteUrl).pathname;
    const extension = path.extname(urlPath).toLowerCase();
    if (extension) {
      return extension;
    }
  } catch {
    return ".img";
  }

  return ".img";
}

function absoluteImagePath(projectRoot: string, localPath: string): string {
  return path.join(projectRoot, "public", localPath.replace(/^\//, ""));
}

function pushDraftEntry(
  bucket: Record<ImageRole, DraftReferenceEntry[]>,
  role: ImageRole,
  remoteUrl: string | null,
  label: string
): void {
  if (!remoteUrl) {
    return;
  }

  const existingEntry = bucket[role].find((entry) => entry.remoteUrl === remoteUrl);
  if (existingEntry) {
    if (existingEntry.label !== label && label.localeCompare(existingEntry.label) < 0) {
      existingEntry.label = label;
    }
    return;
  }

  bucket[role].push({
    label,
    remoteUrl,
  });
}

function collectLaunchImageDraft(
  launch: RawLl2Launch,
  window: LaunchCollectionMode
): DraftLaunchImageReference | null {
  const launchId = launch.id?.trim();
  if (!launchId) {
    return null;
  }

  const launchName = launch.name?.trim() || "Unnamed launch";
  const images = createEmptyRoleBuckets<DraftReferenceEntry>();

  pushDraftEntry(images, "launch", normalizeRemoteImageUrl(launch.image), launchName);

  for (const [index, patch] of sortByPriority(launch.mission_patches ?? []).entries()) {
    pushDraftEntry(
      images,
      "patch",
      normalizeRemoteImageUrl(patch.image_url),
      patch.name?.trim() || `${launchName} patch ${index + 1}`
    );
  }

  for (const program of launch.program ?? []) {
    for (const [index, patch] of sortByPriority(program.mission_patches ?? []).entries()) {
      pushDraftEntry(
        images,
        "patch",
        normalizeRemoteImageUrl(patch.image_url),
        patch.name?.trim() || program.name?.trim() || `${launchName} program patch ${index + 1}`
      );
    }
  }

  pushDraftEntry(
    images,
    "rocket",
    normalizeRemoteImageUrl(launch.rocket?.configuration?.image_url),
    launch.rocket?.configuration?.full_name?.trim() ||
      launch.rocket?.configuration?.name?.trim() ||
      `${launchName} rocket`
  );

  pushDraftEntry(
    images,
    "spacecraft",
    normalizeRemoteImageUrl(launch.spacecraft_stage?.spacecraft?.spacecraft_config?.image_url),
    launch.spacecraft_stage?.spacecraft?.spacecraft_config?.name?.trim() ||
      launch.spacecraft_stage?.spacecraft?.name?.trim() ||
      `${launchName} spacecraft`
  );

  pushDraftEntry(
    images,
    "pad",
    normalizeRemoteImageUrl(launch.pad?.map_image),
    launch.pad?.name?.trim() || `${launchName} launchpad`
  );

  const crewAssignments = [
    ...(launch.spacecraft_stage?.launch_crew ?? []),
    ...(launch.spacecraft_stage?.onboard_crew ?? []),
    ...(launch.spacecraft_stage?.landing_crew ?? []),
  ];

  for (const crewAssignment of crewAssignments) {
    pushDraftEntry(
      images,
      "crew",
      normalizeRemoteImageUrl(crewAssignment.astronaut?.profile_image),
      crewAssignment.astronaut?.name?.trim() || `${launchName} crew`
    );
  }

  return {
    launchId,
    launchName,
    window,
    images: Object.fromEntries(
      IMAGE_ROLES.map((role) => [role, sortEntries(images[role])])
    ) as Record<ImageRole, DraftReferenceEntry[]>,
  };
}

function materializeLaunchReference(
  draft: DraftLaunchImageReference,
  manifest: SpaceXImageManifest
): SpaceXLaunchImageReference {
  return {
    launchId: draft.launchId,
    launchName: draft.launchName,
    window: draft.window,
    images: Object.fromEntries(
      IMAGE_ROLES.map((role) => [
        role,
        draft.images[role].map((entry) => ({
          label: entry.label,
          localPath: manifest[entry.remoteUrl] ?? null,
          remoteUrl: entry.remoteUrl,
        })),
      ])
    ) as Record<ImageRole, SpaceXImageReferenceEntry[]>,
  };
}

function mergeReferenceEntries(
  existingEntries: SpaceXImageReferenceEntry[],
  incomingEntries: SpaceXImageReferenceEntry[]
): SpaceXImageReferenceEntry[] {
  const mergedEntries = new Map<string, SpaceXImageReferenceEntry>();

  for (const entry of existingEntries) {
    mergedEntries.set(entry.remoteUrl, entry);
  }

  for (const entry of incomingEntries) {
    mergedEntries.set(entry.remoteUrl, entry);
  }

  return sortEntries(Array.from(mergedEntries.values()));
}

function mergeLaunchReference(
  existingReference: SpaceXLaunchImageReference,
  incomingReference: SpaceXLaunchImageReference
): SpaceXLaunchImageReference {
  return {
    ...incomingReference,
    images: Object.fromEntries(
      IMAGE_ROLES.map((role) => [
        role,
        mergeReferenceEntries(
          existingReference.images[role] ?? [],
          incomingReference.images[role] ?? []
        ),
      ])
    ) as Record<ImageRole, SpaceXImageReferenceEntry[]>,
  };
}

async function downloadImage(
  fetchImpl: typeof fetch,
  remoteUrl: string,
  projectRoot: string
): Promise<{ localPath: string; buffer: Buffer }> {
  const response = await fetchImpl(remoteUrl, {
    headers: {
      Accept: "image/*",
    },
  });

  if (!response.ok) {
    throw new SpaceXFetchError(`Image download failed with status ${response.status}`, response.status);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = inferExtension(response.headers.get("content-type"), remoteUrl);
  const localPath = `/data/spacex/images/${hashRemoteUrl(remoteUrl)}${extension}`;
  const filePath = absoluteImagePath(projectRoot, localPath);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);

  return { localPath, buffer };
}

export async function buildSpaceXImageSnapshots(
  options: BuildSpaceXImageSnapshotsOptions = {}
): Promise<SpaceXImageSnapshotResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const fetchImpl = options.fetchImpl ?? fetch;
  const logger = options.logger ?? console;
  const manifestPath = path.join(projectRoot, ...MANIFEST_PATH_SEGMENTS);
  const referenceIndexPath = path.join(projectRoot, ...REFERENCE_INDEX_PATH_SEGMENTS);
  const imageDirectory = path.join(projectRoot, ...IMAGE_DIRECTORY_SEGMENTS);
  const existingManifest = await readExistingManifest(manifestPath, projectRoot);
  const existingReferenceIndex =
    (await readJsonFile<SpaceXImageReferenceIndex>(referenceIndexPath)) ?? {};

  await fs.mkdir(imageDirectory, { recursive: true });

  let partial = false;
  let detailHydrationRateLimited = false;
  const launchesById = new Map<string, { launch: RawLl2Launch; window: LaunchCollectionMode }>();

  for (const window of ["upcoming", "previous"] as const) {
    try {
      const launches = await fetchLaunchCollection(fetchImpl, window);
      for (const launch of launches) {
        const launchId = launch.id?.trim();
        if (!launchId || launchesById.has(launchId)) {
          continue;
        }

        launchesById.set(launchId, { launch, window });
      }
    } catch (error) {
      partial = true;
      const err = error as Error & { status?: number };
      logger.warn(
        `SpaceX image refresh skipped the ${window} window: ${err.message ?? "unknown error"}`
      );
    }
  }

  const draftReferences: Array<{ draft: DraftLaunchImageReference; complete: boolean }> = [];
  const currentWindowUrls = new Set<string>();

  for (const { launch: listLaunch, window } of launchesById.values()) {
    const launchId = listLaunch.id?.trim();
    if (!launchId) {
      continue;
    }

    let hydratedLaunch = listLaunch;
    let complete = !detailHydrationRateLimited;

    if (!detailHydrationRateLimited) {
      try {
        hydratedLaunch = await fetchLaunchDetail(fetchImpl, launchId);
      } catch (error) {
        partial = true;
        complete = false;
        const err = error as Error & { status?: number };

        if (err.status === 429) {
          detailHydrationRateLimited = true;
          logger.warn(
            `SpaceX image refresh hit Launch Library rate limiting while hydrating launch ${launchId}. Remaining launches will stay list-only for this pass.`
          );
        } else {
          logger.warn(
            `SpaceX image refresh could not hydrate launch ${launchId}: ${err.message ?? "unknown error"}`
          );
        }
      }
    }

    if (detailHydrationRateLimited && hydratedLaunch === listLaunch) {
      partial = true;
      complete = false;
    }

    const draft = collectLaunchImageDraft(hydratedLaunch, window);
    if (!draft) {
      continue;
    }

    draftReferences.push({ draft, complete });

    for (const role of IMAGE_ROLES) {
      for (const entry of draft.images[role]) {
        currentWindowUrls.add(entry.remoteUrl);
      }
    }
  }

  const nextManifest: SpaceXImageManifest = {};
  const downloaded: string[] = [];
  const reused: string[] = [];

  for (const remoteUrl of Array.from(currentWindowUrls).sort((left, right) => left.localeCompare(right))) {
    const existingLocalPath = existingManifest[remoteUrl];
    if (existingLocalPath && (await fileExists(absoluteImagePath(projectRoot, existingLocalPath)))) {
      nextManifest[remoteUrl] = existingLocalPath;
      reused.push(remoteUrl);
      continue;
    }

    try {
      const { localPath } = await downloadImage(fetchImpl, remoteUrl, projectRoot);
      nextManifest[remoteUrl] = localPath;
      downloaded.push(remoteUrl);
    } catch (error) {
      partial = true;
      const err = error as Error & { status?: number };
      logger.warn(
        `SpaceX image refresh could not download ${remoteUrl}: ${err.message ?? "unknown error"}`
      );

      if (existingLocalPath && (await fileExists(absoluteImagePath(projectRoot, existingLocalPath)))) {
        nextManifest[remoteUrl] = existingLocalPath;
      }
    }
  }

  const finalManifest = sortManifest(partial ? { ...existingManifest, ...nextManifest } : nextManifest);
  const removed: string[] = [];

  if (!partial) {
    const referencedPaths = new Set(Object.values(finalManifest));
    const existingFiles = await fs.readdir(imageDirectory);

    for (const fileName of existingFiles) {
      const localPath = `/data/spacex/images/${fileName}`;
      if (referencedPaths.has(localPath)) {
        continue;
      }

      await fs.rm(path.join(imageDirectory, fileName), { force: true });
      removed.push(localPath);
    }
  }

  const materializedReferences = new Map<string, SpaceXLaunchImageReference>();
  for (const { draft } of draftReferences) {
    materializedReferences.set(draft.launchId, materializeLaunchReference(draft, finalManifest));
  }

  let finalReferenceIndex: SpaceXImageReferenceIndex;

  if (partial) {
    finalReferenceIndex = { ...existingReferenceIndex };

    for (const { draft, complete } of draftReferences) {
      const materialized = materializedReferences.get(draft.launchId);
      if (!materialized) {
        continue;
      }

      if (!complete && finalReferenceIndex[draft.launchId]) {
        finalReferenceIndex[draft.launchId] = mergeLaunchReference(
          finalReferenceIndex[draft.launchId] as SpaceXLaunchImageReference,
          materialized
        );
        continue;
      }

      finalReferenceIndex[draft.launchId] = materialized;
    }
  } else {
    finalReferenceIndex = Object.fromEntries(materializedReferences.entries());
  }

  await writeJsonFile(manifestPath, finalManifest);
  await writeJsonFile(referenceIndexPath, sortReferenceIndex(finalReferenceIndex));

  logger.log(
    `SpaceX image snapshot ${partial ? "completed with partial preservation" : "refreshed"}: ${downloaded.length} downloaded, ${reused.length} reused, ${removed.length} removed.`
  );

  return {
    manifestPath,
    referenceIndexPath,
    downloaded,
    reused,
    removed: removed.sort((left, right) => left.localeCompare(right)),
    partial,
  };
}

async function main() {
  await buildSpaceXImageSnapshots();
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error("Failed to build SpaceX image snapshots:", error);
    process.exitCode = 1;
  });
}
