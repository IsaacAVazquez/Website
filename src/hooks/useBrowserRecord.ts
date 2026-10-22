"use client";

import { useMemo } from "react";
import {
  useLocalStoragePersistenceStatus,
  useLocalStorageString,
} from "./useLocalStorageString";
import {
  readBrowserStorageString,
  writeBrowserStorageJson,
} from "@/lib/browserStorage";

/** Apply each edit to the latest validated save, including edits from other tabs. */
export function useBrowserRecord<T>(key: string, parse: (raw: string) => T) {
  const raw = useLocalStorageString(key);
  const value = useMemo(() => parse(raw), [raw, parse]);
  const status = useLocalStoragePersistenceStatus(key);
  function update(edit: (latest: T) => T) {
    const latest = parse(readBrowserStorageString(key).value ?? "");
    const next = edit(latest);
    writeBrowserStorageJson(key, next);
    return next;
  }
  return { value, update, status };
}
