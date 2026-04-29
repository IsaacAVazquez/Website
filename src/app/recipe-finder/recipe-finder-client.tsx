"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChefHat, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { EditorialPillButton } from "@/components/editorial";
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

const CATEGORY_OPTIONS: { value: RecipeCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
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

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const noMotion = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

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
  if (score >= 0.99) return "var(--home-acid)";
  if (score >= 0.6) return "var(--home-haze)";
  return "var(--home-ink-muted)";
}

export function RecipeFinderClient() {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? noMotion : fadeIn;

  const [pantry, setPantry] = useState<string[]>([]);
  const [pantryDraft, setPantryDraft] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RecipeCategory | "all">("all");
  const [diet, setDiet] = useState<DietTag | "all">("all");
  const [onlyCookable, setOnlyCookable] = useState(false);
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);

  useEffect(() => {
    setPantry(loadPantry());
  }, []);

  useEffect(() => {
    savePantry(pantry);
  }, [pantry]);

  const ingredientCatalog = useMemo(() => getIngredientCatalog(RECIPES), []);

  const suggestions = useMemo(() => {
    const draft = pantryDraft.trim().toLowerCase();
    if (!draft) return [];
    return ingredientCatalog
      .filter((item) => item.includes(draft) && !pantry.includes(item))
      .slice(0, 6);
  }, [pantryDraft, ingredientCatalog, pantry]);

  const matches = useMemo<RecipeMatch[]>(() => {
    return searchRecipes(RECIPES, pantry, { query, category, diet });
  }, [pantry, query, category, diet]);

  const visibleMatches = useMemo<RecipeMatch[]>(() => {
    if (!onlyCookable) return matches;
    return matches.filter((match) => match.missing.length === 0);
  }, [matches, onlyCookable]);

  const cookableNow = useMemo(
    () => matches.filter((match) => match.missing.length === 0).length,
    [matches],
  );

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

  return (
    <section
      className="min-h-screen bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--home-haze)_10%,transparent),transparent_30%),linear-gradient(180deg,color-mix(in_srgb,var(--home-paper-alt)_88%,var(--home-paper))_0%,var(--home-paper)_100%)]"
      aria-label="Recipe finder"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
        <motion.header
          variants={variants}
          initial="hidden"
          animate="visible"
          className="mb-8 overflow-hidden rounded-[28px] border border-[color-mix(in_srgb,var(--home-haze)_14%,var(--home-rule))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))_0%,color-mix(in_srgb,var(--home-paper-alt)_88%,var(--home-acid-soft)_22%)_100%)] px-6 py-8 shadow-[var(--shadow-lg)] sm:px-8 sm:py-10"
        >
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--home-haze)]">
            Pantry-First Cooking
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--home-ink)] sm:text-4xl">
            Recipe Finder
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[var(--home-ink-muted)] sm:text-lg">
            Tell me what's in your kitchen. I'll rank {RECIPES.length} curated recipes by how
            many ingredients you already have, so you can cook tonight without a grocery run.
          </p>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <PantryPanel
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

          <div className="flex min-w-0 flex-col gap-5">
            <FiltersBar
              query={query}
              onQueryChange={setQuery}
              category={category}
              onCategoryChange={setCategory}
              diet={diet}
              onDietChange={setDiet}
              onlyCookable={onlyCookable}
              onOnlyCookableChange={setOnlyCookable}
            />

            <ResultsList
              matches={visibleMatches}
              hasPantry={pantry.length > 0}
              openRecipeId={openRecipeId}
              onToggleRecipe={(id) =>
                setOpenRecipeId((current) => (current === id ? null : id))
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface PantryPanelProps {
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

function PantryPanel({
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
}: PantryPanelProps) {
  return (
    <aside
      className="rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] p-5 shadow-[var(--shadow-md)] sm:p-6"
      aria-label="Your pantry"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[var(--home-ink)]">
          <ChefHat className="h-4 w-4" aria-hidden="true" />
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em]">
            Your Pantry
          </h2>
        </div>
        {pantry.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-touch items-center gap-1 rounded-full border border-[var(--home-rule)] bg-transparent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="relative">
        <label htmlFor="pantry-input" className="sr-only">
          Add an ingredient
        </label>
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <input
              id="pantry-input"
              type="text"
              value={pantryDraft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g. chicken, lemon, rice"
              autoComplete="off"
              className="h-11 w-full rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-4 text-sm text-[var(--home-ink)] placeholder:text-[var(--home-ink-muted)] focus:border-[var(--home-haze)] focus:outline-none focus:ring-2 focus:ring-[var(--home-haze)]/40"
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-12 z-10 max-h-56 overflow-auto rounded-[16px] border border-[var(--home-rule)] bg-[var(--home-paper)] py-1 shadow-[var(--shadow-lg)]">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => onAdd(suggestion)}
                      className="flex w-full min-h-touch items-center gap-2 px-4 py-2 text-left text-sm text-[var(--home-ink)] transition-colors hover:bg-[var(--home-paper-alt)] focus-visible:outline-none focus-visible:bg-[var(--home-paper-alt)]"
                    >
                      <Plus className="h-3 w-3 text-[var(--home-haze)]" aria-hidden="true" />
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
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-[var(--home-ink)] px-4 text-[var(--home-paper)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>

      {pantry.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--home-ink-muted)]">
          Add a few staples and the recipe list will reorder live.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Pantry ingredients">
          {pantry.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => onRemove(item)}
                aria-label={`Remove ${item}`}
                className="group inline-flex min-h-touch items-center gap-1.5 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-1.5 text-xs font-medium text-[var(--home-ink)] transition-colors hover:border-[var(--home-ink)] hover:text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
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
      )}

      <div className="mt-5 border-t border-[var(--home-rule)] pt-4">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--home-ink-muted)]">
          Quick add
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PICKS.filter((pick) => !pantry.includes(pick)).map((pick) => (
            <button
              key={pick}
              type="button"
              onClick={() => onAdd(pick)}
              className="inline-flex min-h-touch items-center rounded-full border border-dashed border-[var(--home-rule)] bg-transparent px-3 py-1 text-[11px] font-medium text-[var(--home-ink-muted)] transition-colors hover:border-[var(--home-haze)] hover:text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
            >
              + {pick}
            </button>
          ))}
        </div>
      </div>

      {pantry.length > 0 && (
        <div className="mt-5 flex items-center gap-2 rounded-[14px] border border-[color-mix(in_srgb,var(--home-haze)_24%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-haze)_8%,var(--home-paper))] px-3 py-2.5 text-sm text-[var(--home-ink)]">
          <Sparkles className="h-4 w-4 text-[var(--home-haze)]" aria-hidden="true" />
          <span>
            <strong>{cookableNow}</strong> recipe{cookableNow === 1 ? "" : "s"} you can cook now.
          </span>
        </div>
      )}
    </aside>
  );
}

interface FiltersBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  category: RecipeCategory | "all";
  onCategoryChange: (value: RecipeCategory | "all") => void;
  diet: DietTag | "all";
  onDietChange: (value: DietTag | "all") => void;
  onlyCookable: boolean;
  onOnlyCookableChange: (value: boolean) => void;
}

function FiltersBar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  diet,
  onDietChange,
  onlyCookable,
  onOnlyCookableChange,
}: FiltersBarProps) {
  return (
    <div className="rounded-[20px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] p-4 shadow-[var(--shadow-sm)] sm:p-5">
      <label htmlFor="recipe-search" className="sr-only">
        Search recipes
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--home-ink-muted)]"
          aria-hidden="true"
        />
        <input
          id="recipe-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search recipe name, cuisine, or ingredient"
          className="h-11 w-full rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] pl-11 pr-4 text-sm text-[var(--home-ink)] placeholder:text-[var(--home-ink-muted)] focus:border-[var(--home-haze)] focus:outline-none focus:ring-2 focus:ring-[var(--home-haze)]/40"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Recipe category">
        {CATEGORY_OPTIONS.map((option) => (
          <EditorialPillButton
            key={option.value}
            active={category === option.value}
            onClick={() => onCategoryChange(option.value)}
            role="tab"
            ariaSelected={category === option.value}
            size="sm"
          >
            {option.label}
          </EditorialPillButton>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--home-ink-muted)]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em]">
            Diet
          </span>
          <select
            value={diet}
            onChange={(event) => onDietChange(event.target.value as DietTag | "all")}
            className="h-9 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-sm text-[var(--home-ink)] focus:border-[var(--home-haze)] focus:outline-none focus:ring-2 focus:ring-[var(--home-haze)]/40"
          >
            {DIET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--home-ink)]">
          <input
            type="checkbox"
            checked={onlyCookable}
            onChange={(event) => onOnlyCookableChange(event.target.checked)}
            className="h-4 w-4 rounded border-[var(--home-rule)] text-[var(--home-haze)] focus:ring-[var(--home-haze)]"
          />
          <span>Only what I can cook now</span>
        </label>
      </div>
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
      <div className="rounded-[20px] border border-dashed border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-6 py-10 text-center">
        <p className="text-sm text-[var(--home-ink-muted)]">
          No recipes match those filters yet. Try removing a constraint or adding more ingredients.
        </p>
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
    <article className="overflow-hidden rounded-[20px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`recipe-detail-${recipe.id}`}
        className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left sm:px-6"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-[0.22em] text-[var(--home-ink-muted)]">
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
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
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
              <h4 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--home-ink-muted)]">
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
                          <span className="ml-2 rounded-full border border-[var(--home-rule)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                            staple
                          </span>
                        )}
                        {isMissing && hasPantry && (
                          <span
                            className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em]"
                            style={{
                              border:
                                "1px solid color-mix(in srgb, var(--home-haze) 40%, var(--home-rule))",
                              color: "var(--home-haze)",
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
              <h4 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--home-ink-muted)]">
                Instructions
              </h4>
              <ol className="space-y-2 text-sm text-[var(--home-ink)]">
                {recipe.instructions.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="font-mono text-[11px] font-bold text-[var(--home-haze)]">
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
                  className="rounded-full border border-[var(--home-rule)] bg-transparent px-2.5 py-0.5 text-[11px] text-[var(--home-ink-muted)]"
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
