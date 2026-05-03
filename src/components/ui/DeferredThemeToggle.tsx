"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ThemeToggleFallback } from "@/components/ui/ThemeToggleFallback";

interface DeferredThemeToggleProps {
  className?: string;
}

const LazyThemeToggle = dynamic<DeferredThemeToggleProps>(
  () => import("@/components/ui/ThemeToggle.js").then((module) => module.ThemeToggle),
  { ssr: false }
);

export function DeferredThemeToggle({ className }: DeferredThemeToggleProps) {
  return (
    <Suspense fallback={<ThemeToggleFallback className={className} />}>
      <LazyThemeToggle className={className} />
    </Suspense>
  );
}
