"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type Dispatch } from "react";

export type KeyedRequestAction<R> =
  | { type: "reset" }
  | { type: "start"; preserve: boolean }
  | { type: "success"; result: R }
  | { type: "error"; error: unknown; preserve: boolean };

/**
 * The request lifecycle useLiveQuote and useStockData share. A key names the
 * resource; a rerun on the same key (a refetch) tells the reducer to keep what
 * it is showing, a late response from a superseded key is dropped, and a null
 * key resets. `load` must be referentially stable (module function or
 * useCallback), since a new identity reruns the request.
 */
export function useKeyedRequest<S, R, A = never>(
  key: string | null,
  load: (key: string) => Promise<R>,
  reducer: (state: S, action: KeyedRequestAction<R> | A) => S,
  empty: S,
  clearCache: (key: string) => void,
): { state: S; dispatch: Dispatch<KeyedRequestAction<R> | A>; refetch: () => void } {
  const [state, dispatch] = useReducer(reducer, empty);
  const [fetchKey, setFetchKey] = useState(0);
  const latestRequestId = useRef(0);
  const previousKey = useRef<string | null>(null);

  useEffect(() => {
    if (!key) {
      previousKey.current = null;
      dispatch({ type: "reset" });
      return;
    }

    let cancelled = false;
    const preserve = previousKey.current === key;
    previousKey.current = key;
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    dispatch({ type: "start", preserve });

    load(key)
      .then((result) => {
        if (cancelled || latestRequestId.current !== requestId) return;
        dispatch({ type: "success", result });
      })
      .catch((error: unknown) => {
        if (cancelled || latestRequestId.current !== requestId) return;
        dispatch({ type: "error", error, preserve });
      });

    return () => {
      cancelled = true;
    };
  }, [key, fetchKey, load]);

  const refetch = useCallback(() => {
    if (!key) return;
    clearCache(key);
    setFetchKey((current) => current + 1);
  }, [key, clearCache]);

  return { state: key ? state : empty, dispatch, refetch };
}
