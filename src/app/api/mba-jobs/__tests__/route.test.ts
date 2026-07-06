/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "../route";

// The route exposes its cache reset on globalThis under a well-known Symbol
// because Next.js route-type checking forbids extra route exports.
function resetMbaJobsCache(): void {
  const reset = (globalThis as Record<symbol, unknown>)[
    Symbol.for("__mbaJobsCacheResetForTesting")
  ];
  if (typeof reset === "function") (reset as () => void)();
}

const originalFetch = global.fetch;
const originalEnv = { ...process.env };
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

function buildGreenhouseResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    jobs: [],
    ...overrides,
  };
}

function buildAshbyResponse(jobs: object[]) {
  return { apiVersion: "1", jobs };
}

function buildSmartRecruitersList(content: object[]) {
  return {
    limit: 100,
    offset: 0,
    totalFound: content.length,
    content,
  };
}

function buildNextDataPage(pageProps: object) {
  return `<!doctype html><html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
    {
      props: { pageProps },
    }
  )}</script></body></html>`;
}

function buildMiroOpenPositionsPage(jobs: object[]) {
  return buildNextDataPage({
    data: {},
    jobSearch: { locations: [], departments: [] },
    jobs,
    departmentsWithJobs: [],
    seo: {},
  });
}

function buildMiroVacancyPage(overrides: Partial<Record<string, unknown>> = {}) {
  return buildNextDataPage({
    slug: "8436222002",
    title: "Manager, Finance Systems",
    department: "Finance",
    location: "Austin, New York, Remote US",
    content:
      "<p>Lead the evolution of our financial planning infrastructure and partner across Finance, Biz Tech, and Accounting.</p>",
    links: [],
    jobSearch: { locations: [], departments: [] },
    questions: [],
    demographic_questions: null,
    gtm: {
      id: 8436222002,
      title: "Manager, Finance Systems",
      location: "Austin, New York, Remote US",
      category: "Finance",
    },
    prepare: {},
    related: {},
    seo: {},
    jobNotFound: false,
    ...overrides,
  });
}

function installFetchMock(responses: Record<string, Response | Error>) {
  mockFetch.mockImplementation(async (input) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const response = responses[url];
    if (response instanceof Error) {
      throw response;
    }

    if (!response) {
      return new Response("missing mock response", { status: 404 });
    }

    return response;
  });
}

describe("GET /api/mba-jobs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The route uses a module-level single-flight cache keyed by company id
    // set. Without resetting, the second test would re-use the first test's
    // cached result for the same key (`stripe`) and bypass the mocked fetch.
    resetMbaJobsCache();
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: mockFetch,
      writable: true,
    });
    delete process.env.ADZUNA_APP_ID;
    delete process.env.ADZUNA_APP_KEY;
    delete process.env.ADZUNA_COUNTRY;
  });

  afterAll(() => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: originalFetch,
      writable: true,
    });
    process.env = originalEnv;
  });

  it("classifies internships, full-time roles, unclear MBA programs, and filters non-target roles", async () => {
    installFetchMock({
      "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true": new Response(
        JSON.stringify(
          buildGreenhouseResponse({
            jobs: [
              {
                id: 1001,
                title: "PM Intern",
                location: { name: "San Francisco, CA" },
                absolute_url: "https://example.com/jobs/1001",
                // first_published (posted) predates updated_at (a later edit);
                // postedAt should track the earlier first_published.
                first_published: "2026-03-01T10:00:00.000Z",
                updated_at: "2026-04-14T16:00:00.000Z",
                departments: [{ name: "Product" }],
                content: "<p>MBA summer internship for product leaders.</p>",
              },
              {
                id: 1002,
                title: "Strategic Finance Associate",
                location: { name: "New York, NY" },
                absolute_url: "https://example.com/jobs/1002",
                updated_at: "2026-04-14T15:00:00.000Z",
                departments: [{ name: "Strategy & Finance" }],
                content: "<p>Corporate finance and FP&A role.</p>",
              },
              {
                id: 1003,
                title: "MBA Leadership Program",
                location: { name: "Seattle, WA" },
                absolute_url: "https://example.com/jobs/1003",
                updated_at: "2026-04-14T14:00:00.000Z",
                departments: [{ name: "Business" }],
                content: "<p>General management rotational program for MBA candidates.</p>",
              },
              {
                id: 1004,
                title: "Product Designer",
                location: { name: "Remote" },
                absolute_url: "https://example.com/jobs/1004",
                updated_at: "2026-04-14T13:00:00.000Z",
                departments: [{ name: "Design" }],
                content: "<p>Design systems role.</p>",
              },
              {
                id: 1005,
                title: "Legal Counsel",
                location: { name: "Remote" },
                absolute_url: "https://example.com/jobs/1005",
                updated_at: "2026-04-14T12:00:00.000Z",
                departments: [{ name: "Legal" }],
                content: "<p>Commercial legal support.</p>",
              },
              {
                id: 1006,
                title: "Associate Product Manager, New Graduate",
                location: { name: "San Francisco, CA" },
                absolute_url: "https://example.com/jobs/1006",
                updated_at: "2026-04-14T11:00:00.000Z",
                departments: [{ name: "Product" }],
                content: "<p>University graduate program for undergraduates.</p>",
              },
              {
                id: 1007,
                title: "Software Engineering Intern",
                location: { name: "Remote" },
                absolute_url: "https://example.com/jobs/1007",
                updated_at: "2026-04-14T10:00:00.000Z",
                departments: [{ name: "Engineering" }],
                content: "<p>Campus internship for CS students.</p>",
              },
              {
                id: 1008,
                title: "Product Management Intern",
                location: { name: "Seattle, WA" },
                absolute_url: "https://example.com/jobs/1008",
                updated_at: "2026-04-14T09:00:00.000Z",
                departments: [{ name: "Product" }],
                content: "<p>Internship for undergraduate students.</p>",
              },
            ],
          })
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
    });

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/mba-jobs?companies=stripe")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.errors).toEqual([]);
    expect(body.jobs).toHaveLength(3);
    expect(body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          companyId: "stripe",
          title: "PM Intern",
          roleType: "internship",
          roleFamilies: ["product"],
          // Prefers first_published over the later updated_at (2026-04-14).
          postedAt: "2026-03-01T10:00:00.000Z",
        }),
        expect.objectContaining({
          title: "Strategic Finance Associate",
          roleType: "full-time",
          roleFamilies: ["strategy", "finance"],
        }),
        expect.objectContaining({
          title: "MBA Leadership Program",
          roleType: "unclear",
          roleFamilies: [],
        }),
      ])
    );
    expect(body.jobs.map((job: { title: string }) => job.title)).not.toEqual(
      expect.arrayContaining([
        "Product Designer",
        "Legal Counsel",
        "Associate Product Manager, New Graduate",
        "Software Engineering Intern",
        "Product Management Intern",
      ])
    );
  });

  it("normalizes encoded HTML snippets into plain text without dropping relevant roles", async () => {
    installFetchMock({
      "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true": new Response(
        JSON.stringify(
          buildGreenhouseResponse({
            jobs: [
              {
                id: 1010,
                title: "Growth Marketing Manager",
                location: { name: "San Francisco, CA" },
                absolute_url: "https://example.com/jobs/1010",
                updated_at: "2026-04-14T16:30:00.000Z",
                departments: [{ name: "Growth" }],
                content:
                  "&lt;p&gt;&lt;strong&gt;&lt;em&gt;Note:&lt;/em&gt;&lt;/strong&gt; &lt;em&gt;if you are an intern or new grad, please do not apply using this link and visit our &lt;/em&gt;&lt;a href=&quot;https://stripe.com/jobs/search&quot;&gt;&lt;em&gt;jobs page&lt;/em&gt;&lt;/a&gt;&lt;em&gt; for those specific postings.&lt;/em&gt;&lt;/p&gt;",
              },
            ],
          })
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
    });

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/mba-jobs?companies=stripe")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.errors).toEqual([]);
    expect(body.jobs).toEqual([
      expect.objectContaining({
        title: "Growth Marketing Manager",
        roleType: "full-time",
        roleFamilies: ["growth"],
        snippet:
          "Note: if you are an intern or new grad, please do not apply using this link and visit our jobs page for those specific postings.",
      }),
    ]);
  });

  it("parses Ashby public job board payloads and matches PMM and chief-of-staff variants", async () => {
    installFetchMock({
      "https://api.ashbyhq.com/posting-api/job-board/notion?includeCompensation=true": new Response(
        JSON.stringify(buildAshbyResponse([
          {
            id: "ashby-1",
            title: "PMM Manager",
            updatedAt: "2026-04-12T11:30:00.000Z",
            department: "Marketing",
            team: "Product Marketing",
            location: "San Francisco, California",
            workplaceType: "Hybrid",
            employmentType: "Full-Time",
            jobUrl: "https://jobs.ashbyhq.com/notion/ashby-1",
            isListed: true,
          },
          {
            id: "ashby-2",
            title: "Chief of Staff to the COO",
            updatedAt: "2026-04-12T10:00:00.000Z",
            department: "Operations",
            team: "Office of the CEO",
            location: "New York, New York",
            workplaceType: "Hybrid",
            employmentType: "Full-Time",
            jobUrl: "https://jobs.ashbyhq.com/notion/ashby-2",
            isListed: true,
          },
        ])),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
    });

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/mba-jobs?companies=notion")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.errors).toEqual([]);
    expect(body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "PMM Manager",
          roleType: "full-time",
          roleFamilies: expect.arrayContaining(["product-marketing"]),
          atsType: "ashby",
        }),
        expect.objectContaining({
          title: "Chief of Staff to the COO",
          roleType: "full-time",
          roleFamilies: ["chief-of-staff"],
          atsType: "ashby",
        }),
      ])
    );
  });

  it("uses the configured provider adapters and skips manual companies", async () => {
    installFetchMock({
      "https://boards-api.greenhouse.io/v1/boards/reddit/jobs?content=true": new Response(
        JSON.stringify(
          buildGreenhouseResponse({
            jobs: [
              {
                id: 3001,
                title: "BizOps Intern",
                location: { name: "Remote" },
                absolute_url: "https://example.com/reddit/3001",
                updated_at: "2026-04-14T17:00:00.000Z",
                departments: [{ name: "Business Operations" }],
                content: "<p>MBA internship</p>",
              },
            ],
          })
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
      "https://api.ashbyhq.com/posting-api/job-board/openai?includeCompensation=true": new Response(
        JSON.stringify(buildAshbyResponse([
          {
            id: "openai-1",
            title: "Corporate Development Associate",
            updatedAt: "2026-04-14T15:30:00.000Z",
            department: "Business",
            team: "Corporate Development",
            location: "San Francisco",
            employmentType: "Full-Time",
            jobUrl: "https://jobs.ashbyhq.com/openai/openai-1",
            isListed: true,
          },
        ])),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
    });

    const response = await GET(
      new NextRequest(
        "https://isaacavazquez.com/api/mba-jobs?companies=reddit,openai,microsoft"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls.map(([input]) => String(input))).toEqual(
      expect.arrayContaining([
        "https://boards-api.greenhouse.io/v1/boards/reddit/jobs?content=true",
        "https://api.ashbyhq.com/posting-api/job-board/openai?includeCompensation=true",
      ])
    );
    expect(body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          companyId: "reddit",
          atsType: "greenhouse",
          roleFamilies: ["operations"],
        }),
        expect.objectContaining({
          companyId: "openai",
          atsType: "ashby",
          roleFamilies: ["business-development"],
        }),
      ])
    );
  });

  it("supports direct-html feeds, newly discovered sources, and skips manual-only companies", async () => {
    installFetchMock({
      "https://boards-api.greenhouse.io/v1/boards/chime/jobs?content=true": new Response(
        JSON.stringify(
          buildGreenhouseResponse({
            jobs: [
              {
                id: 4101,
                title: "Decision Science Manager",
                location: { name: "San Francisco, CA" },
                absolute_url: "https://example.com/chime/4101",
                updated_at: "2026-04-14T17:45:00.000Z",
                departments: [{ name: "Strategy & Analytics" }],
                content: "<p>Drive strategy, analytics, and planning for a fintech business.</p>",
              },
            ],
          })
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
      "https://api.ashbyhq.com/posting-api/job-board/ramp?includeCompensation=true": new Response(
        JSON.stringify(buildAshbyResponse([
          {
            id: "ramp-1",
            title: "Strategic Finance Lead",
            updatedAt: "2026-04-14T14:00:00.000Z",
            department: "Finance",
            team: "Strategic Finance",
            location: "New York, NY",
            employmentType: "Full-Time",
            jobUrl: "https://jobs.ashbyhq.com/ramp/ramp-1",
            isListed: true,
          },
        ])),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
      "https://us.miro.com/careers/open-positions/": new Response(
        buildMiroOpenPositionsPage([
          {
            id: 8436222002,
            title: "Manager, Finance Systems",
            location: "Austin, US; New York, US; Remote US",
            departmentName: "Finance",
          },
          {
            id: 8401505002,
            title: "Backend Software Engineer",
            location: "London, UK",
            departmentName: "Engineering",
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      ),
      "https://us.miro.com/careers/vacancy/8436222002/": new Response(
        buildMiroVacancyPage(),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      ),
      "https://api.smartrecruiters.com/v1/companies/Canva/postings?limit=100": new Response(
        JSON.stringify(
          buildSmartRecruitersList([
            {
              id: "6000000000947886",
              name: "Sales Strategy & Operations Lead",
              releasedDate: "2026-04-14T13:00:00.000Z",
              location: { city: "Austin", region: "TX", country: "US", remote: false },
              department: { label: "Sales" },
              typeOfEmployment: { label: "Full-time" },
            },
            {
              id: "6000000000803918",
              name: "Senior UI Engineer",
              releasedDate: "2026-04-14T12:00:00.000Z",
              location: { city: "London", country: "GB", remote: false },
              department: { label: "Engineering" },
              typeOfEmployment: { label: "Full-time" },
            },
          ])
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
      "https://api.smartrecruiters.com/v1/companies/Canva/postings/6000000000947886": new Response(
        JSON.stringify({
          id: "6000000000947886",
          name: "Sales Strategy & Operations Lead",
          releasedDate: "2026-04-14T13:00:00.000Z",
          location: { city: "Austin", region: "TX", country: "US", remote: false },
          department: { label: "Sales" },
          typeOfEmployment: { label: "Full-time" },
          applyUrl:
            "https://jobs.smartrecruiters.com/Canva/6000000000947886-sales-strategy-operations-lead",
          jobAd: {
            sections: {
              jobDescription: {
                text: "Serve as a strategic business partner and own forecasting, pipeline health, and executive readouts.",
              },
            },
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
    });

    const response = await GET(
      new NextRequest(
        "https://isaacavazquez.com/api/mba-jobs?companies=chime,ramp,miro,canva"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.errors).toEqual([]);
    expect(mockFetch.mock.calls.map(([input]) => String(input))).toEqual(
      expect.arrayContaining([
        "https://boards-api.greenhouse.io/v1/boards/chime/jobs?content=true",
        "https://api.ashbyhq.com/posting-api/job-board/ramp?includeCompensation=true",
        "https://us.miro.com/careers/open-positions/",
        "https://us.miro.com/careers/vacancy/8436222002/",
        "https://api.smartrecruiters.com/v1/companies/Canva/postings?limit=100",
        "https://api.smartrecruiters.com/v1/companies/Canva/postings/6000000000947886",
      ])
    );
    expect(body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          companyId: "chime",
          atsType: "greenhouse",
          title: "Decision Science Manager",
          roleFamilies: expect.arrayContaining(["analytics"]),
        }),
        expect.objectContaining({
          companyId: "ramp",
          atsType: "ashby",
          title: "Strategic Finance Lead",
          roleFamilies: expect.arrayContaining(["finance"]),
        }),
        expect.objectContaining({
          companyId: "miro",
          atsType: "direct-html",
          title: "Manager, Finance Systems",
          roleFamilies: ["finance"],
          snippet:
            "Lead the evolution of our financial planning infrastructure and partner across Finance, Biz Tech, and Accounting.",
          postedAt: "",
        }),
        expect.objectContaining({
          companyId: "canva",
          atsType: "smartrecruiters",
          title: "Sales Strategy & Operations Lead",
          roleFamilies: expect.arrayContaining(["strategy", "operations"]),
          snippet:
            "Serve as a strategic business partner and own forecasting, pipeline health, and executive readouts.",
        }),
      ])
    );
    expect(body.jobs.map((job: { title: string }) => job.title)).not.toEqual(
      expect.arrayContaining(["Backend Software Engineer"])
    );
  });

  it("routes Coinbase through its Greenhouse board and Plaid through its Ashby board, skipping manual portals", async () => {
    // Coinbase and Plaid moved off fragile direct-HTML scrapes (Coinbase's
    // career page 403s bot traffic) to their canonical public ATS boards.
    installFetchMock({
      "https://boards-api.greenhouse.io/v1/boards/coinbase/jobs?content=true": new Response(
        JSON.stringify(
          buildGreenhouseResponse({
            jobs: [
              {
                id: 6230012,
                title: "Corporate Development Associate",
                location: { name: "Remote - USA" },
                absolute_url: "https://www.coinbase.com/careers/positions/6230012",
                updated_at: "2026-06-30T16:00:00.000Z",
                departments: [{ name: "Corporate Development" }],
                content:
                  "<p>Work on corporate development, partnerships, and strategic finance opportunities.</p>",
              },
            ],
          })
        ),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
      "https://api.ashbyhq.com/posting-api/job-board/plaid?includeCompensation=true": new Response(
        JSON.stringify(
          buildAshbyResponse([
            {
              id: "plaid-1",
              title: "Business Operations - Payments",
              updatedAt: "2026-06-28T11:30:00.000Z",
              department: "Business Operations",
              team: "Payments",
              location: "New York, New York",
              workplaceType: "Hybrid",
              employmentType: "Full-Time",
              jobUrl: "https://jobs.ashbyhq.com/plaid/plaid-1",
              isListed: true,
            },
          ])
        ),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    });

    const response = await GET(
      new NextRequest(
        "https://isaacavazquez.com/api/mba-jobs?companies=plaid,coinbase,google"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.errors).toEqual([]);
    expect(body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          companyId: "plaid",
          atsType: "ashby",
          title: "Business Operations - Payments",
        }),
        expect.objectContaining({
          companyId: "coinbase",
          atsType: "greenhouse",
          title: "Corporate Development Associate",
        }),
      ])
    );
    expect(body.sourceStatuses).toEqual([
      expect.objectContaining({ companyId: "plaid", status: "ok", jobCount: 1 }),
      expect.objectContaining({ companyId: "coinbase", status: "ok", jobCount: 1 }),
      expect.objectContaining({ companyId: "google", status: "skipped", jobCount: 0 }),
    ]);
  });

  it("returns partial success with company names when one upstream fails", async () => {
    installFetchMock({
      "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true": new Response(
        JSON.stringify(
          buildGreenhouseResponse({
            jobs: [
              {
                id: 1001,
                title: "MBA Product Intern",
                location: { name: "San Francisco, CA" },
                absolute_url: "https://example.com/jobs/1001",
                updated_at: "2026-04-14T16:00:00.000Z",
                departments: [{ name: "Product" }],
                content: "<p>Summer associate role for MBA students.</p>",
              },
            ],
          })
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
      "https://boards-api.greenhouse.io/v1/boards/brex/jobs?content=true": new Error(
        "upstream timeout"
      ),
    });

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/mba-jobs?companies=stripe,brex")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.jobs).toHaveLength(1);
    expect(body.errors).toEqual([
      {
        companyId: "brex",
        companyName: "Brex",
        message: "upstream timeout",
      },
    ]);
    expect(body.sourceStatuses).toEqual([
      expect.objectContaining({
        companyId: "stripe",
        status: "ok",
        jobCount: 1,
      }),
      expect.objectContaining({
        companyId: "brex",
        status: "failed",
        jobCount: 0,
        message: "upstream timeout",
      }),
    ]);
  });

  it("treats an explicit empty companies query as an empty scan", async () => {
    installFetchMock({});

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/mba-jobs?companies=")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(body.jobs).toEqual([]);
    expect(body.errors).toEqual([]);
    expect(body.companiesRequested).toEqual([]);
    expect(body.sourceStatuses).toEqual([]);
  });

  it("normalizes requested company ids and reports manual-only sources as skipped", async () => {
    installFetchMock({
      "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true": new Response(
        JSON.stringify(
          buildGreenhouseResponse({
            jobs: [
              {
                id: 5001,
                title: "MBA Product Intern",
                location: { name: "San Francisco, CA" },
                absolute_url: "https://example.com/jobs/5001",
                updated_at: "2026-04-14T16:00:00.000Z",
                departments: [{ name: "Product" }],
                content: "<p>MBA summer internship.</p>",
              },
            ],
          })
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
    });

    const response = await GET(
      new NextRequest(
        "https://isaacavazquez.com/api/mba-jobs?companies=STRIPE,stripe,microsoft,unknown"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(body.companiesRequested).toEqual(["stripe", "microsoft", "unknown"]);
    expect(body.sourceStatuses).toEqual([
      expect.objectContaining({
        companyId: "stripe",
        status: "ok",
        jobCount: 1,
      }),
      expect.objectContaining({
        companyId: "microsoft",
        status: "skipped",
        jobCount: 0,
      }),
    ]);
  });

  it("reports external leads as disabled when the opt-in is on without Adzuna keys", async () => {
    installFetchMock({});

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/mba-jobs?companies=&external=on")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(body.jobs).toEqual([]);
    expect(body.sourceStatuses).toEqual([
      expect.objectContaining({
        companyId: "external-adzuna",
        atsType: "external-api",
        status: "external-disabled",
        jobCount: 0,
      }),
    ]);
  });

  it("adds opt-in Adzuna leads, labels them, and dedupes them against direct jobs", async () => {
    process.env.ADZUNA_APP_ID = "test-id";
    process.env.ADZUNA_APP_KEY = "test-key";
    const adzunaUrl =
      "https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=test-id&app_key=test-key&results_per_page=25&what=MBA+intern+product+marketing+strategy+operations+finance+growth&content-type=application%2Fjson";

    installFetchMock({
      "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true": new Response(
        JSON.stringify(
          buildGreenhouseResponse({
            jobs: [
              {
                id: 6101,
                title: "MBA Product Intern",
                location: { name: "San Francisco, CA" },
                absolute_url: "https://example.com/jobs/6101",
                updated_at: "2026-04-14T16:00:00.000Z",
                departments: [{ name: "Product" }],
                content: "<p>MBA summer product internship.</p>",
              },
            ],
          })
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
      [adzunaUrl]: new Response(
        JSON.stringify({
          results: [
            {
              id: "ad-duplicate",
              title: "MBA Product Intern",
              company: { display_name: "Stripe" },
              location: { display_name: "San Francisco, CA" },
              category: { label: "Product" },
              description: "MBA summer product internship.",
              redirect_url: "https://example.com/jobs/6101",
              created: "2026-04-14T18:00:00Z",
            },
            {
              id: "ad-unique",
              title: "Strategic Finance Associate",
              company: { display_name: "External Fintech" },
              location: { display_name: "Remote" },
              category: { label: "Finance Jobs" },
              description: "Lead strategic finance planning and business operations.",
              redirect_url: "https://adzuna.example.com/jobs/ad-unique",
              created: "2026-04-14T17:00:00Z",
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
    });

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/mba-jobs?companies=stripe&external=on")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          companyId: "stripe",
          atsType: "greenhouse",
          title: "MBA Product Intern",
        }),
        expect.objectContaining({
          atsType: "external-api",
          sourceName: "Adzuna",
          sourceUrl: "https://adzuna.example.com/jobs/ad-unique",
          title: "Strategic Finance Associate",
        }),
      ])
    );
    expect(body.jobs.filter((job: { applyUrl: string }) => job.applyUrl === "https://example.com/jobs/6101")).toHaveLength(1);
    expect(body.sourceStatuses).toEqual([
      expect.objectContaining({ companyId: "stripe", status: "ok", jobCount: 1 }),
      expect.objectContaining({
        companyId: "external-adzuna",
        atsType: "external-api",
        status: "ok",
        jobCount: 2,
      }),
    ]);
  });
});
