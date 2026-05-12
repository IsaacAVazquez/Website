import {
  buildMBAApplicationsCsv,
  buildMBAApplicationsExport,
  createManualMBAApplication,
  createMBAApplicationFromJob,
  mergeMBAApplications,
  parseMBAApplications,
} from "../mba-applications";
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

describe("mba applications storage helpers", () => {
  it("creates durable job snapshots for live roles", () => {
    const application = createMBAApplicationFromJob(
      job,
      "applied",
      new Date("2026-04-15T12:00:00.000Z")
    );

    expect(application.jobId).toBe("stripe-1");
    expect(application.status).toBe("applied");
    expect(application.appliedAt).toBe("2026-04-15T12:00:00.000Z");
    expect(application.jobSnapshot).toEqual(
      expect.objectContaining({
        title: "MBA Product Intern",
        capturedAt: "2026-04-15T12:00:00.000Z",
        source: "live-feed",
      })
    );
  });

  it("sanitizes manual applications and rejects missing required fields", () => {
    expect(
      createManualMBAApplication({
        companyName: "",
        title: "Strategy Manager",
        location: "",
        department: "",
        applyUrl: "https://example.com",
      })
    ).toBeNull();

    const application = createManualMBAApplication({
      companyName: "Acme",
      title: "Strategy Manager",
      location: "",
      department: "",
      applyUrl: "javascript:alert(1)",
      sourceUrl: "https://careers.example.com/role",
      notes: "  Talk to alumni.  ",
      followUpDate: "2026-04-20",
    });

    expect(application).toEqual(
      expect.objectContaining({
        jobId: null,
        sourceUrl: "https://careers.example.com/role",
        notes: "Talk to alumni.",
        followUpDate: "2026-04-20",
      })
    );
    expect(application?.jobSnapshot.applyUrl).toBe("");
  });

  it("recovers from corrupted storage and sanitizes imported exports", () => {
    expect(parseMBAApplications("{not-json")).toEqual([]);

    const application = createMBAApplicationFromJob(job);
    const exported = buildMBAApplicationsExport([application]);
    const parsed = parseMBAApplications(JSON.stringify(exported));

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual(
      expect.objectContaining({
        jobId: "stripe-1",
        status: "saved",
        priority: "medium",
      })
    );
  });

  it("merges duplicate applications by job id and keeps the newest update", () => {
    const older = createMBAApplicationFromJob(
      job,
      "saved",
      new Date("2026-04-14T12:00:00.000Z")
    );
    const newer = {
      ...older,
      status: "interviewing" as const,
      updatedAt: "2026-04-16T12:00:00.000Z",
    };

    const merged = mergeMBAApplications([older], [newer]);

    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe("interviewing");
  });

  it("exports spreadsheet-safe CSV", () => {
    const application = {
      ...createMBAApplicationFromJob(job),
      notes: "Recruiter said, \"follow up\"",
    };

    const csv = buildMBAApplicationsCsv([application]);

    expect(csv).toContain("Status,Priority,Company");
    expect(csv).toContain('"Recruiter said, ""follow up"""');
  });
});

