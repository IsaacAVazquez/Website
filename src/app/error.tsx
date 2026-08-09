"use client";

import { usePathname } from "next/navigation";
import { Catalog97Shell } from "@/components/catalog97/Catalog97Shell";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { isCatalog97Route } from "@/constants/catalog97Nav";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const boundary = <RouteErrorBoundary error={error} reset={reset} />;

  // Catalog97Shell normally lives inside each page component. A render error
  // can happen before that component mounts, while the pathname-based global
  // header and layout have already stood down. Keep the Catalog routes' header,
  // main landmark, skip-link target, and footer in that failure state too.
  return isCatalog97Route(pathname) ? (
    <Catalog97Shell>{boundary}</Catalog97Shell>
  ) : (
    boundary
  );
}
