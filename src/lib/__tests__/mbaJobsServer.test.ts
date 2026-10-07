/**
 * @jest-environment node
 */

// Stands in for Netlify Blobs with the same read rule as netlifyBlobs: a
// value older than the caller's max age reads as a miss.
const mockDurableStore = new Map<string, { savedAt: number; value: unknown }>();

jest.mock("@/lib/netlifyBlobs", () => ({
  readDurableJson: jest.fn(async (key: string, maxAgeMs: number) => {
    const saved = mockDurableStore.get(key);
    if (!saved || Date.now() - saved.savedAt > maxAgeMs) return null;
    return saved.value;
  }),
  writeDurableJson: jest.fn(async (key: string, value: unknown) => {
    mockDurableStore.set(key, {
      savedAt: Date.now(),
      value: JSON.parse(JSON.stringify(value)),
    });
  }),
}));

import { getMBAJobsData } from "../mbaJobsServer";
import { writeDurableJson } from "@/lib/netlifyBlobs";

const DAY_MS = 24 * 60 * 60 * 1000;
const GREENHOUSE = "https://boards-api.greenhouse.io/v1/boards";
const CANVA_POSTINGS = "https://api.smartrecruiters.com/v1/companies/Canva/postings";

const originalFetch = global.fetch;
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const mockWrite = writeDurableJson as jest.MockedFunction<typeof writeDurableJson>;

// Clears the module's memory the way a new serverless instance starts, while
// the durable store keeps what earlier instances wrote.
function startColdInstance(): void {
  const reset = (globalThis as Record<symbol, unknown>)[
    Symbol.for("__mbaJobsCacheResetForTesting")
  ];
  if (typeof reset === "function") (reset as () => void)();
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function greenhouseJob(id: number, title: string) {
  return {
    id,
    title,
    location: { name: "San Francisco, CA" },
    absolute_url: `https://example.com/jobs/${id}`,
    first_published: "2026-09-20T16:00:00.000Z",
    updated_at: "2026-09-21T16:00:00.000Z",
    departments: [{ name: "Strategy" }],
    content: "<p>MBA summer internship.</p>",
  };
}

function smartRecruitersPosting(id: string, name: string, department: string) {
  return {
    id,
    name,
    releasedDate: "2026-09-20T13:00:00.000Z",
    location: { city: "Austin", region: "TX", country: "us", remote: false },
    department: { label: department },
    typeOfEmployment: { label: "Full-time" },
  };
}

type Responder = (url: string) => Response | Error;

// Every board answers 200 with no postings unless a responder claims the URL.
// Responders are matched by URL prefix, longest prefix first.
function installBoards(responders: Record<string, Responder> = {}): void {
  const prefixes = Object.keys(responders).sort((a, b) => b.length - a.length);
  mockFetch.mockImplementation(async (input) => {
    const url = String(input);
    const prefix = prefixes.find((candidate) => url.startsWith(candidate));
    if (prefix) {
      const response = responders[prefix](url);
      if (response instanceof Error) throw response;
      return response;
    }
    if (url.startsWith("https://api.lever.co/")) {
      return json([]);
    }
    if (url.startsWith("https://api.smartrecruiters.com/")) {
      return json({ offset: 0, limit: 100, totalFound: 0, content: [] });
    }
    if (url.startsWith("https://us.miro.com/")) {
      return new Response(
        `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
          props: { pageProps: { jobs: [] } },
        })}</script>`,
        { status: 200 }
      );
    }
    return json({ jobs: [], meta: { total: 0 } });
  });
}

// Every board hangs until its own 8 second fetch timeout aborts the request.
function installHangingFetch(): void {
  mockFetch.mockImplementation(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new Error("The operation was aborted."))
        );
      })
  );
}

function jobBoardWrites(): string[] {
  return mockWrite.mock.calls
    .map(([key]) => key)
    .filter((key) => !key.startsWith("heartbeat/"));
}

describe("getMBAJobsData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDurableStore.clear();
    startColdInstance();
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: mockFetch,
      writable: true,
    });
    delete process.env.ADZUNA_APP_ID;
    delete process.env.ADZUNA_APP_KEY;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: originalFetch,
      writable: true,
    });
  });

  it("reads HubSpot from its live board and leaves Atlassian's retired Lever board alone", async () => {
    installBoards({
      [`${GREENHOUSE}/hubspotjobs/`]: () =>
        json({ jobs: [greenhouseJob(8185547, "MBA Strategy Intern")], meta: { total: 1 } }),
    });

    const result = await getMBAJobsData();
    const requested = mockFetch.mock.calls.map(([input]) => String(input));

    expect(requested).not.toContain("https://api.lever.co/v0/postings/atlassian?mode=json");
    expect(requested).not.toContain(`${GREENHOUSE}/hubspot/jobs?content=true`);
    expect(result.body.errors).toEqual([]);
    expect(result.isDegraded).toBe(false);
    expect(result.body.sourceStatuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ companyId: "hubspot", status: "ok", jobCount: 1 }),
      ])
    );
  });

  it("keeps a healthy board's last good jobs when another board fails on every run", async () => {
    jest.useFakeTimers();
    installBoards({
      [`${GREENHOUSE}/stripe/`]: () =>
        json({ jobs: [greenhouseJob(7001, "MBA Product Intern")], meta: { total: 1 } }),
      [`${GREENHOUSE}/brex/`]: () => json({ status: 404, error: "Job not found" }, 404),
    });
    const first = await getMBAJobsData(["stripe", "brex"]);
    expect(first.isDegraded).toBe(true);
    expect(first.body.jobs).toHaveLength(1);

    jest.advanceTimersByTime(31 * 60 * 1000);
    installBoards({
      [`${GREENHOUSE}/stripe/`]: () => new Error("upstream timeout"),
      [`${GREENHOUSE}/brex/`]: () => json({ status: 404, error: "Job not found" }, 404),
    });
    const second = await getMBAJobsData(["stripe", "brex"]);

    expect(second.isError).toBe(false);
    expect(second.isStale).toBe(true);
    expect(second.body.jobs).toEqual(first.body.jobs);
    expect(second.body.fetchedAt).toBe(first.body.fetchedAt);
    expect(second.body.errors.map((error) => error.companyId)).toEqual(["stripe", "brex"]);
    expect(second.body.sourceStatuses).toEqual([
      expect.objectContaining({
        companyId: "stripe",
        status: "failed",
        jobCount: 1,
        message: expect.stringContaining("previously fetched"),
      }),
      expect.objectContaining({ companyId: "brex", status: "failed", jobCount: 0 }),
    ]);
  });

  it("stops serving a failed board's last good jobs after 24 hours", async () => {
    jest.useFakeTimers();
    installBoards({
      [`${GREENHOUSE}/stripe/`]: () =>
        json({ jobs: [greenhouseJob(7001, "MBA Product Intern")], meta: { total: 1 } }),
    });
    await getMBAJobsData(["stripe", "brex"]);

    jest.advanceTimersByTime(25 * 60 * 60 * 1000);
    installBoards({ [`${GREENHOUSE}/stripe/`]: () => new Error("upstream timeout") });
    const later = await getMBAJobsData(["stripe", "brex"]);

    expect(later.body.jobs).toEqual([]);
    expect(later.body.sourceStatuses).toEqual([
      expect.objectContaining({ companyId: "stripe", status: "failed", jobCount: 0 }),
      expect.objectContaining({ companyId: "brex", status: "ok" }),
    ]);
  });

  it("saves the default scan even when one board fails, and saves nothing for a filtered scan", async () => {
    installBoards({
      [`${GREENHOUSE}/stripe/`]: () =>
        json({ jobs: [greenhouseJob(7001, "MBA Product Intern")], meta: { total: 1 } }),
      [`${GREENHOUSE}/brex/`]: () => json({ status: 404, error: "Job not found" }, 404),
    });

    await getMBAJobsData(["stripe", "brex"]);
    await getMBAJobsData(["stripe"]);
    expect(jobBoardWrites()).toEqual([]);

    const result = await getMBAJobsData();
    expect(result.isDegraded).toBe(true);
    expect(jobBoardWrites().sort()).toEqual(["mba-jobs-served/default", "mba-jobs/sources"]);
    expect(mockDurableStore.get("mba-jobs/sources")?.value).toEqual(
      expect.objectContaining({
        stripe: expect.objectContaining({
          jobs: [expect.objectContaining({ id: "stripe-7001" })],
        }),
      })
    );
  });

  it("answers a cold instance with the saved list and its fetched date for 7 days", async () => {
    jest.useFakeTimers();
    installBoards({
      [`${GREENHOUSE}/stripe/`]: () =>
        json({ jobs: [greenhouseJob(7001, "MBA Product Intern")], meta: { total: 1 } }),
    });
    const warm = await getMBAJobsData();
    expect(warm.body.jobs).toHaveLength(1);

    jest.advanceTimersByTime(5 * DAY_MS);
    startColdInstance();
    installHangingFetch();
    const pending = getMBAJobsData();
    await jest.advanceTimersByTimeAsync(5_000);
    const cold = await pending;

    expect(cold.isError).toBe(false);
    expect(cold.isStale).toBe(true);
    expect(cold.body.jobs).toEqual(warm.body.jobs);
    expect(cold.body.fetchedAt).toBe(warm.body.fetchedAt);
    await jest.advanceTimersByTimeAsync(8_000);

    jest.advanceTimersByTime(3 * DAY_MS);
    startColdInstance();
    const expired = getMBAJobsData();
    await jest.advanceTimersByTimeAsync(5_000);
    expect((await expired).isError).toBe(true);
    await jest.advanceTimersByTimeAsync(8_000);
  });

  it.each([undefined, ["stripe"]])("uses the saved board for prompt failures with filter %j", async (companies) => {
    jest.useFakeTimers();
    installBoards({
      [`${GREENHOUSE}/stripe/`]: () =>
        json({ jobs: [greenhouseJob(7001, "MBA Product Intern")], meta: { total: 1 } }),
      [`${GREENHOUSE}/brex/`]: () =>
        json({ jobs: [greenhouseJob(7002, "MBA Strategy Intern")], meta: { total: 1 } }),
    });
    const warm = await getMBAJobsData();
    jest.advanceTimersByTime(5 * DAY_MS);
    startColdInstance();
    mockWrite.mockClear();
    mockFetch.mockRejectedValue(new Error("provider unavailable"));

    const cold = await getMBAJobsData(companies);
    expect(cold.isError).toBe(false);
    expect(cold.isStale).toBe(true);
    expect(cold.isDegraded).toBe(true);
    expect(cold.body.jobs).toEqual(warm.body.jobs.filter((job) => !companies || companies.includes(job.companyId)));
    expect(cold.body.fetchedAt).toBe(warm.body.fetchedAt);
    expect(cold.body.errors.length).toBeGreaterThan(0);
    expect(cold.body.sourceStatuses?.find((source) => source.companyId === "stripe"))
      .toMatchObject({ status: "failed", jobCount: 1 });
    expect(jobBoardWrites()).toEqual([]);

    // A warm instance must respect the same limit as a fresh durable read.
    jest.advanceTimersByTime(3 * DAY_MS);
    expect((await getMBAJobsData(companies)).isError).toBe(true);
    startColdInstance();
    expect((await getMBAJobsData(companies)).isError).toBe(true);
  });

  it("answers a filtered request on a cold instance by filtering the saved default list", async () => {
    jest.useFakeTimers();
    installBoards({
      [`${GREENHOUSE}/stripe/`]: () =>
        json({ jobs: [greenhouseJob(7001, "MBA Product Intern")], meta: { total: 1 } }),
      [`${GREENHOUSE}/brex/`]: () =>
        json({ jobs: [greenhouseJob(7002, "MBA Strategy Intern")], meta: { total: 1 } }),
    });
    const warm = await getMBAJobsData();
    expect(warm.body.jobs).toHaveLength(2);

    jest.advanceTimersByTime(DAY_MS);
    startColdInstance();
    installHangingFetch();
    const pending = getMBAJobsData(["brex"]);
    await jest.advanceTimersByTimeAsync(5_000);
    const cold = await pending;

    expect(cold.isError).toBe(false);
    expect(cold.isStale).toBe(true);
    expect(cold.body.jobs.map((job) => job.id)).toEqual(["brex-7002"]);
    expect(cold.body.fetchedAt).toBe(warm.body.fetchedAt);
    expect(cold.body.sourceStatuses?.map((source) => source.companyId)).toEqual(["brex"]);
    await jest.advanceTimersByTimeAsync(8_000);
  });

  it("serves the snippet at the length the job card shows and still matches on the longer text", async () => {
    const opening =
      "We are a small team that meets every week to plan the year ahead, share what we have learned, and decide together where the next few months of our time and attention should go.";
    expect(opening.length).toBeGreaterThan(160);
    expect(opening.length).toBeLessThan(200);
    installBoards({
      [`${GREENHOUSE}/stripe/`]: () =>
        json({
          jobs: [
            {
              ...greenhouseJob(7003, "Associate"),
              departments: [{ name: "General" }],
              // Greenhouse sends the posting body as entity-escaped HTML.
              content: `&lt;p&gt;${opening} MBA candidates are welcome. ${opening}&lt;/p&gt;`,
            },
          ],
          meta: { total: 1 },
        }),
    });

    const result = await getMBAJobsData(["stripe"]);

    // "MBA" sits past character 160, so the role is only found when matching
    // reads more text than the card shows.
    expect(result.body.jobs.map((job) => job.id)).toEqual(["stripe-7003"]);
    const snippet = result.body.jobs[0].snippet ?? "";
    expect(snippet.length).toBeLessThanOrEqual(161);
    expect(opening.startsWith(snippet.slice(0, -1))).toBe(true);
  });

  it("pages SmartRecruiters until totalFound is reached", async () => {
    const engineers = (count: number, start: number) =>
      Array.from({ length: count }, (_, index) =>
        smartRecruitersPosting(`${start + index}`, "Senior UI Engineer", "Engineering")
      );
    installBoards({
      [CANVA_POSTINGS]: (url) => {
        if (url === `${CANVA_POSTINGS}?limit=100`) {
          return json({ offset: 0, limit: 100, totalFound: 197, content: engineers(100, 1000) });
        }
        if (url === `${CANVA_POSTINGS}?limit=100&offset=100`) {
          return json({
            offset: 100,
            limit: 100,
            totalFound: 197,
            content: [
              ...engineers(96, 2000),
              smartRecruitersPosting("3000", "Sales Strategy & Operations Lead", "Sales"),
            ],
          });
        }
        return json({ id: "3000", applyUrl: "https://jobs.smartrecruiters.com/Canva/3000" });
      },
    });

    const result = await getMBAJobsData(["canva"]);

    expect(result.body.errors).toEqual([]);
    expect(result.body.jobs.map((job) => job.id)).toEqual(["canva-3000"]);
  });

  it("stops paging SmartRecruiters at 5 pages", async () => {
    installBoards({
      [CANVA_POSTINGS]: (url) => {
        const offset = Number(new URL(url).searchParams.get("offset") ?? 0);
        return json({
          offset,
          limit: 100,
          totalFound: 5000,
          content: Array.from({ length: 100 }, (_, index) =>
            smartRecruitersPosting(`${offset + index}`, "Senior UI Engineer", "Engineering")
          ),
        });
      },
    });

    await getMBAJobsData(["canva"]);

    expect(mockFetch.mock.calls.map(([input]) => String(input))).toEqual([
      `${CANVA_POSTINGS}?limit=100`,
      `${CANVA_POSTINGS}?limit=100&offset=100`,
      `${CANVA_POSTINGS}?limit=100&offset=200`,
      `${CANVA_POSTINGS}?limit=100&offset=300`,
      `${CANVA_POSTINGS}?limit=100&offset=400`,
    ]);
  });
});
