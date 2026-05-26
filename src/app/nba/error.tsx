"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

export default function NbaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary error={error} reset={reset} surfaceName="the NBA dashboard" />;
}
