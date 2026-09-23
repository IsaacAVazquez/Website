"use client";

import { useEffect } from "react";

/**
 * Arms every `[data-reveal]` element on the page and releases each one as it
 * scrolls into view, which is what the plate scale-in in `catalog97.css`
 * keys on. Nothing is armed under reduced motion or without JavaScript, so
 * the page is fully legible before and without it.
 */
export function Catalog97Reveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal", "shown");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((element) => {
      element.setAttribute("data-reveal", "armed");
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
