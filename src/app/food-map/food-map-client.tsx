"use client";

import { Search } from "lucide-react";
import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRouter, useSearchParams } from "next/navigation";
import { PROJECT_PRESS } from "@/constants/projectPress";
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

const FOOD_MAP_INK = PROJECT_PRESS[FOOD_MAP_ROUTE].lead;

/* -------------------------------------------------------------------------- */
/* Masthead ticker                                                            */
/* -------------------------------------------------------------------------- */

function HeroTicker() {
  // A printed line of the cities and a few flagship cuisines. It sits still,
  // since nothing on the site loops, and wraps onto a second line when narrow.
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

  return (
    <div className="fm-ticker" aria-hidden="true">
      <div className="fm-ticker-track">
        {words.map((word) => (
          <span key={word}>{word}</span>
        ))}
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
    <div id="food-map-city" role="radiogroup" aria-label="Choose a city" className="fm-chiprow" style={{ scrollMarginTop: "var(--c97-sp-5)" }}>
      {FOOD_MAP_CITIES.map((city, index) => {
        const isActive = state.city === city.id;
        return (
          <button
            key={city.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(city.id)}
            onKeyDown={(event) => {
              const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
                : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
              if (!direction) return;
              event.preventDefault();
              const nextIndex = (index + direction + FOOD_MAP_CITIES.length) % FOOD_MAP_CITIES.length;
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex]?.focus();
              onSelect(FOOD_MAP_CITIES[nextIndex].id);
            }}
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
      <span className="fm-ticket-cuisine">{cuisine.label}</span>
      <span className="fm-ticket-name c97-serif">{place.name}</span>
      <span className="fm-ticket-meta">
        <span>{locale}</span>
        {place.price ? <span className="c97-chip">{place.price}</span> : null}
      </span>
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
  headingRef,
}: {
  place: FoodMapPlace;
  onClear: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
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
      <button type="button" onClick={onClear} className="c97-btn-ghost">
        ← Clear pick
      </button>

      <div className="fm-dossier-head" style={{ ["--fm-accent" as string]: accent }}>
        <p className="fm-dossier-cuisine">{cuisine.label}</p>
        <h2 ref={headingRef} tabIndex={-1} className="fm-dossier-name c97-serif">{place.name}</h2>
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

        <p className="fm-dossier-why c97-prose">{place.why}</p>

        <a
          href={mapsLink(place)}
          target="_blank"
          rel="noopener noreferrer"
          className="c97-btn c97-offset"
          style={{ marginTop: "var(--c97-sp-3)" }}
        >
          Open in Google Maps <span className="c97-arrow-out" aria-hidden="true">↗</span>
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
  reduceMotion,
  onCommit,
}: {
  routeState: FoodMapState;
  reduceMotion: boolean;
  onCommit: (next: FoodMapState) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const pendingFocus = useRef<"detail" | "list" | null>(null);
  const dossierHeadingRef = useRef<HTMLHeadingElement>(null);
  const indexHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = pendingFocus.current === "detail" ? dossierHeadingRef.current
      : pendingFocus.current === "list" ? indexHeadingRef.current : null;
    if (!heading) return;
    pendingFocus.current = null;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [routeState.pick, reduceMotion]);

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
    pendingFocus.current = "detail";
    onCommit(setPick(routeState, id));
  }

  function handleClearPick() {
    pendingFocus.current = "list";
    onCommit(setPick(routeState, null));
  }

  function handleJumpToList() {
    const heading = indexHeadingRef.current;
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function handleResetFilters() {
    setSearchQuery("");
    onCommit(resetFoodMapFilters(routeState));
  }

  return (
    <section className="fm" aria-label="Food Map" data-testid="food-map-shell">
      <div>
        {/* Masthead */}
        <header
          className="c97-band c97-sheet c97-project-hero"
          data-c97-surface={`ink-${FOOD_MAP_INK}`}
          id="food-map-main"
        >
          <div className="c97-shell">
            <div className="fm-masthead-top">
              <div>
                <p className="c97-kicker">A field guide · where to eat</p>
                <h1 className="c97-poster">Food Map</h1>
                <p className="fm-lede c97-lead">
                  The spots I actually send people to, plus the ones the late Anthony
                  Bourdain and the crowd swear by, plotted across ten cities from Austin
                  to Tokyo. Pick a city, filter by who is vouching for it, and pull up
                  what to order before you go.
                </p>
                {/* The hero fills a phone's first screen, so one link goes straight to the city choice. */}
                <a href="#food-map-city" className="c97-btn-ghost">
                  Choose a city
                </a>
              </div>

              <div className="fm-stamp-badge" aria-hidden="true">
                <span className="fm-stamp-small">Est. now</span>
                <span className="fm-stamp-big">EAT HERE</span>
                <span className="fm-stamp-small">no reservations</span>
              </div>
            </div>

            <HeroTicker />

            <dl className="c97-project-hero-readouts fm-masthead-stats">
              <div className="c97-stat">
                <dt className="c97-stat-label">Curated stops</dt>
                <dd className="c97-stat-value">{FOOD_MAP_PLACES.length}</dd>
                <dd className="c97-stat-delta">across {FOOD_MAP_CITIES.length} cities</dd>
              </div>
              <div className="c97-stat">
                <dt className="c97-stat-label">In {activeCity.name}</dt>
                <dd className="c97-stat-value">{visiblePlaces.length}</dd>
                <dd className="c97-stat-delta">of {cityCount} total</dd>
              </div>
              <div className="c97-stat">
                <dt className="c97-stat-label">Cities mapped</dt>
                <dd className="c97-stat-value">{FOOD_MAP_CITIES.length}</dd>
                <dd className="c97-stat-delta">Austin to Tokyo</dd>
              </div>
            </dl>
          </div>
        </header>

        <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
          <div className="c97-shell">
            <p className="fm-status c97-tabular" role="status" aria-live="polite">
              <span className="fm-status-dot" aria-hidden="true" />
              <span>
                Showing {visiblePlaces.length} of {cityCount} in {activeCity.name} ·
                Reviewed {FOOD_MAP_AS_OF} · I would still verify hours before going.
              </span>
            </p>

            {/* Main grid */}
            <div className="fm-grid">
              <div className="fm-col">
                {/* City comes first, since the map, the filters, and the list all follow from it. */}
                <div className="fm-fieldset">
                  <span className="c97-kicker">City</span>
                  <CityTabs
                    state={routeState}
                    counts={cityCounts}
                    onSelect={handleSelectCity}
                  />
                  {/* On one column the list sits under the map and the filters, so this goes straight to it. */}
                  <div className="min-[1001px]:hidden print:hidden">
                    <button type="button" onClick={handleJumpToList} className="c97-btn-ghost">
                      Go to the list of stops
                    </button>
                  </div>
                </div>

                {/* Map */}
                <div className="fm-mapwrap c97-panel">
                  <div className="fm-mapwrap-head">
                    <p className="c97-kicker">The map · {activeCity.name}</p>
                    <span className="fm-map-legend" aria-hidden="true">
                      {FOOD_MAP_CURATORS.map((c) => (
                        <i key={c.id}>
                          <b style={{ background: c.accent }} />
                          {c.name.split(" ")[0]}
                        </i>
                      ))}
                    </span>
                  </div>
                  <FoodMapLeaflet
                    spots={visiblePlaces}
                    activeSpotId={routeState.pick}
                    onSelectSpot={handleSelectPlace}
                    center={activeCity.center}
                    zoom={activeCity.zoom}
                    reduceMotion={reduceMotion}
                  />
                </div>

                {/* Filters */}
                <div className="c97-panel">
                  <div className="fm-deck-head">
                    <p className="c97-kicker">Filters</p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      disabled={!hasFilters}
                      className="c97-btn-ghost"
                    >
                      Reset
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--c97-sp-3)",
                      marginTop: "var(--c97-sp-3)",
                    }}
                  >
                    <div className="fm-fieldset">
                      <span className="c97-kicker">Curator</span>
                      <CuratorStamps state={routeState} onToggle={handleToggleCurator} />
                    </div>

                    <div className="fm-fieldset">
                      <span className="c97-kicker">Cuisine</span>
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
                  <h2 ref={indexHeadingRef} tabIndex={-1} className="c97-poster-sm">The stops</h2>
                  <label className="fm-search">
                    <Search size={15} aria-hidden="true" />
                    <input
                      type="search"
                      aria-label="Filter by name or cuisine"
                      placeholder="Filter by name or cuisine…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </label>
                </div>

                {visiblePlaces.length === 0 ? (
                  <div className="fm-empty">
                    <p className="c97-serif" style={{ fontSize: "var(--c97-fs-h3)" }}>
                      Nothing matches that combination yet.
                    </p>
                    <p className="c97-prose">
                      The list intentionally stays short, so a few filters can rule it out
                      entirely. Loosen one and it comes back.
                    </p>
                    <button type="button" onClick={handleResetFilters} className="c97-btn-ghost">
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
                  <PlaceDossier place={selectedPlace} onClear={handleClearPick} headingRef={dossierHeadingRef} />
                ) : (
                  <>
                    <p className="c97-kicker">The curators</p>
                    <p className="fm-rail-lede c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
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
          </div>
        </section>
      </div>
    </section>
  );
}

/** Resolve a pick id, but only if it belongs to the active city, since a pick
 *  from a different city shouldn't render in the detail panel. */
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
      reduceMotion={shouldReduceMotion}
      onCommit={(next) => router.replace(buildFoodMapHref(next), { scroll: false })}
    />
  );
}
