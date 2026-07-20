"use client";

import { useEffect, useRef, useState } from "react";
import { IconMapPin } from "@tabler/icons-react";
import {
  loadLeaflet,
  cartoTiles,
  type LeafletLayer,
  type LeafletLayerGroup,
  type LeafletMap,
  type LeafletMarker,
  type LeafletStatic,
} from "./leaflet";
import {
  getFoodMapCuisine,
  getPlaceAccent,
  type FoodMapPlace,
  type LatLng,
} from "./food-map-data";

interface FoodMapLeafletProps {
  /** Spots to plot — already filtered by the page. */
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
  /** Drives the basemap: a moody dark field-map vs. a warm daylight one. */
  isDark?: boolean;
}

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string
  );

const pinIcon = (L: LeafletStatic, color: string, active: boolean) =>
  L.divIcon({
    className: `fm-pin-el${active ? " fm-pin-active" : ""}`,
    html: `<span class="fm-pin-dot" style="
      width:${active ? 30 : 22}px;height:${active ? 30 : 22}px;background:${color};
    "></span>`,
    iconSize: active ? [30, 30] : [22, 22],
    iconAnchor: active ? [15, 28] : [11, 21],
    popupAnchor: [0, active ? -26 : -20],
  });

export function FoodMapLeaflet({
  spots,
  activeSpotId,
  onSelectSpot,
  center,
  zoom,
  reduceMotion = false,
  isDark = false,
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
        const tiles = cartoTiles(isDark);
        tileRef.current = L.tileLayer(tiles.url, {
          attribution: tiles.attribution,
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
    // Only run on mount — center/zoom/theme changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the basemap when the theme flips, without tearing down the map.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (status !== "ready" || !L || !map) return;
    if (tileRef.current) {
      tileRef.current.remove();
    }
    const tiles = cartoTiles(isDark);
    tileRef.current = L.tileLayer(tiles.url, {
      attribution: tiles.attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [isDark, status]);

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
          { padding: [48, 48], maxZoom: 14 }
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
      <div className="fm-map-fallback" role="img" aria-label="Map unavailable">
        <IconMapPin size={28} aria-hidden="true" />
        <p style={{ maxWidth: "22rem", margin: 0, fontSize: 13.5 }}>
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
        className="fm-map"
        role="application"
        aria-label="Map of recommended food spots"
      />
      {status === "loading" && (
        <div className="fm-map-loading">Loading map…</div>
      )}
    </div>
  );
}
