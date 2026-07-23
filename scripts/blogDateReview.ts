import matter from "gray-matter";

export interface BlogDateReview {
  bodyChanged: boolean;
  dateReviewed: boolean;
  previousUpdatedAt: string | null;
  currentUpdatedAt: string | null;
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

export function normalizeArticleBody(source: string): string {
  return matter(source).content.replace(/\s+/g, " ").trim();
}

export function reviewBlogDateChange(
  previousSource: string,
  currentSource: string
): BlogDateReview {
  const previous = matter(previousSource);
  const current = matter(currentSource);
  const bodyChanged =
    normalizeArticleBody(previousSource) !== normalizeArticleBody(currentSource);
  const previousUpdatedAt = normalizeDate(previous.data.updatedAt);
  const currentUpdatedAt = normalizeDate(current.data.updatedAt);

  return {
    bodyChanged,
    dateReviewed:
      !bodyChanged ||
      (currentUpdatedAt !== null && currentUpdatedAt !== previousUpdatedAt),
    previousUpdatedAt,
    currentUpdatedAt,
  };
}
