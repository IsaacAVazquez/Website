"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

interface DeferredThemeToggleProps {
  className?: string;
}

// Holds the toggle's 44px while it loads. Without it the header grew 16 to
// 26px when the toggle mounted, which was the whole of the layout shift on
// every Catalog 97 route.
const placeholder = <span aria-hidden="true" className="inline-block h-11 w-11 shrink-0" />;

const LazyThemeToggle = dynamic<DeferredThemeToggleProps>(
  () => import("@/components/ui/ThemeToggle").then((module) => module.ThemeToggle),
  { ssr: false, loading: () => placeholder }
);

export function DeferredThemeToggle({ className }: DeferredThemeToggleProps) {
  // This boundary's fallback never renders, since next/dynamic shows `loading`
  // from a boundary of its own, and it still has to be here. Without it React
  // held the hydration of the page content for about 225 ms on every dashboard.
  return (
    <Suspense fallback={placeholder}>
      <LazyThemeToggle className={className} />
    </Suspense>
  );
}
