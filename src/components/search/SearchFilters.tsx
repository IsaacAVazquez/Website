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

/*
 * The filters are pressed-button groups rather than selects because every
 * option is a single click and the tests and analytics key off the button
 * labels. `.c97-segmented` is the same control the /dashboards category filter
 * draws, and `.c97-microlink` buys each button its 44px target.
 */
export function SearchFilters({
  type,
  category,
  onTypeChange,
  onCategoryChange,
  onClearFilters,
}: SearchFiltersProps) {
  const hasActiveFilters = type !== 'all' || category !== 'all';

  return (
    <div className="c97-panel" style={{ display: "grid", gap: "var(--c97-sp-3)" }}>
      <fieldset className="c97-segmented" style={{ minWidth: 0 }}>
        <legend className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
          Content type
        </legend>
        {contentTypes.map((contentType) => (
          <button
            key={contentType.id}
            type="button"
            onClick={() => onTypeChange(contentType.id)}
            aria-pressed={type === contentType.id}
            className="c97-microlink"
          >
            {contentType.label}
          </button>
        ))}
      </fieldset>

      <fieldset className="c97-segmented" style={{ minWidth: 0 }}>
        <legend className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
          Category
        </legend>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            aria-pressed={category === cat.id}
            className="c97-microlink"
          >
            {cat.label}
          </button>
        ))}
      </fieldset>

      {hasActiveFilters && (
        <div
          style={{
            borderTop: "1px solid var(--c97-rule)",
            paddingTop: "var(--c97-sp-2)",
          }}
        >
          <button type="button" onClick={onClearFilters} className="c97-btn-ghost">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
