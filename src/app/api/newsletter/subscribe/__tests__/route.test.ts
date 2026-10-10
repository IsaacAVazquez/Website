/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "../route";
import { newsletterRateLimiter } from "@/lib/rateLimit";

const mockFetch = jest.fn();
const originalFetch = global.fetch;
global.fetch = mockFetch;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
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
    mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ id: "contact_1" })));
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_CONTACTS_API_KEY;
    delete process.env.RESEND_NEWSLETTER_SEGMENT_ID;
  });

  it("uses a separate contact key without needing the sending key", async () => {
    process.env.RESEND_CONTACTS_API_KEY = "re_contacts";
    delete process.env.RESEND_API_KEY;
    const response = await POST(request({ email: "reader@example.com" }));
    expect(response.status).toBe(200);
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer re_contacts");
  });

  it("normalizes the email and adds the contact to the newsletter segment", async () => {
    const response = await POST(
      request({
        email: "  Reader@Example.com ",
        source: "agent_build_index",
      })
    );

    expect(response.status).toBe(200);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/contacts");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toEqual({
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
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([null, [], "reader@example.com", 12, true])(
    "rejects non-object JSON body %p without calling Resend",
    async (body) => {
      const response = await POST(request(body));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({ success: false });
      expect(mockFetch).not.toHaveBeenCalled();
    }
  );

  it("treats the honeypot as a successful no-op", async () => {
    const response = await POST(
      request({
        email: "bot@example.com",
        source: "writing",
        company: "Spam Company",
      })
    );

    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("is idempotent when the contact already exists", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        jsonResponse({ statusCode: 409, message: "Contact already exists" }, 409)
      )
    );

    const response = await POST(
      request({ email: "reader@example.com", source: "writing" })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it("returns a retryable response when Resend cannot be reached", async () => {
    mockFetch.mockRejectedValue(new Error("network unavailable"));

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
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });

  it.each([401, 403])(
    "tells the visitor the form is off when Resend rejects the key with %d",
    async (status) => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(jsonResponse({ statusCode: status, message: "restricted_api_key" }, status))
      );

      const response = await POST(
        request({ email: "reader@example.com", source: "agent_build_index" })
      );

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        message: expect.stringMatching(/down on my side, so nothing was saved/),
      });
    }
  );

  it("fails closed when Resend is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    const response = await POST(
      request({ email: "reader@example.com", source: "writing" })
    );

    expect(response.status).toBe(503);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
