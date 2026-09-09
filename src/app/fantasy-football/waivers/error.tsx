"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

export default function WaiverTargetsError({
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
      surfaceName="the fantasy football waiver targets"
    />
  );
}
