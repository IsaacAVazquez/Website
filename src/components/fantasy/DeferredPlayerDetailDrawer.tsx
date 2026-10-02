"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import { useMountOnFirstOpen } from "@/hooks/useMountOnFirstOpen";

import type { PlayerDetailDrawer } from "./PlayerDetailDrawer";

const preloadDrawer = () => import("./PlayerDetailDrawer");

const LazyPlayerDetailDrawer = dynamic(
  () => import("./PlayerDetailDrawer").then((module) => module.PlayerDetailDrawer),
  // `loading` is what gives the drawer its own Suspense boundary. Without it
  // the first open suspends up to the route's loading.tsx and blanks the page.
  { loading: () => null },
);

/**
 * The player drawer, loaded the first time a player is opened, which no
 * draft room needs before then.
 */
export function DeferredPlayerDetailDrawer(props: ComponentProps<typeof PlayerDetailDrawer>) {
  const mounted = useMountOnFirstOpen(props.player !== null, preloadDrawer);
  return mounted ? <LazyPlayerDetailDrawer {...props} /> : null;
}
