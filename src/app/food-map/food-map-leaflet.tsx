"use client";

import { MapPin } from "lucide-react";
import { escapeHtml } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import {
  loadLeaflet,
  BASEMAP_TILES,
  type LeafletLayer,
  type LeafletLayerGroup,
  type LeafletMap,
  type LeafletMarker,
  type LeafletStatic,
} from "@/lib/leaflet";
import {
  getFoodMapCuisine,
  getPlaceAccent,
  type FoodMapPlace,
  type LatLng,
} from "./food-map-data";

interface FoodMapLeafletProps {
  /** Spots to plot, already filtered by the page. */
  spots: ReadonlyArray<FoodMapPlace>;
  /** Currently selected spot, highlighted and centered. */
  activeSpotId: string | null;
  /** Fired when a map pin is clicked. */
  onSelectSpot: (id: string) => void;
  /** Center used when there are no spots / nothing selected. */
  center: LatLng;
  zoom: number;
  /** When true, jump instead of animating (honors prefers-reduced-motion). */
  reduceMotion?: boolean;
}

// A plain circular ink dot rather than the old teardrop shape. The print
// shop CSS system only allows a border-radius of 0 or 50%, and a teardrop
// needs an asymmetric radius. The anchor is the dot's own center, since a
// circle (unlike a teardrop) has no point to anchor from.
const pinIcon = (L: LeafletStatic, color: string, active: boolean) => {
  const size = active ? 26 : 18;
  const half = size / 2;
  return L.divIcon({
    className: `fm-pin-el${active ? " fm-pin-active" : ""}`,
    html: `<span class="fm-pin-dot" style="width:${size}px;height:${size}px;background:${color};"></span>`,
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half - 6],
  });
};

export function FoodMapLeaflet({
  spots,
  activeSpotId,
  onSelectSpot,
  center,
  zoom,
  reduceMotion = false,
}: FoodMapLeafletProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletStatic | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const groupRef = useRef<LeafletLayerGroup | null>(null);
  const tileRef = useRef<LeafletLayer | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  // Tracks the last spot set we fit the viewport to, so re-styling the active
  // pin doesn't refit the bounds and fight the separate fly-to effect.
  const fittedKeyRef = useRef<string | null>(null);
  // Keep the latest click handler without re-running the map-init effect.
  const selectRef = useRef(onSelectSpot);
  useEffect(() => {
    selectRef.current = onSelectSpot;
  }, [onSelectSpot]);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Initialize the map once.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        leafletRef.current = L;
        const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
          center,
          zoom
        );
        tileRef.current = L.tileLayer(BASEMAP_TILES.url, {
          attribution: BASEMAP_TILES.attribution,
          maxZoom: 19,
        }).addTo(map);
        groupRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    const markers = markersRef.current;
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      groupRef.current = null;
      tileRef.current = null;
      markers.clear();
    };
    // Only run on mount. Center/zoom/theme changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild markers whenever the set of spots (or active highlight) changes.
  const spotsKey = spots.map((s) => s.id).join(",");
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const group = groupRef.current;
    if (status !== "ready" || !L || !map || !group) return;

    group.clearLayers();
    markersRef.current.clear();

    spots.forEach((spot) => {
      const color = getPlaceAccent(spot);
      const isActive = spot.id === activeSpotId;
      const marker = L.marker(spot.coords, {
        icon: pinIcon(L, color, isActive),
      }).addTo(group);
      marker.bindPopup(
        `<span class="fm-popup-title">${escapeHtml(spot.name)}</span><br/><span class="fm-popup-sub">${escapeHtml(
          getFoodMapCuisine(spot.cuisine).label
        )}</span>`
      );
      marker.on("click", () => selectRef.current(spot.id));
      markersRef.current.set(spot.id, marker);
    });

    // Only refit the viewport when the spot set actually changed. A pure
    // active-pin change re-styles markers but must not move the camera (that's
    // handled by the fly-to effect below).
    if (fittedKeyRef.current !== spotsKey) {
      fittedKeyRef.current = spotsKey;
      if (spots.length > 0) {
        map.fitBounds(
          spots.map((s) => s.coords),
          { padding: [48, 48], maxZoom: 14, animate: !reduceMotion }
        );
      } else {
        map.setView(center, zoom);
      }
    }
    // center/zoom are derived from the same filter change; intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotsKey, status, activeSpotId]);

  // Fly to + open the active spot when it changes (e.g. clicked in the list).
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map || !activeSpotId) return;
    const spot = spots.find((s) => s.id === activeSpotId);
    const marker = markersRef.current.get(activeSpotId);
    if (!spot) return;
    const target = Math.max(14, zoom);
    if (reduceMotion) {
      map.setView(spot.coords, target);
    } else {
      map.flyTo(spot.coords, target);
    }
    marker?.openPopup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSpotId, status]);

  if (status === "error") {
    return (
      <div className="fm-map-fallback c97-panel">
        <MapPin size={24} aria-hidden="true" />
        <p
          className="c97-prose"
          style={{ maxInlineSize: "var(--c97-measure-body)", fontSize: "var(--c97-fs-small)" }}
        >
          The interactive map couldn&apos;t load right now. The full list of stops is
          still below.
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        className="fm-map c97-basemap"
        role="application"
        aria-label="Map of recommended food spots"
      />
      {status === "loading" && (
        <div className="fm-map-loading">Loading map…</div>
      )}
    </div>
  );
}
