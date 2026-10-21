"use client";

import { useEffect } from "react";
import { isAnalyticsEnabled, trackContactClick, trackResumeDownload } from "@/lib/analytics";
import { profile } from "@/lib/profile";

const RESUME_PDF = /\/Isaac_Vazquez_Resume\.pdf$/i;

function stripSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Global click delegation for résumé downloads and contact links, so the
 * server-rendered pages that hold those links (résumé, contact, footer, author
 * bio) need no client code of their own.
 *
 * Renders nothing and does no work when analytics is disabled.
 */
export function ActionClickTracker() {
  useEffect(() => {
    if (!isAnalyticsEnabled()) return;

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.href;
      const page_path = window.location.pathname;

      if (href.startsWith("mailto:")) {
        trackContactClick({ contact_method: "email", page_path });
      } else if (stripSlash(href) === stripSlash(profile.sameAs.linkedin)) {
        trackContactClick({ contact_method: "linkedin", page_path });
      } else if (stripSlash(href) === stripSlash(profile.sameAs.github)) {
        trackContactClick({ contact_method: "github", page_path });
      } else if (RESUME_PDF.test(anchor.pathname)) {
        trackResumeDownload({ page_path });
      }
    };

    // Capture phase, so a handler that stops propagation can't hide the click.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
