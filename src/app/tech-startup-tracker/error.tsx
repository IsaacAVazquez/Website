"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

export default function TechStartupTrackerError({
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
      surfaceName="the Tech Startup Tracker"
    />
  );
}
