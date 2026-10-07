import { act, renderHook, waitFor } from "@testing-library/react";
import {
  MBA_APPLICATIONS_STORAGE_KEY,
  buildMBAApplicationsExport,
  createMBAApplicationFromJob,
  loadMBAApplications,
} from "@/lib/mba-applications";
import { useMBAApplications } from "../useMBAApplications";
import type { MBAJob } from "@/types/mba-jobs";

const job: MBAJob = {
  id: "stripe-1",
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
};

describe("useMBAApplications", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("tracks jobs, persists them, and updates status", () => {
    const { result } = renderHook(() => useMBAApplications());

    act(() => {
      result.current.trackJob(job);
    });

    expect(result.current.applications).toHaveLength(1);
    expect(result.current.applications[0].status).toBe("saved");
    expect(window.localStorage.getItem(MBA_APPLICATIONS_STORAGE_KEY)).toContain(
      "MBA Product Intern"
    );

    act(() => {
      result.current.updateStatus(result.current.applications[0].id, "applied");
    });

    expect(result.current.applications[0].status).toBe("applied");
    expect(result.current.applications[0].appliedAt).not.toBeNull();
  });

  it("imports backup data and merges it with existing applications", () => {
    const { result } = renderHook(() => useMBAApplications());
    const imported = createMBAApplicationFromJob(
      {
        ...job,
        id: "brex-1",
        companyId: "brex",
        companyName: "Brex",
      },
      "interviewing"
    );

    act(() => {
      result.current.trackJob(job);
      result.current.importApplications(JSON.stringify(buildMBAApplicationsExport([imported])));
    });

    expect(result.current.applications).toHaveLength(2);
    expect(
      result.current.applications.some((application) => application.status === "interviewing")
    ).toBe(true);
  });

  it("responds to cross-tab storage updates", async () => {
    const { result } = renderHook(() => useMBAApplications());
    const imported = createMBAApplicationFromJob(job);

    act(() => {
      window.localStorage.setItem(
        MBA_APPLICATIONS_STORAGE_KEY,
        JSON.stringify([imported])
      );
      window.dispatchEvent(
        new StorageEvent("storage", { key: MBA_APPLICATIONS_STORAGE_KEY, newValue: JSON.stringify([imported]) })
      );
    });

    await waitFor(() => expect(result.current.applications).toHaveLength(1));
  });

  const manualDraft = {
    companyName: "Ramp",
    title: "Strategy Intern",
    location: "New York, NY",
    department: "Strategy",
    applyUrl: "https://example.com/ramp",
    notes: "Referral from alum",
  };

  it("matches a job by id or by its normalized apply URL", () => {
    const { result } = renderHook(() => useMBAApplications());

    act(() => {
      result.current.trackJob(job);
      result.current.addManualApplication({ ...manualDraft, applyUrl: "https://example.com/ramp/role" });
    });

    expect(result.current.getApplicationForJob(job)?.jobId).toBe(job.id);
    const byUrl = result.current.getApplicationForJob({
      ...job,
      id: "ramp-live",
      applyUrl: "  HTTPS://EXAMPLE.COM/ramp/role/  ",
    });
    expect(byUrl?.jobSnapshot.companyName).toBe("Ramp");
    expect(result.current.getApplicationForJob({ ...job, id: "other", applyUrl: "" })).toBeUndefined();

    // Only feed-backed applications are indexed by job id.
    expect([...result.current.applicationsByJobId.keys()]).toEqual([job.id]);
  });

  it("keeps an advanced status when the same job is saved again but refreshes its snapshot", () => {
    const { result } = renderHook(() => useMBAApplications());

    act(() => {
      result.current.trackJob(job, "applied");
    });
    const appliedAt = result.current.applications[0].appliedAt;

    let tracked: ReturnType<typeof result.current.trackJob> = null;
    act(() => {
      tracked = result.current.trackJob({ ...job, title: "MBA Product Intern (Payments)" });
    });

    expect(result.current.applications).toHaveLength(1);
    expect(result.current.applications[0].status).toBe("applied");
    expect(result.current.applications[0].appliedAt).toBe(appliedAt);
    expect(result.current.applications[0].jobSnapshot.title).toBe("MBA Product Intern (Payments)");
    expect(result.current.applications[0].jobSnapshot.source).toBe("live-feed");
    expect(tracked).toMatchObject({ status: "applied" });
  });

  it("moves a tracked job to a new status and links a manual entry to the live job", () => {
    const { result } = renderHook(() => useMBAApplications());

    act(() => {
      result.current.addManualApplication({ ...manualDraft, applyUrl: job.applyUrl });
    });
    expect(result.current.applications[0].jobId).toBeNull();

    act(() => {
      result.current.trackJob(job, "interviewing");
    });

    expect(result.current.applications).toHaveLength(1);
    expect(result.current.applications[0]).toMatchObject({
      jobId: job.id,
      status: "interviewing",
      notes: "Referral from alum",
    });
    expect(result.current.applications[0].jobSnapshot.companyName).toBe("Stripe");
  });

  it("adds valid manual applications and ignores drafts without a company or title", () => {
    const { result } = renderHook(() => useMBAApplications());

    let created: ReturnType<typeof result.current.addManualApplication> = null;
    let rejected: ReturnType<typeof result.current.addManualApplication> = null;
    act(() => {
      created = result.current.addManualApplication(manualDraft);
      rejected = result.current.addManualApplication({ ...manualDraft, companyName: "   " });
    });

    expect(created).toMatchObject({ jobId: null, status: "saved" });
    expect(rejected).toBeNull();
    expect(result.current.applications).toHaveLength(1);
  });

  it("updates fields, clears nullable dates, and merges snapshot edits on one application only", () => {
    const { result } = renderHook(() => useMBAApplications());

    act(() => {
      result.current.trackJob(job);
      result.current.addManualApplication({ ...manualDraft, followUpDate: "2026-11-01" });
    });
    const manual = result.current.applications.find((application) => application.jobId === null)!;
    const tracked = result.current.applications.find((application) => application.jobId === job.id)!;

    act(() => {
      result.current.updateApplication(manual.id, {
        notes: "Coffee chat booked",
        contact: "jane@example.com",
        sourceUrl: "https://example.com/source",
        followUpDate: null,
        deadline: "2026-12-01",
        jobSnapshot: { location: "Remote" },
      });
      result.current.updatePriority(manual.id, "high");
    });

    const updated = result.current.applications.find((application) => application.id === manual.id)!;
    expect(updated).toMatchObject({
      notes: "Coffee chat booked",
      contact: "jane@example.com",
      sourceUrl: "https://example.com/source",
      followUpDate: null,
      deadline: "2026-12-01",
      priority: "high",
      status: "saved",
    });
    expect(updated.jobSnapshot.location).toBe("Remote");
    expect(updated.jobSnapshot.title).toBe("Strategy Intern");

    const untouched = result.current.applications.find((application) => application.id === tracked.id)!;
    expect(untouched).toEqual(tracked);
  });

  it("archives out of the active list and removes applications entirely", () => {
    const { result } = renderHook(() => useMBAApplications());

    act(() => {
      result.current.trackJob(job);
      result.current.addManualApplication(manualDraft);
    });
    const manualId = result.current.applications.find((application) => application.jobId === null)!.id;
    const trackedId = result.current.applications.find((application) => application.jobId === job.id)!.id;

    act(() => {
      result.current.archiveApplication(manualId);
    });
    expect(result.current.applications).toHaveLength(2);
    expect(result.current.activeApplications.map((application) => application.id)).toEqual([trackedId]);
    expect(
      result.current.applications.find((application) => application.id === manualId)?.archivedAt
    ).not.toBeNull();

    act(() => {
      result.current.removeApplication(trackedId);
    });
    expect(result.current.applications.map((application) => application.id)).toEqual([manualId]);
  });

  it("reports nothing imported for an empty or unreadable backup", () => {
    const { result } = renderHook(() => useMBAApplications());
    act(() => {
      result.current.trackJob(job);
    });

    let summary: ReturnType<typeof result.current.importApplications> | null = null;
    act(() => {
      summary = result.current.importApplications("not json");
    });
    expect(summary).toEqual({ imported: 0, total: 1 });

    act(() => {
      summary = result.current.importApplications(
        JSON.stringify(buildMBAApplicationsExport([createMBAApplicationFromJob({ ...job, id: "brex-2", applyUrl: "https://example.com/brex" })]))
      );
    });
    expect(summary).toEqual({ imported: 1, total: 2 });
  });

  it("exports JSON and CSV built from the stored applications", () => {
    const { result } = renderHook(() => useMBAApplications());
    act(() => {
      result.current.trackJob(job);
    });

    const exported = JSON.parse(result.current.exportJson());
    expect(exported.schema).toBe("mba-applications-export");
    expect(exported.applications).toHaveLength(1);

    const csvLines = result.current.exportCsv().split("\n");
    expect(csvLines[0].startsWith("Status,Priority,Company,Title")).toBe(true);
    expect(csvLines[1]).toContain("Stripe");
  });

  it("searches active applications by any tracked text and accepts a custom source", () => {
    const { result } = renderHook(() => useMBAApplications());
    act(() => {
      result.current.trackJob(job);
      result.current.addManualApplication(manualDraft);
    });

    expect(result.current.searchApplications("   ")).toHaveLength(2);
    expect(
      result.current.searchApplications("REFERRAL").map((application) => application.jobSnapshot.companyName)
    ).toEqual(["Ramp"]);
    expect(result.current.searchApplications("stripe", [])).toEqual([]);
  });

  it("reports no private sync outside development", () => {
    const { result } = renderHook(() => useMBAApplications());
    expect(result.current.privateSync).toBeNull();
  });
});

describe("useMBAApplications private sync in development", () => {
  const originalFetch = global.fetch;
  const fileRecord = createMBAApplicationFromJob(
    { ...job, id: "brex-9", companyId: "brex", companyName: "Brex", applyUrl: "https://example.com/brex" },
    "applied",
    new Date("2026-10-06T09:00:00.000Z")
  );
  let restoreEnv: { restore: () => void };

  function jsonResponse(status: number, body: unknown) {
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  }

  beforeEach(() => {
    window.localStorage.clear();
    restoreEnv = jest.replaceProperty(process.env, "NODE_ENV", "development");
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "PUT") {
        const sent = JSON.parse(String(init.body)) as { items: unknown[] };
        return Promise.resolve(jsonResponse(200, { revision: "200", items: sent.items }));
      }
      return Promise.resolve(jsonResponse(200, { revision: "100", items: [fileRecord] }));
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    restoreEnv.restore();
    global.fetch = originalFetch;
  });

  it("pulls the private file on mount and merges it into localStorage", async () => {
    const { result } = renderHook(() => useMBAApplications());

    await waitFor(() => expect(result.current.applications).toHaveLength(1));
    expect(result.current.applications[0]).toMatchObject({ id: fileRecord.id, status: "applied" });
    expect(loadMBAApplications().map((application) => application.id)).toEqual([fileRecord.id]);
    expect(result.current.privateSync).toEqual({ lastSyncedAt: expect.any(String), error: null });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/job-search?file=pipeline");
  });

  it("pushes a local change with the pulled revision", async () => {
    const { result } = renderHook(() => useMBAApplications());
    await waitFor(() => expect(result.current.applications).toHaveLength(1));

    act(() => {
      result.current.trackJob(job);
    });
    expect(result.current.applications).toHaveLength(2);

    await waitFor(
      () =>
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/job-search?file=pipeline",
          expect.objectContaining({ method: "PUT" })
        ),
      { timeout: 2_000 }
    );
    const putCall = (global.fetch as jest.Mock).mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === "PUT"
    )!;
    const body = JSON.parse(String((putCall[1] as RequestInit).body));
    expect(body.revision).toBe("100");
    expect(body.items.map((item: { id: string }) => item.id).sort()).toEqual(
      [fileRecord.id, result.current.applications.find((a) => a.jobId === job.id)!.id].sort()
    );
  });

  it("keeps a browser delete deleted when the push hits a 409", async () => {
    const other = createMBAApplicationFromJob(
      { ...job, id: "ramp-1", companyId: "ramp", companyName: "Ramp", applyUrl: "https://example.com/ramp" },
      "saved",
      new Date("2026-10-06T10:00:00.000Z")
    );
    let puts = 0;
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "PUT") {
        puts += 1;
        const sent = JSON.parse(String(init.body)) as { items: unknown[] };
        // The skill touched the file since the pull, so the first push is stale and the
        // server answers with its copy, which still holds the record deleted here.
        if (puts === 1) return Promise.resolve(jsonResponse(409, { revision: "150", items: [fileRecord, other] }));
        return Promise.resolve(jsonResponse(200, { revision: "200", items: sent.items }));
      }
      return Promise.resolve(jsonResponse(200, { revision: "100", items: [fileRecord, other] }));
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useMBAApplications());
    await waitFor(() => expect(result.current.applications).toHaveLength(2));

    act(() => {
      result.current.removeApplication(fileRecord.id);
    });

    await waitFor(() => expect(puts).toBe(2), { timeout: 2_000 });
    const retry = (global.fetch as jest.Mock).mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "PUT"
    )[1]!;
    const body = JSON.parse(String((retry[1] as RequestInit).body));
    expect(body.revision).toBe("150");
    expect(body.items.map((item: { id: string }) => item.id)).toEqual([other.id]);
    expect(loadMBAApplications().map((application) => application.id)).toEqual([other.id]);
    expect(result.current.applications.map((application) => application.id)).toEqual([other.id]);
  });
});
