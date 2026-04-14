import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import type { MBAJob } from "@/types/mba-jobs";

// ---------------------------------------------------------------------------
// POST /api/mba-jobs/email — send an email digest of MBA job listings via Resend
// ---------------------------------------------------------------------------

interface EmailRequestBody {
  jobs: MBAJob[];
  to: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildEmailHtml(jobs: MBAJob[], to: string): string {
  const grouped = new Map<string, MBAJob[]>();
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
            <a href="${j.applyUrl}" style="font-weight:600;color:#5672F8;text-decoration:none;">${j.title}</a>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">${j.department} · ${j.location} · ${formatDate(j.postedAt)}</div>
          </td>
        </tr>`
        )
        .join("");
      return `
      <tr>
        <td style="padding:14px 16px 4px;background:#f9fafb;font-weight:700;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">
          ${company}
        </td>
      </tr>
      ${jobRows}`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>MBA Internship Digest</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#12110F;padding:24px 32px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#D7E74F;">MBA Internship Tracker</p>
              <h1 style="margin:6px 0 0;font-size:24px;font-weight:700;color:#F4EEE1;">Your latest digest</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 8px;">
              <p style="margin:0;font-size:14px;color:#6b7280;">
                Found <strong style="color:#111827;">${jobs.length} MBA internship role${jobs.length === 1 ? "" : "s"}</strong> across ${grouped.size} compan${grouped.size === 1 ? "y" : "ies"}.
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
              <p style="margin:0;font-size:12px;color:#9ca3af;">Sent to ${to} · <a href="https://isaacavazquez.com/mba-internship-notifications" style="color:#5672F8;">Open tracker</a></p>
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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured." },
      { status: 503 }
    );
  }

  let body: EmailRequestBody;
  try {
    body = (await request.json()) as EmailRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { jobs, to } = body;

  if (!to || typeof to !== "string" || !to.includes("@")) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return NextResponse.json({ error: "No jobs provided." }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const subject =
    jobs.length === 1
      ? `1 new MBA internship role`
      : `${jobs.length} MBA internship roles — digest`;

  try {
    const result = await resend.emails.send({
      from: "MBA Tracker <no-reply@isaacavazquez.com>",
      to,
      subject,
      html: buildEmailHtml(jobs, to),
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Failed to send email." },
      { status: 500 }
    );
  }
}
