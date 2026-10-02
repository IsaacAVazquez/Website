"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import { useMountOnFirstOpen } from "@/hooks/useMountOnFirstOpen";

import type { MissionDrawer } from "./MissionDrawer";

const preloadDrawer = () => import("./MissionDrawer");

const LazyMissionDrawer = dynamic(
  () => import("./MissionDrawer").then((module) => module.MissionDrawer),
  // `loading` is what gives the drawer its own Suspense boundary. Without it
  // the first open suspends up to the route's loading.tsx and blanks the page.
  { loading: () => null },
);

/**
 * The mission drawer, loaded the first time a launch is opened. It carries
 * the detail panel and the sequence timeline. A link that
 * names a launch opens it on the server as before, because the hook starts
 * from its first value.
 */
export function DeferredMissionDrawer(props: ComponentProps<typeof MissionDrawer>) {
  const mounted = useMountOnFirstOpen(props.launchId !== null, preloadDrawer);
  return mounted ? <LazyMissionDrawer {...props} /> : null;
}
