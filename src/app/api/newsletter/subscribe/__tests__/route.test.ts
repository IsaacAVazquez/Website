/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "../route";
import { newsletterRateLimiter } from "@/lib/rateLimit";

const createContact = jest.fn();

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    contacts: {
      create: createContact,
    },
  })),
}));

function request(
  body: unknown,
  ip = "203.0.113.10"
): NextRequest {
  return new NextRequest("http://localhost/api/newsletter/subscribe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-nf-client-connection-ip": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("newsletter subscribe route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    newsletterRateLimiter.reset();
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_NEWSLETTER_SEGMENT_ID = "seg_test";
    createContact.mockResolvedValue({
      data: { id: "contact_1" },
      error: null,
    });
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_NEWSLETTER_SEGMENT_ID;
  });

  it("normalizes the email and adds the contact to the newsletter segment", async () => {
    const response = await POST(
      request({
        email: "  Reader@Example.com ",
        source: "agent_build_index",
      })
    );

    expect(response.status).toBe(200);
    expect(createContact).toHaveBeenCalledWith({
      email: "reader@example.com",
      unsubscribed: false,
      segments: [{ id: "seg_test" }],
    });
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it("rejects an invalid email without calling Resend", async () => {
    const response = await POST(
      request({ email: "not-an-email", source: "writing" })
    );

    expect(response.status).toBe(400);
    expect(createContact).not.toHaveBeenCalled();
  });

  it("treats the honeypot as a successful no-op", async () => {
    const response = await POST(
      request({
        email: "bot@example.com",
        source: "writing",
        company: "Spam Company",
      })
    );

    expect(response.status).toBe(200);
    expect(createContact).not.toHaveBeenCalled();
  });

  it("is idempotent when the contact already exists", async () => {
    createContact.mockResolvedValue({
      data: null,
      error: { statusCode: 409, message: "Contact already exists" },
    });

    const response = await POST(
      request({ email: "reader@example.com", source: "writing" })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it("returns a retryable response when Resend cannot be reached", async () => {
    createContact.mockRejectedValue(new Error("network unavailable"));

    const response = await POST(
      request({ email: "reader@example.com", source: "writing" })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
    });
  });

  it("limits repeated signup attempts from one client", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await POST(
        request({ email: `reader${attempt}@example.com`, source: "writing" })
      );
      expect(response.status).toBe(200);
    }

    const response = await POST(
      request({ email: "reader5@example.com", source: "writing" })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
    await expect(response.json()).resolves.toMatchObject({
      message: "Too many attempts. Please try again later.",
    });
    expect(createContact).toHaveBeenCalledTimes(5);
  });

  it("fails closed when Resend is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    const response = await POST(
      request({ email: "reader@example.com", source: "writing" })
    );

    expect(response.status).toBe(503);
    expect(createContact).not.toHaveBeenCalled();
  });
});
