"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ThemeToggleFallback } from "@/components/ui/ThemeToggleFallback";

interface DeferredThemeToggleProps {
  className?: string;
}

const LazyThemeToggle = dynamic<DeferredThemeToggleProps>(
  () => import("@/components/ui/ThemeToggle").then((module) => module.ThemeToggle),
  {
    ssr: false,
    // With ssr: false the Suspense fallback below never renders, so nothing held
    // the toggle's 44px and the header grew 16 to 26px when it mounted, which
    // was the whole of the layout shift on every Catalog 97 route.
    loading: () => <span aria-hidden="true" className="inline-block h-11 w-11 shrink-0" />,
  }
);

export function DeferredThemeToggle({ className }: DeferredThemeToggleProps) {
  return (
    <Suspense fallback={<ThemeToggleFallback className={className} />}>
      <LazyThemeToggle className={className} />
    </Suspense>
  );
}
