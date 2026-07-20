"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { IconSearch } from "@tabler/icons-react";
import {
  FOOD_MAP_AS_OF,
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
import { FoodMapLeaflet } from "./food-map-leaflet";
import "./food-map.css";

interface FoodMapClientProps {
  initialState: FoodMapState;
}

const fadeIn = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const noMotion = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

/* -------------------------------------------------------------------------- */
/* Masthead ticker                                                            */
/* -------------------------------------------------------------------------- */

function HeroTicker() {
  // A printed marquee of the cities and a few flagship cuisines, doubled so the
  // CSS translate loops seamlessly. Motion is paused under prefers-reduced-motion.
  const words = useMemo(() => {
    const cities = FOOD_MAP_CITIES.map((c) => c.name);
    const cuisines = [
      "Barbecue",
      "Tacos",
      "Ramen",
      "Oysters",
      "Pintxos",
      "New Nordic",
      "Pastrami",
      "Wood-fired pizza",
    ];
    return [...cities, ...cuisines];
  }, []);

  const line = (
    <span aria-hidden="true">
      {words.map((word) => (
        <span key={word}>{word}</span>
      ))}
    </span>
  );

  return (
    <div className="fm-ticker" aria-hidden="true">
      <div className="fm-ticker-track">
        {line}
        {line}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter chips                                                               */
/* -------------------------------------------------------------------------- */

function CityTabs({
  state,
  counts,
  onSelect,
}: {
  state: FoodMapState;
  counts: Record<FoodMapCityId, number>;
  onSelect: (id: FoodMapCityId) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Choose a city" className="fm-chiprow">
      {FOOD_MAP_CITIES.map((city) => {
        const isActive = state.city === city.id;
        return (
          <button
            key={city.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onSelect(city.id)}
            className="fm-tab"
          >
            {city.name}
            <span className="fm-tab-count">{counts[city.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

function CuratorStamps({
  state,
  onToggle,
}: {
  state: FoodMapState;
  onToggle: (id: FoodMapCuratorId) => void;
}) {
  return (
    <div className="fm-chiprow">
      {FOOD_MAP_CURATORS.map((curator) => {
        const isActive = state.curators.includes(curator.id);
        return (
          <button
            key={curator.id}
            type="button"
            onClick={() => onToggle(curator.id)}
            aria-pressed={isActive}
            className="fm-stamp"
            style={{ ["--fm-accent" as string]: curator.accent }}
          >
            <span className="fm-stamp-dot" aria-hidden="true" />
            {curator.name}
          </button>
        );
      })}
    </div>
  );
}

function CuisinePills({
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
    <div className="fm-chiprow">
      {cuisines.map((cuisine) => {
        const isActive = state.cuisines.includes(cuisine.id);
        return (
          <button
            key={cuisine.id}
            type="button"
            onClick={() => onToggle(cuisine.id)}
            aria-pressed={isActive}
            className="fm-pill"
          >
            {cuisine.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Place index                                                               */
/* -------------------------------------------------------------------------- */

function PlaceTicket({
  place,
  index,
  isSelected,
  onSelect,
}: {
  place: FoodMapPlace;
  index: number;
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
      className="fm-ticket"
      style={{ ["--fm-accent" as string]: accent }}
    >
      <span className="fm-ticket-index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="fm-ticket-cuisine">{cuisine.label}</p>
      <p className="fm-ticket-name">{place.name}</p>
      <p className="fm-ticket-meta">
        <span>{locale}</span>
        {place.price ? <span className="fm-ticket-price">{place.price}</span> : null}
      </p>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Rail                                                                      */
/* -------------------------------------------------------------------------- */

function CuratorPassport() {
  return (
    <div className="fm-passport">
      {FOOD_MAP_CURATORS.map((curator) => (
        <div
          key={curator.id}
          className="fm-passport-card"
          style={{ ["--fm-accent" as string]: curator.accent }}
        >
          <p className="fm-passport-name">
            <span
              aria-hidden="true"
              className="fm-stamp-dot"
              style={{ ["--fm-accent" as string]: curator.accent }}
            />
            {curator.name}
          </p>
          <p className="fm-passport-blurb">{curator.blurb}</p>
        </div>
      ))}
    </div>
  );
}

function PlaceDossier({
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
    <div className="fm-dossier" style={{ ["--fm-accent" as string]: accent }}>
      <button type="button" onClick={onClear} className="fm-back">
        ← Clear pick
      </button>

      <div className="fm-dossier-head" style={{ ["--fm-accent" as string]: accent }}>
        <p className="fm-dossier-cuisine">{cuisine.label}</p>
        <h2 className="fm-dossier-name">{place.name}</h2>
        <p className="fm-dossier-locale">
          {locale}
          {place.price ? ` · ${place.price}` : ""}
        </p>

        <div className="fm-dossier-rows">
          <div className="fm-dossier-row">
            <p className="fm-dossier-row-label">Order</p>
            <p className="fm-dossier-row-val">{place.order}</p>
          </div>
          <div className="fm-dossier-row">
            <p className="fm-dossier-row-label">Recommended by</p>
            <p className="fm-dossier-row-val">{curatorNames.join(" · ")}</p>
          </div>
        </div>

        <p className="fm-dossier-why">{place.why}</p>

        <a
          href={mapsLink(place)}
          target="_blank"
          rel="noopener noreferrer"
          className="fm-dossier-link"
        >
          Open in Google Maps ↗
        </a>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Workbench                                                                  */
/* -------------------------------------------------------------------------- */

function FoodMapWorkbench({
  routeState,
  variants,
  reduceMotion,
  isDark,
  onCommit,
}: {
  routeState: FoodMapState;
  variants: typeof fadeIn;
  reduceMotion: boolean;
  isDark: boolean;
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

  const selectedPlace = routeState.pick
    ? getFoodMapPlaceInCity(routeState.pick, routeState.city)
    : undefined;

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

  const bourdainCount = FOOD_MAP_PLACES.filter((p) =>
    p.curators.includes("bourdain")
  ).length;

  return (
    <section className="fm" aria-label="Food Map" data-testid="food-map-shell">
      <div className="fm-shell">
        <motion.div variants={variants} initial="hidden" animate="visible">
          {/* Masthead */}
          <header className="fm-hero" id="food-map-main">
            <div className="fm-hero-top">
              <div>
                <p className="fm-kicker">A field guide · where to eat</p>
                <h1 className="fm-title">
                  Food <em>Map</em>
                </h1>
                <p className="fm-lede">
                  The spots I actually send people to, plus the ones the late Anthony
                  Bourdain and the crowd swear by, plotted across ten cities from Austin
                  to Tokyo. Pick a city, filter by who is vouching for it, and pull up
                  what to order before you go.
                </p>
              </div>

              <div className="fm-stamp-badge" aria-hidden="true">
                <span className="fm-stamp-small">Est. now</span>
                <span className="fm-stamp-big">EAT HERE</span>
                <span className="fm-stamp-small">no reservations</span>
              </div>
            </div>

            <HeroTicker />
          </header>

          {/* Search + stats */}
          <div className="fm-ribbon">
            <div className="fm-stat">
              <p className="fm-stat-label">Curated stops</p>
              <p className="fm-stat-val">{FOOD_MAP_PLACES.length}</p>
            </div>
            <div className="fm-stat">
              <p className="fm-stat-label">Cities</p>
              <p className="fm-stat-val">{FOOD_MAP_CITIES.length}</p>
            </div>
            <div className="fm-stat">
              <p className="fm-stat-label">Bourdain picks</p>
              <p className="fm-stat-val">{bourdainCount}</p>
            </div>
            <div className="fm-stat">
              <p className="fm-stat-label">In {activeCity.name}</p>
              <p className="fm-stat-val">
                {visiblePlaces.length}
                <em>/{cityCount}</em>
              </p>
            </div>
          </div>

          <div className="fm-status" role="status" aria-live="polite">
            <span className="fm-status-dot" aria-hidden="true" />
            <span>
              Showing {visiblePlaces.length} of {cityCount} in {activeCity.name} ·
              Reviewed {FOOD_MAP_AS_OF} · I would still verify hours before going.
            </span>
          </div>

          {/* Main grid */}
          <div className="fm-grid">
            <div className="fm-col">
              {/* Map */}
              <div className="fm-mapwrap">
                <div className="fm-mapwrap-head">
                  <p className="fm-kicker">The map · {activeCity.name}</p>
                  <span className="fm-map-legend" aria-hidden="true">
                    {FOOD_MAP_CURATORS.map((c) => (
                      <i key={c.id}>
                        <b style={{ background: c.accent }} />
                        {c.name.split(" ")[0]}
                      </i>
                    ))}
                  </span>
                </div>
                <div className="fm-map-ticks" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <FoodMapLeaflet
                  spots={filteredPlaces}
                  activeSpotId={routeState.pick}
                  onSelectSpot={handleSelectPlace}
                  center={activeCity.center}
                  zoom={activeCity.zoom}
                  reduceMotion={reduceMotion}
                  isDark={isDark}
                />
              </div>

              {/* Filters */}
              <div className="fm-panel">
                <div className="fm-deck-head">
                  <p className="fm-kicker">Filters</p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    disabled={!hasFilters}
                    className="fm-reset"
                  >
                    Reset
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 14 }}>
                  <div className="fm-fieldset">
                    <span className="fm-legend">City</span>
                    <CityTabs
                      state={routeState}
                      counts={cityCounts}
                      onSelect={handleSelectCity}
                    />
                  </div>

                  <div className="fm-fieldset">
                    <span className="fm-legend">Curator</span>
                    <CuratorStamps state={routeState} onToggle={handleToggleCurator} />
                  </div>

                  <div className="fm-fieldset">
                    <span className="fm-legend">Cuisine</span>
                    <CuisinePills
                      cuisines={cityCuisines}
                      state={routeState}
                      onToggle={handleToggleCuisine}
                    />
                  </div>
                </div>
              </div>

              {/* Index */}
              <div className="fm-index-head">
                <h2 className="fm-index-title">The stops</h2>
                <label className="fm-search" aria-label="Filter by name or cuisine">
                  <IconSearch size={15} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Filter by name or cuisine…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>
              </div>

              {visiblePlaces.length === 0 ? (
                <div className="fm-empty">
                  <p className="fm-empty-title">Nothing matches that combination yet.</p>
                  <p>
                    The list intentionally stays short, so a few filters can rule it out
                    entirely. Loosen one and it comes back.
                  </p>
                  <button type="button" onClick={handleResetFilters} className="fm-reset">
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="fm-index">
                  {visiblePlaces.map((place, i) => (
                    <PlaceTicket
                      key={place.id}
                      place={place}
                      index={i}
                      isSelected={routeState.pick === place.id}
                      onSelect={handleSelectPlace}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Rail */}
            <aside aria-label="Food map side panel" className="fm-rail">
              {selectedPlace ? (
                <PlaceDossier place={selectedPlace} onClear={handleClearPick} />
              ) : (
                <>
                  <p className="fm-kicker">The curators</p>
                  <p className="fm-rail-lede">
                    Pins are colored by who recommends them. Tap a pin or a stop to see
                    what to order and why it earns the spot.
                  </p>
                  <CuratorPassport />
                </>
              )}
              <p className="fm-rail-foot">
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

  // Theme drives the map basemap (dark field-map vs. warm daylight). This only
  // feeds the client-only Leaflet map, so there's no SSR markup to mismatch.
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
      isDark={isDark}
      onCommit={(next) => router.replace(buildFoodMapHref(next), { scroll: false })}
    />
  );
}
