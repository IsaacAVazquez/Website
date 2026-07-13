import { promises as fs } from "fs";
import path from "path";
import {
  buildGitHubTrendingSnapshot as buildSnapshotData,
  type GitHubTrendingSourceRepository,
  type GitHubTrendingSourceSegment,
} from "../src/lib/githubTrending";
import type {
  GitHubTrendingSegmentKind,
  GitHubTrendingSnapshot,
} from "../src/types/githubTrending";
import { withRetry } from "./fetchRetry";

interface BuildOptions {
  projectRoot?: string;
  generatedAt?: string;
  logger?: Pick<Console, "log" | "warn">;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
  /** Override the inter-segment pacing delay (ms). Defaults to a token-aware value. */
  requestDelayMs?: number;
  /** Attempts per segment fetch before giving up on that segment. */
  maxFetchAttempts?: number;
  /** Backoff base (ms) for the per-segment retry. Lowered in tests. */
  retryBackoffMs?: number;
}

/**
 * The GitHub Search API is the only upstream source, so a transient blip on a
 * single segment must not discard the entire refresh. We retry each segment and
 * tolerate a few outright failures; only a broad outage (more than this many
 * failed segments) aborts the run so the previous snapshot is preserved.
 */
const MAX_FAILED_SEGMENTS = 3;

/** Error carrying the HTTP status + headers so `withRetry` can classify it. */
class GitHubSearchHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly headers: Headers
  ) {
    super(message);
    this.name = "GitHubSearchHttpError";
  }
}

interface BuildResult {
  snapshotPath: string;
  snapshot: GitHubTrendingSnapshot;
}

interface TrackedSegmentConfig {
  key: string;
  label: string;
  kind: GitHubTrendingSegmentKind;
  qualifier: string;
}

interface GitHubSearchRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  license: { spdx_id: string | null } | null;
  pushed_at: string;
  created_at: string;
  updated_at: string;
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubSearchRepository[];
  message?: string;
}

const SNAPSHOT_PATH_SEGMENTS = [
  "src",
  "data",
  "githubTrendingSnapshot.ts",
] as const;

const WINDOW_DAYS = 7;
const ACTIVITY_WINDOW_DAYS = 45;
const PER_SEGMENT_LIMIT = 14;

const TRACKED_SEGMENTS: TrackedSegmentConfig[] = [
  { key: "language-typescript", label: "TypeScript", kind: "language", qualifier: "language:TypeScript" },
  { key: "language-python", label: "Python", kind: "language", qualifier: "language:Python" },
  { key: "language-javascript", label: "JavaScript", kind: "language", qualifier: "language:JavaScript" },
  { key: "language-go", label: "Go", kind: "language", qualifier: "language:Go" },
  { key: "language-rust", label: "Rust", kind: "language", qualifier: "language:Rust" },
  { key: "language-swift", label: "Swift", kind: "language", qualifier: "language:Swift" },
  { key: "language-java", label: "Java", kind: "language", qualifier: "language:Java" },
  { key: "topic-ai", label: "AI", kind: "topic", qualifier: "topic:ai" },
  { key: "topic-llm", label: "LLMs", kind: "topic", qualifier: "topic:llm" },
  { key: "topic-agents", label: "Agents", kind: "topic", qualifier: "topic:agent" },
  { key: "topic-developer-tools", label: "Developer Tools", kind: "topic", qualifier: "topic:developer-tools" },
  { key: "topic-nextjs", label: "Next.js", kind: "topic", qualifier: "topic:nextjs" },
  { key: "topic-data-engineering", label: "Data Engineering", kind: "topic", qualifier: "topic:data-engineering" },
  { key: "topic-security", label: "Security", kind: "topic", qualifier: "topic:security" },
] as const;

function dateDaysAgo(generatedAt: string, days: number): string {
  const date = new Date(generatedAt);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGitHubToken(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

function buildSearchQuery(
  segment: TrackedSegmentConfig,
  generatedAt: string
): string {
  const pushedSince = dateDaysAgo(generatedAt, ACTIVITY_WINDOW_DAYS);
  return `${segment.qualifier} stars:>50 pushed:>=${pushedSince} archived:false`;
}

function buildSearchUrl(query: string): string {
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", PER_SEGMENT_LIMIT.toString());
  return url.toString();
}

function buildGithubWebSearchUrl(query: string): string {
  const url = new URL("https://github.com/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "repositories");
  url.searchParams.set("s", "stars");
  url.searchParams.set("o", "desc");
  return url.toString();
}

function normalizeRepository(
  repo: GitHubSearchRepository
): GitHubTrendingSourceRepository {
  return {
    id: repo.id,
    nodeId: repo.node_id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    description: repo.description,
    url: repo.html_url,
    homepageUrl: repo.homepage?.trim() || null,
    primaryLanguage: repo.language,
    topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 12).sort() : [],
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    watchers: repo.watchers_count,
    licenseSpdxId: repo.license?.spdx_id || null,
    pushedAt: repo.pushed_at,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
  };
}

function restorePreviousSegment(
  segment: TrackedSegmentConfig,
  previousSnapshot: GitHubTrendingSnapshot | null
): GitHubTrendingSourceSegment | null {
  if (!previousSnapshot) return null;

  const previousSegment = [
    ...(Array.isArray(previousSnapshot.languages)
      ? previousSnapshot.languages
      : []),
    ...(Array.isArray(previousSnapshot.topics) ? previousSnapshot.topics : []),
  ].find((candidate) => candidate.key === segment.key);
  if (!previousSegment) return null;

  const repositoriesById = new Map(
    (Array.isArray(previousSnapshot.repositories)
      ? previousSnapshot.repositories
      : []
    ).map((repository) => [repository.id, repository])
  );
  const repositories = previousSegment.repoIds.flatMap((repositoryId) => {
    const repository = repositoriesById.get(repositoryId);
    if (!repository) return [];

    return [
      {
        id: repository.id,
        nodeId: repository.nodeId,
        name: repository.name,
        fullName: repository.fullName,
        owner: repository.owner,
        description: repository.description,
        url: repository.url,
        homepageUrl: repository.homepageUrl,
        primaryLanguage: repository.primaryLanguage,
        topics: repository.topics,
        stars: repository.stars,
        forks: repository.forks,
        openIssues: repository.openIssues,
        watchers: repository.watchers,
        licenseSpdxId: repository.licenseSpdxId,
        pushedAt: repository.pushedAt,
        createdAt: repository.createdAt,
        updatedAt: repository.updatedAt,
      } satisfies GitHubTrendingSourceRepository,
    ];
  });

  if (repositories.length === 0) return null;

  return {
    key: previousSegment.key,
    label: previousSegment.label,
    kind: previousSegment.kind,
    query: previousSegment.query,
    sourceUrl: previousSegment.sourceUrl,
    repositories,
  };
}

async function readPreviousSnapshot(
  snapshotPath: string,
  logger: Pick<Console, "warn">
): Promise<GitHubTrendingSnapshot | null> {
  try {
    const source = await fs.readFile(snapshotPath, "utf8");
    const match = source.match(
      /export const githubTrendingSnapshot: GitHubTrendingSnapshot = (\{[\s\S]*\});\s*$/
    );
    if (!match) {
      logger.warn(
        "Previous GitHub trending snapshot did not match expected export pattern. Continuing without diff base."
      );
      return null;
    }
    try {
      return JSON.parse(match[1]) as GitHubTrendingSnapshot;
    } catch (parseError) {
      logger.warn(
        `Failed to JSON.parse the previous GitHub trending snapshot body: ${String(parseError)}`
      );
      return null;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.warn(`Could not read previous GitHub trending snapshot: ${String(error)}`);
    }
    return null;
  }
}

/**
 * A GitHub rate-limit response is a 403 with `x-ratelimit-remaining: 0` (primary
 * limit) or a 403/429 with `retry-after` (secondary limit). `withRetry` only
 * treats 429/503/5xx as retryable, so we surface rate-limited 403s as 429 to get
 * the same backoff-and-honor-`Retry-After` behavior.
 */
function effectiveStatus(response: Response): number {
  if (response.status === 403) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (remaining === "0" || response.headers.get("retry-after")) {
      return 429;
    }
  }
  return response.status;
}

async function fetchSegment(
  segment: TrackedSegmentConfig,
  generatedAt: string,
  token: string | undefined,
  fetchImpl: typeof fetch
): Promise<GitHubTrendingSourceSegment> {
  const query = buildSearchQuery(segment, generatedAt);
  const response = await fetchImpl(buildSearchUrl(query), {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "isaac-vazquez-github-trending-pulse",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    // Read the body as text so an HTML rate-limit/error page does not throw a
    // raw SyntaxError; surface a useful message without assuming valid JSON.
    let detail = response.statusText;
    try {
      const errorBody = await response.text();
      try {
        const parsed = JSON.parse(errorBody) as GitHubSearchResponse;
        detail = parsed.message ?? response.statusText;
      } catch {
        // Body was not JSON (e.g. an HTML error page); keep the status text.
      }
    } catch {
      // Ignore body-read failures and fall back to the status text.
    }
    throw new GitHubSearchHttpError(
      `GitHub search failed for ${segment.label} (HTTP ${response.status}): ${detail}`,
      effectiveStatus(response),
      response.headers
    );
  }

  let payload: GitHubSearchResponse;
  try {
    payload = (await response.json()) as GitHubSearchResponse;
  } catch (parseError) {
    throw new Error(
      `GitHub search returned unparseable JSON for ${segment.label}: ${String(parseError)}`
    );
  }

  return {
    key: segment.key,
    label: segment.label,
    kind: segment.kind,
    query,
    sourceUrl: buildGithubWebSearchUrl(query),
    repositories: payload.items.map(normalizeRepository),
  };
}

export async function buildGitHubTrendingSnapshot(
  options: BuildOptions = {}
): Promise<BuildResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const logger = options.logger ?? console;
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const snapshotPath = path.join(projectRoot, ...SNAPSHOT_PATH_SEGMENTS);
  const previousSnapshot = await readPreviousSnapshot(snapshotPath, logger);
  const fetchImpl = options.fetchImpl ?? fetch;
  const token = getGitHubToken();
  const delayMs = options.requestDelayMs ?? (token ? 250 : 6_500);
  const maxAttempts = options.maxFetchAttempts ?? 4;
  const retryBackoffMs = options.retryBackoffMs ?? 1_500;
  const segments: GitHubTrendingSourceSegment[] = [];
  const failedSegments: string[] = [];
  const reusedSegments: string[] = [];

  for (let index = 0; index < TRACKED_SEGMENTS.length; index += 1) {
    const segment = TRACKED_SEGMENTS[index];
    if (index > 0) {
      await sleep(delayMs);
    }
    logger.log(`Fetching GitHub trending segment: ${segment.label}`);
    try {
      segments.push(
        await withRetry(
          `github-trending:${segment.key}`,
          () => fetchSegment(segment, generatedAt, token, fetchImpl),
          maxAttempts,
          retryBackoffMs
        )
      );
    } catch (error) {
      failedSegments.push(segment.label);
      const previousSegment = restorePreviousSegment(segment, previousSnapshot);
      if (previousSegment) {
        segments.push(previousSegment);
        reusedSegments.push(segment.label);
      }
      logger.warn(
        `${previousSegment ? "Reusing" : "Skipping"} GitHub trending segment "${segment.label}" after ${maxAttempts} attempts: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  if (failedSegments.length > MAX_FAILED_SEGMENTS) {
    // Too much of the source is unavailable to trust a partial refresh; abort so
    // the previously committed snapshot is kept rather than gutted.
    throw new Error(
      `GitHub trending refresh aborted: ${failedSegments.length} of ${TRACKED_SEGMENTS.length} segments failed (${failedSegments.join(", ")}). Keeping the previous snapshot.`
    );
  }

  if (failedSegments.length > 0) {
    logger.warn(
      `GitHub trending snapshot built with ${failedSegments.length} segment(s) skipped: ${failedSegments.join(", ")}.`
    );
  }

  const snapshot: GitHubTrendingSnapshot = {
    ...buildSnapshotData({
      generatedAt,
      windowDays: WINDOW_DAYS,
      activityWindowDays: ACTIVITY_WINDOW_DAYS,
      sourceLabel: "GitHub Search API",
      sourceUrl: "https://docs.github.com/rest/search/search#search-repositories",
      segments,
      previousSnapshot,
    }),
    sourceStatus: {
      status: failedSegments.length > 0 ? "degraded" : "fresh",
      failedSegments,
      reusedSegments,
    },
  };

  const fileContents = `import type { GitHubTrendingSnapshot } from "@/types/githubTrending";

// Generated by scripts/buildGitHubTrendingSnapshot.ts.
export const githubTrendingSnapshot: GitHubTrendingSnapshot = ${JSON.stringify(snapshot)};
`;

  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
  // Atomic write: write to a temp file first, then rename. This prevents
  // build/readers from seeing a partial snapshot if the process is interrupted.
  const tmpPath = `${snapshotPath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmpPath, fileContents, "utf8");
  await fs.rename(tmpPath, snapshotPath);

  logger.log(
    `GitHub trending snapshot written: ${snapshot.totals.repositories} repos, ${snapshot.totals.languages} languages, ${snapshot.totals.topics} topics.`
  );

  return { snapshotPath, snapshot };
}

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  path.basename(process.argv[1]) === "buildGitHubTrendingSnapshot.ts";

if (isMainModule) {
  buildGitHubTrendingSnapshot().catch((error) => {
    console.error("Failed to build GitHub trending snapshot:", error);
    process.exitCode = 1;
  });
}
