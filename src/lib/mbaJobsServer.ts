import { load } from "cheerio";
import { after } from "next/server";
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
import { readDurableJson, writeDurableJson } from "@/lib/netlifyBlobs";
import type { DataDeliveryStatus } from "@/lib/dataRevision";
import { recordRuntimeSurfaceHeartbeat } from "@/lib/runtimeSurfaceHeartbeat";

const TIMEOUT_MS = 8_000;
const MAX_SNIPPET_LENGTH = 220;
// The job card clamps the snippet to 3 lines of at most 54ch, so the response
// carries no more than that. Role matching still reads the longer text.
const SERVED_SNIPPET_LENGTH = 160;
const DIRECT_HTML_DETAIL_CONCURRENCY = 6;
const SMARTRECRUITERS_DETAIL_CONCURRENCY = 6;
const SMARTRECRUITERS_PAGE_SIZE = 100;
const SMARTRECRUITERS_MAX_PAGES = 5;
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

function trimServedSnippet(snippet: string | null): string | null {
  return snippet ? truncatePlainText(snippet, SERVED_SNIPPET_LENGTH) : null;
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
    snippet: trimServedSnippet(job.snippet),
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
  totalFound?: number;
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
  listUrl.searchParams.set("limit", String(SMARTRECRUITERS_PAGE_SIZE));
  const firstPage = await fetchJson<SmartRecruitersListResponse>(listUrl.toString());
  const pageCount = Math.min(
    Math.ceil((firstPage.totalFound ?? 0) / SMARTRECRUITERS_PAGE_SIZE),
    SMARTRECRUITERS_MAX_PAGES
  );
  const laterPages = await Promise.all(
    Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) => {
      listUrl.searchParams.set(
        "offset",
        String((index + 1) * SMARTRECRUITERS_PAGE_SIZE)
      );
      return fetchJson<SmartRecruitersListResponse>(listUrl.toString());
    })
  );
  const postings = [firstPage, ...laterPages].flatMap(
    (page) => page.content ?? []
  );

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
          snippet: trimServedSnippet(snippet),
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

interface MBAJobsDataResult {
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

interface LastGoodSource {
  jobs: MBAJob[];
  fetchedAt: string;
}

const jobsCache = new Map<string, JobsCacheEntry>();
// Last good jobs per source, so a board that fails on every run cannot stop
// the boards that answered from being saved.
const lastGoodBySource = new Map<string, LastGoodSource>();
// The most recent non-error result per key, degraded ones included. Failed
// refreshes and refresh deadlines both use it as a fallback.
const lastServedJobs = new Map<string, MBAJobsDataResult>();
const MAX_CACHE_KEYS = 100;
const LAST_GOOD_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// A week old list with its fetched date shown is more useful than an error.
const SERVED_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// Fixed keys. Only the default scan is persisted, so query strings cannot add
// blobs to the store.
const DURABLE_SOURCES_KEY = "mba-jobs/sources";
const DURABLE_SERVED_KEY = "mba-jobs-served/default";
const DEFAULT_CACHE_KEY = buildCacheKey(getDefaultMBACompanyIds(), false);
let durableHydrationPromise: Promise<void> | null = null;

function buildCacheKey(targetIds: string[], includeExternalLeads: boolean): string {
  return (
    [...targetIds]
      .sort()
      .concat(includeExternalLeads ? ["external:adzuna"] : [])
      .join(",") || "__empty__"
  );
}

// Runs once per instance. A cold start has nothing in memory, so the saved
// copies are what a failed board or a slow refresh falls back on.
function hydrateFromDurableStore(): Promise<void> {
  if (durableHydrationPromise) return durableHydrationPromise;
  durableHydrationPromise = (async () => {
    const [sources, served] = await Promise.all([
      readDurableJson<Record<string, LastGoodSource>>(
        DURABLE_SOURCES_KEY,
        LAST_GOOD_MAX_AGE_MS
      ),
      readDurableJson<MBAJobsDataResult>(DURABLE_SERVED_KEY, SERVED_MAX_AGE_MS),
    ]);
    for (const [sourceId, lastGood] of Object.entries(sources ?? {})) {
      if (Array.isArray(lastGood?.jobs) && !lastGoodBySource.has(sourceId)) {
        lastGoodBySource.set(sourceId, lastGood);
      }
    }
    if (
      served &&
      !served.isError &&
      Array.isArray(served.body?.jobs) &&
      !lastServedJobs.has(DEFAULT_CACHE_KEY)
    ) {
      setBoundedCacheValue(lastServedJobs, DEFAULT_CACHE_KEY, served);
    }
  })();
  return durableHydrationPromise;
}

function getLastGoodSource(sourceId: string): LastGoodSource | null {
  const lastGood = lastGoodBySource.get(sourceId);
  if (!lastGood) return null;
  if (Date.now() - Date.parse(lastGood.fetchedAt) <= LAST_GOOD_MAX_AGE_MS) {
    return lastGood;
  }
  lastGoodBySource.delete(sourceId);
  return null;
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

  const externalResult = includeExternalLeads
    ? await fetchAdzunaExternalLeads()
    : null;

  const fetchedAt = new Date().toISOString();
  const recoveredAt: number[] = [];
  const jobs: MBAJob[] = [];

  // A source that answered replaces its last good copy. A source that failed
  // is still reported as failed, and its last good jobs stand in so a partial
  // outage does not make its postings vanish.
  const addSource = (source: MBAJobsSourceStatus, fresh: MBAJob[]) => {
    if (source.status !== "failed") {
      if (source.status === "ok") {
        lastGoodBySource.set(source.companyId, { jobs: fresh, fetchedAt });
      }
      jobs.push(...fresh);
      sourceStatuses.push(source);
      return;
    }

    const message = source.message ?? "unknown error";
    errors.push({
      companyId: source.companyId,
      companyName: source.companyName,
      message,
    });
    const lastGood = getLastGoodSource(source.companyId);
    if (!lastGood || lastGood.jobs.length === 0) {
      sourceStatuses.push(source);
      return;
    }
    recoveredAt.push(Date.parse(lastGood.fetchedAt));
    jobs.push(...lastGood.jobs);
    sourceStatuses.push({
      ...source,
      jobCount: lastGood.jobs.length,
      message: `${message} (serving previously fetched roles)`,
    });
  };

  results.forEach((r, i) => {
    const company = targets[i];
    const source = {
      companyId: company.id,
      companyName: company.name,
      atsType: company.atsType,
    };
    if (r.status === "fulfilled") {
      addSource({ ...source, status: "ok", jobCount: r.value.length }, r.value);
    } else {
      addSource(
        {
          ...source,
          status: "failed",
          jobCount: 0,
          message: (r.reason as Error)?.message ?? "unknown error",
        },
        []
      );
    }
  });

  if (externalResult) addSource(externalResult.status, externalResult.jobs);

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
  // Every source failed and the jobs all come from last good copies, so the
  // list carries the date of the newest of those copies.
  const isStale = allAttemptedSourcesFailed && !isError;

  return {
    body: {
      jobs: dedupedJobs,
      fetchedAt: isStale
        ? new Date(Math.max(...recoveredAt)).toISOString()
        : fetchedAt,
      errors,
      companiesRequested: targets.map((target) => target.id),
      sourceStatuses,
    },
    isError,
    isDegraded,
    isStale,
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
    await hydrateFromDurableStore();

    const settle = async (
      result: MBAJobsDataResult
    ): Promise<MBAJobsDataResult> => {
      if (result.isError) {
        const saved = getSavedJobs(cacheKey, targets);
        if (saved) {
          result = {
            ...saved,
            body: {
              ...saved.body,
              errors: result.body.errors,
              sourceStatuses: result.body.sourceStatuses?.map((source) => ({
                ...source,
                jobCount: saved.body.jobs.filter(
                  (job) => job.companyId === source.companyId
                ).length,
              })),
            },
            isError: false,
            isDegraded: true,
            isStale: true,
          };
        }
      }
      const status: DataDeliveryStatus = result.isError
        ? "unavailable"
        : result.isStale
          ? "stale-fallback"
          : result.isDegraded
            ? "degraded"
            : "fresh";

      if (!result.isError) {
        setBoundedCacheValue(lastServedJobs, cacheKey, result);
        // A stale result holds nothing new, and saving it again would reset
        // the age the saved copies are read against.
        if (cacheKey === DEFAULT_CACHE_KEY && !result.isStale) {
          await Promise.all([
            writeDurableJson(
              DURABLE_SOURCES_KEY,
              Object.fromEntries(lastGoodBySource)
            ),
            writeDurableJson(DURABLE_SERVED_KEY, result),
          ]);
        }
      }

      entry.value = result;
      entry.completedAt = Date.now();
      // Stamp the revision-ledger heartbeat with the served condition. A total
      // outage with no last-good (unavailable) served nothing, so it's skipped
      // and the last known-good heartbeat stands.
      if (status !== "unavailable") {
        await recordRuntimeSurfaceHeartbeat("mba-jobs", {
          fetchedAt: result.body.fetchedAt,
          status,
        });
      }
      return result;
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

// A key this instance has not served yet is answered from the default scan's
// copy, narrowed to the boards that were asked for.
function filterDefaultServedJobs(
  targets: PollableMBACompany[]
): MBAJobsDataResult | undefined {
  const served = lastServedJobs.get(DEFAULT_CACHE_KEY);
  if (!served || targets.length === 0) return undefined;
  const targetIds = new Set(targets.map((target) => target.id));
  return {
    ...served,
    body: {
      ...served.body,
      jobs: served.body.jobs.filter((job) => targetIds.has(job.companyId)),
      errors: served.body.errors.filter((error) =>
        targetIds.has(error.companyId)
      ),
    },
  };
}

function getSavedJobs(
  cacheKey: string,
  targets: PollableMBACompany[]
): MBAJobsDataResult | undefined {
  const saved = lastServedJobs.get(cacheKey) ?? filterDefaultServedJobs(targets);
  if (!saved) return undefined;
  const age = Date.now() - Date.parse(saved.body.fetchedAt);
  // Check memory copies too, and never extend their life by serving them again.
  return Number.isFinite(age) && age >= 0 && age <= SERVED_MAX_AGE_MS
    ? saved
    : undefined;
}

// A cold instance or an expired entry refreshes by fanning out to every board,
// and in production requests waiting on that fan-out were cut off 18 to 27
// seconds in, after the Job Search page's loading shell (what ended them was
// not confirmed). Callers wait this
// long at most. Past it they get the last result served for the key, marked
// stale, or an error when the key has never been served, and the refresh keeps
// running for the next request.
const REFRESH_WAIT_MS = 5_000;

async function waitForRefresh(
  cacheKey: string,
  targets: PollableMBACompany[],
  refresh: Promise<MBAJobsDataResult>
): Promise<MBAJobsDataResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), REFRESH_WAIT_MS);
  });
  const result = await Promise.race([refresh, deadline]);
  clearTimeout(timer);
  if (result) return result;

  try {
    // Keeps the serverless function alive until the refresh lands.
    after(refresh);
  } catch {
    // after() throws outside a request scope (tests, scripts), where there is
    // no function to keep alive.
  }

  const served = getSavedJobs(cacheKey, targets);
  if (served) return { ...served, isDegraded: true, isStale: true };
  return {
    body: {
      jobs: [],
      fetchedAt: new Date().toISOString(),
      errors: [
        {
          companyId: "",
          companyName: "",
          message: "The job boards are still refreshing.",
        },
      ],
      companiesRequested: [],
      sourceStatuses: [],
    },
    isError: true,
    isDegraded: false,
  };
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
  const cacheKey = buildCacheKey(
    targets.map((target) => target.id),
    includeExternalLeads
  );

  const result = await waitForRefresh(
    cacheKey,
    targets,
    getOrFetchJobs(cacheKey, targets, includeExternalLeads)
  );
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
  lastGoodBySource.clear();
  lastServedJobs.clear();
  durableHydrationPromise = null;
  mbaJobsRateLimiter.reset();
};
