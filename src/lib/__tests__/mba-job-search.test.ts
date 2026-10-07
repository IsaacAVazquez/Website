import {
  cleanRelativePath,
  createMBAApplicationFromJob,
  mergeMBAJobCandidates,
  parseMBAApplications,
  parseMBAJobCandidates,
  parseMBAJobSearchTargets,
  sanitizeFit,
  sanitizeInterviewRounds,
  selectNewCandidates,
} from "../mba-applications";
import type { MBAJob, MBAJobCandidate } from "@/types/mba-jobs";

const now = new Date("2026-10-07T12:00:00.000Z");

function makeJob(overrides: Partial<MBAJob> = {}): MBAJob {
  return {
    id: "acme-1",
    companyId: "acme",
    companyName: "Acme",
    title: "Product Manager, Payments",
    location: "San Francisco, CA",
    department: "Product",
    applyUrl: "https://example.com/apply/1",
    postedAt: "2026-10-01T16:00:00.000Z",
    atsType: "greenhouse",
    category: "fintech",
    snippet: null,
    roleType: "full-time",
    roleFamilies: ["product"],
    ...overrides,
  };
}

describe("job-search validators", () => {
  it("clamps fit scores and drops non-numeric ones", () => {
    expect(sanitizeFit({ score: 140, rationale: "x" }, now.toISOString())?.score).toBe(100);
    expect(sanitizeFit({ score: -3 }, now.toISOString())?.score).toBe(0);
    expect(sanitizeFit({ score: 71.6 }, now.toISOString())?.score).toBe(72);
    expect(sanitizeFit({ score: "80" }, now.toISOString())).toBeNull();
    expect(sanitizeFit(null, now.toISOString())).toBeNull();
  });

  it("rejects parent segments and absolute paths in materials dirs", () => {
    expect(cleanRelativePath("private/job-search/roles/acme-pm/")).toBe(
      "private/job-search/roles/acme-pm"
    );
    expect(cleanRelativePath("../etc/passwd")).toBeNull();
    expect(cleanRelativePath("private/../x")).toBeNull();
    expect(cleanRelativePath("/private/job-search")).toBeNull();
    expect(cleanRelativePath("private/job search/roles")).toBe("private/job search/roles");
  });

  it("drops rounds without a label or a valid date and caps the list", () => {
    const rounds = sanitizeInterviewRounds([
      { label: "Recruiter screen", date: "2026-10-09", outcome: "done" },
      { label: "", date: "2026-10-10" },
      { label: "Onsite", date: "not a date", outcome: "bogus" },
      ...Array.from({ length: 15 }, (_, index) => ({ label: `Round ${index}` })),
    ]);
    expect(rounds).toHaveLength(12);
    expect(rounds[0]).toEqual({
      label: "Recruiter screen",
      date: "2026-10-09",
      outcome: "done",
      notes: "",
    });
    expect(rounds[1]).toMatchObject({ label: "Onsite", date: null, outcome: "scheduled" });
  });

  it("round-trips the new application fields through the parser", () => {
    const application = {
      ...createMBAApplicationFromJob(makeJob(), "saved", now),
      fit: { score: 88, rationale: "Strong family match.", scoredAt: now.toISOString() },
      appliedVia: "greenhouse",
      materialsDir: "private/job-search/roles/acme-pm",
      interviewRounds: [{ label: "Screen", date: "2026-10-12", outcome: "scheduled", notes: "" }],
    };
    const [parsed] = parseMBAApplications(JSON.stringify({ applications: [application] }));
    expect(parsed.fit?.score).toBe(88);
    expect(parsed.appliedVia).toBe("greenhouse");
    expect(parsed.materialsDir).toBe("private/job-search/roles/acme-pm");
    expect(parsed.interviewRounds).toHaveLength(1);
  });
});

describe("candidates", () => {
  it("parses the wrapper, defaults triage, and keeps the newer record on merge", () => {
    const base = {
      id: "acme-1",
      job: { ...makeJob(), capturedAt: now.toISOString(), source: "live-feed" },
      sourcedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const parsed = parseMBAJobCandidates(
      JSON.stringify({ schema: "mba-candidates", version: 1, candidates: [base, { bad: true }] })
    );
    expect(parsed).toHaveLength(1);
    expect(parsed[0].triage).toBe("sourced");
    expect(parsed[0].fit).toBeNull();

    const dismissed: MBAJobCandidate = {
      ...parsed[0],
      triage: "dismissed",
      updatedAt: "2026-10-08T12:00:00.000Z",
    };
    const resourced: MBAJobCandidate = { ...parsed[0], updatedAt: now.toISOString() };
    expect(mergeMBAJobCandidates([dismissed], [resourced])[0].triage).toBe("dismissed");
    expect(mergeMBAJobCandidates([resourced], [dismissed])[0].triage).toBe("dismissed");
  });

  it("sorts merged candidates by fit score, then by sourcing time", () => {
    const low: MBAJobCandidate = {
      id: "a",
      job: { ...makeJob({ id: "a", applyUrl: "https://example.com/a" }), capturedAt: "", source: "live-feed" },
      triage: "reviewed",
      fit: { score: 40, rationale: "", scoredAt: now.toISOString() },
      sourcedAt: "2026-10-07T00:00:00.000Z",
      updatedAt: now.toISOString(),
    };
    const high: MBAJobCandidate = { ...low, id: "b", job: { ...low.job, id: "b", applyUrl: "https://example.com/b" }, fit: { ...low.fit!, score: 90 } };
    expect(mergeMBAJobCandidates([low], [high]).map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("selects only full-time, in-target, unseen roles", () => {
    const targets = parseMBAJobSearchTargets(
      JSON.stringify({
        roleFamilies: ["product", "chief-of-staff"],
        locations: ["United States", "US", "Remote", "CA"],
        excludeTitleTerms: ["Director", "chief product officer"],
        companiesAvoid: ["avoidco"],
        startWindow: "2027-summer",
      })
    );
    const tracked = createMBAApplicationFromJob(makeJob({ id: "tracked", applyUrl: "https://example.com/tracked" }), "applied", now);
    const existing: MBAJobCandidate = {
      id: "seen",
      job: { ...makeJob({ id: "seen", applyUrl: "https://example.com/seen" }), capturedAt: "", source: "live-feed" },
      triage: "dismissed",
      fit: null,
      sourcedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const jobs = [
      makeJob(),
      makeJob({ id: "intern", applyUrl: "https://example.com/intern", roleType: "internship" }),
      makeJob({ id: "director", applyUrl: "https://example.com/dir", title: "Director of Product" }),
      makeJob({ id: "cos", applyUrl: "https://example.com/cos", title: "Chief of Staff", roleFamilies: ["chief-of-staff"] }),
      makeJob({ id: "chief", applyUrl: "https://example.com/chief", title: "Chief Product Officer" }),
      makeJob({ id: "abroad", applyUrl: "https://example.com/abroad", location: "London, UK" }),
      makeJob({ id: "avoid", applyUrl: "https://example.com/avoid", companyId: "avoidco" }),
      makeJob({ id: "growth", applyUrl: "https://example.com/growth", roleFamilies: ["growth"] }),
      makeJob({ id: "tracked", applyUrl: "https://example.com/tracked/" }),
      makeJob({ id: "seen", applyUrl: "https://example.com/seen" }),
    ];

    const fresh = selectNewCandidates(jobs, [existing], [tracked], targets, now);
    expect(fresh.map((candidate) => candidate.id).sort()).toEqual(["acme-1", "cos"]);
    expect(fresh[0]).toMatchObject({ triage: "sourced", fit: null, sourcedAt: now.toISOString() });
  });

  it("falls back to permissive defaults for a missing or broken targets file", () => {
    expect(parseMBAJobSearchTargets(null).locations).toEqual([]);
    expect(parseMBAJobSearchTargets("{nope").roleFamilies.length).toBeGreaterThan(5);
  });
});
