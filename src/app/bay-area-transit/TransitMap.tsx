"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BASEMAP_TILES,
  loadLeaflet,
  type LatLng,
  type LeafletLayerGroup,
  type LeafletMap,
  type LeafletStatic,
} from "@/lib/leaflet";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { escapeHtml } from "@/lib/utils";
import type { TransitLine, TransitStation } from "@/types/bayAreaTransit";
import { bundleTrack, linePath } from "./station-map";

interface TransitMapProps {
  stations: TransitStation[];
  lines: TransitLine[];
  selectedStationId: string | null;
  /** Uppercase abbrs of stations with a station-scoped advisory. */
  advisoryStations: Set<string>;
  /** Lowercased colour name of the line drawn on top, others dimmed. */
  highlightedLine: string | null;
  /** The line a line button pinned. A change here fits the map to that line. */
  framedLine: string | null;
  onSelect: (stationId: string) => void;
}

/** From this zoom every station is named; transfers one step earlier. */
const LABEL_ZOOM = 12;
const TRANSFER_LABEL_ZOOM = 11;
const STATION_ZOOM = 13;
/** One line's stroke width; lines sharing track sit this far apart. */
const LINE_WEIGHT = 4;

const lineKey = (colorName: string) => colorName.trim().toLowerCase();

/** Stops shrink when the whole network is in view, so they don't bury the lines. */
function stopRadius(zoom: number, isSelected: boolean, isTransfer: boolean): number {
  const scale = zoom <= 10 ? 0.6 : zoom <= 12 ? 0.8 : 1;
  return (isSelected ? 9 : isTransfer ? 6.5 : 5) * scale;
}

/**
 * The street map. Lines are drawn through BART's own station order with an
 * ink casing under each colour, so red and blue hold up on the washed tiles in
 * either theme. Vector paths can't take keyboard focus, so the chips above and
 * the station list below are the keyboard path to the same selection. Renders
 * nothing when Leaflet can't load, which leaves the drawn map underneath.
 */
export function TransitMap({
  stations,
  lines,
  selectedStationId,
  advisoryStations,
  highlightedLine,
  framedLine,
  onSelect,
}: TransitMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletStatic | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const lineGroupRef = useRef<LeafletLayerGroup | null>(null);
  const stopGroupRef = useRef<LeafletLayerGroup | null>(null);
  const selectRef = useRef(onSelect);
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [zoom, setZoom] = useState(0);

  const byAbbr = useMemo(() => new Map(stations.map((s) => [s.abbr, s])), [stations]);
  // Line ends are how riders read a direction ("to Richmond"), so they keep
  // their names even with the whole network in view.
  const terminals = useMemo(() => {
    // Only lines the map draws, so the airport connector BART lists as
    // OAKL, OAKL doesn't name a station in the middle of the East Bay.
    const ends = new Set<string>();
    for (const line of lines) {
      const path = linePath(line, byAbbr);
      if (path.length > 0) {
        ends.add(path[0].abbr);
        ends.add(path[path.length - 1].abbr);
      }
    }
    return ends;
  }, [lines, byAbbr]);
  const allCoords = useMemo<LatLng[]>(
    () => stations.map((s) => [s.latitude, s.longitude]),
    [stations]
  );

  // Initialise once and frame the whole network.
  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        leafletRef.current = L;
        // Quarter steps let the opening frame fit the network instead of snapping wide.
        // On a touch screen one finger scrolls the page rather than the map;
        // pinch, the zoom buttons, and selecting a station still move it.
        const touch = window.matchMedia("(pointer: coarse)").matches;
        const map = L.map(containerRef.current, {
          scrollWheelZoom: false,
          zoomSnap: 0.25,
          dragging: !touch,
        });
        L.tileLayer(BASEMAP_TILES.url, {
          attribution: `${BASEMAP_TILES.attribution} · BART`,
          maxZoom: 18,
        }).addTo(map);
        if (allCoords.length > 0) {
          map.fitBounds(allCoords, { padding: [24, 24], animate: false });
        } else {
          map.setView([37.8, -122.27], 10);
        }
        lineGroupRef.current = L.layerGroup().addTo(map);
        stopGroupRef.current = L.layerGroup().addTo(map);
        map.on("zoomend", () => setZoom(map.getZoom()));
        // The frame grows with the board beside it, which Leaflet only notices
        // on a window resize, so tell it whenever the box itself changes.
        resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(containerRef.current);
        mapRef.current = map;
        setZoom(map.getZoom());
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      lineGroupRef.current = null;
      stopGroupRef.current = null;
    };
    // Mount only. Data changes are drawn by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lines: one ink casing per stretch of track, wide enough for every line on
  // it, with the BART colours set side by side on top. Redrawn on zoom, since
  // the side-by-side offset is in screen pixels.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const group = lineGroupRef.current;
    if (status !== "ready" || !L || !map || !group) return;
    group.clearLayers();

    const z = map.getZoom();
    const segments = bundleTrack(
      lines.map((line) => ({
        key: lineKey(line.colorName),
        hex: line.hexColor,
        path: linePath(line, byAbbr).map((s) => ({
          abbr: s.abbr,
          ...map.project([s.latitude, s.longitude], z),
        })),
      })),
      LINE_WEIGHT
    );
    const toLatLng = (p: { x: number; y: number }): LatLng => {
      const { lat, lng } = map.unproject([p.x, p.y], z);
      return [lat, lng];
    };
    const dim = (key: string) => highlightedLine !== null && key !== highlightedLine;

    for (const segment of segments) {
      L.polyline(segment.ends.map(toLatLng), {
        className: "c97-transit-casing",
        weight: segment.members.length * LINE_WEIGHT + 3,
        opacity: segment.members.every(dim) ? 0.18 : 1,
        interactive: false,
      }).addTo(group);
    }
    for (const segment of segments) {
      for (const stroke of segment.strokes) {
        L.polyline(stroke.ends.map(toLatLng), {
          color: stroke.hex,
          weight: LINE_WEIGHT,
          opacity: dim(stroke.key) ? 0.18 : 1,
          interactive: false,
        }).addTo(group);
      }
    }
  }, [status, lines, byAbbr, highlightedLine, zoom]);

  // Stops: bigger at transfers, a warning ring where BART posted an advisory.
  useEffect(() => {
    const L = leafletRef.current;
    const group = stopGroupRef.current;
    if (status !== "ready" || !L || !group) return;
    group.clearLayers();

    for (const station of stations) {
      const isSelected = station.id === selectedStationId;
      const isTransfer = station.lines.length > 1;
      const hasAdvisory = advisoryStations.has(station.abbr);
      const classes = [
        "c97-transit-stop",
        isSelected ? "c97-transit-stop-selected" : "",
        hasAdvisory ? "c97-transit-stop-alert" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const marker = L.circleMarker([station.latitude, station.longitude], {
        className: classes,
        radius: stopRadius(zoom, isSelected, isTransfer),
        weight: isSelected ? 3 : zoom <= 10 ? 1.5 : 2,
        fillOpacity: 1,
      }).addTo(group);
      marker.on("click", () => selectRef.current(station.id));
      const permanent =
        isSelected ||
        terminals.has(station.abbr) ||
        zoom >= LABEL_ZOOM ||
        (isTransfer && zoom >= TRANSFER_LABEL_ZOOM);
      marker.bindTooltip(escapeHtml(station.name), {
        permanent,
        direction: "top",
        offset: [0, -8],
        className: `c97-transit-tip${isSelected ? " c97-transit-tip-selected" : ""}`,
      });
    }
  }, [status, stations, selectedStationId, advisoryStations, zoom, terminals]);

  // Follow a new selection, but leave the opening frame on the whole network.
  const framedSelectionRef = useRef(selectedStationId);
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map || !selectedStationId) return;
    if (framedSelectionRef.current === selectedStationId) return;
    framedSelectionRef.current = selectedStationId;
    const station = stations.find((s) => s.id === selectedStationId);
    if (!station) return;
    const target = Math.max(map.getZoom(), STATION_ZOOM);
    const center: LatLng = [station.latitude, station.longitude];
    if (reduceMotion) map.setView(center, target);
    else map.flyTo(center, target);
  }, [status, selectedStationId, stations, reduceMotion]);

  // A framed line fits the view; clearing it goes back to the whole network.
  const framedLineRef = useRef(framedLine);
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map || framedLineRef.current === framedLine) return;
    framedLineRef.current = framedLine;
    const line = lines.find((l) => lineKey(l.colorName) === framedLine);
    const coords: LatLng[] = line
      ? stations
          .filter((s) => s.lines.some((name) => lineKey(name) === framedLine))
          .map((s) => [s.latitude, s.longitude])
      : allCoords;
    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [32, 32], maxZoom: 13, animate: !reduceMotion });
    }
  }, [status, framedLine, lines, stations, allCoords, reduceMotion]);

  if (status === "error") return null;

  return (
    <div
      ref={containerRef}
      className="c97-transit-leaflet c97-basemap"
      data-ready={status === "ready" ? "true" : undefined}
      role="application"
      aria-label="Street map of the BART network. Use the line buttons above and the station list below to move around it with a keyboard."
    />
  );
}
