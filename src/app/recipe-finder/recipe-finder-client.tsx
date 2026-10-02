"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ChefHat, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { RECIPES } from "@/data/recipesSnapshot";
import { readValidatedBrowserStorage, writeBrowserStorageJson } from "@/lib/browserStorage";
import {
  formatTotalTime,
  getIngredientCatalog,
  searchRecipes,
  type DietTag,
  type Recipe,
  type RecipeCategory,
  type RecipeMatch,
} from "@/lib/recipes";
import { indexCardLines } from "./indexCard";
import "./recipe-finder.css";

const RECIPE_FINDER_ROUTE = "/recipe-finder";
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

const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  dessert: "Dessert",
  snack: "Snack",
  side: "Side",
  drink: "Drink",
};

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
  return readValidatedBrowserStorage<string[]>(
    PANTRY_STORAGE_KEY,
    (parsed) => (Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : []),
    () => [],
  ).value;
}

function savePantry(items: string[]) {
  writeBrowserStorageJson(PANTRY_STORAGE_KEY, items);
}

function totalMinutes(recipe: Recipe): number {
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

  // The hero's readouts describe the whole corpus, independent of whatever
  // meal, diet, or search filter is active below, the same way Earthquake
  // Pulse's hero stats don't move when the log's view tab changes.
  const overallMatches = useMemo(() => searchRecipes(RECIPES, pantry, {}), [pantry]);
  const hasPantry = pantry.some((item) => item.trim().length > 0);
  const cookableNow = useMemo(
    () => overallMatches.filter((match) => match.missing.length === 0).length,
    [overallMatches],
  );
  const bestMatch = hasPantry ? overallMatches[0] ?? null : null;
  const bestMatchCard = useMemo(
    () => (bestMatch ? indexCardLines(bestMatch.recipe, pantry) : null),
    [bestMatch, pantry],
  );

  const baseMatches = useMemo<RecipeMatch[]>(() => {
    // The "Vegetarian" view forces the diet filter to vegetarian even if the
    // diet select is "all". Otherwise the diet select wins.
    const effectiveDiet: DietTag | "all" = view === "vegetarian" ? "vegetarian" : diet;
    return searchRecipes(RECIPES, pantry, { query, category, diet: effectiveDiet });
  }, [pantry, query, category, diet, view]);

  const visibleMatches = useMemo<RecipeMatch[]>(() => {
    if (view === "quick") {
      return baseMatches.filter((match) => totalMinutes(match.recipe) <= 15);
    }
    if (view === "pantry") {
      return baseMatches.filter((match) => match.matched.length > 0);
    }
    return baseMatches;
  }, [baseMatches, view]);

  const totalRecipes = RECIPES.length;

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
    // Reset an incompatible meal filter so the nav choice feels authoritative.
    if (next === "quick" || next === "vegetarian" || next === "pantry") {
      setCategory("all");
    }
  }

  const lead = PROJECT_PRESS[RECIPE_FINDER_ROUTE].lead;
  const standfirst =
    "Add the ingredients you have on hand and the recipes below reorder by what you're missing, so the ones you can actually cook tonight come first. I assume a few staples like salt, pepper, and oil are already in every kitchen, so those tick on their own.";

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Recipe Finder"
        standfirst={standfirst}
        readouts={[
          {
            label: "Pantry items",
            value: hydrated ? pantry.length : "—",
            detail: hasPantry ? "saved in your browser" : "add what's in your kitchen",
          },
          {
            label: "Recipes you can make now",
            value: hasPantry ? cookableNow : "—",
            detail: hasPantry ? `of ${totalRecipes} in the corpus` : "add pantry items to rank",
          },
          {
            label: "Closest match",
            value: bestMatch ? bestMatch.recipe.title : "—",
            detail:
              bestMatch && bestMatchCard
                ? `${bestMatchCard.lines.filter((line) => line.have).length} of ${bestMatchCard.lines.length} ingredients ticked, first in the list below`
                : undefined,
          },
        ]}
      >
        <div className="c97-recipe-hero-grid">
          <div data-c97-surface="paper" className="c97-offset c97-recipe-shelf-plate" style={{ padding: "var(--c97-sp-4)" }}>
            <p className="c97-kicker">Pantry shelf</p>
            <PantryShelf
              pantry={pantry}
              hydrated={hydrated}
              pantryDraft={pantryDraft}
              suggestions={suggestions}
              onDraftChange={setPantryDraft}
              onAdd={addIngredient}
              onRemove={removeIngredient}
              onClear={clearPantry}
              onSubmit={handlePantrySubmit}
              onKeyDown={handlePantryKeyDown}
            />
            <p className="c97-prose" style={{ margin: 0, fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
              I put the recipe corpus together by hand, and your pantry is saved in this browser only.
            </p>
          </div>

        </div>
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="c97-poster-sm">Find something to cook</h2>
            <label className="c97-recipe-search" aria-label="Search recipes">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by name or ingredient…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          <div
            className="c97-segmented"
            role="group"
            aria-label="Recipe views"
            style={{ marginTop: "var(--c97-sp-4)" }}
          >
            {(Object.keys(VIEW_LABELS) as ViewId[]).map((id) => {
              const isActive = view === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectView(id)}
                  aria-pressed={isActive}
                  className="min-h-[44px]"
                >
                  {id === "all" && <Search size={16} aria-hidden="true" />}
                  {id === "quick" && <Sparkles size={16} aria-hidden="true" />}
                  {id === "vegetarian" && <ChefHat size={16} aria-hidden="true" />}
                  {id === "pantry" && <Plus size={16} aria-hidden="true" />}
                  <span>{VIEW_LABELS[id]}</span>
                  {id === "pantry" && hasPantry ? <span>({cookableNow})</span> : null}
                </button>
              );
            })}
          </div>

          <div
            className="c97-segmented"
            role="group"
            aria-label="Meal time"
            style={{ marginTop: "var(--c97-sp-3)" }}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={category === option.value}
                onClick={() => setCategory(option.value)}
                className="min-h-[44px]"
              >
                {option.label}
              </button>
            ))}
          </div>

          <div
            className="flex flex-wrap items-center gap-2"
            style={{ marginTop: "var(--c97-sp-3)" }}
          >
            <label htmlFor="recipe-diet-select" className="c97-kicker" style={{ margin: 0 }}>
              Diet
            </label>
            <select
              id="recipe-diet-select"
              aria-label="Filter by diet"
              value={diet}
              onChange={(event) => setDiet(event.target.value as DietTag | "all")}
              disabled={view === "vegetarian"}
              className="c97-recipe-field"
              style={{ flex: "0 0 auto" }}
            >
              {DIET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {view === "vegetarian" ? (
              <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", margin: 0 }}>
                Vegetarian view is active. Switch to All recipes to use other diets.
              </p>
            ) : null}
          </div>

          <p
            className="c97-meta"
            role="status"
            aria-live="polite"
            style={{ marginTop: "var(--c97-sp-3)" }}
          >
            <span>{totalRecipes} recipes</span>
            <span aria-hidden="true">·</span>
            <span>
              {pantry.length} ingredient{pantry.length === 1 ? "" : "s"} in pantry
            </span>
            <span aria-hidden="true">·</span>
            <span>ranking by pantry match</span>
          </p>

          <ResultsGrid
            matches={visibleMatches}
            pantry={pantry}
            openRecipeId={openRecipeId}
            onToggleRecipe={(id) =>
              setOpenRecipeId((current) => (current === id ? null : id))
            }
          />
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
            About this corpus
          </p>
          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
            Every recipe here is one I added by hand, which keeps the ingredient list consistent
            enough for the matcher to work. Pantry staples like salt, pepper, oil, and water are
            assumed and never count against a recipe&rsquo;s missing ingredients.
          </p>
        </div>
      </section>
    </>
  );
}

interface PantryShelfProps {
  pantry: string[];
  hydrated: boolean;
  pantryDraft: string;
  suggestions: string[];
  onDraftChange: (value: string) => void;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  onClear: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

function PantryShelf({
  pantry,
  hydrated,
  pantryDraft,
  suggestions,
  onDraftChange,
  onAdd,
  onRemove,
  onClear,
  onSubmit,
  onKeyDown,
}: PantryShelfProps) {
  return (
    <div>
      <form onSubmit={onSubmit} className="c97-recipe-pantry-form">
        <label htmlFor="pantry-input" className="sr-only">
          Add an ingredient
        </label>
        <div className="c97-recipe-pantry-suggestions">
          <input
            id="pantry-input"
            type="text"
            value={pantryDraft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="e.g. chicken, lemon"
            autoComplete="off"
            className="c97-recipe-field"
          />
          {suggestions.length > 0 ? (
            <ul className="c97-recipe-suggestion-list">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button type="button" onClick={() => onAdd(suggestion)}>
                    <Plus size={14} aria-hidden="true" />
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={!pantryDraft.trim()}
          aria-label="Add ingredient"
          className="c97-recipe-quickadd"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </form>

      {!hydrated ? (
        // Neither "empty" nor a returning visitor's saved pantry is known
        // yet, so show a neutral placeholder instead of flashing the empty
        // prompt in ahead of the real list.
        <span
          className="c97-skeleton"
          style={{ display: "block", height: "1.25rem", width: "60%", marginTop: "var(--c97-sp-3)" }}
        />
      ) : pantry.length === 0 ? (
        <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-3)" }}>
          Add what&rsquo;s in your kitchen.
        </p>
      ) : (
        <>
          <ul
            className="c97-recipe-shelf-tags"
            aria-label="Pantry ingredients"
            style={{ marginTop: "var(--c97-sp-3)" }}
          >
            {pantry.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  aria-label={`Remove ${item}`}
                  className="c97-recipe-tag"
                >
                  <span>{item}</span>
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onClear}
            className="c97-recipe-quickadd"
            style={{ marginTop: "var(--c97-sp-2)" }}
          >
            <Trash2 size={14} aria-hidden="true" />
            Clear
          </button>
        </>
      )}

      <div className="c97-recipe-quickadds" style={{ marginTop: "var(--c97-sp-3)" }}>
        {QUICK_PICKS.filter((pick) => !pantry.includes(pick)).map((pick) => (
          <button key={pick} type="button" onClick={() => onAdd(pick)} className="c97-recipe-quickadd">
            + {pick}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ResultsGridProps {
  matches: RecipeMatch[];
  pantry: string[];
  openRecipeId: string | null;
  onToggleRecipe: (id: string) => void;
}

function ResultsGrid({ matches, pantry, openRecipeId, onToggleRecipe }: ResultsGridProps) {
  if (matches.length === 0) {
    return (
      <div className="c97-prose" style={{ marginTop: "var(--c97-sp-5)" }}>
        <p>No recipes match these filters.</p>
        <p style={{ fontSize: "var(--c97-fs-small)" }}>
          Try removing the meal type or adding more pantry items.
        </p>
      </div>
    );
  }

  return (
    <ul className="c97-recipe-grid" aria-label="Matching recipes" style={{ marginTop: "var(--c97-sp-5)" }}>
      {matches.map((match) => (
        <li key={match.recipe.id}>
          <RecipeIndexCard
            recipe={match.recipe}
            pantry={pantry}
            isOpen={openRecipeId === match.recipe.id}
            onToggleSteps={() => onToggleRecipe(match.recipe.id)}
          />
        </li>
      ))}
    </ul>
  );
}

interface RecipeIndexCardProps {
  recipe: Recipe;
  pantry: string[];
  isOpen: boolean;
  onToggleSteps: () => void;
}

/**
 * The signature: a ruled index card. The ingredient list ticks off what the
 * pantry already covers instead of reporting a percentage, so the match
 * reads directly off the card rather than off a score.
 */
function RecipeIndexCard({ recipe, pantry, isOpen, onToggleSteps }: RecipeIndexCardProps) {
  const card = useMemo(() => indexCardLines(recipe, pantry), [recipe, pantry]);
  const stepsId = `recipe-steps-${recipe.id}`;

  return (
    <article data-c97-surface="paper" className="c97-offset c97-recipe-card" style={{ padding: "var(--c97-sp-4)" }}>
      <header className="c97-recipe-card-header">
        <div>
          <h3 className="c97-serif c97-recipe-card-title">{recipe.title}</h3>
          <p className="c97-kicker c97-recipe-card-meta">
            {recipe.cuisine} · {CATEGORY_LABELS[recipe.category]}
          </p>
        </div>
        <div className="c97-recipe-card-corner">
          <span>
            <strong>{formatTotalTime(recipe)}</strong>
          </span>
          <span>Serves {recipe.servings}</span>
        </div>
      </header>

      <ul className="c97-recipe-ingredients" aria-label={`Ingredients for ${recipe.title}`}>
        {card.lines.map((line, index) => (
          <li key={`${recipe.id}-${index}`} className="c97-recipe-line" data-have={line.have}>
            <span className="c97-recipe-tick" aria-hidden="true">
              <svg viewBox="0 0 14 14">
                <rect x="1" y="1" width="12" height="12" className="c97-recipe-tick-box" />
                {line.have ? (
                  <path d="M3 7.5L6 10.5L11 4" className="c97-recipe-tick-check" />
                ) : null}
              </svg>
            </span>
            <span>
              <span className="sr-only">{line.have ? "In your pantry: " : "Still need: "}</span>
              {line.name}
              {line.staple ? <span className="c97-recipe-staple-mark">staple</span> : null}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="c97-recipe-card-steps-toggle"
        onClick={onToggleSteps}
        aria-expanded={isOpen}
        aria-controls={stepsId}
      >
        {isOpen ? "Hide steps" : "Steps"}
      </button>

      {isOpen ? (
        <div id={stepsId} className="c97-recipe-card-steps">
          <ol>
            {recipe.instructions.map((step, index) => (
              <li key={index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {recipe.tags.length > 0 ? (
            <div className="c97-recipe-card-tags">
              {recipe.tags.map((tag) => (
                <span key={tag} className="c97-chip">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
