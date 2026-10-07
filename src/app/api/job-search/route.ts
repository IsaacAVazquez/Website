import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/apiCacheHeaders";
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
  if (!fs.existsSync(target)) return { revision: "0", items: [] };
  const raw = fs.readFileSync(target, "utf8");
  return {
    revision: String(fs.statSync(target).mtimeMs),
    items: FILES[key].parse(raw),
  };
}

function sanitize(key: FileKey, items: unknown): unknown[] {
  return FILES[key].parse(JSON.stringify(Array.isArray(items) ? items : []));
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") return json({ error: "Not found." }, 404);
  const key = resolveFile(request);
  if (!key) return json({ error: "Expected ?file=pipeline or ?file=candidates." }, 400);
  return json(readCurrent(key));
}

export async function PUT(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") return json({ error: "Not found." }, 404);
  const key = resolveFile(request);
  if (!key) return json({ error: "Expected ?file=pipeline or ?file=candidates." }, 400);

  let body: { revision?: unknown; items?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Expected a JSON body." }, 400);
  }
  if (typeof body?.revision !== "string") {
    return json({ error: "Expected { revision: string, items: unknown[] }." }, 400);
  }

  const current = readCurrent(key);
  if (current.revision !== body.revision) return json(current, 409);

  const items = sanitize(key, body.items);
  // Both wrappers type their array parameter; the parser already produced that shape.
  const wrapped = (FILES[key].wrap as (items: unknown[]) => unknown)(items);
  const target = filePath(key);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(`${target}.tmp`, `${JSON.stringify(wrapped, null, 2)}\n`, "utf8");
  fs.renameSync(`${target}.tmp`, target);

  return json({ revision: String(fs.statSync(target).mtimeMs), items });
}
