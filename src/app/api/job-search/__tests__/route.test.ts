/**
 * @jest-environment node
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { createMBAApplicationFromJob } from "@/lib/mba-applications";
import type { MBAJob, MBAJobCandidate } from "@/types/mba-jobs";
import { GET, PUT } from "../route";

const job: MBAJob = {
  id: "stripe-1",
  companyId: "stripe",
  companyName: "Stripe",
  title: "Product Manager, Payments",
  location: "San Francisco, CA",
  department: "Product",
  applyUrl: "https://example.com/apply",
  postedAt: "2026-10-01T16:00:00.000Z",
  atsType: "greenhouse",
  category: "fintech",
  snippet: "Own the payments roadmap.",
  roleType: "full-time",
  roleFamilies: ["product"],
};

const application = createMBAApplicationFromJob(job, "saved", new Date("2026-10-07T12:00:00.000Z"));

function get(file: string) {
  return GET(new NextRequest(`https://isaacvazquez.com/api/job-search?file=${file}`));
}

function put(file: string, body: unknown) {
  return PUT(
    new NextRequest(`https://isaacvazquez.com/api/job-search?file=${file}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    })
  );
}

describe("/api/job-search outside development", () => {
  it.each(["test", "production"] as const)("returns 404 for GET and PUT when NODE_ENV is %s", async (env) => {
    const restore = jest.replaceProperty(process.env, "NODE_ENV", env);
    try {
      const getResponse = await get("pipeline");
      expect(getResponse.status).toBe(404);
      expect(getResponse.headers.get("Cache-Control")).toBe("no-store");
      await expect(getResponse.json()).resolves.toEqual({ error: "Not found." });

      const putResponse = await put("pipeline", { revision: "0", items: [] });
      expect(putResponse.status).toBe(404);
    } finally {
      restore.restore();
    }
  });
});

describe("/api/job-search in development", () => {
  let tmpDir: string;
  let restoreEnv: { restore: () => void };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "job-search-"));
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
    restoreEnv = jest.replaceProperty(process.env, "NODE_ENV", "development");
  });

  afterEach(() => {
    restoreEnv.restore();
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects an unknown file", async () => {
    expect((await get("targets")).status).toBe(400);
    expect((await put("targets", { revision: "0", items: [] })).status).toBe(400);
  });

  it("returns revision 0 and no items when the file is missing", async () => {
    const response = await get("pipeline");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ revision: "0", items: [] });
  });

  it("writes the pipeline wrapper on PUT and reports the new revision", async () => {
    const response = await put("pipeline", { revision: "0", items: [application] });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.revision).not.toBe("0");
    expect(body.items).toHaveLength(1);
    expect(body.items[0].jobSnapshot.companyName).toBe("Stripe");

    const target = path.join(tmpDir, "private", "job-search", "pipeline.json");
    const written = JSON.parse(fs.readFileSync(target, "utf8"));
    expect(written.schema).toBe("mba-applications-export");
    expect(written.applications).toHaveLength(1);
    expect(fs.existsSync(`${target}.tmp`)).toBe(false);
    expect(fs.readFileSync(target, "utf8").endsWith("}\n")).toBe(true);

    const readBack = await (await get("pipeline")).json();
    expect(readBack.revision).toBe(body.revision);
    expect(readBack.items).toHaveLength(1);
  });

  it("answers 409 with the current file when the revision is stale", async () => {
    const first = await (await put("pipeline", { revision: "0", items: [application] })).json();

    const stale = await put("pipeline", { revision: "0", items: [] });
    expect(stale.status).toBe(409);
    const body = await stale.json();
    expect(body.revision).toBe(first.revision);
    expect(body.items).toHaveLength(1);

    const fresh = await put("pipeline", { revision: first.revision, items: [] });
    expect(fresh.status).toBe(200);
    await expect((await get("pipeline")).json()).resolves.toMatchObject({ items: [] });
  });

  it("rejects a body without a string revision", async () => {
    expect((await put("pipeline", { items: [] })).status).toBe(400);
  });

  it("serves the candidates file through the same contract", async () => {
    await expect((await get("candidates")).json()).resolves.toEqual({ revision: "0", items: [] });

    const candidate: MBAJobCandidate = {
      id: job.id,
      job: application.jobSnapshot,
      triage: "sourced",
      fit: { score: 82, rationale: "Product family, MBA level.", scoredAt: application.updatedAt },
      sourcedAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
    const response = await put("candidates", { revision: "0", items: [candidate] });
    expect(response.status).toBe(200);

    const target = path.join(tmpDir, "private", "job-search", "candidates.json");
    const written = JSON.parse(fs.readFileSync(target, "utf8"));
    expect(written.schema).toBe("mba-candidates");
    expect(written.candidates[0].fit.score).toBe(82);

    const readBack = await (await get("candidates")).json();
    expect(readBack.items[0].triage).toBe("sourced");
  });
});
