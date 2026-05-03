import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { emailDigestRateLimiter, getClientIdentifier, rateLimitResponse } from "@/lib/rateLimit";

// ---------------------------------------------------------------------------
// POST /api/mba-jobs/email — send an email digest of MBA job listings via Resend
// ---------------------------------------------------------------------------

interface EmailRequestBody {
  jobs?: unknown;
  to?: unknown;
}

interface EmailDigestJob {
  companyName: string;
  title: string;
  location: string;
  department: string;
  applyUrl: string;
  postedAt: string;
}

const MAX_BODY_BYTES = 64_000;
const MAX_DIGEST_JOBS = 25;
const MAX_EMAIL_LENGTH = 254;
const MAX_TEXT_LENGTH = 160;

// Hard ceilings — independent of the env allowlist. Even if
// MBA_DIGEST_ALLOWED_RECIPIENTS=* is misconfigured, these cap the blast
// radius. Per-request limit prevents abuse via the API; per-day limit
// prevents an attacker from spamming many small requests.
const MAX_RECIPIENTS_PER_REQUEST = 5;
const MAX_RECIPIENTS_PER_DAY = 50;

interface DailyRecipientCounter {
  date: string; // UTC YYYY-MM-DD
  count: number;
}

let dailyRecipientCounter: DailyRecipientCounter = {
  date: new Date().toISOString().slice(0, 10),
  count: 0,
};

function getCurrentUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function resetCounterIfNewDay(): void {
  const today = getCurrentUtcDate();
  if (dailyRecipientCounter.date !== today) {
    dailyRecipientCounter = { date: today, count: 0 };
  }
}

function tryReserveDailyRecipientSlots(count: number): boolean {
  resetCounterIfNewDay();
  if (dailyRecipientCounter.count + count > MAX_RECIPIENTS_PER_DAY) {
    return false;
  }
  dailyRecipientCounter.count += count;
  return true;
}

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function json(body: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...RESPONSE_HEADERS,
      ...init?.headers,
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeText(value: unknown, fallback?: string): string | null {
  if (typeof value !== "string") return fallback ?? null;

  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return fallback ?? null;

  return trimmed.slice(0, MAX_TEXT_LENGTH);
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const email = value.trim().toLowerCase();
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  return email;
}

function parseAllowedRecipients(): string[] {
  return (process.env.MBA_DIGEST_ALLOWED_RECIPIENTS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedRecipient(email: string): boolean {
  const allowedRecipients = parseAllowedRecipients();
  if (allowedRecipients.length === 0) return false;

  return allowedRecipients.some((allowed) => {
    if (allowed === "*") return true;
    if (allowed.startsWith("@")) return email.endsWith(allowed);
    return email === allowed;
  });
}

function normalizeApplyUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function normalizePostedAt(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;

  return new Date(timestamp).toISOString();
}

function normalizeJob(value: unknown): EmailDigestJob | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const companyName = normalizeText(candidate.companyName);
  const title = normalizeText(candidate.title);
  const location = normalizeText(candidate.location, "Remote");
  const department = normalizeText(candidate.department, "General");
  const applyUrl = normalizeApplyUrl(candidate.applyUrl);
  const postedAt = normalizePostedAt(candidate.postedAt);

  if (!companyName || !title || !location || !department || !applyUrl || !postedAt) {
    return null;
  }

  return {
    companyName,
    title,
    location,
    department,
    applyUrl,
    postedAt,
  };
}

function normalizeJobs(value: unknown): EmailDigestJob[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_DIGEST_JOBS) {
    return null;
  }

  const jobs = value.map(normalizeJob);
  if (jobs.some((job) => job === null)) return null;

  return jobs as EmailDigestJob[];
}

function buildEmailHtml(jobs: EmailDigestJob[], to: string): string {
  const grouped = new Map<string, EmailDigestJob[]>();
  for (const job of jobs) {
    const existing = grouped.get(job.companyName) ?? [];
    existing.push(job);
    grouped.set(job.companyName, existing);
  }

  const rows = Array.from(grouped.entries())
    .map(([company, companyJobs]) => {
      const jobRows = companyJobs
        .map(
          (j) => `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;">
            <a href="${escapeHtml(j.applyUrl)}" style="font-weight:600;color:#5672F8;text-decoration:none;">${escapeHtml(j.title)}</a>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">${escapeHtml(j.department)} · ${escapeHtml(j.location)} · ${escapeHtml(formatDate(j.postedAt))}</div>
          </td>
        </tr>`
        )
        .join("");
      return `
      <tr>
        <td style="padding:14px 16px 4px;background:#f9fafb;font-weight:700;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">
          ${escapeHtml(company)}
        </td>
      </tr>
      ${jobRows}`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Job Search Digest</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#12110F;padding:24px 32px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#D7E74F;">Job Search</p>
              <h1 style="margin:6px 0 0;font-size:24px;font-weight:700;color:#F4EEE1;">Your latest digest</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 8px;">
              <p style="margin:0;font-size:14px;color:#6b7280;">
                Found <strong style="color:#111827;">${jobs.length} MBA role${jobs.length === 1 ? "" : "s"}</strong> across ${grouped.size} compan${grouped.size === 1 ? "y" : "ies"}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 16px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                ${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Sent to ${escapeHtml(to)} · <a href="https://isaacavazquez.com/mba-internship-notifications" style="color:#5672F8;">Open tracker</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: "Email digest request is too large." }, { status: 413 });
  }

  const clientId = getClientIdentifier(request);
  const rateLimitResult = emailDigestRateLimiter.check(clientId);
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return json(
      { error: "Email delivery is not configured." },
      { status: 503 }
    );
  }

  let body: EmailRequestBody;
  try {
    body = (await request.json()) as EmailRequestBody;
  } catch {
    return json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Normalize `to` to a unique recipient list. Today the body sends a single
  // string, but we accept either string or string[] so the per-request ceiling
  // also constrains any future expansion of the API.
  const toCandidates: unknown[] = Array.isArray(body.to) ? body.to : [body.to];
  const recipientSet = new Set<string>();
  for (const candidate of toCandidates) {
    const normalized = normalizeEmail(candidate);
    if (normalized) {
      recipientSet.add(normalized);
    }
  }
  const recipients = Array.from(recipientSet);

  if (recipients.length === 0) {
    return json({ error: "Invalid email address." }, { status: 400 });
  }

  // Hardcoded per-request ceiling. Independent of env allowlist.
  if (recipients.length > MAX_RECIPIENTS_PER_REQUEST) {
    return json(
      {
        error: `A single digest may target at most ${MAX_RECIPIENTS_PER_REQUEST} recipients.`,
      },
      { status: 400 }
    );
  }

  for (const recipient of recipients) {
    if (!isAllowedRecipient(recipient)) {
      return json(
        { error: "Email digests are limited to approved recipients." },
        { status: 403 }
      );
    }
  }

  // Hardcoded per-day ceiling across all IPs. Independent of env allowlist.
  if (!tryReserveDailyRecipientSlots(recipients.length)) {
    return json(
      {
        error: `Daily email digest cap reached (${MAX_RECIPIENTS_PER_DAY} recipients/day). Try again tomorrow.`,
      },
      { status: 429 }
    );
  }

  // Backward-compat: existing call sites send a single recipient and expect
  // the response to mention that recipient, so keep `to` for downstream use.
  const to = recipients[0];

  const jobs = normalizeJobs(body.jobs);
  if (!jobs) {
    return json(
      { error: `Provide 1-${MAX_DIGEST_JOBS} valid jobs for the digest.` },
      { status: 400 }
    );
  }

  const resend = new Resend(apiKey);
  const subject =
    jobs.length === 1
      ? `1 new MBA role`
      : `${jobs.length} MBA roles — digest`;

  try {
    const result = await resend.emails.send({
      from: "MBA Tracker <no-reply@isaacavazquez.com>",
      to: recipients,
      subject,
      html: buildEmailHtml(jobs, to),
    });

    if (result.error) {
      console.error("MBA jobs email provider error:", result.error.message);
      return json({ error: "Email provider failed to send digest." }, { status: 502 });
    }

    return json({ ok: true, id: result.data?.id });
  } catch (err) {
    console.error("MBA jobs email send failed:", (err as Error)?.message ?? err);
    return json({ error: "Failed to send email digest." }, { status: 500 });
  }
}

// Test-only side channel. Next.js route-type checking forbids non-handler
// exports, so the daily-counter reset is hung off a Symbol on `globalThis`.
// Tests call `(globalThis as any)[Symbol.for(...)]()` between cases to clear
// the module-level daily recipient counter. Do not call from production.
(globalThis as Record<symbol, unknown>)[
  Symbol.for("__mbaEmailDailyCounterResetForTesting")
] = (): void => {
  dailyRecipientCounter = {
    date: new Date().toISOString().slice(0, 10),
    count: 0,
  };
};
