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

      // The block sits on the field tint, so the button takes the ink of the
      // enclosing surface and repaints with it in dark mode.
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Copy code";
      button.style.cssText = [
        "position:absolute",
        "top:var(--c97-sp-1)",
        "right:var(--c97-sp-1)",
        "min-height:44px",
        "min-width:44px",
        "padding:0 var(--c97-sp-2)",
        "font-size:var(--c97-fs-label)",
        "letter-spacing:0.08em",
        "text-transform:uppercase",
        "border:0",
        "border-radius:0",
        "cursor:pointer",
        "background:var(--c97-ink-2)",
        "color:var(--c97-surface)",
        "font-family:inherit",
      ].join(";");

      // Room above the first line so the button never covers code.
      const previousPaddingTop = pre.style.paddingTop;
      pre.style.paddingTop = "var(--c97-sp-6)";

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
