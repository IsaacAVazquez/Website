"use client";

import { useEffect, useState } from "react";

/**
 * Loads `${basePath}/${id}` whenever the selected id has no snapshot yet and
 * keeps every answer, so going back to an id never refetches. A failed id is
 * retried the next time it is selected. `initial` seeds the cache with the
 * snapshot the server already rendered.
 */
export function useCachedSnapshot<T>(
  basePath: string,
  id: string | null,
  initial: { id: string | null; snapshot: T | null },
  fallbackError: string
) {
  const [snapshots, setSnapshots] = useState<Record<string, T>>(() =>
    initial.id && initial.snapshot ? { [initial.id]: initial.snapshot } : {}
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || snapshots[id]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Clear request flags when nothing is selected or the snapshot is cached
      setLoadingId(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setLoadingId(id);
    setError(null);

    // Async so any fetch failure, even a missing fetch, lands in the catch below.
    const load = async () => {
      const response = await fetch(`${basePath}/${id}`, { signal: controller.signal });
      const payload = (await response.json()) as T & { error?: string };
      if (!response.ok) throw new Error(payload.error || fallbackError);
      return payload;
    };

    load()
      .then((snapshot) => {
        if (cancelled) return;
        setSnapshots((current) => (current[id] ? current : { ...current, [id]: snapshot }));
      })
      .catch((caught: Error) => {
        if (!cancelled && caught.name !== "AbortError") {
          setError(caught.message || fallbackError);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingId((current) => (current === id ? null : current));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [basePath, fallbackError, id, snapshots]);

  return {
    snapshot: id ? snapshots[id] ?? null : null,
    isLoading: id !== null && loadingId === id,
    error,
  };
}
