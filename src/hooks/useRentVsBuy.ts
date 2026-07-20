"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { calculateRentVsBuy } from "@/lib/rentVsBuy/engine";
import {
  RENT_VS_BUY_STORAGE_KEY,
  decodeRentVsBuyInput,
  saveRentVsBuyInput,
} from "@/lib/rentVsBuy/persistence";
import { createDefaultInput } from "@/lib/rentVsBuy/defaults";
import type { RentVsBuyInput } from "@/lib/rentVsBuy/types";

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === RENT_VS_BUY_STORAGE_KEY) {
      listener();
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(RENT_VS_BUY_STORAGE_KEY) ?? "";
}

function parseSnapshot(raw: string): RentVsBuyInput {
  if (!raw) return createDefaultInput();
  try {
    return decodeRentVsBuyInput(JSON.parse(raw) as unknown);
  } catch {
    return createDefaultInput();
  }
}

export function useRentVsBuy() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "");
  const input = useMemo(() => parseSnapshot(raw), [raw]);
  const result = useMemo(() => calculateRentVsBuy(input), [input]);

  const setInput = useCallback((next: RentVsBuyInput) => {
    const clean = decodeRentVsBuyInput(next);
    saveRentVsBuyInput(clean);
    emitChange();
  }, []);

  const setField = useCallback(
    <K extends keyof RentVsBuyInput>(key: K, value: RentVsBuyInput[K]) => {
      const current = parseSnapshot(getSnapshot());
      setInput({ ...current, [key]: value });
    },
    [setInput],
  );

  const reset = useCallback(() => {
    setInput(createDefaultInput());
  }, [setInput]);

  return { input, result, setField, setInput, reset };
}
