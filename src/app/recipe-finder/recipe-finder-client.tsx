"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ChefHat, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { RECIPES } from "@/data/recipesSnapshot";
import { useIsClient } from "@/hooks/useIsClient";
import { useLocalStorageString } from "@/hooks/useLocalStorageString";
import { getBrowserStorageSnapshot, writeBrowserStorageJson } from "@/lib/browserStorage";
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

/** Caps on what a saved pantry can hold, so a damaged store never prints a novel as one tag. */
const MAX_PANTRY_ITEMS = 200;
const MAX_PANTRY_ITEM_LENGTH = 60;

/** Trimmed, lowercased, capped, deduplicated, blanks dropped: the one shape a pantry item takes, typed or restored. */
function cleanPantryItems(values: unknown[]): string[] {
  const items = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase().slice(0, MAX_PANTRY_ITEM_LENGTH))
    .filter(Boolean);
  return Array.from(new Set(items)).slice(0, MAX_PANTRY_ITEMS);
}

/** The saved pantry, or an empty one when the store holds anything but a JSON list. */
function parsePantry(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? cleanPantryItems(parsed) : [];
  } catch {
    return [];
  }
}

// Reads go through the shared memory-mirrored store, so a write that another
// tab or this one just made is what the next edit builds on.
function loadPantry(): string[] {
  return parsePantry(getBrowserStorageSnapshot(PANTRY_STORAGE_KEY, "[]"));
}

function savePantry(items: string[]) {
  writeBrowserStorageJson(PANTRY_STORAGE_KEY, items);
}

function totalMinutes(recipe: Recipe): number {
  return recipe.prepMinutes + recipe.cookMinutes;
}

export function RecipeFinderClient() {
  // The pantry is read from the shared store, which also carries another
  // tab's edits in, and the server render sees an empty shelf.
  const pantrySnapshot = useLocalStorageString(PANTRY_STORAGE_KEY, "[]");
  const pantry = useMemo(() => parsePantry(pantrySnapshot), [pantrySnapshot]);
  const hydrated = useIsClient();
  const [pantryDraft, setPantryDraft] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RecipeCategory | "all">("all");
  const [view, setView] = useState<ViewId>("all");
  const [diet, setDiet] = useState<DietTag | "all">("all");
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);
  const pantryInputRef = useRef<HTMLInputElement>(null);

  const ingredientCatalog = useMemo(() => getIngredientCatalog(RECIPES), []);

  const suggestions = useMemo(() => {
    const draft = pantryDraft.trim().toLowerCase();
    if (!draft) return [];
    return ingredientCatalog
      .filter((item) => item.includes(draft) && !pantry.includes(item))
      .slice(0, 6);
  }, [pantryDraft, ingredientCatalog, pantry]);

  // The pantry view's count describes the whole corpus, independent of
  // whatever meal, diet, or search filter is active.
  const overallMatches = useMemo(() => searchRecipes(RECIPES, pantry, {}), [pantry]);
  const hasPantry = pantry.some((item) => item.trim().length > 0);
  const cookableNow = useMemo(
    () => overallMatches.filter((match) => match.missing.length === 0).length,
    [overallMatches],
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
    const values = cleanPantryItems(rawValue.split(","));
    if (values.length === 0) return;
    savePantry(cleanPantryItems([...loadPantry(), ...values]));
    setPantryDraft("");
    pantryInputRef.current?.focus();
  }

  function removeIngredient(value: string) {
    savePantry(loadPantry().filter((item) => item !== value));
    pantryInputRef.current?.focus();
  }

  function clearPantry() {
    savePantry([]);
    pantryInputRef.current?.focus();
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

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setDiet("all");
    setView("all");
  }

  function selectView(next: ViewId) {
    setView(next);
    // Reset an incompatible meal filter so the nav choice feels authoritative.
    if (next === "quick" || next === "vegetarian" || next === "pantry") {
      setCategory("all");
    }
  }

  return (
    <div className="rf-root">
      <div className="c97-shell c97-frame rf-page">
        <header className="rf-head">
          <h1>Recipe Finder</h1>
          <p className="rf-lede">
            Add the ingredients you have on hand and the recipes reorder by what you&rsquo;re missing, so the ones you
            can cook tonight come first. Salt, pepper, oil, and water count as already in every kitchen, so those tick
            on their own.
          </p>
        </header>

        <div className="rf-book">
          <section className="rf-shelf" aria-labelledby="rf-shelf-title">
            <h2 id="rf-shelf-title">Pantry</h2>
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
              inputRef={pantryInputRef}
            />
            <p className="rf-note">
              I added every recipe here by hand, which keeps the ingredient names consistent enough for the matcher to
              work, and your pantry is saved in this browser only.
            </p>
          </section>

          <section className="rf-results" aria-labelledby="rf-results-title">
            <div className="rf-results-head">
              <h2 id="rf-results-title">Find something to cook</h2>
              <label className="rf-search">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Search recipes"
                  placeholder="Search by name or ingredient…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>

            <div className="rf-toolbar">
              <div className="rf-chips" role="group" aria-label="Recipe views">
                {(Object.keys(VIEW_LABELS) as ViewId[]).map((id) => {
                  const isActive = view === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectView(id)}
                      aria-pressed={isActive}
                      className="rf-chip"
                    >
                      {id === "quick" && <Sparkles size={14} aria-hidden="true" />}
                      {id === "vegetarian" && <ChefHat size={14} aria-hidden="true" />}
                      {id === "pantry" && <Plus size={14} aria-hidden="true" />}
                      <span>{VIEW_LABELS[id]}</span>
                      {id === "pantry" && hasPantry ? <span>({cookableNow})</span> : null}
                    </button>
                  );
                })}
              </div>

              <div className="rf-chips" role="group" aria-label="Meal time">
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={category === option.value}
                    onClick={() => setCategory(option.value)}
                    className="rf-chip"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="rf-diet">
                <label htmlFor="recipe-diet-select" className="c97-kicker">
                  Diet
                </label>
                <select
                  id="recipe-diet-select"
                  aria-label="Filter by diet"
                  value={diet}
                  onChange={(event) => setDiet(event.target.value as DietTag | "all")}
                  disabled={view === "vegetarian"}
                  className="rf-field rf-select"
                >
                  {DIET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {view === "vegetarian" ? (
                  <p className="rf-note">Vegetarian view is active. Switch to All recipes to use other diets.</p>
                ) : null}
              </div>
            </div>

            <p className="rf-count" role="status" aria-live="polite">
              {visibleMatches.length} of {totalRecipes} recipes
              {hasPantry ? ", ranked by what your pantry is missing" : ""}
            </p>

            <ResultsGrid
              matches={visibleMatches}
              pantry={pantry}
              pantryIsEmpty={hydrated && !hasPantry && view === "pantry"}
              onReset={resetFilters}
              openRecipeId={openRecipeId}
              onToggleRecipe={(id) =>
                setOpenRecipeId((current) => (current === id ? null : id))
              }
            />
          </section>
        </div>
      </div>
    </div>
  );
}

interface PantryShelfProps {
  inputRef: RefObject<HTMLInputElement | null>;
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
  inputRef,
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
    <div className="rf-shelf-body">
      <form onSubmit={onSubmit} className="rf-pantry-form">
        <label htmlFor="pantry-input" className="sr-only">
          Add an ingredient
        </label>
        <div className="rf-suggest">
          <input
            ref={inputRef}
            id="pantry-input"
            type="text"
            value={pantryDraft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="e.g. chicken, lemon"
            autoComplete="off"
            className="rf-field"
          />
          {suggestions.length > 0 ? (
            <ul className="rf-suggest-list">
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
          className="rf-quickadd"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </form>

      {!hydrated ? (
        // Neither "empty" nor a returning visitor's saved pantry is known
        // yet, so show a neutral placeholder instead of flashing the empty
        // prompt in ahead of the real list.
        <span className="c97-skeleton rf-skeleton" />
      ) : pantry.length === 0 ? (
        <p className="rf-note">Add what&rsquo;s in your kitchen, or tap a quick add below.</p>
      ) : (
        <>
          <ul className="rf-tags" aria-label="Pantry ingredients">
            {pantry.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  aria-label={`Remove ${item}`}
                  className="rf-tag"
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
            className="rf-quickadd rf-clear"
          >
            <Trash2 size={14} aria-hidden="true" />
            Clear
          </button>
        </>
      )}

      <div className="rf-quickadds" aria-label="Quick adds" role="group">
        {QUICK_PICKS.filter((pick) => !pantry.includes(pick)).map((pick) => (
          <button key={pick} type="button" onClick={() => onAdd(pick)} className="rf-quickadd">
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
  /** The pantry view with nothing on the shelf, which needs a different prompt than a filter miss. */
  pantryIsEmpty: boolean;
  onReset: () => void;
  openRecipeId: string | null;
  onToggleRecipe: (id: string) => void;
}

function ResultsGrid({ matches, pantry, pantryIsEmpty, onReset, openRecipeId, onToggleRecipe }: ResultsGridProps) {
  if (matches.length === 0) {
    return (
      <div className="rf-empty">
        {pantryIsEmpty ? (
          <>
            <p>Your pantry shelf is empty, so there is nothing to suggest yet.</p>
            <p className="rf-note">
              Add a few ingredients to the pantry and the recipes that use them show up here.
            </p>
          </>
        ) : (
          <>
            <p>No recipes match these filters.</p>
            <p className="rf-note">
              Try removing the meal type or adding more pantry items.
            </p>
          </>
        )}
        <button type="button" onClick={onReset} className="c97-btn-ghost">
          {pantryIsEmpty ? "Show all recipes" : "Reset filters"}
        </button>
      </div>
    );
  }

  return (
    <ul className="rf-grid" aria-label="Matching recipes">
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
 * The signature: a ruled index card. In the list it prints only the name, the
 * time, and how many ingredients are still missing, so 26 recipes scan as a
 * short list. Selecting one opens its ingredient list, which ticks off what
 * the pantry already covers, and its steps on the same card.
 */
function RecipeIndexCard({ recipe, pantry, isOpen, onToggleSteps }: RecipeIndexCardProps) {
  const card = useMemo(() => indexCardLines(recipe, pantry), [recipe, pantry]);
  const detailId = `recipe-detail-${recipe.id}`;

  return (
    <article className="rf-card">
      <header className="rf-card-head">
        <div>
          <h3 className="rf-card-title">{recipe.title}</h3>
          <p className="rf-card-meta">
            {recipe.cuisine} · {CATEGORY_LABELS[recipe.category]}
          </p>
        </div>
        <div className="rf-card-corner">
          <span>
            <strong>{formatTotalTime(recipe)}</strong>
          </span>
          <span>Serves {recipe.servings}</span>
        </div>
      </header>

      <p className="rf-card-need" data-complete={card.counts.need === 0 || undefined}>
        {card.counts.need === 0
          ? "You have every ingredient"
          : `Missing ${card.counts.need} of ${card.lines.length} ingredients`}
      </p>

      <button
        type="button"
        className="rf-card-toggle"
        onClick={onToggleSteps}
        aria-expanded={isOpen}
        aria-controls={detailId}
      >
        {isOpen ? "Hide ingredients and steps" : "Ingredients and steps"}
      </button>

      {isOpen ? (
        <div id={detailId} className="rf-card-detail">
          <ul className="rf-ingredients" aria-label={`Ingredients for ${recipe.title}`}>
            {card.lines.map((line, index) => (
              <li key={`${recipe.id}-${index}`} className="rf-line" data-have={line.have}>
                <span className="rf-tick" aria-hidden="true">
                  <svg viewBox="0 0 14 14">
                    <rect x="1" y="1" width="12" height="12" className="rf-tick-box" />
                    {line.have ? (
                      <path d="M3 7.5L6 10.5L11 4" className="rf-tick-check" />
                    ) : null}
                  </svg>
                </span>
                <span>
                  <span className="sr-only">{line.have ? "In your pantry: " : "Still need: "}</span>
                  {line.name}
                  {line.staple ? <span className="rf-staple">staple</span> : null}
                </span>
              </li>
            ))}
          </ul>

          <div className="rf-card-steps">
            <ol>
              {recipe.instructions.map((step, index) => (
                <li key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {recipe.tags.length > 0 ? (
              <div className="rf-card-tags">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="rf-card-tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
