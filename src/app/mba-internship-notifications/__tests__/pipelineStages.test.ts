import { summarizeApplicationPipeline } from "@/lib/mba-application-insights";
import type { MBATrackedApplication } from "@/types/mba-jobs";
import { pipelineStages } from "../pipelineStages";

const TODAY = "2026-09-26";

function buildApplication(
  overrides: Partial<MBATrackedApplication> = {}
): MBATrackedApplication {
  return {
    id: "app-1",
    jobId: "job-1",
    jobSnapshot: {
      id: "job-1",
      companyId: "acme",
      companyName: "Acme",
      title: "MBA Intern",
      location: "Remote",
      department: "Strategy",
      applyUrl: "https://example.com",
      postedAt: TODAY,
      atsType: "greenhouse",
      category: "startup",
      roleType: "internship",
      roleFamilies: [],
      capturedAt: TODAY,
      source: "live-feed",
    },
    status: "saved",
    priority: "medium",
    notes: "",
    contact: "",
    sourceUrl: null,
    followUpDate: null,
    deadline: null,
    createdAt: TODAY,
    updatedAt: TODAY,
    appliedAt: null,
    archivedAt: null,
    ...overrides,
  } as MBATrackedApplication;
}

describe("pipelineStages", () => {
  it("returns four zeroed stages with dashes when nothing is tracked", () => {
    const insights = summarizeApplicationPipeline([], TODAY);
    const stages = pipelineStages(insights);

    expect(stages.map((stage) => stage.key)).toEqual([
      "applied",
      "responded",
      "interview",
      "offer",
    ]);
    expect(stages.map((stage) => stage.count)).toEqual([0, 0, 0, 0]);
    expect(stages.every((stage) => stage.rateFromPrevious === null)).toBe(true);
  });

  it("computes counts and stage-to-stage rates for a normal funnel", () => {
    // saved(1) applied(2) interviewing(1) offer(1) -> submitted 4, responded 2, interviews 2, offers 1
    const applications = [
      buildApplication({ id: "a1", status: "saved" }),
      buildApplication({ id: "a2", status: "applied" }),
      buildApplication({ id: "a3", status: "applied" }),
      buildApplication({ id: "a4", status: "interviewing" }),
      buildApplication({ id: "a5", status: "offer" }),
    ];
    const insights = summarizeApplicationPipeline(applications, TODAY);
    const stages = pipelineStages(insights);

    const [applied, responded, interview, offer] = stages;
    expect(applied.count).toBe(4);
    expect(applied.rateFromPrevious).toBeNull();

    expect(responded.count).toBe(2);
    expect(responded.rateFromPrevious).toBeCloseTo(0.5);
    expect(responded.rateLabel).toBe("Response rate");

    expect(interview.count).toBe(2);
    expect(interview.rateFromPrevious).toBeCloseTo(1); // 2 of 2 responded reached interview

    expect(offer.count).toBe(1);
    expect(offer.rateFromPrevious).toBeCloseTo(0.5); // 1 of 2 interviews became an offer
  });

  it("prints a dash instead of a rate when the stage before is empty", () => {
    // Everyone applied, nobody has heard back yet.
    const applications = [
      buildApplication({ id: "a1", status: "applied" }),
      buildApplication({ id: "a2", status: "applied" }),
      buildApplication({ id: "a3", status: "applied" }),
    ];
    const insights = summarizeApplicationPipeline(applications, TODAY);
    const stages = pipelineStages(insights);
    const [applied, responded, interview, offer] = stages;

    expect(applied.count).toBe(3);
    expect(responded.count).toBe(0);
    expect(responded.rateFromPrevious).toBeCloseTo(0); // a real zero: 0 of 3 responded
    expect(interview.count).toBe(0);
    expect(interview.rateFromPrevious).toBeNull(); // 0 responded, so no rate to compute
    expect(offer.count).toBe(0);
    expect(offer.rateFromPrevious).toBeNull();
  });

  it("does not let one outlier-sized funnel break the rate math", () => {
    const applications = Array.from({ length: 500 }, (_, i) =>
      buildApplication({ id: `a${i}`, status: i < 400 ? "offer" : "applied" })
    );
    const insights = summarizeApplicationPipeline(applications, TODAY);
    const stages = pipelineStages(insights);
    const [applied, responded, interview, offer] = stages;

    expect(applied.count).toBe(500);
    expect(responded.count).toBe(400);
    expect(interview.count).toBe(400);
    expect(offer.count).toBe(400);
    expect(responded.rateFromPrevious).toBeCloseTo(400 / 500);
    expect(interview.rateFromPrevious).toBeCloseTo(1);
    expect(offer.rateFromPrevious).toBeCloseTo(1);
  });
});
