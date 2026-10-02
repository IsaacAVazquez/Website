"use client";

import { startTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Keeps a dashboard's URL on `desiredHref` with a scroll-free replace, and
 * returns a push for user navigation that skips hrefs already in the bar.
 */
export function useRouteSync(route: string, desiredHref: string) {
  const router = useRouter();
  const query = useSearchParams().toString();
  const currentHref = `${route}${query ? `?${query}` : ""}`;

  useEffect(() => {
    if (currentHref === desiredHref) return;
    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  return function pushHref(href: string) {
    if (href === currentHref) return;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };
}
