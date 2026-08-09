"use client";

import { Catalog97Shell } from "@/components/catalog97/Catalog97Shell";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

export default function DashboardsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Catalog97Shell>
      <RouteErrorBoundary
        error={error}
        reset={reset}
        surfaceName="the dashboard index"
      />
    </Catalog97Shell>
  );
}
