"use client";

import { useEffect, useRef, useState } from "react";
import { IconMapPin } from "@tabler/icons-react";
import {
  loadLeaflet,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
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
    className: "food-map-pin",
    html: `<span style="
      display:block;width:${active ? 30 : 22}px;height:${active ? 30 : 22}px;
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      background:${color};border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      ${active ? "outline:3px solid rgba(0,0,0,0.18);outline-offset:1px;" : ""}
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
}: FoodMapLeafletProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletStatic | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const groupRef = useRef<LeafletLayerGroup | null>(null);
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
        L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(
          map
        );
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
      markers.clear();
    };
    // Only run on mount — center/zoom changes are handled below.
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
        `<strong>${escapeHtml(spot.name)}</strong><br/><span style="color:#555">${escapeHtml(
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
      <div
        className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-[var(--radius-3xl)] p-8 text-center"
        style={{
          border: "1px solid var(--home-rule)",
          background: "color-mix(in srgb, var(--home-paper) 90%, var(--home-elev-mix))",
        }}
        role="img"
        aria-label="Map unavailable"
      >
        <IconMapPin size={28} aria-hidden="true" style={{ color: "var(--home-ink-muted)" }} />
        <p className="max-w-xs text-sm" style={{ color: "var(--home-ink-muted)" }}>
          The interactive map couldn&apos;t load right now. The full list of spots is
          still below.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[420px] w-full">
      <div
        ref={containerRef}
        className="h-full min-h-[320px] w-full rounded-[var(--radius-3xl)]"
        style={{
          border: "1px solid var(--home-rule)",
          background: "color-mix(in srgb, var(--home-paper) 90%, var(--home-elev-mix))",
        }}
        role="application"
        aria-label="Map of recommended food spots"
      />
      {status === "loading" && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-3xl)] text-sm"
          style={{
            background: "color-mix(in srgb, var(--home-paper) 90%, var(--home-elev-mix))",
            color: "var(--home-ink-muted)",
          }}
        >
          Loading map…
        </div>
      )}
    </div>
  );
}
