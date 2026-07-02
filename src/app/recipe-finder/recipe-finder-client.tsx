"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ChefHat, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { EditorialPillButton } from "@/components/editorial";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import { RECIPES } from "@/data/recipesSnapshot";
import {
  formatTotalTime,
  getIngredientCatalog,
  searchRecipes,
  type DietTag,
  type RecipeCategory,
  type RecipeMatch,
} from "@/lib/recipes";

const PANTRY_STORAGE_KEY = "recipe-finder:pantry:v1";

type ViewId = "all" | "quick" | "vegetarian" | "pantry";

const VIEW_LABELS: Record<ViewId, string> = {
  all: "All recipes",
  quick: "Quick wins",
  vegetarian: "Vegetarian",
  pantry: "Suggested by pantry",
};

const CATEGORY_OPTIONS: { value: RecipeCategory | "all"; label: string }[] = [
  { value: "all", label: "Any time" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "side", label: "Sides" },
  { value: "snack", label: "Snacks" },
  { value: "dessert", label: "Desserts" },
  { value: "drink", label: "Drinks" },
];

const DIET_OPTIONS: { value: DietTag | "all"; label: string }[] = [
  { value: "all", label: "Any diet" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "dairy-free", label: "Dairy-free" },
  { value: "high-protein", label: "High-protein" },
  { value: "low-carb", label: "Low-carb" },
];

const QUICK_PICKS = [
  "egg",
  "chicken breast",
  "rice",
  "pasta",
  "tomato",
  "onion",
  "garlic",
  "potato",
  "bread",
  "cheese",
  "spinach",
  "lemon",
];

function loadPantry(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PANTRY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function savePantry(items: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota errors — local persistence is a nice-to-have, not a requirement.
  }
}

function formatPercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function getMatchTone(score: number): string {
  if (score >= 0.99) return "var(--home-signal)";
  if (score >= 0.6) return "var(--home-signal)";
  return "var(--home-ink-muted)";
}

function totalMinutes(recipe: RecipeMatch["recipe"]): number {
  return recipe.prepMinutes + recipe.cookMinutes;
}

export function RecipeFinderClient() {
  const [pantry, setPantry] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [pantryDraft, setPantryDraft] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RecipeCategory | "all">("all");
  const [view, setView] = useState<ViewId>("all");
  const [diet, setDiet] = useState<DietTag | "all">("all");
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);

  // Load the saved pantry after mount so the server and first client render
  // match (both start empty), then flip `hydrated` so the save effect can run.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time hydration: read the saved pantry after mount so SSR and the first client render match
    setPantry(loadPantry());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    savePantry(pantry);
  }, [pantry, hydrated]);

  const ingredientCatalog = useMemo(() => getIngredientCatalog(RECIPES), []);

  const suggestions = useMemo(() => {
    const draft = pantryDraft.trim().toLowerCase();
    if (!draft) return [];
    return ingredientCatalog
      .filter((item) => item.includes(draft) && !pantry.includes(item))
      .slice(0, 6);
  }, [pantryDraft, ingredientCatalog, pantry]);

  const baseMatches = useMemo<RecipeMatch[]>(() => {
    // Sidebar "Vegetarian" view forces the diet filter to vegetarian even if
    // the rail diet select is "all". Otherwise the rail diet wins.
    const effectiveDiet: DietTag | "all" =
      view === "vegetarian" ? "vegetarian" : diet;
    return searchRecipes(RECIPES, pantry, {
      query,
      category,
      diet: effectiveDiet,
    });
  }, [pantry, query, category, diet, view]);

  const visibleMatches = useMemo<RecipeMatch[]>(() => {
    if (view === "quick") {
      return baseMatches.filter((m) => totalMinutes(m.recipe) <= 15);
    }
    if (view === "pantry") {
      return baseMatches.filter((m) => m.matched.length > 0);
    }
    return baseMatches;
  }, [baseMatches, view]);

  const cookableNow = useMemo(
    () => baseMatches.filter((match) => match.missing.length === 0).length,
    [baseMatches],
  );
  const almostCookable = useMemo(
    () =>
      baseMatches.filter(
        (match) => match.matchScore >= 0.6 && match.missing.length > 0,
      ).length,
    [baseMatches],
  );

  const hasPantry = pantry.length > 0;
  const totalRecipes = RECIPES.length;

  const quickWinsCount = useMemo(
    () => baseMatches.filter((m) => totalMinutes(m.recipe) <= 15).length,
    [baseMatches],
  );

  const dietLabel = useMemo(() => {
    if (view === "vegetarian") return "Vegetarian";
    return DIET_OPTIONS.find((option) => option.value === diet)?.label ?? "Any diet";
  }, [diet, view]);

  const mealLabel = useMemo(
    () => CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? "Any time",
    [category],
  );

  const recipeStatsCells: HomeStatsCell[] = [
    {
      label: "Recipes available",
      value: visibleMatches.length.toLocaleString(),
      sub: `of ${totalRecipes} in corpus`,
    },
    {
      label: "Pantry items",
      value: hasPantry ? pantry.length.toLocaleString() : "—",
      sub: hasPantry ? "Saved locally" : "Add to start",
    },
    {
      label: "Cookable now",
      value: hasPantry ? cookableNow.toLocaleString() : "—",
      sub: hasPantry ? "100% pantry match" : undefined,
      tone: hasPantry && cookableNow > 0 ? "good" : "default",
    },
    {
      label: "Almost cookable",
      value: hasPantry ? almostCookable.toLocaleString() : "—",
      sub: hasPantry ? "60% or better" : undefined,
    },
    {
      label: "Total in corpus",
      value: totalRecipes.toLocaleString(),
    },
    {
      label: "Active diet",
      value: dietLabel,
    },
    {
      label: "Active meal",
      value: mealLabel,
    },
    {
      label: "Quick wins",
      value: quickWinsCount.toLocaleString(),
      sub: "15 minutes or less",
    },
  ];

  function addIngredient(rawValue: string) {
    const value = rawValue.trim().toLowerCase();
    if (!value) return;
    setPantry((current) => (current.includes(value) ? current : [...current, value]));
    setPantryDraft("");
  }

  function removeIngredient(value: string) {
    setPantry((current) => current.filter((item) => item !== value));
  }

  function clearPantry() {
    setPantry([]);
  }

  function handlePantrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addIngredient(pantryDraft);
  }

  function handlePantryKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "," || event.key === "Tab") {
      const value = pantryDraft.trim();
      if (value) {
        event.preventDefault();
        addIngredient(value);
      }
    }
  }

  function selectView(next: ViewId) {
    setView(next);
    // Reset incompatible filters so the nav choice feels authoritative.
    if (next === "quick" || next === "vegetarian" || next === "pantry") {
      setCategory("all");
    }
  }

  return (
    <section
      className="home-page min-h-screen"
      aria-label="Recipe Finder"
      data-testid="recipe-shell"
    >
      <div className="home-shell home-section">
        <div className="flex flex-col gap-6">
          <div className="tool-topbar">
            <div>
              <p className="tool-crumbs">
                Recipe Finder / <strong>{VIEW_LABELS[view]}</strong>
              </p>
              <h1>Recipe Finder</h1>
            </div>

            <label className="tool-search" aria-label="Search recipes">
              <Search size={14} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by name or ingredient…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Recipe views"
          >
            {(Object.keys(VIEW_LABELS) as ViewId[]).map((id) => {
              const isActive = view === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectView(id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? "true" : undefined}
                  className="inline-flex min-h-touch items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-[transform,border-color,background-color,color,box-shadow] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
                  style={{
                    borderColor: isActive
                      ? "var(--home-ink)"
                      : "var(--home-rule)",
                    background: isActive
                      ? "var(--home-ink)"
                      : "var(--home-paper-raised)",
                    color: isActive ? "var(--home-paper)" : "var(--home-ink-muted)",
                    fontFamily: "var(--font-home-sans)",
                  }}
                >
                  {id === "all" && <Search size={16} aria-hidden="true" />}
                  {id === "quick" && <Sparkles size={16} aria-hidden="true" />}
                  {id === "vegetarian" && <ChefHat size={16} aria-hidden="true" />}
                  {id === "pantry" && <Plus size={16} aria-hidden="true" />}
                  <span>{VIEW_LABELS[id]}</span>
                  {id === "pantry" && hasPantry ? (
                    <span
                      className="ml-1 rounded-full px-2 py-0.5 text-2xs font-bold tracking-[0.04em]"
                      style={{
                        background: isActive
                          ? "color-mix(in srgb, var(--home-paper) 22%, transparent)"
                          : "color-mix(in srgb, var(--home-signal) 40%, transparent)",
                        color: isActive ? "var(--home-paper)" : "var(--home-ink)",
                      }}
                    >
                      {cookableNow}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="tool-meta-chip" role="status" aria-live="polite">
            <span className="tool-meta-chip-dot" aria-hidden="true" />
            <span>
              <strong>{totalRecipes}</strong> recipes ·{" "}
              <strong>{pantry.length}</strong> ingredient{pantry.length === 1 ? "" : "s"} in pantry
            </span>
            <span className="tool-meta-chip-divider" aria-hidden="true">
              ·
            </span>
            <span>ranking by pantry match</span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
            <div className="space-y-5">
              <HomeStatsPanel
                id="recipe-finder-stats"
                title="Recipes at a glance"
                meta={hasPantry ? `${cookableNow} cookable now` : "Add pantry items to rank"}
                hideLiveDot
                cells={recipeStatsCells}
                pills={[
                  { label: "Quick wins", href: "/recipe-finder?view=quick" },
                  { label: "Vegetarian", href: "/recipe-finder?view=vegetarian" },
                  { label: "Pantry", href: "/recipe-finder?view=pantry" },
                  { label: "All recipes", href: "/recipe-finder?view=all" },
                ]}
              />

              <div
                className="flex flex-wrap gap-2"
                role="tablist"
                aria-label="Meal time"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <EditorialPillButton
                    key={option.value}
                    active={category === option.value}
                    onClick={() => setCategory(option.value)}
                    role="tab"
                    ariaSelected={category === option.value}
                    size="sm"
                  >
                    {option.label}
                  </EditorialPillButton>
                ))}
              </div>

              <ResultsList
                matches={visibleMatches}
                hasPantry={hasPantry}
                openRecipeId={openRecipeId}
                onToggleRecipe={(id) =>
                  setOpenRecipeId((current) => (current === id ? null : id))
                }
              />
            </div>

            <aside
              aria-label="Pantry editor"
              className="flex flex-col gap-4 rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_74%,var(--home-elev-mix))] p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24 lg:self-start"
            >
              <section aria-labelledby="pantry-heading">
                <p className="tool-rail-label" id="pantry-heading">
                  <ChefHat size={12} aria-hidden="true" />
                  Pantry
                </p>
                <PantryEditor
                  pantry={pantry}
                  pantryDraft={pantryDraft}
                  suggestions={suggestions}
                  onDraftChange={setPantryDraft}
                  onAdd={addIngredient}
                  onRemove={removeIngredient}
                  onClear={clearPantry}
                  onSubmit={handlePantrySubmit}
                  onKeyDown={handlePantryKeyDown}
                  cookableNow={cookableNow}
                />
              </section>

              <section aria-labelledby="diet-heading">
                <p className="tool-rail-label" id="diet-heading">
                  <Sparkles size={12} aria-hidden="true" />
                  Diet
                </p>
                <label className="sr-only" htmlFor="recipe-diet-select">
                  Filter by diet
                </label>
                <select
                  id="recipe-diet-select"
                  value={diet}
                  onChange={(event) => setDiet(event.target.value as DietTag | "all")}
                  disabled={view === "vegetarian"}
                  className="w-full min-h-touch rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-3 py-2 text-xs font-medium text-[var(--home-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {DIET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {view === "vegetarian" ? (
                  <p className="mt-2 text-2xs text-[var(--home-ink-muted)]">
                    Vegetarian view is active. Switch to All recipes to use other diets.
                  </p>
                ) : null}
              </section>

              <section aria-labelledby="quick-adds-heading">
                <p className="tool-rail-label" id="quick-adds-heading">
                  <Plus size={12} aria-hidden="true" />
                  Quick adds
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PICKS.filter((pick) => !pantry.includes(pick)).map((pick) => (
                    <button
                      key={pick}
                      type="button"
                      onClick={() => addIngredient(pick)}
                      className="inline-flex min-h-touch items-center rounded-full border border-dashed border-[var(--home-rule)] bg-transparent px-3 py-1 text-2xs font-medium text-[var(--home-ink-muted)] transition-colors hover:border-[var(--home-signal)] hover:text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
                    >
                      + {pick}
                    </button>
                  ))}
                </div>
              </section>

              <p className="tool-rail-foot">
                <Sparkles size={14} aria-hidden="true" />
                Pantry saved in your browser
              </p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

interface PantryEditorProps {
  pantry: string[];
  pantryDraft: string;
  suggestions: string[];
  onDraftChange: (value: string) => void;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  onClear: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  cookableNow: number;
}

function PantryEditor({
  pantry,
  pantryDraft,
  suggestions,
  onDraftChange,
  onAdd,
  onRemove,
  onClear,
  onSubmit,
  onKeyDown,
  cookableNow,
}: PantryEditorProps) {
  return (
    <div>
      <form onSubmit={onSubmit} className="relative">
        <label htmlFor="pantry-input" className="sr-only">
          Add an ingredient
        </label>
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              id="pantry-input"
              type="text"
              value={pantryDraft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g. chicken, lemon"
              autoComplete="off"
              className="h-10 w-full rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-xs text-[var(--home-ink)] placeholder:text-[var(--home-ink-muted)] focus:border-[var(--home-signal)] focus:outline-none focus:ring-2 focus:ring-[var(--home-signal)]/40"
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-11 z-10 max-h-56 overflow-auto rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-paper)] py-1 shadow-[var(--shadow-lg)]">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => onAdd(suggestion)}
                      className="flex w-full min-h-touch items-center gap-2 px-3 py-2 text-left text-xs text-[var(--home-ink)] transition-colors hover:bg-[var(--home-paper-alt)] focus-visible:outline-none focus-visible:bg-[var(--home-paper-alt)]"
                    >
                      <Plus className="h-3 w-3 text-[var(--home-signal)]" aria-hidden="true" />
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="submit"
            disabled={!pantryDraft.trim()}
            aria-label="Add ingredient"
            className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[var(--home-ink)] px-3 text-[var(--home-paper)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>

      {pantry.length === 0 ? (
        <p className="mt-3 text-1xs text-[var(--home-ink-muted)]">
          Add a few staples and the recipe list will reorder live.
        </p>
      ) : (
        <>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Pantry ingredients">
            {pantry.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  aria-label={`Remove ${item}`}
                  className="group inline-flex min-h-touch items-center gap-1 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-2.5 py-1 text-2xs font-medium text-[var(--home-ink)] transition-colors hover:border-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
                >
                  <span>{item}</span>
                  <X
                    className="h-3 w-3 text-[var(--home-ink-muted)] transition-colors group-hover:text-[var(--home-ink)]"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-touch items-center gap-1 rounded-full border border-[var(--home-rule)] bg-transparent px-3 py-1 text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              Clear
            </button>
            <span className="inline-flex items-center gap-1.5 text-2xs text-[var(--home-ink)]">
              <Sparkles className="h-3 w-3 text-[var(--home-signal)]" aria-hidden="true" />
              <strong>{cookableNow}</strong> can cook now
            </span>
          </div>
        </>
      )}
    </div>
  );
}

interface ResultsListProps {
  matches: RecipeMatch[];
  hasPantry: boolean;
  openRecipeId: string | null;
  onToggleRecipe: (id: string) => void;
}

function ResultsList({ matches, hasPantry, openRecipeId, onToggleRecipe }: ResultsListProps) {
  if (matches.length === 0) {
    return (
      <div className="tool-empty">
        <p>No recipes match these filters.</p>
        <p>Try removing the meal type or adding more pantry items →</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4" aria-label="Matching recipes">
      {matches.map((match) => (
        <li key={match.recipe.id}>
          <RecipeCard
            match={match}
            hasPantry={hasPantry}
            isOpen={openRecipeId === match.recipe.id}
            onToggle={() => onToggleRecipe(match.recipe.id)}
          />
        </li>
      ))}
    </ul>
  );
}

interface RecipeCardProps {
  match: RecipeMatch;
  hasPantry: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function RecipeCard({ match, hasPantry, isOpen, onToggle }: RecipeCardProps) {
  const { recipe, matched, missing, staples, matchScore } = match;
  const total = matched.length + missing.length;
  const tone = getMatchTone(matchScore);

  return (
    <article className="overflow-hidden rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`recipe-detail-${recipe.id}`}
        className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left sm:px-6"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-3xs font-mono font-semibold uppercase tracking-[0.22em] text-[var(--home-ink-muted)]">
            <span>{recipe.cuisine}</span>
            <span aria-hidden="true">·</span>
            <span>{recipe.category}</span>
            <span aria-hidden="true">·</span>
            <span>{formatTotalTime(recipe)}</span>
            <span aria-hidden="true">·</span>
            <span>Serves {recipe.servings}</span>
          </div>
          <h3 className="text-lg font-semibold text-[var(--home-ink)] sm:text-xl">
            {recipe.title}
          </h3>
          {hasPantry ? (
            <p className="mt-2 text-sm text-[var(--home-ink-muted)]">
              You have <strong className="text-[var(--home-ink)]">{matched.length}</strong> of{" "}
              <strong className="text-[var(--home-ink)]">{total}</strong> ingredients
              {missing.length > 0 && (
                <>
                  {" "}— missing{" "}
                  <span className="text-[var(--home-ink)]">
                    {missing
                      .slice(0, 3)
                      .map((ing) => ing.name)
                      .join(", ")}
                    {missing.length > 3 ? `, +${missing.length - 3} more` : ""}
                  </span>
                </>
              )}
              .
            </p>
          ) : (
            <p className="mt-2 text-sm text-[var(--home-ink-muted)]">
              {total} ingredient{total === 1 ? "" : "s"}
              {staples.length > 0 ? `, plus ${staples.length} pantry staple${staples.length === 1 ? "" : "s"}` : ""}.
            </p>
          )}
        </div>

        <div
          className="flex shrink-0 flex-col items-end gap-1"
          aria-label={`Match score ${formatPercent(matchScore)}`}
        >
          <span
            className="inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
            style={{
              background: `color-mix(in srgb, ${tone} 14%, var(--home-paper))`,
              color: tone,
              border: `1px solid color-mix(in srgb, ${tone} 30%, var(--home-rule))`,
            }}
          >
            {hasPantry ? formatPercent(matchScore) : "—"}
          </span>
          <span className="font-mono text-3xs uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
            {isOpen ? "Hide" : "Open"}
          </span>
        </div>
      </button>

      {isOpen && (
        <div
          id={`recipe-detail-${recipe.id}`}
          className="border-t border-[var(--home-rule)] px-5 py-5 sm:px-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-mono text-2xs font-semibold uppercase tracking-[0.22em] text-[var(--home-ink-muted)]">
                Ingredients
              </h4>
              <ul className="space-y-1.5 text-sm">
                {recipe.ingredients.map((ingredient) => {
                  const isMissing = missing.some((m) => m.name === ingredient.name);
                  const isStaple = !!ingredient.staple;
                  return (
                    <li
                      key={ingredient.name}
                      className="flex items-start gap-2"
                      style={{
                        color: isMissing
                          ? "var(--home-ink-muted)"
                          : "var(--home-ink)",
                      }}
                    >
                      <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                      <span>
                        {ingredient.display}
                        {isStaple && (
                          <span className="ml-2 rounded-full border border-[var(--home-rule)] px-1.5 py-0.5 text-3xs uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                            staple
                          </span>
                        )}
                        {isMissing && hasPantry && (
                          <span
                            className="ml-2 rounded-full px-1.5 py-0.5 text-3xs uppercase tracking-[0.16em]"
                            style={{
                              border:
                                "1px solid color-mix(in srgb, var(--home-signal) 40%, var(--home-rule))",
                              color: "var(--home-signal)",
                            }}
                          >
                            missing
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-mono text-2xs font-semibold uppercase tracking-[0.22em] text-[var(--home-ink-muted)]">
                Instructions
              </h4>
              <ol className="space-y-2 text-sm text-[var(--home-ink)]">
                {recipe.instructions.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="font-mono text-2xs font-bold text-[var(--home-signal)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {recipe.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--home-rule)] bg-transparent px-2.5 py-0.5 text-2xs text-[var(--home-ink-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
