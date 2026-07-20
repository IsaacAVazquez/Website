"use client";

interface SearchFiltersProps {
  type: string;
  category: string;
  onTypeChange: (type: string) => void;
  onCategoryChange: (category: string) => void;
  onClearFilters: () => void;
}

// `id` is sent verbatim as the `type` query param. It must match a type the
// API actually emits ('post' for writing, 'project', 'page') — see /api/search.
const contentTypes = [
  { id: 'all', label: 'All Content' },
  { id: 'post', label: 'Writing' },
  { id: 'project', label: 'Projects' },
  { id: 'page', label: 'Pages' },
];

// `id` is sent verbatim as the `category` query param and the API matches it by
// case-insensitive EXACT equality. Every id below must match a `category` value
// emitted by /api/search, or the filter silently returns nothing. Keep this list
// in sync with the corpus categories rather than inventing display-friendly labels.
const categories = [
  { id: 'all', label: 'All Categories' },
  { id: 'Agentic AI', label: 'Agentic AI' },
  { id: 'Product Management', label: 'Product Management' },
  { id: 'Fantasy Football Analytics', label: 'Fantasy Football' },
  { id: 'Sports Data Tools', label: 'Sports Dashboards' },
  { id: 'Sports Analytics', label: 'Sports Writing' },
  { id: 'QA Engineering', label: 'QA Engineering' },
  { id: 'Fintech Product', label: 'Fintech' },
];

function getPillStyle(active: boolean) {
  if (active) {
    return {
      background: "var(--home-ink)",
      color: "var(--home-paper)",
      border: "1px solid var(--home-ink)",
    } as const;
  }
  return {
    background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
    color: "var(--home-ink)",
    border: "1px solid var(--home-rule)",
  } as const;
}

export function SearchFilters({
  type,
  category,
  onTypeChange,
  onCategoryChange,
  onClearFilters,
}: SearchFiltersProps) {
  const hasActiveFilters = type !== 'all' || category !== 'all';

  return (
    <div
      className="space-y-4 rounded-[var(--radius-xl)] p-4"
      style={{
        background: "color-mix(in srgb, var(--home-paper-alt) 78%, var(--home-elev-mix))",
        border: "1px solid var(--home-rule)",
      }}
    >
      <div>
        <p
          className="home-kicker mb-2"
          style={{ marginTop: 0 }}
        >
          Content type
        </p>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((contentType) => (
            <button
              key={contentType.id}
              type="button"
              onClick={() => onTypeChange(contentType.id)}
              aria-pressed={type === contentType.id}
              className="inline-flex min-h-[36px] items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              style={{
                fontFamily: "var(--font-home-sans)",
                letterSpacing: "0.02em",
                ...getPillStyle(type === contentType.id),
              }}
            >
              {contentType.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p
          className="home-kicker mb-2"
          style={{ marginTop: 0 }}
        >
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              aria-pressed={category === cat.id}
              className="inline-flex min-h-[36px] items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              style={{
                fontFamily: "var(--font-home-sans)",
                letterSpacing: "0.02em",
                ...getPillStyle(category === cat.id),
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <div
          className="pt-3"
          style={{ borderTop: "1px solid var(--home-rule)" }}
        >
          <button
            type="button"
            onClick={onClearFilters}
            className="text-sm underline underline-offset-2"
            style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-signal)" }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
