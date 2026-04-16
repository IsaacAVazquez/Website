"use client";

import { useState, useCallback } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

type PrepMode = "questions" | "practice";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "10px",
  border: "1px solid var(--home-rule)",
  background: "var(--home-paper)",
  color: "var(--home-ink)",
  fontFamily: "var(--font-home-sans)",
  fontSize: "14px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  marginBottom: "4px",
  color: "color-mix(in srgb, var(--home-ink) 65%, var(--home-paper))",
  fontFamily: "var(--font-home-sans)",
};

export function InterviewPrepCoach() {
  const [mode, setMode] = useState<PrepMode>("questions");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Practice mode fields
  const [questionToEvaluate, setQuestionToEvaluate] = useState("");
  const [userAnswer, setUserAnswer] = useState("");

  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmitQuestions = role.trim() && jobDescription.trim() && !isStreaming;
  const canSubmitPractice =
    role.trim() &&
    jobDescription.trim() &&
    questionToEvaluate.trim() &&
    userAnswer.trim() &&
    !isStreaming;
  const canSubmit = mode === "questions" ? canSubmitQuestions : canSubmitPractice;

  const handleGenerate = useCallback(async () => {
    if (!canSubmit) return;
    setOutput("");
    setError(null);
    setIsStreaming(true);

    try {
      const payload: Record<string, string> = {
        jobDescription: jobDescription.trim(),
        role: role.trim(),
        mode,
      };

      if (mode === "practice") {
        payload.questionToEvaluate = questionToEvaluate.trim();
        payload.userAnswer = userAnswer.trim();
      }

      const res = await fetch("/api/job-search/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsStreaming(false);
    }
  }, [canSubmit, jobDescription, role, mode, questionToEvaluate, userAnswer]);

  return (
    <div className="space-y-6">
      <div className="home-card p-6 space-y-4" style={{ borderRadius: "18px" }}>
        <h3
          className="text-base font-semibold mb-0"
          style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
        >
          Interview Prep Coach
        </h3>
        <p
          className="text-xs mb-0"
          style={{ color: "color-mix(in srgb, var(--home-ink) 50%, var(--home-paper))" }}
        >
          Generate tailored interview questions or practice your answers with AI feedback.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-1" role="tablist" aria-label="Interview prep mode">
          {(["questions", "practice"] as PrepMode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setOutput("");
                setError(null);
              }}
              className="px-4 py-2 text-sm rounded-lg transition-colors"
              style={{
                fontFamily: "var(--font-home-sans)",
                fontWeight: mode === m ? 600 : 400,
                color: mode === m ? "var(--home-paper)" : "var(--home-ink)",
                background:
                  mode === m
                    ? "var(--home-haze)"
                    : "color-mix(in srgb, var(--home-ink) 6%, var(--home-paper))",
                border: "none",
                cursor: "pointer",
              }}
            >
              {m === "questions" ? "Generate Questions" : "Practice & Feedback"}
            </button>
          ))}
        </div>

        {/* Shared fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label style={labelStyle}>
              Job Description <span style={{ color: "var(--color-error, #D94040)" }}>*</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={6}
              style={{ ...fieldStyle, resize: "vertical" }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Role <span style={{ color: "var(--color-error, #D94040)" }}>*</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Senior Product Manager"
              style={fieldStyle}
            />
          </div>
        </div>

        {/* Practice mode fields */}
        {mode === "practice" && (
          <div className="space-y-4 pt-2">
            <div
              className="h-px"
              style={{ background: "var(--home-rule)" }}
            />
            <div>
              <label style={labelStyle}>
                Interview Question{" "}
                <span style={{ color: "var(--color-error, #D94040)" }}>*</span>
              </label>
              <textarea
                value={questionToEvaluate}
                onChange={(e) => setQuestionToEvaluate(e.target.value)}
                placeholder="e.g., Tell me about a time you had to influence a team without direct authority."
                rows={2}
                style={{ ...fieldStyle, resize: "vertical" }}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Your Answer{" "}
                <span style={{ color: "var(--color-error, #D94040)" }}>*</span>
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer as you would say it in an interview..."
                rows={6}
                style={{ ...fieldStyle, resize: "vertical" }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!canSubmit}
          className="px-5 py-2.5 text-sm rounded-lg font-medium transition-colors"
          style={{
            color: "var(--home-paper)",
            background: canSubmit ? "var(--home-haze)" : "var(--home-stone)",
            border: "none",
            cursor: canSubmit ? "pointer" : "not-allowed",
            fontFamily: "var(--font-home-sans)",
            opacity: canSubmit ? 1 : 0.6,
          }}
        >
          {isStreaming
            ? "Generating..."
            : mode === "questions"
              ? "Generate Questions"
              : "Get Feedback"}
        </button>
      </div>

      {error && (
        <div
          className="home-card p-4"
          style={{
            borderRadius: "14px",
            borderLeft: "3px solid var(--color-error, #D94040)",
          }}
        >
          <p
            className="text-sm mb-0"
            style={{ color: "var(--color-error, #D94040)", fontFamily: "var(--font-home-sans)" }}
          >
            {error}
          </p>
        </div>
      )}

      {(output || isStreaming) && (
        <div className="home-card p-6 space-y-4" style={{ borderRadius: "18px" }}>
          <h3
            className="text-base font-semibold mb-0"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {mode === "questions" ? "Interview Questions" : "Answer Feedback"}
          </h3>
          <MarkdownRenderer content={output} isStreaming={isStreaming} />
        </div>
      )}
    </div>
  );
}
