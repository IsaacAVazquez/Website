import { act, renderHook, waitFor } from "@testing-library/react";
import { useMBAJobs } from "../useMBAJobs";
import type { MBAJob, MBAJobsApiResponse } from "@/types/mba-jobs";

const SEEN_IDS_KEY = "mba_seen_job_ids_v1";
const WATCHED_KEY = "mba_watched_companies_v2";

function makeJob(overrides: Partial<MBAJob> & { id: string }): MBAJob {
  return {
    companyId: "stripe",
    companyName: "Stripe",
    title: "MBA Product Intern",
    location: "San Francisco, CA",
    department: "Product",
    applyUrl: "https://example.com/apply",
    postedAt: "2026-04-14T16:00:00.000Z",
    atsType: "greenhouse",
    category: "fintech",
    snippet: "Summer associate role.",
    roleType: "internship",
    roleFamilies: ["product"],
    ...overrides,
  };
}

const jobA = makeJob({ id: "stripe-1" });
const jobB = makeJob({
  id: "brex-1",
  companyId: "brex",
  companyName: "Brex",
  title: "MBA Strategy Intern",
});

function buildResponse(jobs: MBAJob[]): MBAJobsApiResponse {
  return {
    jobs,
    fetchedAt: "2026-06-23T12:00:00.000Z",
    errors: [],
    companiesRequested: jobs.map((j) => j.companyId),
    sourceStatuses: [],
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function installFetch(
  impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
) {
  const fetchMock = jest.fn(impl);
  (global as unknown as { fetch: typeof fetch }).fetch =
    fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function mockJobsResponse(jobs: MBAJob[]) {
  return installFetch(async () => jsonResponse(buildResponse(jobs)));
}

describe("useMBAJobs", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete (global as { fetch?: typeof fetch }).fetch;
  });

  afterEach(() => {
    delete (global as { fetch?: typeof fetch }).fetch;
  });

  it("loads jobs from the API on mount and clears the loading flag", async () => {
    const fetchSpy = mockJobsResponse([jobA, jobB]);

    const { result } = renderHook(() => useMBAJobs());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.jobs).toHaveLength(2);
    expect(result.current.jobs.map((j) => j.id)).toEqual(["stripe-1", "brex-1"]);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetchedAt).toBeInstanceOf(Date);
    expect(fetchSpy).toHaveBeenCalled();
    expect(String(fetchSpy.mock.calls[0][0])).toContain("/api/mba-jobs");
  });

  it("derives newJobCount from unseen jobs and updates after marking one seen", async () => {
    mockJobsResponse([jobA, jobB]);

    const { result } = renderHook(() => useMBAJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.jobs).toHaveLength(2);

    expect(result.current.newJobCount).toBe(2);

    act(() => {
      result.current.markJobSeen("stripe-1");
    });

    await waitFor(() => expect(result.current.newJobCount).toBe(1));
    expect(result.current.seenIds.has("stripe-1")).toBe(true);

    const persisted = JSON.parse(
      window.localStorage.getItem(SEEN_IDS_KEY) ?? "[]"
    );
    expect(persisted).toContain("stripe-1");
  });

  it("marks all visible jobs seen and persists every id", async () => {
    mockJobsResponse([jobA, jobB]);

    const { result } = renderHook(() => useMBAJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.jobs).toHaveLength(2);

    act(() => {
      result.current.markAllSeen();
    });

    await waitFor(() => expect(result.current.newJobCount).toBe(0));

    const persisted = JSON.parse(
      window.localStorage.getItem(SEEN_IDS_KEY) ?? "[]"
    );
    expect(persisted).toEqual(expect.arrayContaining(["stripe-1", "brex-1"]));
  });

  it("starts with all non-manual companies watched by default", async () => {
    mockJobsResponse([jobA]);

    const { result } = renderHook(() => useMBAJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.watchedCompanyIds.has("stripe")).toBe(true);
    expect(result.current.watchedCompanyIds.size).toBeGreaterThan(0);
  });

  it("toggles a company off and on and persists the watched set", async () => {
    const fetchSpy = mockJobsResponse([jobA]);

    const { result } = renderHook(() => useMBAJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.watchedCompanyIds.has("stripe")).toBe(true);

    act(() => {
      result.current.toggleCompany("stripe");
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.watchedCompanyIds.has("stripe")).toBe(false);
    let persisted = JSON.parse(window.localStorage.getItem(WATCHED_KEY) ?? "[]");
    expect(persisted).not.toContain("stripe");

    act(() => {
      result.current.toggleCompany("stripe");
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.watchedCompanyIds.has("stripe")).toBe(true);
    persisted = JSON.parse(window.localStorage.getItem(WATCHED_KEY) ?? "[]");
    expect(persisted).toContain("stripe");
  });

  it("drops persisted watched company ids that are no longer known", async () => {
    window.localStorage.setItem(
      WATCHED_KEY,
      JSON.stringify(["stripe", "retired-company"])
    );
    const fetchSpy = mockJobsResponse([jobA]);

    const { result } = renderHook(() => useMBAJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const requestedUrl = new URL(
      String(fetchSpy.mock.calls[0][0]),
      "https://isaacavazquez.com"
    );
    expect(requestedUrl.searchParams.get("companies")).toBe("stripe");
    expect(result.current.watchedCompanyIds.has("stripe")).toBe(true);
    expect(result.current.watchedCompanyIds.has("retired-company")).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("setAllCompanies(false) clears the watched set and persists it", async () => {
    const fetchSpy = mockJobsResponse([jobA]);

    const { result } = renderHook(() => useMBAJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setAllCompanies(false);
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.watchedCompanyIds.size).toBe(0);
    const persisted = JSON.parse(
      window.localStorage.getItem(WATCHED_KEY) ?? "[]"
    );
    expect(persisted).toEqual([]);

    act(() => {
      result.current.setAllCompanies(true);
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.watchedCompanyIds.size).toBeGreaterThan(0);
  });

  it("surfaces an error when the fetch fails", async () => {
    installFetch(async () => jsonResponse({ error: "boom" }, 500));

    const { result } = renderHook(() => useMBAJobs());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toContain("500");
    expect(result.current.jobs).toHaveLength(0);
  });

  it("surfaces structured outage detail from a 503 body alongside the error", async () => {
    const outageErrors = [
      { companyId: "stripe", companyName: "Stripe", message: "upstream timeout" },
    ];
    const outageStatuses = [
      {
        companyId: "stripe",
        companyName: "Stripe",
        atsType: "greenhouse" as const,
        status: "failed" as const,
        jobCount: 0,
        message: "upstream timeout",
      },
    ];
    installFetch(async () =>
      jsonResponse(
        {
          jobs: [],
          fetchedAt: "2026-06-23T12:00:00.000Z",
          errors: outageErrors,
          companiesRequested: ["stripe"],
          sourceStatuses: outageStatuses,
        },
        503
      )
    );

    const { result } = renderHook(() => useMBAJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toContain("503");
    expect(result.current.fetchErrors).toEqual(outageErrors);
    expect(result.current.sourceStatuses).toEqual(outageStatuses);
  });

  it("reads seen ids persisted before mount (cross-tab sync)", async () => {
    window.localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(["stripe-1"]));
    mockJobsResponse([jobA, jobB]);

    const { result } = renderHook(() => useMBAJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.jobs).toHaveLength(2);

    expect(result.current.seenIds.has("stripe-1")).toBe(true);
    expect(result.current.newJobCount).toBe(1);
  });

  it("sends an email digest and reports success", async () => {
    const fetchSpy = installFetch(async (input) => {
      if (String(input).includes("/api/mba-jobs/email")) {
        return jsonResponse({ ok: true });
      }
      return jsonResponse(buildResponse([jobA]));
    });

    const { result } = renderHook(() => useMBAJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.jobs).toHaveLength(1);

    await act(async () => {
      await result.current.sendEmailDigest("isaac@example.com");
    });

    expect(result.current.emailResult?.ok).toBe(true);
    expect(
      fetchSpy.mock.calls.some((c) =>
        String(c[0]).includes("/api/mba-jobs/email")
      )
    ).toBe(true);

    act(() => {
      result.current.clearEmailResult();
    });
    expect(result.current.emailResult).toBeNull();
  });
});
