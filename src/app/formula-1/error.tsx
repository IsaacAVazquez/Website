"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

export default function FormulaOneError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorBoundary error={error} reset={reset} surfaceName="the Formula 1 dashboard" />
  );
}
