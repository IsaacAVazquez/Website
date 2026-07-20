import {
  describeAttentionItem,
  diffInDays,
  getApplicationAttentionItems,
  sortApplicationsForColumn,
  summarizeApplicationPipeline,
  toApplicationDateKey,
} from "../mba-application-insights";
import type {
  MBAApplicationPriority,
  MBAApplicationStatus,
  MBATrackedApplication,
} from "@/types/mba-jobs";

const TODAY = "2026-07-20";

let idCounter = 0;

function buildApplication(
  overrides: {
    status?: MBAApplicationStatus;
    priority?: MBAApplicationPriority;
    followUpDate?: string | null;
    deadline?: string | null;
    updatedAt?: string;
    companyName?: string;
    title?: string;
  } = {}
): MBATrackedApplication {
  idCounter += 1;
  const company = overrides.companyName ?? `Company ${idCounter}`;
  return {
    id: `app-${idCounter}`,
    jobId: `job-${idCounter}`,
    jobSnapshot: {
      id: `job-${idCounter}`,
      companyId: "stripe",
      companyName: company,
      title: overrides.title ?? "Product Manager",
      location: "Remote",
      department: "Product",
      applyUrl: "https://example.com/apply",
      postedAt: "2026-07-01T00:00:00.000Z",
      atsType: "greenhouse",
      category: "fintech",
      snippet: null,
      roleType: "full-time",
      roleFamilies: ["product"],
      capturedAt: "2026-07-01T00:00:00.000Z",
      source: "live-feed",
    },
    status: overrides.status ?? "saved",
    priority: overrides.priority ?? "medium",
    notes: "",
    contact: "",
    sourceUrl: "https://example.com/apply",
    followUpDate: overrides.followUpDate ?? null,
    deadline: overrides.deadline ?? null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-07-10T00:00:00.000Z",
    appliedAt: null,
    archivedAt: null,
  };
}

describe("date-key helpers", () => {
  it("formats a date in the local calendar day", () => {
    expect(toApplicationDateKey(new Date(2026, 6, 5))).toBe("2026-07-05");
  });

  it("counts whole days between keys and rejects malformed input", () => {
    expect(diffInDays(TODAY, "2026-07-23")).toBe(3);
    expect(diffInDays(TODAY, "2026-07-17")).toBe(-3);
    expect(diffInDays(TODAY, TODAY)).toBe(0);
    expect(diffInDays(TODAY, "not-a-date")).toBeNull();
  });
});

describe("summarizeApplicationPipeline", () => {
  it("builds funnel counts and stage-conversion rates from active applications", () => {
    const applications = [
      buildApplication({ status: "saved" }),
      buildApplication({ status: "saved" }),
      buildApplication({ status: "applied" }),
      buildApplication({ status: "applied" }),
      buildApplication({ status: "applied" }),
      buildApplication({ status: "interviewing" }),
      buildApplication({ status: "interviewing" }),
      buildApplication({ status: "offer" }),
      buildApplication({ status: "rejected" }),
      buildApplication({ status: "archived" }),
    ];

    const insights = summarizeApplicationPipeline(applications, TODAY);

    expect(insights.total).toBe(9);
    expect(insights.archived).toBe(1);
    expect(insights.funnel).toEqual({
      saved: 2,
      applied: 3,
      interviewing: 2,
      offer: 1,
      rejected: 1,
    });
    expect(insights.submitted).toBe(7);
    expect(insights.responded).toBe(4);
    expect(insights.interviews).toBe(3);
    expect(insights.offers).toBe(1);
    expect(insights.responseRate).toBeCloseTo(4 / 7);
    expect(insights.interviewRate).toBeCloseTo(3 / 7);
    expect(insights.offerRate).toBeCloseTo(1 / 7);
  });

  it("returns null rates when nothing has been submitted yet", () => {
    const insights = summarizeApplicationPipeline(
      [buildApplication({ status: "saved" }), buildApplication({ status: "saved" })],
      TODAY
    );

    expect(insights.submitted).toBe(0);
    expect(insights.responseRate).toBeNull();
    expect(insights.interviewRate).toBeNull();
    expect(insights.offerRate).toBeNull();
  });

  it("buckets follow-ups and only counts deadlines for un-submitted roles", () => {
    const applications = [
      buildApplication({ followUpDate: "2026-07-17" }), // overdue
      buildApplication({ followUpDate: TODAY }), // due today
      buildApplication({ followUpDate: "2026-07-24" }), // upcoming (within window)
      buildApplication({ followUpDate: "2026-09-01" }), // beyond window, ignored
      buildApplication({ status: "saved", deadline: "2026-07-18" }), // passed
      buildApplication({ status: "saved", deadline: TODAY }), // due today
      buildApplication({ status: "saved", deadline: "2026-07-25" }), // upcoming
      buildApplication({ status: "applied", deadline: "2026-07-18" }), // submitted, ignored
    ];

    const insights = summarizeApplicationPipeline(applications, TODAY);

    expect(insights.followUps).toEqual({ overdue: 1, dueToday: 1, upcoming: 1 });
    expect(insights.deadlines).toEqual({ overdue: 1, dueToday: 1, upcoming: 1 });
  });
});

describe("getApplicationAttentionItems", () => {
  it("surfaces overdue and due-today follow-ups but not future ones", () => {
    const overdue = buildApplication({ followUpDate: "2026-07-15", companyName: "Overdue Co" });
    const today = buildApplication({ followUpDate: TODAY, companyName: "Today Co" });
    const future = buildApplication({ followUpDate: "2026-07-25", companyName: "Future Co" });

    const items = getApplicationAttentionItems([future, today, overdue], TODAY);

    expect(items.map((item) => item.application.jobSnapshot.companyName)).toEqual([
      "Overdue Co",
      "Today Co",
    ]);
    expect(items[0].kind).toBe("follow-up-overdue");
    expect(items[0].daysFromToday).toBe(-5);
    expect(items[1].kind).toBe("follow-up-today");
  });

  it("treats deadlines as actionable only while a role is un-submitted", () => {
    const savedSoon = buildApplication({
      status: "saved",
      deadline: "2026-07-22",
      companyName: "Saved Co",
    });
    const appliedPassed = buildApplication({
      status: "applied",
      deadline: "2026-07-01",
      companyName: "Applied Co",
    });

    const items = getApplicationAttentionItems([savedSoon, appliedPassed], TODAY);

    expect(items).toHaveLength(1);
    expect(items[0].application.jobSnapshot.companyName).toBe("Saved Co");
    expect(items[0].kind).toBe("deadline-soon");
  });

  it("surfaces each application once under its most urgent signal", () => {
    const both = buildApplication({
      status: "saved",
      followUpDate: "2026-07-16", // overdue follow-up (most urgent)
      deadline: "2026-07-22", // also a soon deadline
      companyName: "Both Co",
    });

    const items = getApplicationAttentionItems([both], TODAY);

    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("follow-up-overdue");
  });

  it("orders by urgency, then by imminence, then by priority", () => {
    const followUpOverdue = buildApplication({
      followUpDate: "2026-07-19",
      companyName: "FollowUp Co",
    });
    const deadlinePassed = buildApplication({
      status: "saved",
      deadline: "2026-07-10",
      companyName: "Deadline Co",
    });
    const soonLowPriority = buildApplication({
      status: "saved",
      deadline: "2026-07-21",
      priority: "low",
      companyName: "Soon Low",
    });
    const soonHighPriority = buildApplication({
      status: "saved",
      deadline: "2026-07-21",
      priority: "high",
      companyName: "Soon High",
    });

    const items = getApplicationAttentionItems(
      [soonLowPriority, soonHighPriority, deadlinePassed, followUpOverdue],
      TODAY
    );

    expect(items.map((item) => item.kind)).toEqual([
      "follow-up-overdue",
      "deadline-passed",
      "deadline-soon",
      "deadline-soon",
    ]);
    // Same-kind, same-date ties break toward higher priority first.
    expect(items[2].application.jobSnapshot.companyName).toBe("Soon High");
    expect(items[3].application.jobSnapshot.companyName).toBe("Soon Low");
  });

  it("ignores archived applications and malformed dates", () => {
    const archived = buildApplication({ status: "archived", followUpDate: "2026-07-01" });
    const malformed = buildApplication({ followUpDate: "07/20/2026" });

    expect(getApplicationAttentionItems([archived, malformed], TODAY)).toEqual([]);
  });
});

describe("describeAttentionItem", () => {
  it("renders human-readable summaries with singular and plural days", () => {
    const base = buildApplication();
    expect(
      describeAttentionItem({
        application: base,
        kind: "follow-up-overdue",
        dateKey: "2026-07-17",
        daysFromToday: -3,
      })
    ).toBe("Follow-up overdue by 3 days");
    expect(
      describeAttentionItem({
        application: base,
        kind: "deadline-passed",
        dateKey: "2026-07-19",
        daysFromToday: -1,
      })
    ).toBe("Deadline passed 1 day ago");
    expect(
      describeAttentionItem({
        application: base,
        kind: "deadline-soon",
        dateKey: TODAY,
        daysFromToday: 0,
      })
    ).toBe("Deadline today");
    expect(
      describeAttentionItem({
        application: base,
        kind: "follow-up-today",
        dateKey: TODAY,
        daysFromToday: 0,
      })
    ).toBe("Follow-up due today");
  });
});

describe("sortApplicationsForColumn", () => {
  it("orders by priority, then most recently updated, without mutating input", () => {
    const lowRecent = buildApplication({
      priority: "low",
      updatedAt: "2026-07-19T00:00:00.000Z",
      companyName: "Low Recent",
    });
    const highOld = buildApplication({
      priority: "high",
      updatedAt: "2026-07-02T00:00:00.000Z",
      companyName: "High Old",
    });
    const mediumRecent = buildApplication({
      priority: "medium",
      updatedAt: "2026-07-18T00:00:00.000Z",
      companyName: "Medium Recent",
    });
    const highRecent = buildApplication({
      priority: "high",
      updatedAt: "2026-07-15T00:00:00.000Z",
      companyName: "High Recent",
    });

    const input = [lowRecent, highOld, mediumRecent, highRecent];
    const sorted = sortApplicationsForColumn(input);

    expect(sorted.map((item) => item.jobSnapshot.companyName)).toEqual([
      "High Recent",
      "High Old",
      "Medium Recent",
      "Low Recent",
    ]);
    // Original array order is preserved.
    expect(input[0]).toBe(lowRecent);
  });
});
