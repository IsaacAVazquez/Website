import { NextRequest, NextResponse } from "next/server";
import type {
  MBACompany,
  MBAJob,
  MBAJobsApiResponse,
} from "@/types/mba-jobs";
import { MBA_COMPANIES, MBA_COMPANY_MAP } from "@/constants/mba-companies";
import { matchMBAJobRole } from "@/lib/mba-job-matching";

const TIMEOUT_MS = 8_000;
type PollableMBACompany = MBACompany & { atsType: "greenhouse" | "lever" | "ashby" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
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

async function fetchGreenhouse(companyId: string, slug: string): Promise<MBAJob[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
      { signal: controller.signal, next: { revalidate: 1800 } }
    );
    if (!res.ok) throw new Error(`Greenhouse HTTP ${res.status}`);
    const data = (await res.json()) as { jobs: GHJob[] };
    const company = MBA_COMPANY_MAP.get(companyId);
    if (!company) return [];
    return data.jobs
      .flatMap((job) => {
        const snippet = job.content ? stripHtml(job.content).slice(0, 220) || null : null;
        const match = matchMBAJobRole({
          title: job.title,
          department: job.departments?.[0]?.name,
          location: job.location?.name,
          snippet,
        });
        if (!match) return [];
        return buildMBAJob(company, {
          id: `${companyId}-${job.id}`,
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
  } finally {
    clearTimeout(timer);
  }
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

async function fetchLever(companyId: string, slug: string): Promise<MBAJob[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { signal: controller.signal, next: { revalidate: 1800 } }
    );
    if (!res.ok) throw new Error(`Lever HTTP ${res.status}`);
    const data = (await res.json()) as LeverPosting[];
    const company = MBA_COMPANY_MAP.get(companyId);
    if (!company) return [];
    return data
      .flatMap((job) => {
        const match = matchMBAJobRole({
          title: job.text,
          department: job.categories?.team,
          location: job.categories?.location,
          snippet: job.categories?.level ?? null,
          employmentType: job.categories?.commitment ?? null,
        });
        if (!match) return [];
        return buildMBAJob(company, {
          id: `${companyId}-${job.id}`,
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
  } finally {
    clearTimeout(timer);
  }
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

async function fetchAshby(companyId: string, slug: string): Promise<MBAJob[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://jobs.ashbyhq.com/${slug}`, {
      signal: controller.signal,
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error(`Ashby HTTP ${res.status}`);

    const html = await res.text();
    const rawAppData = extractJsonObject(html, "window.__appData = ");
    if (!rawAppData) {
      throw new Error("Ashby payload missing app data");
    }

    const data = JSON.parse(rawAppData) as AshbyAppData;
    const postings = data.jobBoard?.jobPostings ?? [];
    const company = MBA_COMPANY_MAP.get(companyId);
    if (!company) return [];

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
          id: `${companyId}-${job.id}`,
          title: job.title.trim(),
          location: job.locationName ?? job.workplaceType ?? "Remote",
          department: job.teamName ?? job.departmentName ?? "General",
          applyUrl: `https://jobs.ashbyhq.com/${slug}/${job.id}`,
          postedAt: job.updatedAt ?? job.publishedDate ?? new Date().toISOString(),
          snippet: null,
          roleType: match.roleType,
          roleFamilies: match.roleFamilies,
        });
      });
  } finally {
    clearTimeout(timer);
  }
}

const PROVIDER_FETCHERS = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
} as const;

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

  const errors: MBAJobsApiResponse["errors"] = [];

  const results = await Promise.allSettled(
    targets.map((company) => PROVIDER_FETCHERS[company.atsType](company.id, company.atsSlug))
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
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );

  const body: MBAJobsApiResponse = {
    jobs,
    fetchedAt: new Date().toISOString(),
    errors,
    companiesRequested: requestedIds,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
