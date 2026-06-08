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
import { IconSearch } from "@tabler/icons-react";
import {
  FOOD_MAP_CITIES,
  FOOD_MAP_CURATORS,
  FOOD_MAP_PLACES,
  countPlacesByCity,
  filterFoodMapPlaces,
  getCuisinesForCity,
  getFoodMapCity,
  getFoodMapCuisine,
  getFoodMapCurator,
  getPlaceAccent,
  mapsLink,
  type FoodMapCityId,
  type FoodMapCuisine,
  type FoodMapCuisineId,
  type FoodMapCuratorId,
  type FoodMapPlace,
} from "./food-map-data";
import {
  buildFoodMapHref,
  FOOD_MAP_ROUTE,
  normalizeFoodMapState,
  resetFoodMapFilters,
  setCity,
  setPick,
  toggleCuisine,
  toggleCurator,
  type FoodMapState,
} from "./food-map-state";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import { FoodMapLeaflet } from "./food-map-leaflet";

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

const FILTER_LABEL_CLASS =
  "text-[10.5px] font-bold uppercase tracking-[0.14em]";

function CityChips({
  state,
  counts,
  onSelect,
}: {
  state: FoodMapState;
  counts: Record<FoodMapCityId, number>;
  onSelect: (id: FoodMapCityId) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Choose a city" className="flex flex-wrap gap-2">
      {FOOD_MAP_CITIES.map((city) => {
        const isActive = state.city === city.id;
        return (
          <button
            key={city.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onSelect(city.id)}
            className="resume-chip min-h-touch transition-[transform,border-color,background-color,box-shadow] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
            style={{
              borderColor: isActive
                ? "color-mix(in srgb, var(--home-haze) 45%, var(--home-rule))"
                : "var(--home-rule)",
              background: isActive
                ? "color-mix(in srgb, var(--home-haze) 18%, var(--home-paper))"
                : "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
              color: "var(--home-ink)",
            }}
          >
            {city.name}
            <span
              className="ml-2 text-[0.7rem] uppercase tracking-[0.12em]"
              style={{ color: "var(--home-ink-muted)" }}
            >
              {counts[city.id] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CuratorChips({
  state,
  onToggle,
}: {
  state: FoodMapState;
  onToggle: (id: FoodMapCuratorId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FOOD_MAP_CURATORS.map((curator) => {
        const isActive = state.curators.includes(curator.id);
        return (
          <button
            key={curator.id}
            type="button"
            onClick={() => onToggle(curator.id)}
            aria-pressed={isActive}
            className="resume-chip min-h-touch inline-flex items-center gap-2 transition-[transform,border-color,background-color,box-shadow] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
            style={{
              borderColor: isActive
                ? `color-mix(in srgb, ${curator.accent} 55%, var(--home-rule))`
                : "var(--home-rule)",
              background: isActive
                ? `color-mix(in srgb, ${curator.accent} 18%, var(--home-paper))`
                : "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
              color: "var(--home-ink)",
            }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: curator.accent }}
            />
            {curator.name}
          </button>
        );
      })}
    </div>
  );
}

function CuisineChips({
  cuisines,
  state,
  onToggle,
}: {
  cuisines: ReadonlyArray<FoodMapCuisine>;
  state: FoodMapState;
  onToggle: (id: FoodMapCuisineId) => void;
}) {
  if (cuisines.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {cuisines.map((cuisine) => {
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

function PlaceCard({
  place,
  isSelected,
  onSelect,
}: {
  place: FoodMapPlace;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const cuisine = getFoodMapCuisine(place.cuisine);
  const accent = getPlaceAccent(place);
  const locale = place.neighborhood ?? getFoodMapCity(place.city).name;

  return (
    <button
      type="button"
      onClick={() => onSelect(place.id)}
      aria-pressed={isSelected}
      className="home-card min-h-touch w-full rounded-[1.25rem] p-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
      style={{
        ...getPanelStyle(),
        background: isSelected
          ? `color-mix(in srgb, ${accent} 14%, var(--home-paper))`
          : "color-mix(in srgb, var(--home-paper-alt) 70%, var(--home-elev-mix))",
        borderColor: isSelected
          ? `color-mix(in srgb, ${accent} 35%, var(--home-rule))`
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
            {locale}
          </p>
        </div>
        {place.price ? (
          <span
            className="resume-chip"
            style={{
              borderColor: "var(--home-rule)",
              background: "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
            }}
          >
            {place.price}
          </span>
        ) : null}
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
  const cuisine = getFoodMapCuisine(place.cuisine);
  const accent = getPlaceAccent(place);
  const city = getFoodMapCity(place.city);
  const locale = place.neighborhood
    ? `${place.neighborhood}, ${city.name}`
    : city.name;
  const curatorNames = place.curators.map((id) => getFoodMapCurator(id).name);

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
          background: `color-mix(in srgb, ${accent} 12%, var(--home-paper))`,
          borderColor: `color-mix(in srgb, ${accent} 30%, var(--home-rule))`,
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
          {locale}
          {place.price ? ` · ${place.price}` : ""}
        </p>

        <div className="mt-4 grid gap-3">
          <div className="rounded-[1.1rem] px-4 py-3" style={getPanelStyle()}>
            <p className="home-kicker mb-1">Order</p>
            <p
              className="mb-0 text-[0.95rem] font-semibold tracking-[-0.02em]"
              style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
            >
              {place.order}
            </p>
          </div>
          <div className="rounded-[1.1rem] px-4 py-3" style={getPanelStyle()}>
            <p className="home-kicker mb-1">Recommended by</p>
            <p
              className="mb-0 text-[0.95rem] font-semibold tracking-[-0.02em]"
              style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
            >
              {curatorNames.join(" · ")}
            </p>
          </div>
        </div>

        <p
          className="mt-4 text-[0.95rem] leading-relaxed"
          style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
        >
          {place.why}
        </p>

        <a
          href={mapsLink(place)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-touch items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold transition-[transform,border-color,background-color,color] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
          style={{
            ...getPanelStyle(),
            color: "var(--home-ink)",
            fontFamily: "var(--font-home-sans)",
          }}
        >
          Open in Google Maps ↗
        </a>
      </div>
    </div>
  );
}

function CuratorLegend() {
  return (
    <div className="flex flex-col gap-3">
      {FOOD_MAP_CURATORS.map((curator) => (
        <div key={curator.id} className="rounded-[1.25rem] p-4" style={getPanelStyle()}>
          <div className="mb-1 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: curator.accent }}
            />
            <p
              className={FILTER_LABEL_CLASS}
              style={{ color: "var(--home-ink)" }}
            >
              {curator.name}
            </p>
          </div>
          <p
            className="mb-0 text-[0.85rem] leading-relaxed"
            style={{ color: "var(--home-ink-muted)" }}
          >
            {curator.blurb}
          </p>
        </div>
      ))}
    </div>
  );
}

function FoodMapWorkbench({
  routeState,
  variants,
  reduceMotion,
  onCommit,
}: {
  routeState: FoodMapState;
  variants: typeof fadeIn;
  reduceMotion: boolean;
  onCommit: (next: FoodMapState) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const activeCity = getFoodMapCity(routeState.city);
  const cityCuisines = useMemo(
    () => getCuisinesForCity(routeState.city),
    [routeState.city]
  );

  const filteredPlaces = useMemo(
    () =>
      filterFoodMapPlaces(FOOD_MAP_PLACES, {
        city: routeState.city,
        curators: routeState.curators,
        cuisines: routeState.cuisines,
      }),
    [routeState.city, routeState.curators, routeState.cuisines]
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

  const cityCounts = useMemo(() => countPlacesByCity(FOOD_MAP_PLACES), []);
  const cityCount = cityCounts[routeState.city] ?? 0;

  const selectedPlace = routeState.pick ? getFoodMapPlaceInCity(routeState.pick, routeState.city) : undefined;

  const hasFilters =
    routeState.curators.length > 0 ||
    routeState.cuisines.length > 0 ||
    searchQuery.trim().length > 0;

  function handleSelectCity(id: FoodMapCityId) {
    setSearchQuery("");
    onCommit(setCity(routeState, id));
  }

  function handleToggleCurator(id: FoodMapCuratorId) {
    onCommit(toggleCurator(routeState, id));
  }

  function handleToggleCuisine(id: FoodMapCuisineId) {
    onCommit(toggleCuisine(routeState, id));
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
    routeState.curators.length +
    routeState.cuisines.length +
    (searchQuery.trim().length > 0 ? 1 : 0);

  const bourdainCount = FOOD_MAP_PLACES.filter((p) =>
    p.curators.includes("bourdain")
  ).length;

  const foodMapStatsCells: HomeStatsCell[] = [
    {
      label: "Curated stops",
      value: FOOD_MAP_PLACES.length.toLocaleString(),
    },
    {
      label: "Cities",
      value: FOOD_MAP_CITIES.length.toLocaleString(),
    },
    {
      label: "Curators",
      value: FOOD_MAP_CURATORS.length.toLocaleString(),
    },
    {
      label: `Cuisines in ${activeCity.name}`,
      value: cityCuisines.length.toLocaleString(),
    },
    {
      label: `Stops in ${activeCity.name}`,
      value: cityCount.toLocaleString(),
    },
    {
      label: "Currently visible",
      value: visiblePlaces.length.toLocaleString(),
      sub: `of ${cityCount}`,
    },
    {
      label: "Active filters",
      value: activeFilterCount,
      sub: hasFilters ? "Tap reset to clear" : "None applied",
    },
    {
      label: "Bourdain picks",
      value: bourdainCount.toLocaleString(),
      sub: "across all cities",
    },
  ];

  return (
    <section
      className="home-page min-h-screen"
      aria-label="Food Map"
      data-testid="food-map-shell"
    >
      <div className="home-shell home-section">
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          <div className="tool-topbar" id="food-map-main">
            <div>
              <p className="tool-crumbs">
                Food Map / <strong>{activeCity.name}</strong>
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

          <div className="tool-meta-chip" role="status" aria-live="polite">
            <span className="tool-meta-chip-dot" aria-hidden="true" />
            <span>
              <strong>{FOOD_MAP_PLACES.length}</strong> curated stops
            </span>
            <span className="tool-meta-chip-divider" aria-hidden="true">
              ·
            </span>
            <span>
              <strong>{FOOD_MAP_CITIES.length}</strong> cities
            </span>
            <span className="tool-meta-chip-spacer" />
            <span className="tool-meta-chip-meta">
              Showing {visiblePlaces.length} of {cityCount} in {activeCity.name}.
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
            <div className="flex flex-col gap-4">
              <HomeStatsPanel
                id="food-map-stats"
                title="Food Map at a glance"
                meta={`${visiblePlaces.length} of ${cityCount} visible in ${activeCity.name}`}
                hideLiveDot
                cells={foodMapStatsCells}
                pills={[
                  { label: "All stops", href: "/food-map" },
                  { label: "Tokyo", href: "/food-map?city=tokyo" },
                  { label: "Bourdain picks", href: "/food-map?curator=bourdain" },
                  { label: "New York", href: "/food-map?city=nyc" },
                ]}
              />

              <div className="tool-card tool-card-hero overflow-hidden p-4 sm:p-5">
                <FoodMapLeaflet
                  spots={filteredPlaces}
                  activeSpotId={routeState.pick}
                  onSelectSpot={handleSelectPlace}
                  center={activeCity.center}
                  zoom={activeCity.zoom}
                  reduceMotion={reduceMotion}
                />
              </div>

              <div className="tool-card flex flex-col" style={{ gap: 14 }}>
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

                <div className="flex flex-col gap-2">
                  <span
                    className={FILTER_LABEL_CLASS}
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    City
                  </span>
                  <CityChips
                    state={routeState}
                    counts={cityCounts}
                    onSelect={handleSelectCity}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span
                    className={FILTER_LABEL_CLASS}
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Curator
                  </span>
                  <CuratorChips state={routeState} onToggle={handleToggleCurator} />
                </div>

                <div className="flex flex-col gap-2">
                  <span
                    className={FILTER_LABEL_CLASS}
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Cuisine
                  </span>
                  <CuisineChips
                    cuisines={cityCuisines}
                    state={routeState}
                    onToggle={handleToggleCuisine}
                  />
                </div>
              </div>

              {visiblePlaces.length === 0 ? (
                <div className="tool-empty">
                  <p className="text-sm font-semibold" style={{ color: "var(--home-ink)" }}>
                    Nothing matches that combination yet.
                  </p>
                  <p>
                    The list intentionally stays short, so a few filters can rule it
                    out entirely.
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

            <aside
              aria-label="Food map side panel"
              className="flex flex-col gap-4 rounded-[1.5rem] p-5 lg:sticky lg:top-24 lg:self-start"
              style={getPanelStyle()}
            >
              {selectedPlace ? (
                <PlaceDetail place={selectedPlace} onClear={handleClearPick} />
              ) : (
                <>
                  <p className="tool-rail-label">Curators</p>
                  <p
                    className="-mt-1 text-[0.85rem] leading-relaxed"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Pins are colored by who recommends them. Tap a pin or a card to
                    see why it earns the spot.
                  </p>
                  <CuratorLegend />
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

/** Resolve a pick id, but only if it belongs to the active city — a pick from a
 *  different city shouldn't render in the detail panel. */
function getFoodMapPlaceInCity(
  id: string,
  city: FoodMapCityId
): FoodMapPlace | undefined {
  const place = FOOD_MAP_PLACES.find((entry) => entry.id === id);
  return place && place.city === city ? place : undefined;
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
    searchParams.get("city") !== null ||
    searchParams.get("curator") !== null ||
    searchParams.get("cuisine") !== null ||
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
      routeState={routeState}
      variants={variants}
      reduceMotion={Boolean(shouldReduceMotion)}
      onCommit={(next) =>
        router.replace(buildFoodMapHref(next), { scroll: false })
      }
    />
  );
}
