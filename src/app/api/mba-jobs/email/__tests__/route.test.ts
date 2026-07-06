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

// The route exposes its daily-counter reset on globalThis under a well-known
// Symbol because Next.js route-type checking forbids extra route exports.
function resetMbaEmailDailyCounter(): void {
  const reset = (globalThis as Record<symbol, unknown>)[
    Symbol.for("__mbaEmailDailyCounterResetForTesting")
  ];
  if (typeof reset === "function") (reset as () => void)();
}

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
      // The per-IP rate limit is keyed on the trusted client IP, so give each
      // distinct `client` a distinct IP (and a fixed `client` a stable one).
      "x-nf-client-connection-ip": `ip-${client}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/mba-jobs/email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Module-level daily counter persists across tests; reset so the
    // per-day ceiling does not leak between cases.
    resetMbaEmailDailyCounter();
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
    // The route now sends `to` as an array (deduped, lowercased) so the
    // per-request ceiling can also constrain future multi-recipient calls.
    expect(emailPayload.to).toEqual(["allowed@example.com"]);
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

  it("caps an oversized digest to 25 jobs instead of rejecting it", async () => {
    const response = await POST(
      makeRequest({
        to: "allowed@example.com",
        jobs: Array.from({ length: 30 }, (_, index) => ({
          ...validJob,
          id: `job-${index}`,
          title: `MBA Role ${index}`,
          applyUrl: `https://jobs.example.com/apply/${index}`,
        })),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const emailPayload = mockSend.mock.calls[0][0];
    // Capped to the first 25 entries: role 24 is kept, roles 25+ are dropped.
    expect(emailPayload.html).toContain("25 MBA role");
    expect(emailPayload.html).toContain("MBA Role 24");
    expect(emailPayload.html).not.toContain("MBA Role 25");
    expect(emailPayload.html).not.toContain("MBA Role 29");
  });

  it("skips undated / direct-HTML jobs and sends only the valid ones", async () => {
    const response = await POST(
      makeRequest({
        to: "allowed@example.com",
        jobs: [
          {
            ...validJob,
            id: "valid-1",
            title: "Valid Role One",
            applyUrl: "https://jobs.example.com/apply/1",
          },
          {
            ...validJob,
            id: "undated-1",
            title: "Undated Direct HTML Role",
            postedAt: "",
            applyUrl: "https://jobs.example.com/apply/2",
          },
          {
            ...validJob,
            id: "valid-2",
            title: "Valid Role Two",
            applyUrl: "https://jobs.example.com/apply/3",
          },
          {
            ...validJob,
            id: "bad-date-1",
            title: "Unparsable Date Role",
            postedAt: "not-a-real-date",
            applyUrl: "https://jobs.example.com/apply/4",
          },
        ],
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const emailPayload = mockSend.mock.calls[0][0];
    expect(emailPayload.html).toContain("Valid Role One");
    expect(emailPayload.html).toContain("Valid Role Two");
    expect(emailPayload.html).not.toContain("Undated Direct HTML Role");
    expect(emailPayload.html).not.toContain("Unparsable Date Role");
    // Only the two dated jobs survive the filter.
    expect(emailPayload.html).toContain("2 MBA role");
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

  it("rejects requests with more than 5 recipients in the to array", async () => {
    process.env.MBA_DIGEST_ALLOWED_RECIPIENTS = "*";

    const response = await POST(
      makeRequest({
        to: [
          "one@example.com",
          "two@example.com",
          "three@example.com",
          "four@example.com",
          "five@example.com",
          "six@example.com",
        ],
        jobs: [validJob],
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/at most 5 recipients/i);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("dedupes recipients before applying the per-request ceiling", async () => {
    process.env.MBA_DIGEST_ALLOWED_RECIPIENTS = "*";

    const response = await POST(
      makeRequest({
        // Six entries but only five unique addresses after lowercasing.
        to: [
          "one@example.com",
          "ONE@example.com",
          "two@example.com",
          "three@example.com",
          "four@example.com",
          "five@example.com",
        ],
        jobs: [validJob],
      })
    );

    expect(response.status).toBe(200);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const emailPayload = mockSend.mock.calls[0][0];
    expect(emailPayload.to).toHaveLength(5);
  });

  it("returns 429 when the per-day recipient ceiling would be exceeded", async () => {
    process.env.MBA_DIGEST_ALLOWED_RECIPIENTS = "*";

    // Exhaust the day: 10 requests of 5 recipients each = 50 (the cap).
    // Each request comes from a unique client so the per-IP rate limit
    // does not trip first.
    for (let i = 0; i < 10; i += 1) {
      const response = await POST(
        makeRequest(
          {
            to: [
              `a${i}@example.com`,
              `b${i}@example.com`,
              `c${i}@example.com`,
              `d${i}@example.com`,
              `e${i}@example.com`,
            ],
            jobs: [validJob],
          },
          `daily-cap-${i}`
        )
      );
      expect(response.status).toBe(200);
    }

    // The next request — even with a single recipient — should hit the cap.
    const overflow = await POST(
      makeRequest({ to: "overflow@example.com", jobs: [validJob] }, "daily-cap-overflow")
    );
    const body = await overflow.json();

    expect(overflow.status).toBe(429);
    expect(body.error).toMatch(/Daily email digest cap/i);
    expect(mockSend).toHaveBeenCalledTimes(10);
  });
});
