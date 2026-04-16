"use client";

import { useState, useCallback } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

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

export function CoverLetterGenerator() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeContext, setResumeContext] = useState("");
  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = company.trim() && role.trim() && jobDescription.trim() && !isStreaming;

  const handleGenerate = useCallback(async () => {
    if (!canSubmit) return;
    setOutput("");
    setError(null);
    setIsStreaming(true);
    setCopied(false);

    try {
      const res = await fetch("/api/job-search/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          jobDescription: jobDescription.trim(),
          resumeContext: resumeContext.trim() || undefined,
        }),
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
  }, [canSubmit, company, role, jobDescription, resumeContext]);

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="home-card p-6 space-y-4" style={{ borderRadius: "18px" }}>
        <h3
          className="text-base font-semibold mb-0"
          style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
        >
          Generate a Cover Letter
        </h3>
        <p
          className="text-xs mb-0"
          style={{ color: "color-mix(in srgb, var(--home-ink) 50%, var(--home-paper))" }}
        >
          Paste a job description and get a tailored cover letter powered by Claude.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>
              Company <span style={{ color: "var(--color-error, #D94040)" }}>*</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              style={fieldStyle}
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

        <div>
          <label style={labelStyle}>
            Job Description <span style={{ color: "var(--color-error, #D94040)" }}>*</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={8}
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </div>

        <div>
          <label style={labelStyle}>Your Background (optional)</label>
          <textarea
            value={resumeContext}
            onChange={(e) => setResumeContext(e.target.value)}
            placeholder="Summarize your relevant experience, skills, and achievements..."
            rows={4}
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </div>

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
          {isStreaming ? "Generating..." : "Generate Cover Letter"}
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
          <div className="flex items-center justify-between">
            <h3
              className="text-base font-semibold mb-0"
              style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
            >
              Your Cover Letter
            </h3>
            {output && !isStreaming && (
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs rounded-md transition-colors"
                style={{
                  color: copied ? "var(--color-success, #2D8A4E)" : "var(--home-haze)",
                  background: copied
                    ? "color-mix(in srgb, var(--color-success, #2D8A4E) 10%, transparent)"
                    : "color-mix(in srgb, var(--home-haze) 10%, transparent)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-home-sans)",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <MarkdownRenderer content={output} isStreaming={isStreaming} />
        </div>
      )}
    </div>
  );
}
