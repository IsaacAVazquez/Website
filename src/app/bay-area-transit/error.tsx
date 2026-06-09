"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

export default function BayAreaTransitError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      surfaceName="the Bay Area Transit dashboard"
    />
  );
}
