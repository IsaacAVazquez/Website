"use client";

import "./globals.css";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

/**
 * The last-resort boundary for a throw in the root layout itself (Providers,
 * ConditionalLayout, or the header every route renders), which `error.tsx`
 * cannot catch because it sits inside that layout. It replaces the whole
 * document, so it prints its own html and body and leaves out the shell, since
 * the header may be the component that crashed. The next/font variables and
 * the dark class are not set here, so it renders in fallback fonts and light.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="c97-page" data-c97 data-c97-surface="paper">
          <main id="main-content">
            <RouteErrorBoundary error={error} reset={reset} />
          </main>
        </div>
      </body>
    </html>
  );
}
