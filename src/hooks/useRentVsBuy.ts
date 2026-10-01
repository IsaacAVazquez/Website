"use client";

import { useCallback, useMemo } from "react";
import { calculateRentVsBuy } from "@/lib/rentVsBuy/engine";
import {
  RENT_VS_BUY_STORAGE_KEY,
  decodeRentVsBuyInput,
  saveRentVsBuyInput,
} from "@/lib/rentVsBuy/persistence";
import { createDefaultInput } from "@/lib/rentVsBuy/defaults";
import { useLocalStorageString } from "@/hooks/useLocalStorageString";
import { readBrowserStorageString } from "@/lib/browserStorage";
import type { RentVsBuyInput } from "@/lib/rentVsBuy/types";

function parseSnapshot(raw: string): RentVsBuyInput {
  if (!raw) return createDefaultInput();
  try {
    return decodeRentVsBuyInput(JSON.parse(raw) as unknown);
  } catch {
    return createDefaultInput();
  }
}

export function useRentVsBuy() {
  const raw = useLocalStorageString(RENT_VS_BUY_STORAGE_KEY);
  const input = useMemo(() => parseSnapshot(raw), [raw]);
  const result = useMemo(() => calculateRentVsBuy(input), [input]);

  const setInput = useCallback((next: RentVsBuyInput) => {
    const clean = decodeRentVsBuyInput(next);
    saveRentVsBuyInput(clean);
  }, []);

  const setField = useCallback(
    <K extends keyof RentVsBuyInput>(key: K, value: RentVsBuyInput[K]) => {
      const current = parseSnapshot(readBrowserStorageString(RENT_VS_BUY_STORAGE_KEY).value ?? "");
      setInput({ ...current, [key]: value });
    },
    [setInput],
  );

  const reset = useCallback(() => {
    setInput(createDefaultInput());
  }, [setInput]);

  return { input, result, setField, setInput, reset };
}
