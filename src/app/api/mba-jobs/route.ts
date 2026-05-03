import { NextRequest, NextResponse } from "next/server";
import { load } from "cheerio";
import type {
  MBAATSType,
  MBACompany,
  MBAJob,
  MBAJobsApiResponse,
} from "@/types/mba-jobs";
import { MBA_COMPANIES } from "@/constants/mba-companies";
import { matchMBAJobRole } from "@/lib/mba-job-matching";

const TIMEOUT_MS = 8_000;
const MAX_SNIPPET_LENGTH = 220;
type PollableMBACompany = MBACompany & { atsType: Exclude<MBAATSType, "manual"> };
type GreenhouseMBACompany = MBACompany & { atsType: "greenhouse" };
type LeverMBACompany = MBACompany & { atsType: "lever" };
type AshbyMBACompany = MBACompany & { atsType: "ashby" };
type DirectHtmlMBACompany = MBACompany & { atsType: "direct-html" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeHtmlEntity(entity: string): string {
  const normalized = entity.toLowerCase();
  if (normalized.startsWith("#x")) {
    const value = Number.parseInt(normalized.slice(2), 16);
    return Number.isNaN(value) ? `&${entity};` : String.fromCodePoint(value);
  }
  if (normalized.startsWith("#")) {
    const value = Number.parseInt(normalized.slice(1), 10);
    return Number.isNaN(value) ? `&${entity};` : String.fromCodePoint(value);
  }
  return HTML_ENTITY_MAP[normalized] ?? `&${entity};`;
}

function decodeHtmlEntities(value: string): string {
  let output = value;
  for (let pass = 0; pass < 2; pass += 1) {
    const decoded = output.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity: string) =>
      decodeHtmlEntity(entity)
    );
    if (decoded === output) break;
    output = decoded;
  }
  return output;
}

function truncatePlainText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const candidate = value.slice(0, maxLength + 1).trim();
  const boundary = candidate.slice(0, maxLength).lastIndexOf(" ");
  const cutIndex = boundary >= Math.floor(maxLength * 0.6) ? boundary : maxLength;
  return `${candidate.slice(0, cutIndex).trimEnd()}…`;
}

function normalizeJobSnippet(html: string): string | null {
  const plainText = decodeHtmlEntities(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) return null;
  return truncatePlainText(plainText, MAX_SNIPPET_LENGTH);
}

function getPostedAtTime(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function buildMBAJob(
  company: MBACompany,
  job: Omit<MBAJob, "companyId" | "companyName" | "category" | "atsType">
): MBAJob {
  return {
    ...job,
    companyId: company.id,
    companyName: company.name,
    category: company.category,
    atsType: company.atsType,
  };
}

// ---------------------------------------------------------------------------
// Greenhouse
// ---------------------------------------------------------------------------

interface GHJob {
  id: number;
  title: string;
  location: { name: string };
  absolute_url: string;
  updated_at: string;
  departments: { name: string }[];
  content?: string;
}

async function fetchGreenhouse(company: GreenhouseMBACompany): Promise<MBAJob[]> {
  const data = await fetchJson<{ jobs: GHJob[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${company.sourceKey}/jobs?content=true`
  );

  return data.jobs.flatMap((job) => {
    const snippet = job.content ? normalizeJobSnippet(job.content) : null;
    const match = matchMBAJobRole({
      title: job.title,
      department: job.departments?.[0]?.name,
      location: job.location?.name,
      snippet,
    });
    if (!match) return [];
    return buildMBAJob(company, {
      id: `${company.id}-${job.id}`,
      title: job.title,
      location: job.location?.name ?? "Remote",
      department: job.departments?.[0]?.name ?? "General",
      applyUrl: job.absolute_url,
      postedAt: job.updated_at,
      snippet,
      roleType: match.roleType,
      roleFamilies: match.roleFamilies,
    });
  });
}

// ---------------------------------------------------------------------------
// Lever
// ---------------------------------------------------------------------------

interface LeverPosting {
  id: string;
  text: string;
  categories: {
    team?: string;
    commitment?: string;
    level?: string;
    location?: string;
  };
  hostedUrl: string;
  createdAt: number;
}

async function fetchLever(company: LeverMBACompany): Promise<MBAJob[]> {
  const data = await fetchJson<LeverPosting[]>(
    `https://api.lever.co/v0/postings/${company.sourceKey}?mode=json`
  );

  return data.flatMap((job) => {
    const match = matchMBAJobRole({
      title: job.text,
      department: job.categories?.team,
      location: job.categories?.location,
      snippet: job.categories?.level ?? null,
      employmentType: job.categories?.commitment ?? null,
    });
    if (!match) return [];
    return buildMBAJob(company, {
      id: `${company.id}-${job.id}`,
      title: job.text,
      location: job.categories?.location ?? "Remote",
      department: job.categories?.team ?? "General",
      applyUrl: job.hostedUrl,
      postedAt: new Date(job.createdAt).toISOString(),
      snippet: null,
      roleType: match.roleType,
      roleFamilies: match.roleFamilies,
    });
  });
}

// ---------------------------------------------------------------------------
// Ashby
// ---------------------------------------------------------------------------

interface AshbyJobPosting {
  id: string;
  title: string;
  updatedAt?: string | null;
  publishedDate?: string | null;
  departmentName?: string | null;
  teamName?: string | null;
  locationName?: string | null;
  workplaceType?: string | null;
  employmentType?: string | null;
  isListed?: boolean;
}

interface AshbyAppData {
  jobBoard?: {
    jobPostings?: AshbyJobPosting[];
  };
}

function extractJsonObject(source: string, marker: string): string | null {
  const start = source.indexOf(marker);
  if (start === -1) return null;

  const objectStart = source.indexOf("{", start + marker.length);
  if (objectStart === -1) return null;

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(objectStart, index + 1);
      }
    }
  }

  return null;
}

async function fetchAshby(company: AshbyMBACompany): Promise<MBAJob[]> {
  const html = await fetchText(`https://jobs.ashbyhq.com/${company.sourceKey}`);
  const rawAppData = extractJsonObject(html, "window.__appData = ");
  if (!rawAppData) {
    throw new Error("Ashby payload missing app data");
  }

  const data = JSON.parse(rawAppData) as AshbyAppData;
  const postings = data.jobBoard?.jobPostings ?? [];

  return postings
    .filter((job) => job.isListed !== false)
    .flatMap((job) => {
      const match = matchMBAJobRole({
        title: job.title,
        department: [job.teamName, job.departmentName].filter(Boolean).join(" "),
        location: job.locationName ?? job.workplaceType,
        employmentType: job.employmentType,
      });
      if (!match) return [];
      return buildMBAJob(company, {
        id: `${company.id}-${job.id}`,
        title: job.title.trim(),
        location: job.locationName ?? job.workplaceType ?? "Remote",
        department: job.teamName ?? job.departmentName ?? "General",
        applyUrl: `https://jobs.ashbyhq.com/${company.sourceKey}/${job.id}`,
        postedAt: job.updatedAt ?? job.publishedDate ?? new Date().toISOString(),
        snippet: null,
        roleType: match.roleType,
        roleFamilies: match.roleFamilies,
      });
    });
}

// ---------------------------------------------------------------------------
// Direct HTML
// ---------------------------------------------------------------------------

interface DirectHtmlJobSeed {
  id: string;
  title: string;
  location: string;
  department: string;
  applyUrl: string;
  detailUrl?: string;
  postedAt?: string;
  snippet?: string | null;
}

interface DirectHtmlJobDetail {
  location?: string;
  department?: string;
  applyUrl?: string;
  postedAt?: string;
  snippet?: string | null;
}

interface DirectHtmlParser {
  jobsUrl: string;
  parseList: (html: string) => DirectHtmlJobSeed[];
  parseDetail?: (html: string, seed: DirectHtmlJobSeed) => DirectHtmlJobDetail;
}

function parseNextData<T>(html: string): T {
  const $ = load(html);
  const raw = $('script#__NEXT_DATA__[type="application/json"]').html();

  if (!raw) {
    throw new Error("Next.js page payload missing __NEXT_DATA__");
  }

  return JSON.parse(raw) as T;
}

interface MiroOpenPositionsPageData {
  props: {
    pageProps: {
      jobs?: Array<{
        id: number;
        title: string;
        location?: string | null;
        departmentName?: string | null;
      }>;
    };
  };
}

interface MiroVacancyPageData {
  props: {
    pageProps: {
      title: string;
      department?: string | null;
      location?: string | null;
      content?: string | null;
    };
  };
}

const DIRECT_HTML_PARSERS: Record<string, DirectHtmlParser> = {
  miro: {
    jobsUrl: "https://us.miro.com/careers/open-positions/",
    parseList(html) {
      const data = parseNextData<MiroOpenPositionsPageData>(html);
      const jobs = data.props.pageProps.jobs ?? [];

      return jobs.map((job) => {
        const applyUrl = `https://us.miro.com/careers/vacancy/${job.id}/`;
        return {
          id: `${job.id}`,
          title: job.title.trim(),
          location: job.location?.trim() || "Remote",
          department: job.departmentName?.trim() || "General",
          applyUrl,
          detailUrl: applyUrl,
          postedAt: "",
        };
      });
    },
    parseDetail(html, seed) {
      const data = parseNextData<MiroVacancyPageData>(html);
      const pageProps = data.props.pageProps;

      return {
        location: pageProps.location?.trim() || seed.location,
        department: pageProps.department?.trim() || seed.department,
        snippet: pageProps.content ? normalizeJobSnippet(pageProps.content) : null,
        postedAt: "",
      };
    },
  },
};

async function fetchDirectHtml(company: DirectHtmlMBACompany): Promise<MBAJob[]> {
  const parser = DIRECT_HTML_PARSERS[company.sourceKey];
  if (!parser) {
    throw new Error(`Direct HTML parser missing for ${company.sourceKey}`);
  }

  const html = await fetchText(company.jobsUrl ?? parser.jobsUrl);
  const seeds = parser.parseList(html);

  const results = await Promise.all(
    seeds.map(async (seed) => {
      let detail: DirectHtmlJobDetail = {};
      if (parser.parseDetail && seed.detailUrl) {
        try {
          const detailHtml = await fetchText(seed.detailUrl);
          detail = parser.parseDetail(detailHtml, seed);
        } catch {
          detail = {};
        }
      }

      const title = seed.title.trim();
      const location = detail.location?.trim() || seed.location;
      const department = detail.department?.trim() || seed.department;
      const snippet = detail.snippet ?? seed.snippet ?? null;
      const match = matchMBAJobRole({
        title,
        department,
        location,
        snippet,
      });

      if (!match) {
        return null;
      }

      return buildMBAJob(company, {
        id: `${company.id}-${seed.id}`,
        title,
        location,
        department,
        applyUrl: detail.applyUrl ?? seed.applyUrl,
        postedAt: detail.postedAt ?? seed.postedAt ?? "",
        snippet,
        roleType: match.roleType,
        roleFamilies: match.roleFamilies,
      });
    })
  );

  return results.filter((job): job is MBAJob => job !== null);
}

const PROVIDER_FETCHERS = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
  "direct-html": fetchDirectHtml,
} as const;

// ---------------------------------------------------------------------------
// Single-flight in-memory cache
// ---------------------------------------------------------------------------
//
// This route fans out to ~10 external ATS sources, plus 50+ HTML scrape
// requests for direct sources like Miro. Without coalescing, simultaneous
// requests would multiply the upstream load by N. Single-flight caches the
// in-flight promise per cache key so concurrent callers share the result.
//
// Single Netlify instance — no Redis needed.

const SUCCESS_TTL_MS = 30 * 60 * 1000; // 30 minutes
const ERROR_TTL_MS = 2 * 60 * 1000; // 2 minutes
const ERROR_CACHE_CONTROL_HEADER = "no-store";
const SUCCESS_CACHE_CONTROL_HEADER =
  "public, s-maxage=1800, stale-while-revalidate=3600";

interface JobsFetchResult {
  body: MBAJobsApiResponse;
  isError: boolean;
}

interface JobsCacheEntry {
  promise: Promise<JobsFetchResult>;
  completedAt: number | null;
  value: JobsFetchResult | null;
}

const jobsCache = new Map<string, JobsCacheEntry>();

function isJobsFresh(entry: JobsCacheEntry, now: number): boolean {
  if (entry.completedAt === null || entry.value === null) {
    return true; // in-flight
  }
  const ttl = entry.value.isError ? ERROR_TTL_MS : SUCCESS_TTL_MS;
  return now - entry.completedAt < ttl;
}

async function fetchAllJobs(
  requestedIds: string[],
  targets: PollableMBACompany[]
): Promise<JobsFetchResult> {
  const errors: MBAJobsApiResponse["errors"] = [];

  const results = await Promise.allSettled(
    targets.map((company) => {
      const fetcher = PROVIDER_FETCHERS[company.atsType] as (
        company: PollableMBACompany
      ) => Promise<MBAJob[]>;
      return fetcher(company);
    })
  );

  const jobs: MBAJob[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      jobs.push(...r.value);
    } else {
      errors.push({
        companyId: targets[i].id,
        companyName: targets[i].name,
        message: (r.reason as Error)?.message ?? "unknown error",
      });
    }
  });

  jobs.sort(
    (a, b) => getPostedAtTime(b.postedAt) - getPostedAtTime(a.postedAt)
  );

  // If every target failed, treat as an error so the cache TTL is short.
  const isError = jobs.length === 0 && errors.length > 0;

  return {
    body: {
      jobs,
      fetchedAt: new Date().toISOString(),
      errors,
      companiesRequested: requestedIds,
    },
    isError,
  };
}

function getOrFetchJobs(
  cacheKey: string,
  requestedIds: string[],
  targets: PollableMBACompany[]
): Promise<JobsFetchResult> {
  const now = Date.now();
  const existing = jobsCache.get(cacheKey);

  if (existing && isJobsFresh(existing, now)) {
    return existing.promise;
  }

  const entry: JobsCacheEntry = {
    promise: Promise.resolve<JobsFetchResult>({
      body: { jobs: [], fetchedAt: "", errors: [], companiesRequested: [] },
      isError: true,
    }),
    completedAt: null,
    value: null,
  };

  entry.promise = (async () => {
    try {
      const result = await fetchAllJobs(requestedIds, targets);
      entry.value = result;
      entry.completedAt = Date.now();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      const result: JobsFetchResult = {
        body: {
          jobs: [],
          fetchedAt: new Date().toISOString(),
          errors: [{ companyId: "", companyName: "", message }],
          companiesRequested: requestedIds,
        },
        isError: true,
      };
      entry.value = result;
      entry.completedAt = Date.now();
      return result;
    }
  })();

  jobsCache.set(cacheKey, entry);
  return entry.promise;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("companies");
  const requestedIds = param
    ? param
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : MBA_COMPANIES.filter((c) => c.atsType !== "manual").map((c) => c.id);

  const targets = MBA_COMPANIES.filter(
    (c): c is PollableMBACompany =>
      c.atsType !== "manual" && requestedIds.includes(c.id)
  );

  // Stable cache key: sorted, lowercased company ids.
  const cacheKey = [...requestedIds]
    .map((id) => id.toLowerCase())
    .sort()
    .join(",");

  const result = await getOrFetchJobs(cacheKey, requestedIds, targets);

  return NextResponse.json(result.body, {
    headers: {
      "Cache-Control": result.isError
        ? ERROR_CACHE_CONTROL_HEADER
        : SUCCESS_CACHE_CONTROL_HEADER,
    },
  });
}

// Test-only side channel. Next.js route-type checking forbids non-handler
// exports, so the cache reset is hung off a Symbol on `globalThis` instead.
// Tests call `(globalThis as any)[Symbol.for(...)]()` between cases to clear
// the module-level single-flight cache. Do not call this from production.
(globalThis as Record<symbol, unknown>)[
  Symbol.for("__mbaJobsCacheResetForTesting")
] = (): void => {
  jobsCache.clear();
};
