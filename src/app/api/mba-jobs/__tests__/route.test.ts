/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "../route";

const originalFetch = global.fetch;
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

function buildGreenhouseResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
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
      {
        id: 1002,
        title: "Senior Software Engineer",
        location: { name: "New York, NY" },
        absolute_url: "https://example.com/jobs/1002",
        updated_at: "2026-04-14T12:00:00.000Z",
        departments: [{ name: "Engineering" }],
        content: "<p>Backend role.</p>",
      },
    ],
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

function installFetchMock(
  responses: Record<string, Response | Error>,
) {
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

  it("returns MBA-filtered Greenhouse jobs from the current boards API", async () => {
    installFetchMock({
      "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true": new Response(
        JSON.stringify(buildGreenhouseResponse()),
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
    expect(body.jobs).toHaveLength(1);
    expect(body.jobs[0]).toEqual(
      expect.objectContaining({
        companyId: "stripe",
        companyName: "Stripe",
        title: "MBA Product Intern",
        department: "Product",
        applyUrl: "https://example.com/jobs/1001",
        atsType: "greenhouse",
      })
    );
  });

  it("parses Ashby public job board payloads", async () => {
    installFetchMock({
      "https://jobs.ashbyhq.com/notion": new Response(
        buildAshbyPage("notion", [
          {
            id: "ashby-1",
            title: "MBA Strategy Intern",
            updatedAt: "2026-04-12T11:30:00.000Z",
            departmentName: "Business",
            teamName: "Corporate Strategy",
            locationName: "San Francisco, California",
            workplaceType: "Hybrid",
            employmentType: "Internship",
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
    expect(body.jobs).toEqual([
      expect.objectContaining({
        companyId: "notion",
        companyName: "Notion",
        title: "MBA Strategy Intern",
        department: "Corporate Strategy",
        applyUrl: "https://jobs.ashbyhq.com/notion/ashby-1",
        atsType: "ashby",
      }),
    ]);
  });

  it("uses the configured provider adapters and skips manual companies", async () => {
    installFetchMock({
      "https://boards-api.greenhouse.io/v1/boards/reddit/jobs?content=true": new Response(
        JSON.stringify(buildGreenhouseResponse({
          jobs: [
            {
              id: 3001,
              title: "MBA Product Strategy Intern",
              location: { name: "Remote" },
              absolute_url: "https://example.com/reddit/3001",
              updated_at: "2026-04-14T17:00:00.000Z",
              departments: [{ name: "Product Strategy" }],
              content: "<p>MBA internship</p>",
            },
          ],
        })),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
      "https://jobs.ashbyhq.com/openai": new Response(
        buildAshbyPage("openai", [
          {
            id: "openai-1",
            title: "MBA Operations Intern",
            updatedAt: "2026-04-14T15:30:00.000Z",
            departmentName: "Operations",
            teamName: "Business Operations",
            locationName: "San Francisco",
            employmentType: "Internship",
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
        expect.objectContaining({ companyId: "reddit", atsType: "greenhouse" }),
        expect.objectContaining({ companyId: "openai", atsType: "ashby" }),
      ])
    );
  });

  it("returns partial success with company names when one upstream fails", async () => {
    installFetchMock({
      "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true": new Response(
        JSON.stringify(buildGreenhouseResponse()),
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
