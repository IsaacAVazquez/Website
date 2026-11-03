export const REPO_SHORTLIST_KEY = "github-trending-shortlist-v1";
export const REPO_SHORTLIST_LIMIT = 50;

export function parseRepoShortlist(raw: string | null): number[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is number =>
                typeof id === "number" && Number.isSafeInteger(id) && id > 0,
            ),
          ),
        ].slice(0, REPO_SHORTLIST_LIMIT)
      : [];
  } catch {
    return [];
  }
}

export function toggleRepoShortlist(ids: number[], id: number): number[] {
  if (!Number.isSafeInteger(id) || id <= 0) return ids;
  return ids.includes(id)
    ? ids.filter((item) => item !== id)
    : [...ids, id].slice(0, REPO_SHORTLIST_LIMIT);
}
