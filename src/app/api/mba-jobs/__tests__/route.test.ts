/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "../route";

const originalFetch = global.fetch;
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

function buildGreenhouseResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    jobs: [],
    ...overrides,
  };
}

function buildAshbyPage(slug: string, jobs: object[]) {
  return `<!doctype html><html><body><script>window.__appData = ${JSON.stringify({
    organization: { hostedJobsPageSlug: slug },
    jobBoard: { jobPostings: jobs },
  })};
fetch("https://cdn.ashbyprd.com/frontend_non_user/example/.vite/manifest.json");</script></body></html>`;
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
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: mockFetch,
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: originalFetch,
      writable: true,
    });
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
      "https://jobs.ashbyhq.com/notion": new Response(
        buildAshbyPage("notion", [
          {
            id: "ashby-1",
            title: "PMM Manager",
            updatedAt: "2026-04-12T11:30:00.000Z",
            departmentName: "Marketing",
            teamName: "Product Marketing",
            locationName: "San Francisco, California",
            workplaceType: "Hybrid",
            employmentType: "Full-Time",
            isListed: true,
          },
          {
            id: "ashby-2",
            title: "Chief of Staff to the COO",
            updatedAt: "2026-04-12T10:00:00.000Z",
            departmentName: "Operations",
            teamName: "Office of the CEO",
            locationName: "New York, New York",
            workplaceType: "Hybrid",
            employmentType: "Full-Time",
            isListed: true,
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
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
          roleFamilies: ["operations", "chief-of-staff"],
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
      "https://jobs.ashbyhq.com/openai": new Response(
        buildAshbyPage("openai", [
          {
            id: "openai-1",
            title: "Corporate Development Associate",
            updatedAt: "2026-04-14T15:30:00.000Z",
            departmentName: "Business",
            teamName: "Corporate Development",
            locationName: "San Francisco",
            employmentType: "Full-Time",
            isListed: true,
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
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
        "https://jobs.ashbyhq.com/openai",
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
      "https://jobs.ashbyhq.com/ramp": new Response(
        buildAshbyPage("ramp", [
          {
            id: "ramp-1",
            title: "Strategic Finance Lead",
            updatedAt: "2026-04-14T14:00:00.000Z",
            departmentName: "Finance",
            teamName: "Strategic Finance",
            locationName: "New York, NY",
            employmentType: "Full-Time",
            isListed: true,
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
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
        "https://jobs.ashbyhq.com/ramp",
        "https://us.miro.com/careers/open-positions/",
        "https://us.miro.com/careers/vacancy/8436222002/",
      ])
    );
    expect(mockFetch.mock.calls.map(([input]) => String(input))).not.toEqual(
      expect.arrayContaining(["https://www.lifeatcanva.com/en/jobs/"])
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
      ])
    );
    expect(body.jobs.map((job: { title: string }) => job.title)).not.toEqual(
      expect.arrayContaining(["Backend Software Engineer"])
    );
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
  });
});
