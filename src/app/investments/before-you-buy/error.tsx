"use client";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

export default function BeforeYouBuyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary error={error} reset={reset} surfaceName="Before You Buy" />;
}
