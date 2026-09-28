"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import { useLocalStorageString } from "@/hooks/useLocalStorageString";
import { useMountOnFirstOpen } from "@/hooks/useMountOnFirstOpen";
import { FANTASY_COMPARE_STORAGE_KEY, parseIdList } from "@/lib/fantasyLocal";

import type { CompareTray } from "./CompareTray";

const LazyCompareTray = dynamic(
  () => import("./CompareTray").then((module) => module.CompareTray),
  // `loading` is what gives the tray its own Suspense boundary. Without it the
  // first pin suspends up to the route's loading.tsx and blanks the page.
  { loading: () => null },
);

/**
 * The compare tray, loaded once a player is pinned. The tray shows nothing
 * until then, and it carries framer-motion and the compare modal.
 *
 * It reads the pinned ids itself so the board around it takes no new
 * subscription. It counts raw ids, not resolved players, because the tray also
 * reports pins that belong to another board. Nothing is preloaded, since most
 * visits never pin a player.
 */
export function DeferredCompareTray(props: ComponentProps<typeof CompareTray>) {
  const pinned = useLocalStorageString(FANTASY_COMPARE_STORAGE_KEY, "[]");
  const mounted = useMountOnFirstOpen(parseIdList(pinned).length > 0);
  return mounted ? <LazyCompareTray {...props} /> : null;
}
