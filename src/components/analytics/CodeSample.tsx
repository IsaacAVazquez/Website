"use client";

import { useState } from "react";
import { trackCodeCopy } from "@/lib/analytics";

interface CodeSampleProps {
  code: string;
  /** Language hint, e.g. "ts", "bash". Shown as a label and sent to GA. */
  language?: string;
  /** Stable id for the snippet (used as the GA `snippet_id`). */
  id?: string;
  /** Surface this sample lives on (GA `code_location`). */
  location?: string;
}

/**
 * A code sample with a copy-to-clipboard button. The copy action fires a GA4
 * `code_copy` event (a no-op when analytics is disabled) without otherwise
 * changing behaviour — the clipboard write happens regardless.
 *
 * It sits on the field tint rather than on inverted ink, the same treatment
 * `.c97-article pre` gives a code block, so it stays calm in dark mode.
 */
export function CodeSample({
  code,
  language,
  id,
  location = "code_sample",
}: CodeSampleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can reject (permissions / insecure context) — tracking the
      // intent is still useful and must never throw into the UI.
    }
    trackCodeCopy({
      code_location: location,
      code_language: language,
      snippet_id: id,
      char_count: code.length,
    });
  };

  return (
    <div style={{ background: "var(--c97-field)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--c97-sp-2)",
          minHeight: 44,
          padding: "0 var(--c97-sp-2)",
          borderBottom: "1px solid var(--c97-rule)",
        }}
      >
        <span className="c97-kicker">{language ?? "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="c97-btn-ghost"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className="c97-mono"
        style={{
          fontSize: "var(--c97-fs-small)",
          lineHeight: "var(--c97-lh-body)",
          color: "var(--c97-ink)",
          padding: "var(--c97-sp-2)",
          overflowX: "auto",
          margin: 0,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
