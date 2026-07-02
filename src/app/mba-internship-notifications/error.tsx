"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

export default function MbaJobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary error={error} reset={reset} surfaceName="the MBA internship tracker" />;
}
