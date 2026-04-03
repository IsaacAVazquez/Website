"use client";

import dynamic from "next/dynamic";
import { ThemeToggleFallback } from "@/components/ui/ThemeToggleFallback";

const LazyThemeToggle = dynamic(
  () => import("@/components/ui/ThemeToggle").then((module) => module.ThemeToggle),
  {
    ssr: false,
    loading: () => <ThemeToggleFallback />,
  }
);

export function DeferredThemeToggle() {
  return <LazyThemeToggle />;
}
