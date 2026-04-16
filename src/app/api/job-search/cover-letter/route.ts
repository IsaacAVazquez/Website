import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

interface CoverLetterRequest {
  jobDescription: string;
  company: string;
  role: string;
  resumeContext?: string;
}

function isValidRequest(body: unknown): body is CoverLetterRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.jobDescription === "string" &&
    b.jobDescription.trim().length > 0 &&
    typeof b.company === "string" &&
    b.company.trim().length > 0 &&
    typeof b.role === "string" &&
    b.role.trim().length > 0
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isValidRequest(body)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: jobDescription, company, role" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = new Anthropic({ apiKey });

    const userMessage = [
      `Job Description:\n${body.jobDescription.trim()}`,
      `\nCompany: ${body.company.trim()}`,
      `Role: ${body.role.trim()}`,
      body.resumeContext?.trim()
        ? `\nCandidate Background:\n${body.resumeContext.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-5-20241022",
      max_tokens: 1500,
      system: `You are an expert career coach and professional cover letter writer. Write a tailored, compelling cover letter for the specified job. Requirements:
- Address specific details from the job description
- Highlight relevant experience from the candidate's background if provided
- Use a confident, professional, and direct tone
- Keep it to 3-4 paragraphs — concise but substantive
- Output ONLY the letter text. No subject line, no preamble, no commentary
- Start directly with "Dear Hiring Manager," or similar appropriate salutation`,
      messages: [{ role: "user", content: userMessage }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("[cover-letter] Error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate cover letter" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
