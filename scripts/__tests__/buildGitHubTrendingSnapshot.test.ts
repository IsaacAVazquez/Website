/**
 * @jest-environment node
 */
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { buildGitHubTrendingSnapshot } from "../buildGitHubTrendingSnapshot";
import type { GitHubTrendingSnapshot } from "../../src/types/githubTrending";

const GENERATED_AT = "2026-06-15T00:00:00.000Z";
const SILENT_LOGGER = { log: jest.fn(), warn: jest.fn() };

async function makeProjectRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "github-trending-snapshot-"));
}

function snapshotPathFor(projectRoot: string): string {
  return path.join(projectRoot, "src", "data", "githubTrendingSnapshot.ts");
}

function makeRepoItem(id: number) {
  return {
    id,
    node_id: `node-${id}`,
    name: `repo-${id}`,
    full_name: `owner/repo-${id}`,
    owner: { login: "owner" },
    description: "A trending repository",
    html_url: `https://github.com/owner/repo-${id}`,
    homepage: null,
    language: "TypeScript",
    topics: ["ai"],
    stargazers_count: 1000 + id,
    forks_count: 100,
    open_issues_count: 5,
    watchers_count: 50,
    license: { spdx_id: "MIT" },
    pushed_at: "2026-06-10T00:00:00Z",
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2026-06-12T00:00:00Z",
  };
}

function okResponse(id: number): Response {
  return new Response(
    JSON.stringify({ total_count: 1, incomplete_results: false, items: [makeRepoItem(id)] }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

/** Extracts the segment qualifier (e.g. "language:Rust") from a search URL. */
function qualifierFromUrl(input: string): string {
  const query = new URL(input).searchParams.get("q") ?? "";
  return query.split(" stars:")[0];
}

interface FetchOutcome {
  /** HTTP status to return while failing. Defaults to 503 (retryable). */
  status?: number;
  /** Fail this many leading attempts, then succeed. Omit/Infinity = always fail. */
  failTimes?: number;
}

/**
 * Builds a `fetch` stub keyed by segment qualifier. Each distinct qualifier gets
 * a stable repo id so retries of the same segment return the same repository.
 */
function createFetchMock(outcomes: Record<string, FetchOutcome> = {}) {
  const idByQualifier = new Map<string, number>();
  const callsByQualifier = new Map<string, number>();
  let nextId = 1;

  return jest.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const qualifier = qualifierFromUrl(String(input));
    const calls = (callsByQualifier.get(qualifier) ?? 0) + 1;
    callsByQualifier.set(qualifier, calls);

    const outcome = outcomes[qualifier];
    if (outcome && calls <= (outcome.failTimes ?? Number.POSITIVE_INFINITY)) {
      return new Response("upstream unavailable", { status: outcome.status ?? 503 });
    }

    if (!idByQualifier.has(qualifier)) {
      idByQualifier.set(qualifier, nextId);
      nextId += 1;
    }
    return okResponse(idByQualifier.get(qualifier)!);
  });
}

async function readSnapshotRaw(projectRoot: string): Promise<string> {
  return fs.readFile(snapshotPathFor(projectRoot), "utf8");
}

describe("buildGitHubTrendingSnapshot resilience", () => {
  const originalToken = process.env.GITHUB_TOKEN;
  const originalGhToken = process.env.GH_TOKEN;

  beforeEach(() => {
    // Force the fast, token-aware delay path off so tests don't pace requests.
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    SILENT_LOGGER.log.mockReset();
    SILENT_LOGGER.warn.mockReset();
  });

  afterEach(async () => {
    if (originalToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = originalToken;
    if (originalGhToken === undefined) delete process.env.GH_TOKEN;
    else process.env.GH_TOKEN = originalGhToken;

    const entries = await fs.readdir(os.tmpdir());
    await Promise.all(
      entries
        .filter((entry) => entry.startsWith("github-trending-snapshot-"))
        .map((entry) => fs.rm(path.join(os.tmpdir(), entry), { recursive: true, force: true }))
    );
  });

  it("writes a snapshot covering every segment when all fetches succeed", async () => {
    const projectRoot = await makeProjectRoot();
    const fetchImpl = createFetchMock();

    const { snapshot } = await buildGitHubTrendingSnapshot({
      projectRoot,
      generatedAt: GENERATED_AT,
      logger: SILENT_LOGGER,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      requestDelayMs: 0,
      retryBackoffMs: 0,
    });

    // 7 language + 7 topic segments, one unique repo each.
    expect(snapshot.totals.languages).toBe(7);
    expect(snapshot.totals.topics).toBe(7);
    expect(snapshot.totals.repositories).toBe(14);
    expect(fetchImpl).toHaveBeenCalledTimes(14);
    await expect(readSnapshotRaw(projectRoot)).resolves.toContain(
      "export const githubTrendingSnapshot"
    );
  });

  it("retries a transient failure and still covers the segment", async () => {
    const projectRoot = await makeProjectRoot();
    // Rust fails once with a retryable 503, then succeeds on retry.
    const fetchImpl = createFetchMock({
      "language:Rust": { status: 503, failTimes: 1 },
    });

    const { snapshot } = await buildGitHubTrendingSnapshot({
      projectRoot,
      generatedAt: GENERATED_AT,
      logger: SILENT_LOGGER,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      requestDelayMs: 0,
      retryBackoffMs: 0,
    });

    expect(snapshot.totals.repositories).toBe(14);
    // 14 successful calls + 1 retried attempt for Rust.
    expect(fetchImpl).toHaveBeenCalledTimes(15);
  });

  it("skips up to the tolerated number of permanently failing segments", async () => {
    const projectRoot = await makeProjectRoot();
    // Three non-retryable (422) failures — at the tolerance boundary.
    const fetchImpl = createFetchMock({
      "language:Swift": { status: 422 },
      "topic:llm": { status: 422 },
      "topic:security": { status: 422 },
    });

    const { snapshot } = await buildGitHubTrendingSnapshot({
      projectRoot,
      generatedAt: GENERATED_AT,
      logger: SILENT_LOGGER,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      requestDelayMs: 0,
      retryBackoffMs: 0,
    });

    expect(snapshot.totals.repositories).toBe(11);
    await expect(readSnapshotRaw(projectRoot)).resolves.toContain(
      "export const githubTrendingSnapshot"
    );
  });

  it("aborts without overwriting the previous snapshot when too many segments fail", async () => {
    const projectRoot = await makeProjectRoot();
    const existing = `import type { GitHubTrendingSnapshot } from "@/types/githubTrending";

// Generated by scripts/buildGitHubTrendingSnapshot.ts.
export const githubTrendingSnapshot: GitHubTrendingSnapshot = ${JSON.stringify(
      { generatedAt: "2026-06-01T00:00:00.000Z", repositories: [] } as Partial<GitHubTrendingSnapshot>,
      null,
      2
    )};
`;
    await fs.mkdir(path.dirname(snapshotPathFor(projectRoot)), { recursive: true });
    await fs.writeFile(snapshotPathFor(projectRoot), existing, "utf8");

    // Four failures > MAX_FAILED_SEGMENTS (3) ⇒ abort the run.
    const fetchImpl = createFetchMock({
      "language:Swift": { status: 422 },
      "topic:llm": { status: 422 },
      "topic:security": { status: 422 },
      "topic:agent": { status: 422 },
    });

    await expect(
      buildGitHubTrendingSnapshot({
        projectRoot,
        generatedAt: GENERATED_AT,
        logger: SILENT_LOGGER,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        requestDelayMs: 0,
        retryBackoffMs: 0,
      })
    ).rejects.toThrow(/refresh aborted/i);

    // The committed snapshot must be left exactly as it was.
    await expect(readSnapshotRaw(projectRoot)).resolves.toBe(existing);
  });
});
