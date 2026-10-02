"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import { useLocalStorageString } from "@/hooks/useLocalStorageString";
import { useMountOnFirstOpen } from "@/hooks/useMountOnFirstOpen";
import { FANTASY_COMPARE_STORAGE_KEY, parseIdList } from "@/lib/fantasyLocal";

import type { CompareTray } from "./CompareTray";

const preloadTray = () => import("./CompareTray");

const LazyCompareTray = dynamic(
  () => import("./CompareTray").then((module) => module.CompareTray),
  // `loading` is what gives the tray its own Suspense boundary. Without it the
  // first pin suspends up to the route's loading.tsx and blanks the page.
  { loading: () => null },
);

/**
 * The compare tray, kept out of first load. It shows nothing until a player is
 * pinned, and it carries the compare modal.
 *
 * It reads the pinned ids itself so the board around it takes no new
 * subscription. It counts raw ids, not resolved players, because the tray also
 * reports pins that belong to another board. Its code loads in idle time, so
 * the first pin shows the tray at once.
 */
export function DeferredCompareTray(props: ComponentProps<typeof CompareTray>) {
  const pinned = useLocalStorageString(FANTASY_COMPARE_STORAGE_KEY, "[]");
  const mounted = useMountOnFirstOpen(parseIdList(pinned).length > 0, preloadTray);
  return mounted ? <LazyCompareTray {...props} /> : null;
}
