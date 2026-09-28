"use client";

import dynamic from "next/dynamic";

interface DeferredThemeToggleProps {
  className?: string;
}

const LazyThemeToggle = dynamic<DeferredThemeToggleProps>(
  () => import("@/components/ui/ThemeToggle").then((module) => module.ThemeToggle),
  {
    ssr: false,
    // Holds the toggle's 44px while it loads. Without it the header grew 16 to
    // 26px when the toggle mounted, which was the whole of the layout shift on
    // every Catalog 97 route. With ssr: false, next/dynamic wraps the toggle in
    // its own Suspense boundary and renders this as the fallback.
    loading: () => <span aria-hidden="true" className="inline-block h-11 w-11 shrink-0" />,
  }
);

export function DeferredThemeToggle({ className }: DeferredThemeToggleProps) {
  return <LazyThemeToggle className={className} />;
}
