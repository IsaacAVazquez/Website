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
    <div
      className="relative my-4 overflow-hidden rounded-[var(--radius-xl)]"
      style={{
        background: "var(--home-ink)",
        border: "1px solid var(--home-rule)",
      }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-2"
        style={{
          borderBottom: "1px solid color-mix(in srgb, var(--home-paper) 18%, transparent)",
        }}
      >
        <span
          className="text-xs uppercase tracking-wider"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            color: "color-mix(in srgb, var(--home-paper) 64%, transparent)",
          }}
        >
          {language ?? "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="inline-flex min-h-[32px] items-center rounded-md px-2.5 py-1 text-xs font-semibold transition-colors"
          style={{
            fontFamily: "var(--font-home-sans)",
            background: "color-mix(in srgb, var(--home-paper) 14%, transparent)",
            color: "var(--home-paper)",
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className="overflow-x-auto px-4 py-3 text-sm leading-6"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          color: "var(--home-paper)",
          margin: 0,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
