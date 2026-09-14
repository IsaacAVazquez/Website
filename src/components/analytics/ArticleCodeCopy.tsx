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

      // Code blocks sit on paper in both themes, so the button takes ink on
      // raised paper. The old paper-on-paper styling measured 1.06:1.
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Copy code";
      button.style.cssText = [
        "position:absolute",
        "top:0.25rem",
        "right:0.25rem",
        "min-height:44px",
        "min-width:44px",
        "padding:0 0.75rem",
        "font-size:0.75rem",
        "font-weight:600",
        "border-radius:2px",
        "cursor:pointer",
        "border:1px solid var(--home-rule)",
        "background:var(--home-paper-raised)",
        "color:var(--home-ink)",
        "font-family:var(--font-home-sans)",
      ].join(";");

      // Room above the first line so the button never covers code.
      const previousPaddingTop = pre.style.paddingTop;
      pre.style.paddingTop = "3.5rem";

      // The button text change is not announced, so a status region says it.
      const status = document.createElement("span");
      status.className = "sr-only";
      status.setAttribute("role", "status");

      const onClick = async () => {
        const text = codeEl?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "Copied";
          status.textContent = "Code copied to clipboard";
          window.setTimeout(() => {
            button.textContent = "Copy code";
            status.textContent = "";
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
      pre.appendChild(status);

      cleanups.push(() => {
        button.removeEventListener("click", onClick);
        button.remove();
        status.remove();
        pre.style.paddingTop = previousPaddingTop;
        delete pre.dataset.copyEnhanced;
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [containerSelector, location]);

  return null;
}
