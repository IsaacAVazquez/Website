"use client";

import { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

function convertMarkdownToHtml(md: string): string {
  let html = md
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings (### > ## > #)
  html = html.replace(/^### (.+)$/gm, '<h4 style="margin-top:1.2em;margin-bottom:0.4em;font-size:15px;font-weight:600">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 style="margin-top:1.5em;margin-bottom:0.5em;font-size:17px;font-weight:600">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 style="margin-top:1.5em;margin-bottom:0.5em;font-size:19px;font-weight:600">$1</h2>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Unordered list items
  html = html.replace(/^- (.+)$/gm, '<li style="margin-left:1.2em;margin-bottom:0.3em;list-style:disc">$1</li>');

  // Numbered list items
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin-left:1.2em;margin-bottom:0.3em;list-style:decimal">$1</li>');

  // Paragraphs: wrap lines that aren't headings/list items/empty
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li")) return trimmed;
      // If the block is all list items, wrap in a list
      if (trimmed.split("\n").every((l) => l.trim().startsWith("<li"))) {
        return trimmed;
      }
      return `<p style="margin-bottom:0.8em">${trimmed}</p>`;
    })
    .join("\n");

  // Clean up stray newlines inside tags
  html = html.replace(/\n(?!<)/g, "<br>");

  return html;
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  const html = useMemo(() => {
    if (!content) return "";
    return convertMarkdownToHtml(content);
  }, [content]);

  return (
    <div className="relative">
      <div
        style={{
          color: "var(--home-ink)",
          fontFamily: "var(--font-home-sans)",
          fontSize: "14px",
          lineHeight: 1.7,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {isStreaming && (
        <span
          className="inline-block w-2 h-4 ml-0.5 animate-pulse"
          style={{ background: "var(--home-haze)", verticalAlign: "text-bottom" }}
          aria-label="Generating..."
        />
      )}
    </div>
  );
}
