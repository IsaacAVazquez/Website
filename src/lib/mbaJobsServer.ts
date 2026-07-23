import { createHash } from "node:crypto";
import { load } from "cheerio";
import type {
  MBAATSType,
  MBACompany,
  MBAJob,
  MBAJobsApiResponse,
  MBAJobsSourceStatus,
} from "@/types/mba-jobs";
import { MBA_COMPANIES } from "@/constants/mba-companies";
import { matchMBAJobRole } from "@/lib/mba-job-matching";
import { mbaJobsRateLimiter } from "@/lib/rateLimit";
import { readDurableJson, writeDurableJson } from "@/lib/durableJsonCache";
import type { DataDeliveryStatus } from "@/lib/dataRevision";
import { recordRuntimeSurfaceHeartbeat } from "@/lib/runtimeSurfaceHeartbeat";

const TIMEOUT_MS = 8_000;
const MAX_SNIPPET_LENGTH = 220;
const DIRECT_HTML_DETAIL_CONCURRENCY = 6;
const SMARTRECRUITERS_DETAIL_CONCURRENCY = 6;
const ADZUNA_RESULTS_PER_PAGE = 25;
type PollableMBACompany = MBACompany & {
  atsType: Exclude<MBAATSType, "manual" | "external-api">;
};
type GreenhouseMBACompany = MBACompany & { atsType: "greenhouse" };
type LeverMBACompany = MBACompany & { atsType: "lever" };
type AshbyMBACompany = MBACompany & { atsType: "ashby" };
type SmartRecruitersMBACompany = MBACompany & { atsType: "smartrecruiters" };
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
      // Some ATS responses exceed Next's 2 MB fetch-cache limit. The route's
      // normalized in-memory cache and response cache handle reuse instead.
      cache: "no-store",
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
      // Some careers pages exceed Next's 2 MB fetch-cache limit. The route's
      // normalized in-memory cache and response cache handle reuse instead.
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
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
  // `first_published` is when the posting first went live; `updated_at` moves on
  // any later edit, so it overstates recency. Prefer first_published for the
  // posted date and fall back to updated_at only when it's absent.
  first_published?: string;
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
      postedAt: job.first_published ?? job.updated_at,
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
  publishedAt?: string | null;
  publishedDate?: string | null;
  department?: string | null;
  departmentName?: string | null;
  team?: string | null;
  teamName?: string | null;
  location?: string | null;
  locationName?: string | null;
  workplaceType?: string | null;
  employmentType?: string | null;
  jobUrl?: string | null;
  descriptionHtml?: string | null;
  descriptionPlain?: string | null;
  isListed?: boolean;
}

interface AshbyPostingApiResponse {
  jobs?: AshbyJobPosting[];
}

function getAshbyJobText(value?: string | null): string | null {
  if (!value) return null;
  return normalizeJobSnippet(value);
}

async function fetchAshby(company: AshbyMBACompany): Promise<MBAJob[]> {
  const data = await fetchJson<AshbyPostingApiResponse>(
    `https://api.ashbyhq.com/posting-api/job-board/${company.sourceKey}?includeCompensation=true`
  );
  const postings = data.jobs ?? [];

  return postings
    .filter((job) => job.isListed !== false)
    .flatMap((job) => {
      const department = job.team ?? job.teamName ?? job.department ?? job.departmentName;
      const location = job.location ?? job.locationName ?? job.workplaceType;
      const snippet =
        getAshbyJobText(job.descriptionPlain) ?? getAshbyJobText(job.descriptionHtml);
      const match = matchMBAJobRole({
        title: job.title,
        department,
        location,
        snippet,
        employmentType: job.employmentType,
      });
      if (!match) return [];
      return buildMBAJob(company, {
        id: `${company.id}-${job.id}`,
        title: job.title.trim(),
        location: location ?? "Remote",
        department: department ?? "General",
        applyUrl: job.jobUrl ?? `https://jobs.ashbyhq.com/${company.sourceKey}/${job.id}`,
        postedAt:
          job.updatedAt ?? job.publishedAt ?? job.publishedDate ?? new Date().toISOString(),
        snippet,
        roleType: match.roleType,
        roleFamilies: match.roleFamilies,
      });
    });
}

// ---------------------------------------------------------------------------
// SmartRecruiters
// ---------------------------------------------------------------------------

interface SmartRecruitersPosting {
  id: string;
  name: string;
  releasedDate?: string | null;
  location?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
    remote?: boolean | null;
  } | null;
  department?: { label?: string | null } | null;
  function?: { label?: string | null } | null;
  typeOfEmployment?: { label?: string | null } | null;
  ref?: string | null;
}

interface SmartRecruitersListResponse {
  content?: SmartRecruitersPosting[];
}

interface SmartRecruitersPostingDetail extends SmartRecruitersPosting {
  applyUrl?: string | null;
  jobAd?: {
    sections?: Record<string, { text?: string | null } | undefined>;
  } | null;
}

function formatSmartRecruitersLocation(
  location: SmartRecruitersPosting["location"]
): string {
  if (!location) return "Remote";
  const parts = [location.city, location.region, location.country]
    .filter((part): part is string => !!part?.trim())
    .map((part) => part.trim());
  if (location.remote) {
    return parts.length > 0 ? `${parts.join(", ")} / Remote` : "Remote";
  }
  return parts.length > 0 ? parts.join(", ") : "Remote";
}

function getSmartRecruitersSnippet(detail: SmartRecruitersPostingDetail): string | null {
  const sections = detail.jobAd?.sections;
  if (!sections) return null;
  const raw = [
    sections.jobDescription?.text,
    sections.qualifications?.text,
    sections.additionalInformation?.text,
  ]
    .filter(Boolean)
    .join(" ");
  return raw ? normalizeJobSnippet(raw) : null;
}

async function fetchSmartRecruiters(
  company: SmartRecruitersMBACompany
): Promise<MBAJob[]> {
  const listUrl = new URL(
    `https://api.smartrecruiters.com/v1/companies/${company.sourceKey}/postings`
  );
  listUrl.searchParams.set("limit", "100");
  const data = await fetchJson<SmartRecruitersListResponse>(listUrl.toString());
  const postings = data.content ?? [];

  const matchedSeeds = postings.flatMap((job) => {
    const department = job.department?.label ?? job.function?.label ?? "General";
    const location = formatSmartRecruitersLocation(job.location);
    const match = matchMBAJobRole({
      title: job.name,
      department,
      location,
      employmentType: job.typeOfEmployment?.label,
    });
    if (!match) return [];
    return [{ job, department, location, match }];
  });

  const results = await mapWithConcurrency(
    matchedSeeds,
    SMARTRECRUITERS_DETAIL_CONCURRENCY,
    async ({ job, department, location, match }) => {
      let detail: SmartRecruitersPostingDetail | null;
      try {
        detail = await fetchJson<SmartRecruitersPostingDetail>(
          `https://api.smartrecruiters.com/v1/companies/${company.sourceKey}/postings/${job.id}`
        );
      } catch {
        detail = null;
      }

      return buildMBAJob(company, {
        id: `${company.id}-${job.id}`,
        title: job.name.trim(),
        location: detail ? formatSmartRecruitersLocation(detail.location) : location,
        department: detail?.department?.label ?? detail?.function?.label ?? department,
        applyUrl:
          detail?.applyUrl ??
          `https://jobs.smartrecruiters.com/${company.sourceKey}/${job.id}`,
        postedAt: detail?.releasedDate ?? job.releasedDate ?? new Date().toISOString(),
        snippet: detail ? getSmartRecruitersSnippet(detail) : null,
        roleType: match.roleType,
        roleFamilies: match.roleFamilies,
      });
    }
  );

  return results;
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
  title?: string;
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

  const results = await mapWithConcurrency(
    seeds,
    DIRECT_HTML_DETAIL_CONCURRENCY,
    async (seed) => {
      let detail: DirectHtmlJobDetail = {};
      if (parser.parseDetail && seed.detailUrl) {
        try {
          const detailHtml = await fetchText(seed.detailUrl);
          detail = parser.parseDetail(detailHtml, seed);
        } catch {
          detail = {};
        }
      }

      const title = detail.title?.trim() || seed.title.trim();
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
    }
  );

  return results.filter((job): job is MBAJob => job !== null);
}

const PROVIDER_FETCHERS = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
  smartrecruiters: fetchSmartRecruiters,
  "direct-html": fetchDirectHtml,
} as const;

// ---------------------------------------------------------------------------
// Optional external leads
// ---------------------------------------------------------------------------

interface AdzunaJob {
  id: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  company?: { display_name?: string | null } | null;
  location?: { display_name?: string | null } | null;
  category?: { label?: string | null } | null;
  contract_type?: string | null;
  contract_time?: string | null;
}

interface AdzunaResponse {
  results?: AdzunaJob[];
}

interface ExternalFetchResult {
  jobs: MBAJob[];
  status: MBAJobsSourceStatus;
}

function normalizeDedupeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeJobUrlForDedupe(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of Array.from(url.searchParams.keys())) {
      if (/^(utm_|gh_src|source|ref)/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    return url.toString().replace(/\/+$/, "").toLowerCase();
  } catch {
    return value.trim().replace(/\/+$/, "").toLowerCase();
  }
}

function getJobDedupeKey(job: MBAJob): string {
  const urlKey = normalizeJobUrlForDedupe(job.applyUrl);
  if (urlKey) return `url:${urlKey}`;
  return `title:${normalizeDedupeText(job.companyName)}:${normalizeDedupeText(job.title)}`;
}

function dedupeJobs(jobs: MBAJob[]): MBAJob[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = getJobDedupeKey(job);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getKnownCompanyForName(companyName: string): MBACompany | undefined {
  const normalized = normalizeDedupeText(companyName);
  return MBA_COMPANIES.find((company) => normalizeDedupeText(company.name) === normalized);
}

async function fetchAdzunaExternalLeads(): Promise<ExternalFetchResult> {
  const appId = process.env.ADZUNA_APP_ID?.trim();
  const appKey = process.env.ADZUNA_APP_KEY?.trim();
  const country = process.env.ADZUNA_COUNTRY?.trim().toLowerCase() || "us";
  const sourceStatusBase = {
    companyId: "external-adzuna",
    companyName: "Adzuna leads",
    atsType: "external-api" as const,
  };

  if (!appId || !appKey) {
    return {
      jobs: [],
      status: {
        ...sourceStatusBase,
        status: "external-disabled",
        jobCount: 0,
        message: "Set ADZUNA_APP_ID and ADZUNA_APP_KEY to enable external leads.",
      },
    };
  }

  try {
    const url = new URL(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1`
    );
    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    url.searchParams.set("results_per_page", String(ADZUNA_RESULTS_PER_PAGE));
    url.searchParams.set(
      "what",
      "MBA intern product marketing strategy operations finance growth"
    );
    url.searchParams.set("content-type", "application/json");

    const data = await fetchJson<AdzunaResponse>(url.toString());
    const jobs = (data.results ?? []).flatMap((job) => {
      const title = job.title?.trim();
      const companyName = job.company?.display_name?.trim() || "External company";
      const applyUrl = job.redirect_url?.trim();
      if (!title || !applyUrl) return [];

      const snippet = job.description ? normalizeJobSnippet(job.description) : null;
      const match = matchMBAJobRole({
        title,
        department: job.category?.label,
        location: job.location?.display_name,
        snippet,
        employmentType: [job.contract_type, job.contract_time].filter(Boolean).join(" "),
      });
      if (!match) return [];

      const knownCompany = getKnownCompanyForName(companyName);
      return [
        {
          id: `adzuna-${job.id}`,
          companyId: knownCompany?.id ?? `external-adzuna-${job.id}`,
          companyName,
          title,
          location: job.location?.display_name ?? "See posting",
          department: job.category?.label ?? "External lead",
          applyUrl,
          postedAt: job.created ?? new Date().toISOString(),
          atsType: "external-api" as const,
          category: knownCompany?.category ?? "startup",
          snippet,
          roleType: match.roleType,
          roleFamilies: match.roleFamilies,
          sourceName: "Adzuna",
          sourceUrl: applyUrl,
        },
      ];
    });

    return {
      jobs,
      status: {
        ...sourceStatusBase,
        status: "ok",
        jobCount: jobs.length,
      },
    };
  } catch (error) {
    return {
      jobs: [],
      status: {
        ...sourceStatusBase,
        status: "failed",
        jobCount: 0,
        message: (error as Error)?.message ?? "External leads failed.",
      },
    };
  }
}

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
const KNOWN_COMPANY_IDS = new Set(MBA_COMPANIES.map((company) => company.id));

export interface MBAJobsDataResult {
  body: MBAJobsApiResponse;
  isError: boolean;
  isDegraded: boolean;
  isStale?: boolean;
}

interface JobsCacheEntry {
  promise: Promise<MBAJobsDataResult>;
  completedAt: number | null;
  value: MBAJobsDataResult | null;
}

const jobsCache = new Map<string, JobsCacheEntry>();
const lastGoodJobs = new Map<string, MBAJobsDataResult>();
const MAX_CACHE_KEYS = 100;
const DURABLE_LAST_GOOD_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function getDurableJobsKey(cacheKey: string): string {
  return `mba-jobs/${createHash("sha256").update(cacheKey).digest("hex")}`;
}

function setBoundedCacheValue<T>(map: Map<string, T>, key: string, value: T): void {
  map.delete(key);
  map.set(key, value);

  while (map.size > MAX_CACHE_KEYS) {
    const oldestKey = map.keys().next().value;
    if (typeof oldestKey !== "string") break;
    map.delete(oldestKey);
  }
}

function isJobsFresh(entry: JobsCacheEntry, now: number): boolean {
  if (entry.completedAt === null || entry.value === null) {
    return true; // in-flight
  }
  // Degraded-but-successful results (some boards failed, others answered)
  // deliberately get the success TTL: partial failures are routine at this
  // fan-out, and the short error TTL would re-hit ~30 boards every 2 minutes
  // whenever a single board is chronically down. Only total failures and
  // stale fallbacks retry quickly.
  const ttl =
    entry.value.isError || entry.value.isStale ? ERROR_TTL_MS : SUCCESS_TTL_MS;
  return now - entry.completedAt < ttl;
}

async function fetchAllJobs(
  targets: PollableMBACompany[],
  includeExternalLeads: boolean
): Promise<MBAJobsDataResult> {
  const errors: MBAJobsApiResponse["errors"] = [];
  const sourceStatuses: MBAJobsSourceStatus[] = [];

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
    const company = targets[i];
    if (r.status === "fulfilled") {
      jobs.push(...r.value);
      sourceStatuses.push({
        companyId: company.id,
        companyName: company.name,
        atsType: company.atsType,
        status: "ok",
        jobCount: r.value.length,
      });
    } else {
      errors.push({
        companyId: company.id,
        companyName: company.name,
        message: (r.reason as Error)?.message ?? "unknown error",
      });
      sourceStatuses.push({
        companyId: company.id,
        companyName: company.name,
        atsType: company.atsType,
        status: "failed",
        jobCount: 0,
        message: (r.reason as Error)?.message ?? "unknown error",
      });
    }
  });

  if (includeExternalLeads) {
    const externalResult = await fetchAdzunaExternalLeads();
    jobs.push(...externalResult.jobs);
    sourceStatuses.push(externalResult.status);
    if (externalResult.status.status === "failed") {
      errors.push({
        companyId: externalResult.status.companyId,
        companyName: externalResult.status.companyName,
        message: externalResult.status.message ?? "External leads failed.",
      });
    }
  }

  const dedupedJobs = dedupeJobs(jobs);

  dedupedJobs.sort(
    (a, b) => getPostedAtTime(b.postedAt) - getPostedAtTime(a.postedAt)
  );

  const attemptedSources = sourceStatuses.filter(
    (source) => source.status === "ok" || source.status === "failed"
  );
  const failedSources = attemptedSources.filter(
    (source) => source.status === "failed"
  );
  const allAttemptedSourcesFailed =
    attemptedSources.length > 0 &&
    failedSources.length === attemptedSources.length;

  // An empty result is trustworthy only when at least one attempted source
  // actually responded. If every attempted source failed, return an error so
  // clients keep their previous jobs rather than replacing them with an empty
  // outage payload.
  const isError = dedupedJobs.length === 0 && allAttemptedSourcesFailed;
  const isDegraded = failedSources.length > 0 && !isError;

  return {
    body: {
      jobs: dedupedJobs,
      fetchedAt: new Date().toISOString(),
      errors,
      companiesRequested: targets.map((target) => target.id),
      sourceStatuses,
    },
    isError,
    isDegraded,
  };
}

function buildStaleJobsResult(
  good: MBAJobsDataResult,
  failure: MBAJobsDataResult
): MBAJobsDataResult {
  return {
    body: {
      ...good.body,
      errors: failure.body.errors,
      sourceStatuses: failure.body.sourceStatuses,
    },
    isError: false,
    isDegraded: true,
    isStale: true,
  };
}

// When only some boards failed, backfill the response with the last-good
// jobs from exactly those failed sources so a partial outage does not make
// their postings silently vanish. Fresh jobs win on id collisions, and the
// failed sources' statuses note that earlier data is being served.
function mergeLastGoodIntoDegraded(
  good: MBAJobsDataResult,
  degraded: MBAJobsDataResult
): MBAJobsDataResult {
  const failedCompanyIds = new Set(
    (degraded.body.sourceStatuses ?? [])
      .filter((source) => source.status === "failed")
      .map((source) => source.companyId)
  );
  const freshJobIds = new Set(degraded.body.jobs.map((job) => job.id));
  const recoveredJobs = good.body.jobs.filter(
    (job) => failedCompanyIds.has(job.companyId) && !freshJobIds.has(job.id)
  );
  if (recoveredJobs.length === 0) return degraded;

  const recoveredCounts = new Map<string, number>();
  recoveredJobs.forEach((job) => {
    recoveredCounts.set(job.companyId, (recoveredCounts.get(job.companyId) ?? 0) + 1);
  });

  const jobs = [...degraded.body.jobs, ...recoveredJobs].sort(
    (a, b) => getPostedAtTime(b.postedAt) - getPostedAtTime(a.postedAt)
  );
  const sourceStatuses = (degraded.body.sourceStatuses ?? []).map((source) => {
    const recoveredCount = recoveredCounts.get(source.companyId);
    if (source.status !== "failed" || !recoveredCount) return source;
    return {
      ...source,
      jobCount: recoveredCount,
      message: `${source.message ?? "unknown error"} (serving previously fetched roles)`,
    };
  });

  return {
    body: { ...degraded.body, jobs, sourceStatuses },
    isError: false,
    isDegraded: true,
  };
}

function getOrFetchJobs(
  cacheKey: string,
  targets: PollableMBACompany[],
  includeExternalLeads: boolean
): Promise<MBAJobsDataResult> {
  const now = Date.now();
  const existing = jobsCache.get(cacheKey);

  if (existing && isJobsFresh(existing, now)) {
    return existing.promise;
  }

  const entry: JobsCacheEntry = {
    promise: Promise.resolve<MBAJobsDataResult>({
      body: {
        jobs: [],
        fetchedAt: "",
        errors: [],
        companiesRequested: [],
        sourceStatuses: [],
      },
      isError: true,
      isDegraded: false,
    }),
    completedAt: null,
    value: null,
  };

  entry.promise = (async () => {
    if (!lastGoodJobs.has(cacheKey)) {
      const durableGood = await readDurableJson<MBAJobsDataResult>(
        getDurableJobsKey(cacheKey),
        DURABLE_LAST_GOOD_MAX_AGE_MS
      );
      if (durableGood && !durableGood.isError && !durableGood.isDegraded) {
        setBoundedCacheValue(lastGoodJobs, cacheKey, durableGood);
      }
    }

    const settle = async (
      result: MBAJobsDataResult
    ): Promise<MBAJobsDataResult> => {
      let served = result;
      let status: DataDeliveryStatus;

      if (!result.isError && !result.isDegraded) {
        setBoundedCacheValue(lastGoodJobs, cacheKey, result);
        await writeDurableJson(getDurableJobsKey(cacheKey), result);
        status = "fresh";
      } else if (result.isError) {
        const good = lastGoodJobs.get(cacheKey);
        if (good) {
          served = buildStaleJobsResult(good, result);
          status = "stale-fallback";
        } else {
          status = "unavailable";
        }
      } else {
        // Degraded: some boards answered, some failed. Never promote this to
        // lastGoodJobs, but do backfill the failed boards from it.
        const good = lastGoodJobs.get(cacheKey);
        if (good) served = mergeLastGoodIntoDegraded(good, result);
        status = "degraded";
      }

      entry.value = served;
      entry.completedAt = Date.now();
      // Stamp the revision-ledger heartbeat with the served condition. A total
      // outage with no last-good (unavailable) served nothing, so it's skipped
      // and the last known-good heartbeat stands.
      if (status !== "unavailable") {
        await recordRuntimeSurfaceHeartbeat("mba-jobs", {
          fetchedAt: served.body.fetchedAt,
          status,
        });
      }
      return served;
    };

    try {
      return await settle(await fetchAllJobs(targets, includeExternalLeads));
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      const result: MBAJobsDataResult = {
        body: {
          jobs: [],
          fetchedAt: new Date().toISOString(),
          errors: [{ companyId: "", companyName: "", message }],
          companiesRequested: targets.map((target) => target.id),
          sourceStatuses: targets.map((target) => ({
            companyId: target.id,
            companyName: target.name,
            atsType: target.atsType,
            status: "failed",
            jobCount: 0,
            message,
          })),
        },
        isError: true,
        isDegraded: false,
      };
      return await settle(result);
    }
  })();

  setBoundedCacheValue(jobsCache, cacheKey, entry);
  return entry.promise;
}

export function getDefaultMBACompanyIds(): string[] {
  return MBA_COMPANIES.filter((company) => company.atsType !== "manual").map(
    (company) => company.id
  );
}

export function getUnknownMBACompanyIds(requestedIds: string[]): string[] {
  return requestedIds.filter((companyId) => !KNOWN_COMPANY_IDS.has(companyId));
}

function buildSkippedSourceStatuses(requestedIds: string[]): MBAJobsSourceStatus[] {
  return requestedIds.flatMap((id) => {
    const company = MBA_COMPANIES.find((candidate) => candidate.id === id);
    if (!company || company.atsType !== "manual") return [];
    return [
      {
        companyId: company.id,
        companyName: company.name,
        atsType: company.atsType,
        status: "skipped" as const,
        jobCount: 0,
        message: "Manual-only company; use the career page fallback.",
      },
    ];
  });
}

function orderSourceStatuses(
  requestedIds: string[],
  sourceStatuses: MBAJobsSourceStatus[]
): MBAJobsSourceStatus[] {
  const byCompanyId = new Map(
    sourceStatuses.map((status) => [status.companyId, status])
  );
  const orderedCompanyStatuses = requestedIds
    .map((id) => byCompanyId.get(id))
    .filter((status): status is MBAJobsSourceStatus => !!status);
  const externalStatuses = sourceStatuses.filter((status) =>
    status.companyId.startsWith("external-")
  );
  return [...orderedCompanyStatuses, ...externalStatuses];
}

export async function getMBAJobsData(
  requestedIds: string[] = getDefaultMBACompanyIds(),
  includeExternalLeads = false
): Promise<MBAJobsDataResult> {
  const unknownCompanyIds = getUnknownMBACompanyIds(requestedIds);
  if (unknownCompanyIds.length > 0) {
    throw new Error(
      `Unknown MBA company ids: ${unknownCompanyIds.join(", ")}`
    );
  }

  const targets = MBA_COMPANIES.filter(
    (c): c is PollableMBACompany =>
      c.atsType !== "manual" &&
      c.atsType !== "external-api" &&
      requestedIds.includes(c.id)
  );

  // Stable cache key: sorted validated pollable company ids. Manual-only and
  // unknown ids do not affect fetched data, so they are added to source health
  // outside the single-flight cache.
  const cacheKey = targets
    .map((target) => target.id)
    .sort()
    .concat(includeExternalLeads ? ["external:adzuna"] : [])
    .join(",") || "__empty__";

  const result = await getOrFetchJobs(cacheKey, targets, includeExternalLeads);
  const sourceStatuses = orderSourceStatuses(requestedIds, [
    ...buildSkippedSourceStatuses(requestedIds),
    ...(result.body.sourceStatuses ?? []),
  ]);

  return {
    ...result,
    body: {
      ...result.body,
      companiesRequested: requestedIds,
      sourceStatuses,
    },
  };
}

// Test-only side channel. Next.js route-type checking forbids non-handler
// exports, so the cache reset is hung off a Symbol on `globalThis` instead.
// Tests call `(globalThis as any)[Symbol.for(...)]()` between cases to clear
// the module-level single-flight cache. Do not call this from production.
(globalThis as Record<symbol, unknown>)[
  Symbol.for("__mbaJobsCacheResetForTesting")
] = (): void => {
  jobsCache.clear();
  lastGoodJobs.clear();
  mbaJobsRateLimiter.reset();
};
