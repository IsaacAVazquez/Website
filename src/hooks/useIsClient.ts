"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/** False during server render and hydration, true once the client store is read. */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
