"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { IconBookmark, IconSearch } from "@tabler/icons-react";
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
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";

interface FoodMapClientProps {
  initialState: FoodMapState;
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const noMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

function getPanelStyle(): CSSProperties {
  return {
    background: "color-mix(in srgb, var(--home-paper-alt) 74%, var(--home-elev-mix))",
    border: "1px solid var(--home-rule)",
    boxShadow: "var(--shadow-sm)",
  };
}

interface Shortlist {
  id: string;
  label: string;
  blurb: string;
  placeIds: ReadonlyArray<string>;
}

const SHORTLISTS: ReadonlyArray<Shortlist> = [
  {
    id: "weeknight",
    label: "Quick weeknight",
    blurb: "Casual, fast, no reservation drama.",
    placeIds: ["veracruz-all-natural", "home-slice-pizza", "loro"],
  },
  {
    id: "date-night",
    label: "Date night",
    blurb: "Dinner rooms that earn the booking.",
    placeIds: ["suerte", "uchi", "perlas"],
  },
  {
    id: "tourist",
    label: "Tourist-tested",
    blurb: "The asks I get from out-of-town friends.",
    placeIds: ["franklin-barbecue", "junes-all-day", "home-slice-pizza"],
  },
];

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
            className="resume-chip min-h-touch transition-[transform,border-color,background-color,box-shadow] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
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
            className="resume-chip min-h-touch transition-[transform,border-color,background-color,box-shadow] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
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
            className="min-h-touch rounded-full px-4 py-2 text-sm font-semibold transition-[transform,border-color,background-color,color] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
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
      className="home-card min-h-touch w-full rounded-[1.25rem] p-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
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
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onClear}
        className="self-start min-h-touch rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-[transform,border-color,background-color,color] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
        style={{
          ...getPanelStyle(),
          color: "var(--home-ink)",
          fontFamily: "var(--font-home-sans)",
        }}
      >
        Clear pick
      </button>

      <div
        className="rounded-[1.5rem] p-5"
        style={{
          ...getPanelStyle(),
          background: `color-mix(in srgb, ${neighborhood.accent} 12%, var(--home-paper))`,
          borderColor: `color-mix(in srgb, ${neighborhood.accent} 30%, var(--home-rule))`,
        }}
      >
        <p className="home-kicker mb-1">{cuisine.label}</p>
        <h2
          className="text-[1.35rem] font-semibold tracking-[-0.04em]"
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

        <div className="mt-4 grid gap-3">
          <div className="rounded-[1.1rem] px-4 py-3" style={getPanelStyle()}>
            <p className="home-kicker mb-1">Order</p>
            <p
              className="mb-0 text-[0.95rem] font-semibold tracking-[-0.02em]"
              style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
            >
              {place.signature}
            </p>
          </div>
          <div className="rounded-[1.1rem] px-4 py-3" style={getPanelStyle()}>
            <p className="home-kicker mb-1">Best for</p>
            <p
              className="mb-0 text-[0.95rem] font-semibold tracking-[-0.02em]"
              style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
            >
              {mealLabels.join(" · ")}
            </p>
          </div>
        </div>

        <p
          className="mt-4 text-[0.95rem] leading-relaxed"
          style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
        >
          {place.why}
        </p>
      </div>
    </div>
  );
}

function ShortlistsRail({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {SHORTLISTS.map((list) => {
        const places = list.placeIds
          .map((id) => getFoodMapPlace(id))
          .filter((p): p is FoodMapPlace => Boolean(p));
        if (places.length === 0) return null;

        return (
          <div
            key={list.id}
            className="rounded-[1.25rem] p-4"
            style={getPanelStyle()}
          >
            <p
              className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: "var(--home-ink-muted)" }}
            >
              {list.label}
            </p>
            <p
              className="mb-3 text-[0.85rem] leading-relaxed"
              style={{ color: "var(--home-ink-muted)" }}
            >
              {list.blurb}
            </p>
            <ul className="flex flex-col gap-1">
              {places.map((place) => {
                const neighborhood = getFoodMapNeighborhood(place.neighborhood);
                return (
                  <li key={`${list.id}-${place.id}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(place.id)}
                      className="min-h-touch flex w-full items-center justify-between gap-2 rounded-[0.85rem] px-3 py-2 text-left transition-[background-color,border-color] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2 hover:bg-[color-mix(in_srgb,var(--home-haze)_10%,transparent)]"
                      style={{
                        border: "1px solid var(--home-rule)",
                        background:
                          "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
                      }}
                      aria-label={`Pick ${place.name}`}
                    >
                      <span
                        className="text-[0.88rem] font-semibold tracking-[-0.02em]"
                        style={{
                          color: "var(--home-ink)",
                          fontFamily: "var(--font-home-sans)",
                        }}
                      >
                        {place.name}
                      </span>
                      <span
                        aria-hidden="true"
                        className="inline-block h-2 w-2 rounded-full"
                        style={{
                          background: `color-mix(in srgb, ${neighborhood.accent} 65%, var(--home-rule))`,
                        }}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlaces = useMemo(
    () =>
      filterFoodMapPlaces(FOOD_MAP_PLACES, {
        neighborhoods: routeState.neighborhoods,
        cuisines: routeState.cuisines,
        meal: routeState.meal,
      }),
    [routeState.neighborhoods, routeState.cuisines, routeState.meal]
  );

  const visiblePlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredPlaces;
    return filteredPlaces.filter((p) => {
      const cuisine = getFoodMapCuisine(p.cuisine);
      return (
        p.name.toLowerCase().includes(q) ||
        cuisine.label.toLowerCase().includes(q)
      );
    });
  }, [filteredPlaces, searchQuery]);

  const selectedPlace = routeState.pick ? getFoodMapPlace(routeState.pick) : undefined;

  const hasFilters =
    routeState.neighborhoods.length > 0 ||
    routeState.cuisines.length > 0 ||
    routeState.meal !== DEFAULT_FOOD_MAP_STATE.meal ||
    searchQuery.trim().length > 0;

  const currentNeighborhoodName = useMemo(() => {
    if (routeState.neighborhoods.length === 1) {
      return getFoodMapNeighborhood(routeState.neighborhoods[0]).name;
    }
    if (routeState.neighborhoods.length > 1) {
      return `${routeState.neighborhoods.length} neighborhoods`;
    }
    return "All";
  }, [routeState.neighborhoods]);

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
    setSearchQuery("");
    onCommit(resetFoodMapFilters(routeState));
  }

  const activeFilterCount =
    routeState.neighborhoods.length +
    routeState.cuisines.length +
    (routeState.meal !== DEFAULT_FOOD_MAP_STATE.meal ? 1 : 0) +
    (searchQuery.trim().length > 0 ? 1 : 0);

  const cuisineCount = new Set(FOOD_MAP_PLACES.map((p) => p.cuisine)).size;
  const cheapEatsCount = FOOD_MAP_PLACES.filter((p) => p.price === "$").length;
  const highEndCount = FOOD_MAP_PLACES.filter((p) => p.price === "$$$").length;

  const foodMapStatsCells: HomeStatsCell[] = [
    {
      label: "Curated stops",
      value: FOOD_MAP_PLACES.length.toLocaleString(),
    },
    {
      label: "Neighborhoods",
      value: FOOD_MAP_NEIGHBORHOODS.length.toLocaleString(),
    },
    {
      label: "Cuisines",
      value: cuisineCount.toLocaleString(),
    },
    {
      label: "Currently visible",
      value: visiblePlaces.length.toLocaleString(),
      sub: `of ${FOOD_MAP_PLACES.length}`,
    },
    {
      label: "Active filters",
      value: activeFilterCount,
      sub: hasFilters ? "Tap reset to clear" : "None applied",
    },
    {
      label: "Shortlists",
      value: SHORTLISTS.length.toLocaleString(),
    },
    {
      label: "Cheap eats",
      value: cheapEatsCount.toLocaleString(),
      sub: "$",
    },
    {
      label: "High-end",
      value: highEndCount.toLocaleString(),
      sub: "$$$",
    },
  ];

  return (
    <section
      className="home-page min-h-screen"
      aria-label="Food Map"
      data-testid="food-map-shell"
    >
      <div className="tool-page-stack">
        <motion.div variants={variants} initial="hidden" animate="visible">
          <div className="tool-shell" data-testid="food-map-tool-shell">
            <aside className="tool-sidebar" aria-label="Food map navigation">
              <div className="tool-brand">
                <div className="tool-brand-mark" aria-hidden="true">
                  IV
                </div>
                <div className="tool-brand-name">
                  Food Map
                  <small>Austin shortlist</small>
                </div>
              </div>

              <nav
                className="flex flex-col gap-1.5"
                aria-label="Neighborhood navigation"
              >
                {FOOD_MAP_NEIGHBORHOODS.map((neighborhood) => {
                  const counts = countPlacesByNeighborhood(FOOD_MAP_PLACES);
                  const isActive = routeState.neighborhoods.includes(
                    neighborhood.id
                  );
                  return (
                    <button
                      key={neighborhood.id}
                      type="button"
                      onClick={() => handleToggleNeighborhood(neighborhood.id)}
                      aria-pressed={isActive}
                      className={`tool-nav-link${isActive ? " is-active" : ""}`}
                    >
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 flex-none rounded-full"
                        style={{
                          background: `color-mix(in srgb, ${neighborhood.accent} 70%, var(--home-rule))`,
                        }}
                      />
                      <span className="truncate">{neighborhood.name}</span>
                      <span className="tool-nav-pill">
                        {counts[neighborhood.id] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="tool-sidebar-footer">
                <IconBookmark size={14} aria-hidden="true" />
                <span>Curated by Isaac</span>
              </div>
            </aside>

            <div className="tool-main" id="food-map-main">
              <div className="tool-topbar">
                <div>
                  <p className="tool-crumbs">
                    Food Map / <strong>{currentNeighborhoodName}</strong>
                  </p>
                  <h1>Food Map</h1>
                </div>

                <label className="tool-search" aria-label="Filter by name or cuisine">
                  <IconSearch size={14} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Filter by name or cuisine…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>
              </div>

              <div
                className="tool-meta-chip"
                role="status"
                aria-live="polite"
              >
                <span className="tool-meta-chip-dot" aria-hidden="true" />
                <span>
                  <strong>{FOOD_MAP_PLACES.length}</strong> curated stops
                </span>
                <span className="tool-meta-chip-divider" aria-hidden="true">
                  ·
                </span>
                <span>
                  <strong>{FOOD_MAP_NEIGHBORHOODS.length}</strong> neighborhoods
                </span>
                <span className="tool-meta-chip-spacer" />
                <span className="tool-meta-chip-meta">
                  Showing {visiblePlaces.length} of {FOOD_MAP_PLACES.length} spots.
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <HomeStatsPanel
                  id="food-map-stats"
                  title="Food Map at a glance"
                  meta={`${visiblePlaces.length} of ${FOOD_MAP_PLACES.length} visible`}
                  hideLiveDot
                  cells={foodMapStatsCells}
                  pills={[
                    { label: "All stops", href: "/food-map" },
                    { label: "Cheap eats", href: "/food-map?cuisine=tex-mex" },
                    { label: "Date night", href: "/food-map?pick=suerte" },
                    { label: "Tourist-tested", href: "/food-map?pick=franklin-barbecue" },
                  ]}
                />

                <div className="tool-card tool-card-hero overflow-hidden p-4 sm:p-5">
                  <FoodMapSvg
                    state={routeState}
                    visiblePlaces={filteredPlaces}
                    onSelectPlace={handleSelectPlace}
                    onToggleNeighborhood={handleToggleNeighborhood}
                  />
                </div>

                <div
                  className="tool-card flex flex-col"
                  style={{ gap: 12 }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="home-kicker mb-0">Filters</p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      disabled={!hasFilters}
                      className="min-h-touch rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-[transform,border-color,background-color,color,box-shadow] duration-200 ease disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                      style={{
                        ...getPanelStyle(),
                        color: "var(--home-ink)",
                        fontFamily: "var(--font-home-sans)",
                      }}
                    >
                      Reset filters
                    </button>
                  </div>
                  <NeighborhoodChips
                    state={routeState}
                    onToggle={handleToggleNeighborhood}
                  />
                  <CuisineChips
                    state={routeState}
                    onToggle={handleToggleCuisine}
                  />
                  <MealSegmented state={routeState} onChange={handleSetMeal} />
                </div>

                {visiblePlaces.length === 0 ? (
                  <div className="tool-empty">
                    <p className="text-sm font-semibold" style={{ color: "var(--home-ink)" }}>
                      Nothing matches that combination yet.
                    </p>
                    <p>
                      The list intentionally stays short, so a few filters can
                      rule it out entirely.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-4 min-h-touch rounded-full px-4 py-2 text-sm font-semibold transition-[transform,border-color,background-color,color] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                      style={{
                        ...getPanelStyle(),
                        color: "var(--home-ink)",
                        fontFamily: "var(--font-home-sans)",
                      }}
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
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
            </div>

            <aside className="tool-rail" aria-label="Food map side panel">
              {selectedPlace ? (
                <PlaceDetail place={selectedPlace} onClear={handleClearPick} />
              ) : (
                <>
                  <p className="tool-rail-label">Shortlists</p>
                  <p
                    className="-mt-1 text-[0.85rem] leading-relaxed"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Tap a pin or a card to see why it earns the spot.
                  </p>
                  <ShortlistsRail onSelect={handleSelectPlace} />
                </>
              )}

              <p className="tool-rail-foot">
                These are the spots I actually send people to.
              </p>
            </aside>
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
