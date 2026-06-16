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

interface BuildOptions {
  projectRoot?: string;
  generatedAt?: string;
  logger?: Pick<Console, "log" | "warn">;
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
  { key: "topic-ai", label: "AI", kind: "topic", qualifier: "topic:artificial-intelligence" },
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

async function fetchSegment(
  segment: TrackedSegmentConfig,
  generatedAt: string,
  token: string | undefined
): Promise<GitHubTrendingSourceSegment> {
  const query = buildSearchQuery(segment, generatedAt);
  const response = await fetch(buildSearchUrl(query), {
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
    throw new Error(
      `GitHub search failed for ${segment.label} (HTTP ${response.status}): ${detail}`
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
  const token = getGitHubToken();
  const delayMs = token ? 250 : 6_500;
  const segments: GitHubTrendingSourceSegment[] = [];

  for (let index = 0; index < TRACKED_SEGMENTS.length; index += 1) {
    const segment = TRACKED_SEGMENTS[index];
    if (index > 0) {
      await sleep(delayMs);
    }
    logger.log(`Fetching GitHub trending segment: ${segment.label}`);
    segments.push(await fetchSegment(segment, generatedAt, token));
  }

  const snapshot = buildSnapshotData({
    generatedAt,
    windowDays: WINDOW_DAYS,
    activityWindowDays: ACTIVITY_WINDOW_DAYS,
    sourceLabel: "GitHub Search API",
    sourceUrl: "https://docs.github.com/rest/search/search#search-repositories",
    segments,
    previousSnapshot,
  });

  const fileContents = `import type { GitHubTrendingSnapshot } from "@/types/githubTrending";

// Generated by scripts/buildGitHubTrendingSnapshot.ts.
export const githubTrendingSnapshot: GitHubTrendingSnapshot = ${JSON.stringify(snapshot, null, 2)};
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
