"use client";

import { useEffect, useMemo, useState } from "react";
import { LocateFixed } from "lucide-react";
import { formatUpdatedAt } from "@/lib/date-formatters";
import type {
  TransitDeparture,
  TransitLine,
  TransitSectionStatus,
  TransitStation,
  TransitStationBoard,
} from "@/types/bayAreaTransit";
import { bundleTrack, linePath, nearestStation, projectStations } from "./station-map";
import { TransitMap } from "./TransitMap";

interface TransitSignatureProps {
  stations: TransitStation[];
  lines: TransitLine[];
  selectedStation: TransitStation | null;
  stationBoard: TransitStationBoard | null;
  isLoading: boolean;
  error: string | null;
  onSelect: (stationId: string) => void;
  onRetry: () => void;
  /** Whether the snapshot's departures are fresh, the last good copy, or missing. */
  departuresStatus?: TransitSectionStatus;
  /** Uppercase abbrs of stations with a station-scoped advisory. */
  advisoryStations?: Set<string>;
}

const W = 640;
const H = 460;
const PAD = 28;
const DOT_R = 5;
const SELECTED_R = 9;
const DRAWN_LINE_WEIGHT = 3;
const NO_ADVISORIES = new Set<string>();

const lineKey = (colorName: string) => colorName.trim().toLowerCase();

/** Miles, since the Bay reads distance in miles. */
function formatMiles(km: number): string {
  const miles = km * 0.621371;
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "Leaving";
  if (minutes <= 0) return "Now";
  return `${minutes} min`;
}

/** BART's feed sends "RED"; the board prints "Red". */
function lineName(colorName: string): string {
  const trimmed = colorName.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/** "Red line · Platform 2 · 8 cars", leaving out whatever BART didn't send. */
function departureDetail(departure: TransitDeparture): string {
  return [
    `${lineName(departure.colorName)} line`,
    departure.platform ? `Platform ${departure.platform}` : null,
    departure.length > 0 ? `${departure.length} cars` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** The whole row as one sentence, so a screen reader hears more than "Daly City Leaving". */
function departureLabel(departure: TransitDeparture): string {
  const when =
    departure.minutes === null
      ? "leaving now"
      : departure.minutes <= 0
        ? "due now"
        : `in ${departure.minutes} min`;
  const late =
    departure.delaySeconds >= 60 ? `, ${Math.round(departure.delaySeconds / 60)} min late` : "";
  const platform = departure.platform ? `, platform ${departure.platform}` : "";
  const cars = departure.length > 0 ? `, ${departure.length} cars` : "";
  return `${lineName(departure.colorName)} line to ${departure.destination}, ${when}${late}${platform}${cars}. Show this line on the map.`;
}

/**
 * The trains still ahead at `now`, with their minutes counted from `now`.
 * BART counts minutes from the moment it answered, so a board that has been
 * held for a while overstates every wait by its own age.
 *
 * ponytail: trusts the viewer's clock. Send the server's time with the board
 * if skewed clocks turn up.
 */
export function upcomingDepartures(
  board: TransitStationBoard,
  now: number
): TransitDeparture[] {
  const elapsed = Math.floor((now - Date.parse(board.generatedAt)) / 60_000);
  // Written this way round so an unreadable generatedAt, which gives NaN, and
  // a clock that runs behind the server both leave the board as it was read.
  if (!(elapsed >= 1)) return board.departures;
  return board.departures
    .filter((departure) => (departure.minutes ?? 0) >= elapsed)
    .map((departure) => ({
      ...departure,
      minutes: (departure.minutes ?? 0) - elapsed,
    }));
}

function PlatformBoard({
  station,
  board,
  isLoading,
  error,
  onRetry,
  departuresStatus,
  pinnedLine,
  onHoverLine,
  onPinLine,
}: {
  station: TransitStation | null;
  board: TransitStationBoard | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  departuresStatus: TransitSectionStatus;
  pinnedLine: string | null;
  onHoverLine: (line: string | null) => void;
  onPinLine: (line: string) => void;
}) {
  // Null on the server and on the first client render, so both print the board
  // as it was read and hydration matches. The viewer's clock takes over after.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The viewer's clock can only be read after mount without breaking hydration
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const departures =
    board && now !== null ? upcomingDepartures(board, now) : board?.departures ?? [];

  return (
    <div className="c97-transit-board" data-c97-surface="espresso">
      {/* Padded only, so the espresso surface is the board itself. */}
      <div className="c97-transit-board-inner">
        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Next trains</p>
        {!station ? (
          <p className="text-sm leading-6" style={{ color: "var(--c97-ink-2)", marginBottom: "0" }}>
            No station is available in the current snapshot.
          </p>
        ) : (
          <>
            <h2 className="c97-poster-sm" style={{ marginBottom: "var(--c97-sp-1)" }}>{station.name}</h2>
            {board?.generatedAt ? (
              <p className="c97-meta" style={{ marginBottom: "var(--c97-sp-1)" }}>
                Read from BART {formatUpdatedAt(board.generatedAt)}
              </p>
            ) : null}
            {departuresStatus !== "fresh" ? (
              <p className="c97-transit-board-status" role="status">
                {departuresStatus === "stale-fallback"
                  ? "BART did not answer, so these times come from the last good snapshot and may be out of date."
                  : "Departures are unavailable from BART right now."}
              </p>
            ) : null}

            {isLoading ? (
              <p className="text-sm" role="status" style={{ color: "var(--c97-ink-2)", marginBottom: "0" }}>
                Loading departures…
              </p>
            ) : null}

            {error ? (
              <div role="alert">
                <p className="text-sm leading-6" style={{ marginBottom: "var(--c97-sp-1)", color: "var(--c97-negative)" }}>
                  {error}
                </p>
                <button type="button" className="c97-btn-ghost" onClick={onRetry}>
                  Try again
                </button>
              </div>
            ) : null}

            {!isLoading && !error && board ? (
              departures.length > 0 ? (
                <ul className="c97-transit-departures">
                  {departures.slice(0, 8).map((departure, index) => (
                    <li key={`${departure.destinationAbbr}-${departure.platform}-${index}`}>
                      {/* A row shows its line on the map: hover or focus to
                          preview it, press to keep it there. */}
                      <button
                        type="button"
                        className="c97-transit-departure-row"
                        aria-label={departureLabel(departure)}
                        aria-pressed={pinnedLine === lineKey(departure.colorName)}
                        onClick={() => onPinLine(lineKey(departure.colorName))}
                        onMouseEnter={() => onHoverLine(lineKey(departure.colorName))}
                        onMouseLeave={() => onHoverLine(null)}
                        onFocus={() => onHoverLine(lineKey(departure.colorName))}
                        onBlur={() => onHoverLine(null)}
                      >
                        <span
                          className="c97-transit-departure-bar"
                          style={{ background: departure.hexColor }}
                          aria-hidden="true"
                        />
                        <span className="c97-transit-departure-dest">{departure.destination}</span>
                        <span className="c97-mono c97-transit-departure-min">
                          {formatMinutes(departure.minutes)}
                        </span>
                        <span className="c97-transit-departure-detail">
                          {departureDetail(departure)}
                        </span>
                        {departure.delaySeconds >= 60 ? (
                          <span className="c97-transit-departure-late">
                            {Math.round(departure.delaySeconds / 60)} min late
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-6" style={{ color: "var(--c97-ink-2)", marginBottom: "0" }}>
                  {departuresStatus === "fresh" && board.departures.length === 0
                    ? `No trains are scheduled at ${station.name} right now.`
                    : `No upcoming departures in this snapshot for ${station.name}.`}
                </p>
              )
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The page's signature. A street map of the network with every line drawn
 * through its stations in BART's order, beside a platform board for the
 * selected station, set large like the display over the platform. The drawn
 * map under the street map is the server render, the print copy, and the
 * fallback when Leaflet can't load. Stations respond to a pointer; the line
 * buttons and the station list below are the keyboard path.
 */
export function TransitSignature({
  stations,
  lines,
  selectedStation,
  stationBoard,
  isLoading,
  error,
  onSelect,
  onRetry,
  departuresStatus = "fresh",
  advisoryStations = NO_ADVISORIES,
}: TransitSignatureProps) {
  const points = useMemo(
    () => projectStations(stations, lines, W, H, PAD),
    [stations, lines]
  );
  const byAbbr = useMemo(() => new Map(stations.map((s) => [s.abbr, s])), [stations]);
  const pointByAbbr = useMemo(() => new Map(points.map((p) => [p.abbr, p])), [points]);

  const [pinnedLine, setPinnedLine] = useState<string | null>(null);
  const [hoverLine, setHoverLine] = useState<string | null>(null);
  const highlightedLine = hoverLine ?? pinnedLine;
  const isDimmed = (key: string) => highlightedLine !== null && key !== highlightedLine;
  const track = useMemo(
    () =>
      bundleTrack(
        lines.map((line) => ({
          key: lineKey(line.colorName),
          hex: line.hexColor,
          path: linePath(line, pointByAbbr),
        })),
        DRAWN_LINE_WEIGHT
      ),
    [lines, pointByAbbr]
  );
  const togglePin = (key: string) =>
    setPinnedLine((current) => (current === key ? null : key));
  // Only the line buttons reframe the map. A board row highlights its line
  // and leaves the view on the station the rider is looking at.
  const [framedLine, setFramedLine] = useState<string | null>(null);

  const [locateNote, setLocateNote] = useState<string | null>(null);
  function handleLocate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocateNote("This browser can't share a location, so pick a station on the map or from the list below.");
      return;
    }
    setLocateNote("Finding the closest station…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const hit = nearestStation(stations, position.coords.latitude, position.coords.longitude);
        if (!hit) {
          setLocateNote(null);
          return;
        }
        onSelect(hit.station.id);
        setLocateNote(`${hit.station.name} is the closest station, about ${formatMiles(hit.km)} away.`);
      },
      () =>
        setLocateNote("Location is turned off, so pick a station on the map or from the list below."),
      { timeout: 10_000, maximumAge: 60_000 }
    );
  }

  return (
    <div className="c97-transit-signature">
      <div className="c97-transit-map" data-c97-surface="paper">
        <div className="c97-transit-map-head">
          <div className="c97-transit-line-toggles" role="group" aria-label="Show a line on the map">
            {lines.map((line) => {
              const key = lineKey(line.colorName);
              return (
                <button
                  key={line.id}
                  type="button"
                  className="c97-btn-ghost"
                  // "Blue" means little outside the Bay, so the name carries the route.
                  aria-label={line.name ? `${line.colorName} line, ${line.name}` : undefined}
                  title={line.name || undefined}
                  aria-pressed={pinnedLine === key}
                  onClick={() => {
                    togglePin(key);
                    setFramedLine(pinnedLine === key ? null : key);
                  }}
                  onMouseEnter={() => setHoverLine(key)}
                  onMouseLeave={() => setHoverLine(null)}
                  onFocus={() => setHoverLine(key)}
                  onBlur={() => setHoverLine(null)}
                >
                  <span
                    className="c97-transit-swatch"
                    style={{ background: line.hexColor, marginInlineEnd: "var(--c97-sp-1)" }}
                    aria-hidden="true"
                  />
                  {line.colorName}
                </button>
              );
            })}
          </div>
          <button type="button" className="c97-btn-ghost c97-transit-locate" onClick={handleLocate}>
            <LocateFixed className="h-4 w-4" aria-hidden="true" style={{ marginInlineEnd: "var(--c97-sp-1)" }} />
            Nearest station
          </button>
        </div>
        {locateNote ? (
          <p className="c97-meta c97-transit-locate-note" role="status">
            {locateNote}
          </p>
        ) : null}

        <div className="c97-transit-map-frame">
          {points.length === 0 ? (
            <p className="c97-meta">No stations in the current snapshot.</p>
          ) : (
            <svg
              className="c97-transit-drawn-map"
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-labelledby="transit-map-title"
            >
              <title id="transit-map-title">
                {`The BART network, ${points.length} stations, ${
                  selectedStation ? `with ${selectedStation.name} selected` : "none selected"
                }`}
              </title>
              {track.map((segment) => (
                <line
                  key={`casing-${segment.members.join("-")}-${segment.ends[0].x}-${segment.ends[0].y}`}
                  className="c97-transit-casing"
                  x1={segment.ends[0].x}
                  y1={segment.ends[0].y}
                  x2={segment.ends[1].x}
                  y2={segment.ends[1].y}
                  strokeWidth={segment.members.length * DRAWN_LINE_WEIGHT + 2}
                  strokeLinecap="round"
                  opacity={segment.members.every(isDimmed) ? 0.2 : 1}
                  aria-hidden="true"
                />
              ))}
              {track.flatMap((segment) =>
                segment.strokes.map((stroke) => (
                  <line
                    key={`${stroke.key}-${stroke.ends[0].x}-${stroke.ends[0].y}`}
                    x1={stroke.ends[0].x}
                    y1={stroke.ends[0].y}
                    x2={stroke.ends[1].x}
                    y2={stroke.ends[1].y}
                    stroke={stroke.hex}
                    strokeWidth={DRAWN_LINE_WEIGHT}
                    strokeLinecap="round"
                    opacity={isDimmed(stroke.key) ? 0.2 : 1}
                    aria-hidden="true"
                  />
                ))
              )}
              {points.map((point) => {
                const station = byAbbr.get(point.abbr);
                const isSelected = station?.id === selectedStation?.id;
                const r = isSelected ? SELECTED_R : DOT_R;
                return (
                  // Pointer only. The station list below is the keyboard path, and
                  // role="img" makes these marks presentational anyway.
                  <g
                    key={point.abbr}
                    style={{ cursor: "pointer" }}
                    onClick={() => station && onSelect(station.id)}
                  >
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={r}
                      className="c97-transit-drawn-stop"
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                    {isSelected ? (
                      <text
                        x={point.x}
                        y={point.y - r - 10}
                        textAnchor="middle"
                        className="c97-transit-station-label"
                      >
                        {station?.name ?? point.abbr}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          )}
          <TransitMap
            stations={stations}
            lines={lines}
            selectedStationId={selectedStation?.id ?? null}
            advisoryStations={advisoryStations}
            highlightedLine={highlightedLine}
            framedLine={framedLine}
            onSelect={onSelect}
          />
        </div>
      </div>

      <PlatformBoard
        departuresStatus={departuresStatus}
        station={selectedStation}
        board={stationBoard}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        pinnedLine={pinnedLine}
        onHoverLine={setHoverLine}
        onPinLine={togglePin}
      />
    </div>
  );
}
