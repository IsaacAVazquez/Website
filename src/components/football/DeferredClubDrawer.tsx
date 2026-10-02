"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import { useMountOnFirstOpen } from "@/hooks/useMountOnFirstOpen";

import type { ClubDrawer } from "./ClubDrawer";

const preloadDrawer = () => import("./ClubDrawer");

const LazyClubDrawer = dynamic(
  () => import("./ClubDrawer").then((module) => module.ClubDrawer),
  // `loading` is what gives the drawer its own Suspense boundary. Without it
  // the first open suspends up to the route's loading.tsx and blanks the page.
  { loading: () => null },
);

/**
 * The club drawer, loaded the first time a club is opened, so the standings
 * route does not carry it on first load. A link that names a club opens
 * it on the server as before, because the hook starts from its first value.
 */
export function DeferredClubDrawer(props: ComponentProps<typeof ClubDrawer>) {
  const mounted = useMountOnFirstOpen(props.club !== null, preloadDrawer);
  return mounted ? <LazyClubDrawer {...props} /> : null;
}
