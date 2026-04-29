/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const mockSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

import { POST } from "../route";

const originalEnv = { ...process.env };

const validJob = {
  id: "job-1",
  companyId: "stripe",
  companyName: "Stripe",
  title: "MBA Product Intern",
  location: "San Francisco, CA",
  department: "Product",
  applyUrl: "https://jobs.example.com/apply/1",
  postedAt: "2026-04-01T00:00:00.000Z",
  atsType: "greenhouse",
  category: "fintech",
  snippet: null,
  roleType: "internship",
  roleFamilies: ["product"],
};

function makeRequest(
  body: unknown,
  client = Math.random().toString(36).slice(2),
  headers: Record<string, string> = {}
) {
  return new NextRequest("https://isaacavazquez.com/api/mba-jobs/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": `jest-${client}`,
      "X-Forwarded-For": `192.0.2.${client.length}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/mba-jobs/email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.MBA_DIGEST_ALLOWED_RECIPIENTS = "allowed@example.com,@haas.berkeley.edu";
    mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("sends a sanitized digest to an allowed recipient", async () => {
    const response = await POST(
      makeRequest({
        to: "Allowed@Example.com",
        jobs: [
          {
            ...validJob,
            companyName: "Stripe <script>alert(1)</script>",
            title: "<img src=x onerror=alert(1)> MBA role",
            department: "Product & Strategy",
            location: "Berkeley <b>CA</b>",
          },
        ],
      })
    );
    const body = await response.json();
    const emailPayload = mockSend.mock.calls[0][0];

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(emailPayload.to).toBe("allowed@example.com");
    expect(emailPayload.html).toContain("&lt;img");
    expect(emailPayload.html).toContain("Product &amp; Strategy");
    expect(emailPayload.html).not.toContain("<img src=x");
    expect(emailPayload.html).not.toContain("<script>alert");
  });

  it("rejects recipients outside the allowlist", async () => {
    const response = await POST(
      makeRequest({
        to: "attacker@example.net",
        jobs: [validJob],
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toMatch(/approved recipients/i);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects oversized job digests", async () => {
    const response = await POST(
      makeRequest({
        to: "allowed@example.com",
        jobs: Array.from({ length: 26 }, (_, index) => ({
          ...validJob,
          id: `job-${index}`,
          applyUrl: `https://jobs.example.com/apply/${index}`,
        })),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/1-25 valid jobs/i);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects unsafe apply URLs", async () => {
    const response = await POST(
      makeRequest({
        to: "allowed@example.com",
        jobs: [
          {
            ...validJob,
            applyUrl: "javascript:alert(1)",
          },
        ],
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/valid jobs/i);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rate limits repeated send attempts by client", async () => {
    const client = "rate-limit-client";
    const payload = { to: "allowed@example.com", jobs: [validJob] };

    for (let index = 0; index < 3; index += 1) {
      const response = await POST(makeRequest(payload, client));
      expect(response.status).toBe(200);
    }

    const limited = await POST(makeRequest(payload, client));
    const body = await limited.json();

    expect(limited.status).toBe(429);
    expect(body.error).toBe("Too many requests");
    expect(mockSend).toHaveBeenCalledTimes(3);
  });
});
