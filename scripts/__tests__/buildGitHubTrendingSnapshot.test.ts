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
  return path.join(projectRoot, "src", "data", "githubTrendingSnapshot.json");
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

const NOW_MS = Date.parse(GENERATED_AT);

/** The rate limit headers GitHub sends on an unauthenticated search. */
function searchHeaders(remaining: number, resetEpochSeconds: number) {
  return {
    "content-type": "application/json; charset=utf-8",
    "x-ratelimit-limit": "10",
    "x-ratelimit-remaining": String(remaining),
    "x-ratelimit-used": String(10 - remaining),
    "x-ratelimit-resource": "search",
    "x-ratelimit-reset": String(resetEpochSeconds),
  };
}

/** A 200 whose search timed out, so `items` holds only what was found in time. */
function incompleteResponse(id: number): Response {
  return new Response(
    JSON.stringify({ total_count: 18913, incomplete_results: true, items: [makeRepoItem(id)] }),
    { status: 200, headers: searchHeaders(9, NOW_MS / 1000 + 60) }
  );
}

/** A primary rate limit: the window is spent and GitHub sends no `retry-after`. */
function rateLimitedResponse(status: number, resetEpochSeconds: number): Response {
  return new Response(
    JSON.stringify({
      message:
        "API rate limit exceeded for 203.0.113.7. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)",
      documentation_url:
        "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting",
    }),
    { status, headers: searchHeaders(0, resetEpochSeconds) }
  );
}

/** Records each delay the builder asks for and fires the timer straight away. */
function recordTimerDelays(): number[] {
  const delays: number[] = [];
  const realSetTimeout = global.setTimeout;
  jest.spyOn(global, "setTimeout").mockImplementation(((callback: () => void, ms = 0) => {
    delays.push(ms);
    return realSetTimeout(callback, 0);
  }) as unknown as typeof setTimeout);
  return delays;
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
  /** Full response to return while failing, for cases a bare status cannot express. */
  respond?: (id: number) => Response;
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

    // Assigned before the outcome so a failing segment keeps the same id across
    // two mocks, which the reuse test relies on.
    if (!idByQualifier.has(qualifier)) {
      idByQualifier.set(qualifier, nextId);
      nextId += 1;
    }
    const id = idByQualifier.get(qualifier)!;

    const outcome = outcomes[qualifier];
    if (outcome && calls <= (outcome.failTimes ?? Number.POSITIVE_INFINITY)) {
      return (
        outcome.respond?.(id) ??
        new Response("upstream unavailable", { status: outcome.status ?? 503 })
      );
    }

    return okResponse(id);
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
    jest.restoreAllMocks();
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
    expect(snapshot.sourceStatus).toEqual({
      status: "fresh",
      failedSegments: [],
      reusedSegments: [],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(14);
    await expect(readSnapshotRaw(projectRoot)).resolves.toContain('"generatedAt"');
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
    expect(snapshot.sourceStatus).toEqual({
      status: "degraded",
      failedSegments: ["Swift", "LLMs", "Security"],
      reusedSegments: [],
    });
    await expect(readSnapshotRaw(projectRoot)).resolves.toContain('"generatedAt"');
  });

  it("aborts without overwriting the previous snapshot when too many segments fail", async () => {
    const projectRoot = await makeProjectRoot();
    const existing = JSON.stringify(
      { generatedAt: "2026-06-01T00:00:00.000Z", repositories: [] } as Partial<GitHubTrendingSnapshot>,
      null,
      2
    );
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

  it("retries a segment whose results GitHub flags as incomplete", async () => {
    const projectRoot = await makeProjectRoot();
    const fetchImpl = createFetchMock({
      "language:Rust": { failTimes: 1, respond: incompleteResponse },
    });

    const { snapshot } = await buildGitHubTrendingSnapshot({
      projectRoot,
      generatedAt: GENERATED_AT,
      logger: SILENT_LOGGER,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      requestDelayMs: 0,
      retryBackoffMs: 0,
    });

    // 14 complete calls + the incomplete first attempt for Rust.
    expect(fetchImpl).toHaveBeenCalledTimes(15);
    expect(snapshot.sourceStatus?.status).toBe("fresh");
  });

  it("reuses the previous segment when the results stay incomplete", async () => {
    const projectRoot = await makeProjectRoot();
    const options = {
      projectRoot,
      logger: SILENT_LOGGER,
      requestDelayMs: 0,
      retryBackoffMs: 0,
    };
    await buildGitHubTrendingSnapshot({
      ...options,
      generatedAt: "2026-06-14T00:00:00.000Z",
      fetchImpl: createFetchMock() as unknown as typeof fetch,
    });
    const fetchImpl = createFetchMock({
      "language:Rust": { respond: incompleteResponse },
    });

    const { snapshot } = await buildGitHubTrendingSnapshot({
      ...options,
      generatedAt: GENERATED_AT,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(snapshot.sourceStatus).toEqual({
      status: "degraded",
      failedSegments: ["Rust"],
      reusedSegments: ["Rust"],
    });
    expect(snapshot.totals.repositories).toBe(14);
    // 13 complete calls + 4 incomplete attempts for Rust.
    expect(fetchImpl).toHaveBeenCalledTimes(17);
  });

  it.each([403, 429])(
    "waits for the rate limit reset before retrying an HTTP %i",
    async (status) => {
      const projectRoot = await makeProjectRoot();
      const fetchImpl = createFetchMock({
        "language:Rust": {
          failTimes: 1,
          respond: () => rateLimitedResponse(status, NOW_MS / 1000 + 40),
        },
      });
      jest.spyOn(Date, "now").mockReturnValue(NOW_MS);
      jest.spyOn(Math, "random").mockReturnValue(0);
      const delays = recordTimerDelays();

      const { snapshot } = await buildGitHubTrendingSnapshot({
        projectRoot,
        generatedAt: GENERATED_AT,
        logger: SILENT_LOGGER,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        requestDelayMs: 0,
        retryBackoffMs: 0,
      });

      expect(delays).toContain(40_000);
      expect(fetchImpl).toHaveBeenCalledTimes(15);
      expect(snapshot.sourceStatus?.status).toBe("fresh");
    }
  );

  it("caps the rate limit wait when the reset is far off", async () => {
    const projectRoot = await makeProjectRoot();
    const fetchImpl = createFetchMock({
      "language:Rust": {
        failTimes: 1,
        respond: () => rateLimitedResponse(403, NOW_MS / 1000 + 3600),
      },
    });
    jest.spyOn(Date, "now").mockReturnValue(NOW_MS);
    jest.spyOn(Math, "random").mockReturnValue(0);
    const delays = recordTimerDelays();

    await buildGitHubTrendingSnapshot({
      projectRoot,
      generatedAt: GENERATED_AT,
      logger: SILENT_LOGGER,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      requestDelayMs: 0,
      retryBackoffMs: 0,
    });

    expect(Math.max(...delays)).toBe(65_000);
  });
});
