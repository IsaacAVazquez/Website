import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/apiCacheHeaders";
import { JobSearchFilesBusyError, withJobSearchFileLock } from "@/lib/jobSearchFileLock";
import {
  buildMBAApplicationsExport,
  buildMBAJobCandidatesFile,
  parseMBAApplications,
  parseMBAJobCandidates,
} from "@/lib/mba-applications";

/**
 * Development-only bridge between the dashboard's localStorage and the
 * gitignored private/job-search/ folder that the job-search skills edit.
 * Outside `next dev` every request is a 404, so production never exposes
 * the filesystem.
 */

const FILES = {
  pipeline: {
    name: "pipeline.json",
    parse: parseMBAApplications,
    wrap: buildMBAApplicationsExport,
  },
  candidates: {
    name: "candidates.json",
    parse: parseMBAJobCandidates,
    wrap: buildMBAJobCandidatesFile,
  },
} as const;

type FileKey = keyof typeof FILES;

/** Enabled only by the loopback-bound development launcher. */
function notFound(request: NextRequest) {
  if (process.env.NODE_ENV !== "development" || process.env.JOB_SEARCH_PRIVATE_SYNC !== "1") {
    return json({ error: "Not found." }, 404);
  }
  // Next can synthesize nextUrl from its own hostname. The raw Host also
  // rejects DNS rebinding, but the launcher's listener is the LAN boundary.
  const host = request.headers.get("host");
  if (!host || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i.test(host)) {
    return json({ error: "Not found." }, 404);
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== `http://${host}` && origin !== `https://${host}`) {
    return json({ error: "Not found." }, 404);
  }
  return null;
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function resolveFile(request: NextRequest): FileKey | null {
  const file = request.nextUrl.searchParams.get("file");
  return file === "pipeline" || file === "candidates" ? file : null;
}

function filePath(key: FileKey): string {
  return path.join(process.cwd(), "private", "job-search", FILES[key].name);
}

function readCurrent(key: FileKey): { revision: string; items: unknown[] } {
  const target = filePath(key);
  try {
    const raw = fs.readFileSync(target, "utf8");
    return { revision: revisionFor(raw), items: FILES[key].parse(raw) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { revision: "0", items: [] };
    throw error;
  }
}

function revisionFor(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function sanitize(key: FileKey, items: unknown[]): unknown[] {
  return FILES[key].parse(JSON.stringify(items));
}

export async function GET(request: NextRequest) {
  const blocked = notFound(request);
  if (blocked) return blocked;
  const key = resolveFile(request);
  if (!key) return json({ error: "Expected ?file=pipeline or ?file=candidates." }, 400);
  return json(readCurrent(key));
}

export async function PUT(request: NextRequest) {
  const blocked = notFound(request);
  if (blocked) return blocked;
  const key = resolveFile(request);
  if (!key) return json({ error: "Expected ?file=pipeline or ?file=candidates." }, 400);

  let body: { revision?: unknown; items?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Expected a JSON body." }, 400);
  }
  if (typeof body?.revision !== "string" || !Array.isArray(body.items)) {
    return json({ error: "Expected { revision: string, items: unknown[] }." }, 400);
  }

  const items = sanitize(key, body.items);
  if (items.length !== body.items.length) {
    return json({ error: "Expected valid, unique records in items." }, 400);
  }
  try {
    return await withJobSearchFileLock(() => {
      const current = readCurrent(key);
      if (current.revision !== body.revision) return json(current, 409);
      // Both wrappers type their array parameter; the parser produced that shape.
      const wrapped = (FILES[key].wrap as (items: unknown[]) => unknown)(items);
      const target = filePath(key);
      const raw = `${JSON.stringify(wrapped, null, 2)}\n`;
      fs.writeFileSync(`${target}.tmp`, raw, "utf8");
      fs.renameSync(`${target}.tmp`, target);
      return json({ revision: revisionFor(raw), items });
    });
  } catch (error) {
    if (error instanceof JobSearchFilesBusyError) return json({ error: error.message }, 503);
    throw error;
  }
}
