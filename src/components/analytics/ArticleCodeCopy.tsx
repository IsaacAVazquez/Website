"use client";

import { useEffect } from "react";
import { trackCodeCopy } from "@/lib/analytics";

interface ArticleCodeCopyProps {
  /** CSS selector for the rendered article container. */
  containerSelector: string;
  /** GA `code_location` for samples copied from this surface. */
  location?: string;
}

/**
 * Progressively enhances fenced code blocks inside server-rendered article HTML
 * (injected via `dangerouslySetInnerHTML`, so React can't own these nodes). It
 * attaches an unobtrusive "Copy" button to each `<pre>` and fires a GA4
 * `code_copy` event on use. Purely additive — it never alters the code itself,
 * and does nothing when analytics is disabled or no code blocks exist.
 */
export function ArticleCodeCopy({
  containerSelector,
  location = "article",
}: ArticleCodeCopyProps) {
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const blocks = Array.from(container.querySelectorAll("pre"));
    if (blocks.length === 0) return;

    const cleanups: (() => void)[] = [];

    blocks.forEach((pre, index) => {
      if (pre.dataset.copyEnhanced === "true") return;
      pre.dataset.copyEnhanced = "true";

      // Keep the absolutely-positioned button anchored to the block.
      if (getComputedStyle(pre).position === "static") {
        pre.style.position = "relative";
      }

      const codeEl = pre.querySelector("code");
      const languageClass = codeEl?.className.match(/language-([\w-]+)/);
      const language = languageClass?.[1];

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code to clipboard");
      button.style.cssText = [
        "position:absolute",
        "top:0.5rem",
        "right:0.5rem",
        "padding:0.25rem 0.6rem",
        "font-size:0.72rem",
        "font-weight:600",
        "border-radius:0.375rem",
        "cursor:pointer",
        "border:1px solid color-mix(in srgb, var(--home-paper) 24%, transparent)",
        "background:color-mix(in srgb, var(--home-paper) 14%, transparent)",
        "color:var(--home-paper)",
        "font-family:var(--font-home-sans)",
      ].join(";");

      const onClick = async () => {
        const text = codeEl?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "Copied";
          window.setTimeout(() => {
            button.textContent = "Copy";
          }, 1600);
        } catch {
          // Ignore clipboard failures — still record the intent below.
        }
        trackCodeCopy({
          code_location: location,
          code_language: language,
          snippet_id: `block-${index + 1}`,
          char_count: text.length,
        });
      };

      button.addEventListener("click", onClick);
      pre.appendChild(button);

      cleanups.push(() => {
        button.removeEventListener("click", onClick);
        button.remove();
        delete pre.dataset.copyEnhanced;
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [containerSelector, location]);

  return null;
}
