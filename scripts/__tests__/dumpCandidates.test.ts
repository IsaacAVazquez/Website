/** @jest-environment node */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildMBAApplicationsExport,
  buildMBAJobCandidatesFile,
  createMBAApplicationFromJob,
  parseMBAJobCandidates,
} from "../../src/lib/mba-applications";
import type { MBAJob, MBAJobCandidate } from "../../src/types/mba-jobs";

let resolveFeed: (value: unknown) => void;
jest.mock("../../src/lib/mbaJobsServer", () => ({
  getDefaultMBACompanyIds: () => [],
  getMBAJobsData: jest.fn(() => new Promise((resolve) => { resolveFeed = resolve; })),
}));

const job: MBAJob = {
  id: "example-role", companyId: "example", companyName: "Example", title: "Product Manager",
  location: "Remote", department: "Product", applyUrl: "https://example.com/role",
  postedAt: "2026-10-14T00:00:00Z", atsType: "greenhouse", category: "fintech",
  snippet: null, roleType: "full-time", roleFamilies: ["product"],
};
const application = createMBAApplicationFromJob(job);
const candidate: MBAJobCandidate = {
  id: job.id, job: application.jobSnapshot, triage: "sourced", fit: null,
  sourcedAt: application.createdAt, updatedAt: application.updatedAt,
};

describe("candidate sourcing during dashboard edits", () => {
  let directory: string;
  let target: string;

  beforeEach(() => {
    jest.resetModules();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "job-source-test-"));
    const folder = path.join(directory, "private/job-search");
    fs.mkdirSync(folder, { recursive: true });
    target = path.join(folder, "candidates.json");
    fs.writeFileSync(target, JSON.stringify(buildMBAJobCandidatesFile([candidate])));
    jest.spyOn(process, "cwd").mockReturnValue(directory);
    jest.replaceProperty(process, "argv", ["node", "dumpCandidates.ts"]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it.each(["dismiss", "remove", "add", "promote"])("preserves a concurrent %s", async (edit) => {
    let done: () => void;
    const completed = new Promise<void>((resolve) => { done = resolve; });
    jest.spyOn(console, "log").mockImplementation(() => done());
    require("../jobSearch/dumpCandidates");

    const newer = { ...candidate, triage: "dismissed" as const, updatedAt: "2099-10-14T01:00:00Z" };
    const other = { ...candidate, id: "other", job: { ...candidate.job, id: "other", applyUrl: "https://example.com/other" } };
    const next = edit === "dismiss" ? [newer] : edit === "add" ? [candidate, other] : [];
    fs.writeFileSync(target, JSON.stringify(buildMBAJobCandidatesFile(next)));
    if (edit === "promote") {
      fs.writeFileSync(path.join(path.dirname(target), "pipeline.json"), JSON.stringify(buildMBAApplicationsExport([application])));
    }

    resolveFeed!({ isError: false, body: { jobs: edit === "promote" ? [job] : [], errors: [] } });
    await completed;
    expect(parseMBAJobCandidates(fs.readFileSync(target, "utf8"))).toEqual(
      parseMBAJobCandidates(JSON.stringify(buildMBAJobCandidatesFile(next)))
    );
  });
});
