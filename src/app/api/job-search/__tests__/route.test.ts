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
  return GET(new NextRequest(`http://localhost:3000/api/job-search?file=${file}`, {
    headers: { Host: "localhost:3000" },
  }));
}

function put(file: string, body: unknown) {
  return PUT(
    new NextRequest(`http://localhost:3000/api/job-search?file=${file}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", Host: "localhost:3000" },
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
  let restoreSync: { restore: () => void };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "job-search-"));
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
    restoreEnv = jest.replaceProperty(process.env, "NODE_ENV", "development");
    const previous = process.env.JOB_SEARCH_PRIVATE_SYNC;
    process.env.JOB_SEARCH_PRIVATE_SYNC = "1";
    restoreSync = { restore: () => {
      if (previous === undefined) delete process.env.JOB_SEARCH_PRIVATE_SYNC;
      else process.env.JOB_SEARCH_PRIVATE_SYNC = previous;
    } };
  });

  afterEach(() => {
    restoreEnv.restore();
    restoreSync.restore();
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("answers 404 to a request that did not come from this machine", async () => {
    const response = await GET(new NextRequest("http://192.168.1.20:3000/api/job-search?file=pipeline"));
    expect(response.status).toBe(404);
  });

  it("disables file access unless the loopback launcher enabled it", async () => {
    process.env.JOB_SEARCH_PRIVATE_SYNC = "0";
    expect((await get("pipeline")).status).toBe(404);
    expect((await put("pipeline", { revision: "0", items: [] })).status).toBe(404);
    delete process.env.JOB_SEARCH_PRIVATE_SYNC;
    expect((await get("pipeline")).status).toBe(404);
  });

  it.each([null, "192.0.2.40:3000", "example.com:3000", "localhost:3000@evil.example"])(
    "rejects raw Host %p even when Next synthesized a localhost URL",
    async (host) => {
      const headers = new Headers();
      if (host !== null) headers.set("Host", host);
      const response = await GET(new NextRequest("http://localhost:3000/api/job-search?file=pipeline", { headers }));
      expect(response.status).toBe(404);
    }
  );

  it.each(["https://evil.example", "null", "http://localhost:4000"])("rejects an unrelated Origin %s", async (origin) => {
    const response = await GET(new NextRequest("http://localhost:3000/api/job-search?file=pipeline", {
      headers: { Host: "localhost:3000", Origin: origin },
    }));
    expect(response.status).toBe(404);
  });

  it("allows the dashboard's own origin", async () => {
    const response = await GET(new NextRequest("http://localhost:3000/api/job-search?file=pipeline", {
      headers: { Host: "localhost:3000", Origin: "http://localhost:3000" },
    }));
    expect(response.status).toBe(200);
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

  it.each([undefined, null, {}, "not an array"])("preserves the file when items is %p", async (items) => {
    const first = await (await put("pipeline", { revision: "0", items: [application] })).json();
    const target = path.join(tmpDir, "private", "job-search", "pipeline.json");
    const before = fs.readFileSync(target, "utf8");

    expect((await put("pipeline", { revision: first.revision, items })).status).toBe(400);
    expect(fs.readFileSync(target, "utf8")).toBe(before);
  });

  it.each([[null], [{}], [application, null]])("rejects invalid records without partially replacing the file %p", async (...items) => {
    const first = await (await put("pipeline", { revision: "0", items: [application] })).json();
    const target = path.join(tmpDir, "private/job-search/pipeline.json");
    const before = fs.readFileSync(target, "utf8");
    expect((await put("pipeline", { revision: first.revision, items })).status).toBe(400);
    expect(fs.readFileSync(target, "utf8")).toBe(before);
  });

  it("never pairs an old read with a newer file revision", async () => {
    await put("pipeline", { revision: "0", items: [application] });
    const target = path.join(tmpDir, "private/job-search/pipeline.json");
    const before = fs.readFileSync(target, "utf8");
    const next = JSON.parse(before);
    next.applications[0].notes = "Saved by another writer";
    const read = jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => {
      fs.writeFileSync(target, JSON.stringify(next));
      fs.utimesSync(target, new Date("2030-01-01"), new Date("2030-01-01"));
      return before;
    });
    const stale = await (await get("pipeline")).json();
    read.mockRestore();
    expect(stale.items[0].notes).toBe(application.notes);
    expect((await put("pipeline", { revision: stale.revision, items: stale.items })).status).toBe(409);
    expect(JSON.parse(fs.readFileSync(target, "utf8")).applications[0].notes).toBe("Saved by another writer");
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

  it("leaves a file a hand edit made invalid untouched instead of reading it as empty", async () => {
    const target = path.join(tmpDir, "private", "job-search", "pipeline.json");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, '{"applications":[],}');

    await expect(get("pipeline")).rejects.toThrow("is not valid JSON");
    await expect(put("pipeline", { revision: "0", items: [] })).rejects.toThrow("is not valid JSON");
    expect(fs.readFileSync(target, "utf8")).toBe('{"applications":[],}');
    expect(fs.existsSync(path.join(path.dirname(target), ".write.lock"))).toBe(false);
  });
});
