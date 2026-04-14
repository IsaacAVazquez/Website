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
      expect.arrayContaining(["Product Designer", "Legal Counsel"])
    );
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
          roleFamilies: ["product-marketing"],
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
