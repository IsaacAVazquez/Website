// Minimal, dependency-free Leaflet loader.
//
// We avoid adding `leaflet`/`react-leaflet` as npm dependencies and instead load
// Leaflet from a pinned CDN at runtime, tiling from OpenStreetMap (both free, no
// API key). Consumers must handle the rejected promise and fall back to a
// non-map view. Only the slice of the Leaflet API we actually use is typed.

import type { LatLng } from "./food-map-data";

const VERSION = "1.9.4";
const CSS_URL = `https://unpkg.com/leaflet@${VERSION}/dist/leaflet.css`;
const JS_URL = `https://unpkg.com/leaflet@${VERSION}/dist/leaflet.js`;

export interface LeafletMap {
  setView(center: LatLng, zoom: number): LeafletMap;
  flyTo(center: LatLng, zoom: number): LeafletMap;
  fitBounds(
    bounds: LatLng[],
    options?: { padding?: [number, number]; maxZoom?: number }
  ): LeafletMap;
  invalidateSize(): void;
  remove(): void;
}

export interface LeafletLayer {
  addTo(target: LeafletMap | LeafletLayerGroup): LeafletLayer;
  remove(): void;
}

export interface LeafletLayerGroup {
  addTo(map: LeafletMap): LeafletLayerGroup;
  clearLayers(): void;
}

export interface LeafletMarker {
  addTo(target: LeafletMap | LeafletLayerGroup): LeafletMarker;
  on(event: string, handler: () => void): LeafletMarker;
  bindPopup(content: string, options?: Record<string, unknown>): LeafletMarker;
  openPopup(): LeafletMarker;
}

export interface LeafletIcon {
  readonly _icon?: unknown;
}

export interface LeafletStatic {
  map(el: HTMLElement, options?: Record<string, unknown>): LeafletMap;
  tileLayer(url: string, options?: Record<string, unknown>): LeafletLayer;
  marker(
    latlng: LatLng,
    options?: { icon?: LeafletIcon } & Record<string, unknown>
  ): LeafletMarker;
  layerGroup(): LeafletLayerGroup;
  divIcon(options: Record<string, unknown>): LeafletIcon;
}

type WindowWithLeaflet = Window & typeof globalThis & { L?: LeafletStatic };

let cached: Promise<LeafletStatic> | null = null;

export function loadLeaflet(): Promise<LeafletStatic> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Leaflet requires a browser environment"));
  }

  const existing = (window as WindowWithLeaflet).L;
  if (existing) return Promise.resolve(existing);
  if (cached) return cached;

  cached = new Promise<LeafletStatic>((resolve, reject) => {
    if (!document.querySelector("link[data-leaflet]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      link.crossOrigin = "";
      link.dataset.leaflet = "true";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = JS_URL;
    script.async = true;
    script.crossOrigin = "";
    script.onload = () => {
      const L = (window as WindowWithLeaflet).L;
      if (L) resolve(L);
      else reject(new Error("Leaflet loaded but window.L is undefined"));
    };
    script.onerror = () => {
      cached = null;
      reject(new Error("Failed to load Leaflet from CDN"));
    };
    document.head.appendChild(script);
  });

  return cached;
}

// CARTO basemaps give the food map its own cinematic look: a moody "dark
// matter" field-map at night, a warm "voyager" one by day. Both are free
// raster tiles that only require OSM + CARTO attribution.
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function cartoTiles(isDark: boolean): { url: string; attribution: string } {
  return {
    url: isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    attribution: CARTO_ATTRIBUTION,
  };
}
