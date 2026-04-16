import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

interface InterviewPrepRequest {
  jobDescription: string;
  role: string;
  mode: "questions" | "practice";
  questionToEvaluate?: string;
  userAnswer?: string;
}

function isValidRequest(body: unknown): body is InterviewPrepRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;

  if (typeof b.jobDescription !== "string" || !b.jobDescription.trim()) return false;
  if (typeof b.role !== "string" || !b.role.trim()) return false;
  if (b.mode !== "questions" && b.mode !== "practice") return false;

  if (b.mode === "practice") {
    if (typeof b.questionToEvaluate !== "string" || !b.questionToEvaluate.trim()) return false;
    if (typeof b.userAnswer !== "string" || !b.userAnswer.trim()) return false;
  }

  return true;
}

const QUESTIONS_SYSTEM_PROMPT = `You are an expert interview coach. Generate interview questions for the specified role. Output in markdown format with these sections:

## Behavioral Questions
Generate 5 behavioral questions using the STAR framework. For each question, include:
- The question
- **Why they ask this:** Brief explanation
- **Strong answer approach:** 2-3 sentence guidance

## Technical Questions
Generate 3 technical or domain-specific questions relevant to the role. For each:
- The question
- **What they're assessing:** Brief explanation
- **Key points to hit:** Bullet list of 2-3 talking points

## Role-Specific Questions
Generate 4 questions specific to the company/role based on the job description. For each:
- The question
- **What they're looking for:** Brief explanation
- **How to stand out:** 1-2 sentences of advice

Be specific to the actual role and job description provided. Avoid generic questions when possible.`;

const PRACTICE_SYSTEM_PROMPT = `You are an expert interview coach evaluating a candidate's answer to an interview question. Provide structured feedback in markdown format:

## Assessment

### What Landed Well
- Bullet points of strengths in the answer

### Areas to Strengthen
- Specific, actionable feedback on what could be improved

### Revised Example
Provide a polished version of their answer that incorporates your feedback. Keep their authentic voice but strengthen the structure and impact.

### Quick Tips
2-3 one-line tips for delivering this answer effectively in a real interview.

Be encouraging but honest. Focus on substance and structure, not just polish.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isValidRequest(body)) {
      return new Response(
        JSON.stringify({
          error:
            body && typeof body === "object" && (body as Record<string, unknown>).mode === "practice"
              ? "Missing required fields: jobDescription, role, questionToEvaluate, userAnswer"
              : "Missing required fields: jobDescription, role, mode",
        }),
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

    const isQuestions = body.mode === "questions";

    const userMessage = isQuestions
      ? `Job Description:\n${body.jobDescription.trim()}\n\nRole: ${body.role.trim()}`
      : `Job Description:\n${body.jobDescription.trim()}\n\nRole: ${body.role.trim()}\n\nInterview Question:\n${body.questionToEvaluate!.trim()}\n\nCandidate's Answer:\n${body.userAnswer!.trim()}`;

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-5-20241022",
      max_tokens: 2500,
      system: isQuestions ? QUESTIONS_SYSTEM_PROMPT : PRACTICE_SYSTEM_PROMPT,
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
    console.error("[interview-prep] Error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate interview prep" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
