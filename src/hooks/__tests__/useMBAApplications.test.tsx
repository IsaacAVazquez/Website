import { act, renderHook, waitFor } from "@testing-library/react";
import {
  MBA_APPLICATIONS_STORAGE_KEY,
  buildMBAApplicationsExport,
  createMBAApplicationFromJob,
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
        new StorageEvent("storage", { key: MBA_APPLICATIONS_STORAGE_KEY })
      );
    });

    await waitFor(() => expect(result.current.applications).toHaveLength(1));
  });
});

