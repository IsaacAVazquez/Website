"use client";

import { Search } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSearchParams } from "next/navigation";
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
  const tabsRef = useRef<HTMLDivElement>(null);

  // The bar scrolls sideways under 1200px, so a shared link or a reload can
  // open with the checked city off screen. This centres it with the bar's own
  // scroll, which scrollIntoView would not keep to, and leaves a tab that is
  // already in view where it is.
  useEffect(() => {
    const tabs = tabsRef.current;
    const checked = tabs?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!tabs || !checked) return;
    const bar = tabs.getBoundingClientRect();
    const box = checked.getBoundingClientRect();
    if (box.left >= bar.left && box.right <= bar.right) return;
    tabs.scrollLeft += box.left + box.width / 2 - (bar.left + bar.width / 2);
  }, [state.city]);

  return (
    <div ref={tabsRef} id="food-map-city" role="radiogroup" aria-label="Choose a city" className="fm-tabs">
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
            {city.name}{" "}
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
          className="c97-btn fm-dossier-maps"
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

  function revealHeading(heading: HTMLHeadingElement | null) {
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function handleSelectPlace(id: string) {
    // Picking the chosen stop again leaves the URL as it is, so no render follows to move the focus.
    if (id === selectedPlace?.id) {
      revealHeading(dossierHeadingRef.current);
      return;
    }
    pendingFocus.current = "detail";
    onCommit(setPick(routeState, id));
  }

  function handleClearPick() {
    pendingFocus.current = "list";
    onCommit(setPick(routeState, null));
  }

  function handleJumpToList() {
    revealHeading(indexHeadingRef.current);
  }

  function handleResetFilters() {
    setSearchQuery("");
    onCommit(resetFoodMapFilters(routeState));
  }

  return (
    <section className="fm" aria-label="Food Map" data-testid="food-map-shell" data-c97-surface="paper">
      <div className="c97-shell c97-frame fm-page">
        <header className="fm-head">
          <div className="fm-title">
            <h1>Food Map</h1>
            <p className="fm-lede">
              The spots I actually send people to, plus the ones the late Anthony Bourdain and the crowd swear by, across
              ten cities from Austin to Tokyo. Pick a city, filter by who is vouching for it, and pull up what to order
              before you go.
            </p>
          </div>
          <div className="fm-stamp-badge" aria-hidden="true">
            <span className="fm-stamp-big">EAT HERE</span>
            <span className="fm-stamp-small">no reservations</span>
          </div>
        </header>

        {/* City comes first, since the map, the filters, and the list all follow from it. */}
        <div className="fm-citybar">
          <CityTabs state={routeState} counts={cityCounts} onSelect={handleSelectCity} />
        </div>

        <p className="fm-status c97-tabular" role="status" aria-live="polite">
          <span className="fm-status-dot" aria-hidden="true" />
          <span>
            Showing {visiblePlaces.length} of {cityCount} in {activeCity.name} ·
            Reviewed {FOOD_MAP_AS_OF} · I would still verify hours before going.
          </span>
        </p>

        <div className="fm-mapwrap">
          {/* On one column the filters and the map sit between here and the list, so this goes straight to it. */}
          <div className="fm-jump">
            <button type="button" onClick={handleJumpToList} className="c97-btn-ghost">
              Go to the list of stops
            </button>
          </div>
          <div className="fm-filters">
            <div className="fm-fieldset" role="group" aria-label="Curator">
              <CuratorStamps state={routeState} onToggle={handleToggleCurator} />
            </div>
            <div className="fm-fieldset" role="group" aria-label="Cuisine">
              <CuisinePills cuisines={cityCuisines} state={routeState} onToggle={handleToggleCuisine} />
            </div>
            <button type="button" onClick={handleResetFilters} disabled={!hasFilters} className="c97-btn-ghost fm-reset">
              Reset
            </button>
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

        <div className="fm-grid">
          <div className="fm-col">
            <div className="fm-index-head">
              <h2 ref={indexHeadingRef} tabIndex={-1}>The stops</h2>
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
                <p className="fm-empty-title">Nothing matches that combination yet.</p>
                <p>
                  The list intentionally stays short, so a few filters can rule it out entirely. Loosen one and it comes
                  back.
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

          <aside aria-label="Food map side panel" className="fm-rail">
            {selectedPlace ? (
              <PlaceDossier place={selectedPlace} onClear={handleClearPick} headingRef={dossierHeadingRef} />
            ) : (
              <>
                <h2 className="fm-rail-title">The curators</h2>
                <p className="fm-rail-lede">
                  Pins are colored by who recommends them. Tap a pin or a stop to see what to order and why it earns the
                  spot.
                </p>
                <CuratorPassport />
              </>
            )}
          </aside>
        </div>
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

/**
 * The filters live in the URL, and every chip is a plain history replace. The
 * router syncs useSearchParams from the native call, so a chip never waits on
 * a server render of this page the way router.replace did.
 */
function replaceHref(href: string) {
  window.history.replaceState(null, "", href);
}

export function FoodMapClient({ initialState }: FoodMapClientProps) {
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
  const routeState = searchParams ? normalizedRouteState : initialState;

  useEffect(() => {
    if (hasManagedParams && currentHref !== canonicalHref) replaceHref(canonicalHref);
  }, [canonicalHref, currentHref, hasManagedParams]);

  return (
    <FoodMapWorkbench
      routeState={routeState}
      reduceMotion={shouldReduceMotion}
      onCommit={(next) => replaceHref(buildFoodMapHref(next))}
    />
  );
}
