import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { getClientIp } from "@/lib/rateLimit";
import {
  checkNewsletterSubscriptionRateLimit,
  normalizeSubscriberEmail,
} from "@/lib/newsletterSubscription";

const ALLOWED_SOURCES = new Set([
  "writing",
  "agent_build_index",
  "fantasy_football",
]);

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
  const rateLimit = checkNewsletterSubscriptionRateLimit(
    getClientIp(request)
  );
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many attempts. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimit.retryAfterSeconds.toString(),
        },
      }
    );
  }

  let payload: SubscribePayload;
  try {
    payload = (await request.json()) as SubscribePayload;
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
    return NextResponse.json(
      {
        success: false,
        message: "Email signup is temporarily unavailable.",
      },
      { status: 503 }
    );
  }

  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID?.trim();
  const resend = new Resend(apiKey);
  let error: unknown;
  try {
    ({ error } = await resend.contacts.create({
      email,
      unsubscribed: false,
      ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
    }));
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

  if (error) {
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : null;

    // Repeated signup should remain idempotent from the reader's perspective.
    if (statusCode === 409) {
      return successResponse();
    }

    logger.error("Newsletter contact creation failed", {
      source,
      statusCode,
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
