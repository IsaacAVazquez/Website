"use client";

import { startTransition, useEffect, useMemo, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FOOD_MAP_CUISINES,
  FOOD_MAP_MEALS,
  FOOD_MAP_NEIGHBORHOODS,
  FOOD_MAP_PLACES,
  countPlacesByNeighborhood,
  filterFoodMapPlaces,
  getFoodMapCuisine,
  getFoodMapNeighborhood,
  getFoodMapPlace,
  type FoodMapCuisineId,
  type FoodMapMealId,
  type FoodMapNeighborhoodId,
  type FoodMapPlace,
} from "./food-map-data";
import {
  buildFoodMapHref,
  DEFAULT_FOOD_MAP_STATE,
  FOOD_MAP_ROUTE,
  normalizeFoodMapState,
  resetFoodMapFilters,
  setMeal,
  setPick,
  toggleCuisine,
  toggleNeighborhood,
  type FoodMapState,
} from "./food-map-state";

interface FoodMapClientProps {
  initialState: FoodMapState;
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const noMotion = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

function getPanelStyle(): CSSProperties {
  return {
    background: "color-mix(in srgb, var(--home-paper-alt) 74%, var(--home-elev-mix))",
    border: "1px solid var(--home-rule)",
    boxShadow: "var(--shadow-sm)",
  };
}

function NeighborhoodChips({
  state,
  onToggle,
}: {
  state: FoodMapState;
  onToggle: (id: FoodMapNeighborhoodId) => void;
}) {
  const counts = countPlacesByNeighborhood(FOOD_MAP_PLACES);

  return (
    <div className="flex flex-wrap gap-2">
      {FOOD_MAP_NEIGHBORHOODS.map((neighborhood) => {
        const isActive = state.neighborhoods.includes(neighborhood.id);
        return (
          <button
            key={neighborhood.id}
            type="button"
            onClick={() => onToggle(neighborhood.id)}
            aria-pressed={isActive}
            className="resume-chip min-h-touch transition-[transform,border-color,background-color,box-shadow] duration-200 ease"
            style={{
              borderColor: isActive
                ? `color-mix(in srgb, ${neighborhood.accent} 45%, var(--home-rule))`
                : "var(--home-rule)",
              background: isActive
                ? `color-mix(in srgb, ${neighborhood.accent} 18%, var(--home-paper))`
                : "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
              color: "var(--home-ink)",
            }}
          >
            {neighborhood.name}
            <span
              className="ml-2 text-[0.7rem] uppercase tracking-[0.12em]"
              style={{ color: "var(--home-ink-muted)" }}
            >
              {counts[neighborhood.id] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CuisineChips({
  state,
  onToggle,
}: {
  state: FoodMapState;
  onToggle: (id: FoodMapCuisineId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FOOD_MAP_CUISINES.map((cuisine) => {
        const isActive = state.cuisines.includes(cuisine.id);
        return (
          <button
            key={cuisine.id}
            type="button"
            onClick={() => onToggle(cuisine.id)}
            aria-pressed={isActive}
            className="resume-chip min-h-touch transition-[transform,border-color,background-color,box-shadow] duration-200 ease"
            style={{
              borderColor: isActive
                ? "color-mix(in srgb, var(--home-haze) 38%, var(--home-rule))"
                : "var(--home-rule)",
              background: isActive
                ? "color-mix(in srgb, var(--home-haze) 14%, var(--home-paper))"
                : "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
              color: "var(--home-ink)",
            }}
          >
            {cuisine.label}
          </button>
        );
      })}
    </div>
  );
}

function MealSegmented({
  state,
  onChange,
}: {
  state: FoodMapState;
  onChange: (meal: FoodMapMealId) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter by meal"
      className="flex flex-wrap gap-1 rounded-full p-1"
      style={getPanelStyle()}
    >
      {FOOD_MAP_MEALS.map((meal) => {
        const isActive = state.meal === meal.id;
        return (
          <button
            key={meal.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(meal.id)}
            className="min-h-touch rounded-full px-4 py-2 text-sm font-semibold transition-[transform,border-color,background-color,color] duration-200 ease"
            style={{
              background: isActive
                ? "color-mix(in srgb, var(--home-haze) 18%, var(--home-paper))"
                : "transparent",
              color: "var(--home-ink)",
              fontFamily: "var(--font-home-sans)",
              border: isActive
                ? "1px solid color-mix(in srgb, var(--home-haze) 35%, var(--home-rule))"
                : "1px solid transparent",
            }}
          >
            {meal.label}
          </button>
        );
      })}
    </div>
  );
}

function FoodMapSvg({
  state,
  visiblePlaces,
  onSelectPlace,
  onToggleNeighborhood,
}: {
  state: FoodMapState;
  visiblePlaces: ReadonlyArray<FoodMapPlace>;
  onSelectPlace: (id: string) => void;
  onToggleNeighborhood: (id: FoodMapNeighborhoodId) => void;
}) {
  const visibleIds = useMemo(
    () => new Set(visiblePlaces.map((place) => place.id)),
    [visiblePlaces]
  );

  return (
    <div
      className="home-card overflow-hidden p-4 sm:p-5"
      style={getPanelStyle()}
    >
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label="Stylized Austin food map showing curated restaurant pins by neighborhood"
        className="block h-auto w-full"
      >
        <rect
          x={0}
          y={0}
          width={100}
          height={100}
          fill="color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))"
        />

        {FOOD_MAP_NEIGHBORHOODS.map((neighborhood) => {
          const isActive = state.neighborhoods.includes(neighborhood.id);
          const fillStrength = isActive ? 24 : 12;
          const strokeStrength = isActive ? 55 : 25;

          return (
            <g
              key={neighborhood.id}
              className="cursor-pointer"
              onClick={() => onToggleNeighborhood(neighborhood.id)}
            >
              <rect
                x={neighborhood.shape.x}
                y={neighborhood.shape.y}
                width={neighborhood.shape.width}
                height={neighborhood.shape.height}
                rx={2.4}
                fill={`color-mix(in srgb, ${neighborhood.accent} ${fillStrength}%, var(--home-paper))`}
                stroke={`color-mix(in srgb, ${neighborhood.accent} ${strokeStrength}%, var(--home-rule))`}
                strokeWidth={0.5}
              />
              <text
                x={neighborhood.labelX}
                y={neighborhood.labelY}
                textAnchor="middle"
                style={{
                  fill: "var(--home-ink-muted)",
                  fontFamily: "var(--font-home-sans)",
                  fontSize: "2.4px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                {neighborhood.name}
              </text>
            </g>
          );
        })}

        <path
          d="M 6 51 Q 22 47 38 51 Q 54 55 70 51 Q 86 47 96 53 L 96 56 Q 86 50 70 54 Q 54 58 38 54 Q 22 50 6 54 Z"
          fill="color-mix(in srgb, var(--home-haze) 32%, var(--home-paper))"
          stroke="color-mix(in srgb, var(--home-haze) 45%, var(--home-rule))"
          strokeWidth={0.4}
        />
        <text
          x={50}
          y={54}
          textAnchor="middle"
          style={{
            fill: "var(--home-ink-muted)",
            fontFamily: "var(--font-home-sans)",
            fontSize: "1.9px",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Lady Bird Lake
        </text>

        {FOOD_MAP_PLACES.map((place) => {
          const isVisible = visibleIds.has(place.id);
          const isSelected = state.pick === place.id;
          const radius = isSelected ? 2.4 : 1.6;
          const fill = isSelected
            ? "var(--home-haze)"
            : isVisible
              ? "var(--home-ink)"
              : "color-mix(in srgb, var(--home-ink) 28%, var(--home-paper))";
          const stroke = isSelected ? "var(--home-paper)" : "transparent";
          const strokeWidth = isSelected ? 0.7 : 0;

          return (
            <g
              key={place.id}
              className="cursor-pointer"
              onClick={() => isVisible && onSelectPlace(place.id)}
              aria-label={`Select ${place.name}`}
              role="button"
              opacity={isVisible ? 1 : 0.45}
            >
              <circle
                cx={place.x}
                cy={place.y}
                r={radius}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
              {isSelected ? (
                <text
                  x={place.x}
                  y={place.y - 3.4}
                  textAnchor="middle"
                  style={{
                    fill: "var(--home-ink)",
                    fontFamily: "var(--font-home-sans)",
                    fontSize: "2px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                  }}
                >
                  {place.name}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PlaceCard({
  place,
  isSelected,
  onSelect,
}: {
  place: FoodMapPlace;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const neighborhood = getFoodMapNeighborhood(place.neighborhood);
  const cuisine = getFoodMapCuisine(place.cuisine);

  return (
    <button
      type="button"
      onClick={() => onSelect(place.id)}
      aria-pressed={isSelected}
      className="home-card min-h-touch w-full rounded-[1.25rem] p-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 ease"
      style={{
        ...getPanelStyle(),
        background: isSelected
          ? `color-mix(in srgb, ${neighborhood.accent} 14%, var(--home-paper))`
          : "color-mix(in srgb, var(--home-paper-alt) 70%, var(--home-elev-mix))",
        borderColor: isSelected
          ? `color-mix(in srgb, ${neighborhood.accent} 35%, var(--home-rule))`
          : "var(--home-rule)",
        boxShadow: isSelected ? "var(--shadow-md)" : "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="home-kicker mb-1">{cuisine.label}</p>
          <p
            className="mb-1 text-base font-semibold tracking-[-0.03em]"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {place.name}
          </p>
          <p
            className="mb-0 text-sm leading-relaxed"
            style={{ color: "var(--home-ink-muted)" }}
          >
            {neighborhood.name}
          </p>
        </div>
        <span
          className="resume-chip"
          style={{
            borderColor: "var(--home-rule)",
            background: "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
          }}
        >
          {place.price}
        </span>
      </div>
    </button>
  );
}

function PlaceDetail({
  place,
  onClear,
}: {
  place: FoodMapPlace;
  onClear: () => void;
}) {
  const neighborhood = getFoodMapNeighborhood(place.neighborhood);
  const cuisine = getFoodMapCuisine(place.cuisine);
  const mealLabels = place.meals.map((meal) =>
    meal.charAt(0).toUpperCase() + meal.slice(1)
  );

  return (
    <div
      className="home-card h-full p-5 sm:p-6"
      style={{
        ...getPanelStyle(),
        background: `color-mix(in srgb, ${neighborhood.accent} 12%, var(--home-paper))`,
        borderColor: `color-mix(in srgb, ${neighborhood.accent} 30%, var(--home-rule))`,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="home-kicker mb-1">{cuisine.label}</p>
          <h2
            className="text-[1.45rem] font-semibold tracking-[-0.04em]"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {place.name}
          </h2>
          <p
            className="mb-0 mt-1 text-sm leading-relaxed"
            style={{ color: "var(--home-ink-muted)" }}
          >
            {neighborhood.name} · {place.price}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="min-h-touch rounded-full px-4 py-2 text-sm font-semibold transition-[transform,border-color,background-color,color] duration-200 ease"
          style={{
            ...getPanelStyle(),
            color: "var(--home-ink)",
            fontFamily: "var(--font-home-sans)",
          }}
        >
          Clear pick
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.2rem] px-4 py-4" style={getPanelStyle()}>
          <p className="home-kicker mb-1">Order</p>
          <p
            className="mb-0 text-base font-semibold tracking-[-0.03em]"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {place.signature}
          </p>
        </div>
        <div className="rounded-[1.2rem] px-4 py-4" style={getPanelStyle()}>
          <p className="home-kicker mb-1">Best for</p>
          <p
            className="mb-0 text-base font-semibold tracking-[-0.03em]"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {mealLabels.join(" · ")}
          </p>
        </div>
      </div>

      <p
        className="mt-5 text-[1rem] leading-relaxed"
        style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
      >
        {place.why}
      </p>
    </div>
  );
}

function FoodMapWorkbench({
  routeState,
  variants,
  onCommit,
}: {
  routeState: FoodMapState;
  variants: typeof fadeIn;
  onCommit: (next: FoodMapState) => void;
}) {
  const visiblePlaces = useMemo(
    () =>
      filterFoodMapPlaces(FOOD_MAP_PLACES, {
        neighborhoods: routeState.neighborhoods,
        cuisines: routeState.cuisines,
        meal: routeState.meal,
      }),
    [routeState.neighborhoods, routeState.cuisines, routeState.meal]
  );

  const selectedPlace = routeState.pick ? getFoodMapPlace(routeState.pick) : undefined;

  const hasFilters =
    routeState.neighborhoods.length > 0 ||
    routeState.cuisines.length > 0 ||
    routeState.meal !== DEFAULT_FOOD_MAP_STATE.meal;

  function handleToggleNeighborhood(id: FoodMapNeighborhoodId) {
    onCommit(toggleNeighborhood(routeState, id));
  }

  function handleToggleCuisine(id: FoodMapCuisineId) {
    onCommit(toggleCuisine(routeState, id));
  }

  function handleSetMeal(meal: FoodMapMealId) {
    onCommit(setMeal(routeState, meal));
  }

  function handleSelectPlace(id: string) {
    onCommit(setPick(routeState, id));
  }

  function handleClearPick() {
    onCommit(setPick(routeState, null));
  }

  function handleResetFilters() {
    onCommit(resetFoodMapFilters(routeState));
  }

  return (
    <section
      className="home-page min-h-screen"
      aria-label="Food Map"
      data-testid="food-map-shell"
    >
      <div className="home-shell home-section space-y-6 sm:space-y-8">
        <motion.div variants={variants} initial="hidden" animate="visible">
          <div className="space-y-4">
            <p className="home-kicker">Food Map</p>
            <h1
              className="max-w-4xl text-balance"
              style={{
                color: "var(--home-ink)",
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2.6rem, 6vw, 5rem)",
                fontWeight: 600,
                lineHeight: 0.94,
                letterSpacing: "-0.08em",
              }}
            >
              The Austin spots I send people to before they ask.
            </h1>
            <p className="home-body max-w-[42rem]">
              I built this because I keep typing the same restaurant list into
              text threads. The map keeps my actual go-tos in one place, sorted
              by neighborhood, cuisine, and what time of day I would actually be
              there. It is opinionated on purpose. I would rather give a short,
              honest list than a long one I do not stand behind.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="resume-chip">{FOOD_MAP_PLACES.length} curated stops</span>
              <span className="resume-chip">4 neighborhoods</span>
              <span className="resume-chip">Deep-linkable filters</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={variants} initial="hidden" animate="visible">
          <div
            className="home-card p-5 sm:p-6"
            style={getPanelStyle()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="home-kicker mb-1">Filters</p>
                <h2
                  className="text-[1.2rem] font-semibold tracking-[-0.04em]"
                  style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                >
                  Narrow the map by neighborhood, cuisine, or meal
                </h2>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!hasFilters}
                className="min-h-touch rounded-full px-4 py-2 text-sm font-semibold transition-[transform,border-color,background-color,color,box-shadow] duration-200 ease disabled:cursor-not-allowed disabled:opacity-55"
                style={{
                  ...getPanelStyle(),
                  color: "var(--home-ink)",
                  fontFamily: "var(--font-home-sans)",
                }}
              >
                Reset filters
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="home-kicker mb-2">Neighborhood</p>
                <NeighborhoodChips
                  state={routeState}
                  onToggle={handleToggleNeighborhood}
                />
              </div>
              <div>
                <p className="home-kicker mb-2">Cuisine</p>
                <CuisineChips state={routeState} onToggle={handleToggleCuisine} />
              </div>
              <div>
                <p className="home-kicker mb-2">Meal</p>
                <MealSegmented state={routeState} onChange={handleSetMeal} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={variants} initial="hidden" animate="visible">
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <FoodMapSvg
              state={routeState}
              visiblePlaces={visiblePlaces}
              onSelectPlace={handleSelectPlace}
              onToggleNeighborhood={handleToggleNeighborhood}
            />

            {selectedPlace ? (
              <PlaceDetail place={selectedPlace} onClear={handleClearPick} />
            ) : (
              <div
                className="home-card flex h-full flex-col justify-between p-5 sm:p-6"
                style={getPanelStyle()}
              >
                <div>
                  <p className="home-kicker mb-2">Pick</p>
                  <h2
                    className="text-[1.2rem] font-semibold tracking-[-0.04em]"
                    style={{
                      color: "var(--home-ink)",
                      fontFamily: "var(--font-home-sans)",
                    }}
                  >
                    Tap a pin or a card to see why it earns the spot.
                  </h2>
                  <p
                    className="mt-3 text-sm leading-relaxed"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Each entry has the order I land on, the meal I would
                    actually go for, and a short note on what makes the room
                    work. Filters and picks both encode in the URL, so the
                    shortlist I send a friend is just a link.
                  </p>
                </div>
                <p
                  className="mb-0 mt-5 text-sm"
                  style={{ color: "var(--home-ink-muted)" }}
                >
                  Showing {visiblePlaces.length} of {FOOD_MAP_PLACES.length} spots.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={variants} initial="hidden" animate="visible">
          <div
            className="home-card p-5 sm:p-6"
            style={getPanelStyle()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="home-kicker mb-1">Shortlist</p>
                <h2
                  className="text-[1.2rem] font-semibold tracking-[-0.04em]"
                  style={{
                    color: "var(--home-ink)",
                    fontFamily: "var(--font-home-sans)",
                  }}
                >
                  {visiblePlaces.length === 0
                    ? "Nothing matches that combination yet."
                    : `${visiblePlaces.length} ${visiblePlaces.length === 1 ? "spot" : "spots"} on this filter`}
                </h2>
              </div>
            </div>

            {visiblePlaces.length === 0 ? (
              <p
                className="mt-4 mb-0 text-sm leading-relaxed"
                style={{ color: "var(--home-ink-muted)" }}
              >
                The list intentionally stays short, so a few filters can rule it
                out entirely. Reset to see the full map.
              </p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visiblePlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isSelected={routeState.pick === place.id}
                    onSelect={handleSelectPlace}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function FoodMapClient({ initialState }: FoodMapClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? noMotion : fadeIn;

  const normalizedRouteState = normalizeFoodMapState(searchParams);
  const currentQuery = searchParams.toString();
  const currentHref = currentQuery ? `${FOOD_MAP_ROUTE}?${currentQuery}` : FOOD_MAP_ROUTE;
  const canonicalHref = buildFoodMapHref(normalizedRouteState);
  const hasManagedParams =
    searchParams.get("neighborhood") !== null ||
    searchParams.get("cuisine") !== null ||
    searchParams.get("meal") !== null ||
    searchParams.get("pick") !== null;
  const routeState = hasManagedParams ? normalizedRouteState : initialState;

  useEffect(() => {
    if (hasManagedParams && currentHref !== canonicalHref) {
      startTransition(() => {
        router.replace(canonicalHref, { scroll: false });
      });
    }
  }, [canonicalHref, currentHref, hasManagedParams, router]);

  return (
    <FoodMapWorkbench
      key={buildFoodMapHref(routeState)}
      routeState={routeState}
      variants={variants}
      onCommit={(next) =>
        router.replace(buildFoodMapHref(next), { scroll: false })
      }
    />
  );
}
