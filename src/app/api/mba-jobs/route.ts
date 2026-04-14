import { NextRequest, NextResponse } from "next/server";
import type { MBAJob, MBAJobsApiResponse } from "@/types/mba-jobs";
import { MBA_COMPANIES, MBA_COMPANY_MAP, MBA_KEYWORDS } from "@/constants/mba-companies";

const TIMEOUT_MS = 8_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesMBAKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return MBA_KEYWORDS.some((kw) => lower.includes(kw));
}

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
      `https://boards.greenhouse.io/api/v1/boards/${slug}/jobs?content=true`,
      { signal: controller.signal, next: { revalidate: 1800 } }
    );
    if (!res.ok) throw new Error(`Greenhouse HTTP ${res.status}`);
    const data = (await res.json()) as { jobs: GHJob[] };
    const company = MBA_COMPANY_MAP.get(companyId);
    if (!company) return [];
    return data.jobs
      .filter(
        (j) =>
          matchesMBAKeyword(j.title) ||
          matchesMBAKeyword(stripHtml(j.content ?? ""))
      )
      .map((j) => ({
        id: `${companyId}-${j.id}`,
        companyId,
        companyName: company.name,
        title: j.title,
        location: j.location?.name ?? "Remote",
        department: j.departments?.[0]?.name ?? "General",
        applyUrl: j.absolute_url,
        postedAt: j.updated_at,
        atsType: "greenhouse" as const,
        category: company.category,
        snippet: j.content
          ? stripHtml(j.content).slice(0, 220) || null
          : null,
      }));
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
      .filter(
        (j) =>
          matchesMBAKeyword(j.text) ||
          matchesMBAKeyword(j.categories?.commitment ?? "") ||
          matchesMBAKeyword(j.categories?.team ?? "") ||
          matchesMBAKeyword(j.categories?.level ?? "")
      )
      .map((j) => ({
        id: `${companyId}-${j.id}`,
        companyId,
        companyName: company.name,
        title: j.text,
        location: j.categories?.location ?? "Remote",
        department: j.categories?.team ?? "General",
        applyUrl: j.hostedUrl,
        postedAt: new Date(j.createdAt).toISOString(),
        atsType: "lever" as const,
        category: company.category,
        snippet: null,
      }));
  } finally {
    clearTimeout(timer);
  }
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
    (c) => c.atsType !== "manual" && requestedIds.includes(c.id)
  );

  const errors: MBAJobsApiResponse["errors"] = [];

  const results = await Promise.allSettled(
    targets.map((c) =>
      c.atsType === "greenhouse"
        ? fetchGreenhouse(c.id, c.atsSlug)
        : fetchLever(c.id, c.atsSlug)
    )
  );

  const jobs: MBAJob[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      jobs.push(...r.value);
    } else {
      errors.push({
        companyId: targets[i].id,
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
