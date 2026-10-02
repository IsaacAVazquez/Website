import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  getClientIp,
  newsletterRateLimiter,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { isRecord } from "@/lib/utils";
import { normalizeSubscriberEmail } from "@/lib/newsletterSubscription";

const ALLOWED_SOURCES = new Set(["writing", "agent_build_index"]);

interface SubscribePayload {
  email?: unknown;
  source?: unknown;
  company?: unknown;
}

function successResponse() {
  return NextResponse.json({
    success: true,
    message: "You are on the list.",
  });
}

export async function POST(request: NextRequest) {
  const rateLimit = newsletterRateLimiter.check(
    `newsletter:${getClientIp(request)}`
  );
  if (!rateLimit.success) {
    return rateLimitResponse(
      rateLimit,
      "Too many attempts. Please try again later."
    );
  }

  let payload: SubscribePayload;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }
    payload = body;
  } catch {
    return NextResponse.json(
      { success: false, message: "Enter a valid email address." },
      { status: 400 }
    );
  }

  // A filled honeypot is treated as a successful no-op so automated form
  // submitters get no useful signal about the filter.
  if (typeof payload.company === "string" && payload.company.trim()) {
    return successResponse();
  }

  const email = normalizeSubscriberEmail(payload.email);
  if (!email) {
    return NextResponse.json(
      { success: false, message: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const source =
    typeof payload.source === "string" && ALLOWED_SOURCES.has(payload.source)
      ? payload.source
      : "writing";
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    // Without this line a missing key looked like a quiet day for signups.
    logger.error("Newsletter signup is off because RESEND_API_KEY is not set", { source });
    return NextResponse.json(
      {
        success: false,
        message: "Email signup is temporarily unavailable.",
      },
      { status: 503 }
    );
  }

  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID?.trim();
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
        ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
      }),
    });
  } catch {
    logger.error("Newsletter contact creation request failed", { source });
    return NextResponse.json(
      {
        success: false,
        message: "I could not save that signup. Please try again.",
      },
      { status: 502 }
    );
  }

  if (!response.ok) {
    // Repeated signup should remain idempotent from the reader's perspective.
    if (response.status === 409) {
      return successResponse();
    }

    logger.error("Newsletter contact creation failed", {
      source,
      statusCode: response.status,
    });
    return NextResponse.json(
      {
        success: false,
        message: "I could not save that signup. Please try again.",
      },
      { status: 502 }
    );
  }

  return successResponse();
}
