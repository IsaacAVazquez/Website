import type { MBAJob, MBATrackedApplication } from "@/types/mba-jobs";
import {
  EMPTY_APPLICATION_FORM,
  getApplicationFormState,
} from "../application-form";

function buildApplication(
  overrides: Partial<MBATrackedApplication> = {}
): MBATrackedApplication {
  const job: MBAJob = {
    id: "stripe-1",
    companyId: "stripe",
    companyName: "Stripe",
    title: "MBA Product Intern",
    location: "San Francisco, CA",
    department: "Product",
    applyUrl: "https://example.com/stripe/apply",
    postedAt: "2026-04-14T16:00:00.000Z",
    atsType: "greenhouse",
    category: "fintech",
    snippet: "Summer associate role for product-minded MBA students.",
    roleType: "internship",
    roleFamilies: ["product"],
  };
  return {
    id: "app-1",
    jobId: job.id,
    jobSnapshot: {
      ...job,
      capturedAt: "2026-04-14T18:30:00.000Z",
      source: "live-feed",
    },
    status: "saved",
    priority: "medium",
    notes: "",
    contact: "",
    sourceUrl: job.applyUrl,
    followUpDate: null,
    deadline: null,
    createdAt: "2026-04-14T18:30:00.000Z",
    updatedAt: "2026-04-14T18:30:00.000Z",
    appliedAt: null,
    archivedAt: null,
    ...overrides,
  };
}

describe("getApplicationFormState", () => {
  it("returns the shared empty form when there is no application", () => {
    expect(getApplicationFormState(null)).toBe(EMPTY_APPLICATION_FORM);
  });

  it("maps snapshot and top-level application fields onto the form", () => {
    const form = getApplicationFormState(
      buildApplication({
        status: "interviewing",
        priority: "high",
        notes: "Follow up with recruiter.",
        contact: "recruiter@stripe.com",
        sourceUrl: "https://jobs.example.com/source",
        followUpDate: "2026-04-20",
        deadline: "2026-05-01",
      })
    );

    expect(form).toEqual({
      companyName: "Stripe",
      title: "MBA Product Intern",
      location: "San Francisco, CA",
      department: "Product",
      applyUrl: "https://example.com/stripe/apply",
      sourceUrl: "https://jobs.example.com/source",
      status: "interviewing",
      priority: "high",
      contact: "recruiter@stripe.com",
      followUpDate: "2026-04-20",
      deadline: "2026-05-01",
      notes: "Follow up with recruiter.",
    });
  });

  it("pulls the company, role, and status straight from the snapshot, not the empty defaults", () => {
    const form = getApplicationFormState(
      buildApplication({
        jobSnapshot: {
          ...buildApplication().jobSnapshot,
          companyName: "Brex",
          title: "Strategic Finance Associate",
        },
        status: "offer",
      })
    );

    expect(form.companyName).toBe("Brex");
    expect(form.title).toBe("Strategic Finance Associate");
    expect(form.status).toBe("offer");
  });

  it("falls back to empty strings when followUpDate and deadline are null", () => {
    const form = getApplicationFormState(
      buildApplication({ followUpDate: null, deadline: null })
    );

    expect(form.followUpDate).toBe("");
    expect(form.deadline).toBe("");
  });
});
