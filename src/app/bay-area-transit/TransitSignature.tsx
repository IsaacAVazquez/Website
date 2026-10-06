"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type {
  TransitDeparture,
  TransitLine,
  TransitSectionStatus,
  TransitStation,
  TransitStationBoard,
} from "@/types/bayAreaTransit";
import { projectStations } from "./station-map";

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
}

const W = 640;
const H = 460;
const PAD = 28;
const DOT_R = 5;
const SELECTED_R = 9;
const RING_GAP = 3.5;

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "Leaving";
  if (minutes <= 0) return "Now";
  return `${minutes} min`;
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

/** A readable swatch border that still shows bright BART colors on light paper. */
export function swatchStyle(hexColor: string): CSSProperties {
  return {
    background: hexColor,
    border: "1px solid color-mix(in srgb, var(--c97-ink) 16%, transparent)",
  };
}

/**
 * Station search and the full station list, printed on the board itself so a
 * pick changes the departures right under it. The list closes on a pick, which
 * is what keeps the board in view on a phone.
 */
function StationFinder({
  stations,
  lines,
  selectedStationId,
  onSelect,
}: {
  stations: TransitStation[];
  lines: TransitLine[];
  selectedStationId: string | null;
  onSelect: (stationId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const hexByColor = useMemo(
    () => new Map(lines.map((line) => [line.colorName.trim().toLowerCase(), line.hexColor])),
    [lines]
  );
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? stations.filter(
        (station) =>
          station.name.toLowerCase().includes(needle) ||
          (station.city ?? "").toLowerCase().includes(needle) ||
          station.abbr.toLowerCase() === needle
      )
    : showAll
    ? stations
    : [];

  function pick(stationId: string, byKeyboard: boolean) {
    const opener = needle ? inputRef.current : toggleRef.current;
    onSelect(stationId);
    setQuery("");
    setShowAll(false);
    // The opener sits above the list, so bringing it back into view also brings
    // the board under it into view. A tap only scrolls, since focusing the
    // field would reopen the phone keyboard over the board, and it scrolls the
    // finder to the top of the screen because a field that is already in view
    // low on the screen leaves the board under the fold.
    if (byKeyboard || opener !== inputRef.current) opener?.focus();
    else opener?.closest(".c97-transit-finder")?.scrollIntoView?.({ block: "start" });
  }

  return (
    <div className="c97-transit-finder" data-c97-surface="paper">
      <label className="c97-kicker" htmlFor="transit-station-search">
        Find a station
      </label>
      <input
        ref={inputRef}
        id="transit-station-search"
        type="search"
        className="c97-field"
        autoComplete="off"
        placeholder="Station or city"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {needle ? null : (
        <button
          ref={toggleRef}
          type="button"
          className="c97-btn-ghost"
          style={{ justifySelf: "start" }}
          aria-expanded={showAll}
          onClick={() => setShowAll((open) => !open)}
        >
          {showAll ? "Hide the station list" : `Show all ${stations.length} stations`}
        </button>
      )}
      {visible.length > 0 ? (
        <ul className="c97-transit-station-list">
          {visible.map((station) => (
            <li key={station.id}>
              <button
                type="button"
                // A click that came from the keyboard carries no click count.
                onClick={(event) => pick(station.id, event.detail === 0)}
                aria-current={station.id === selectedStationId ? "true" : undefined}
                className="c97-transit-station-row"
              >
                <span className="min-w-0">
                  <span className="block c97-serif truncate" style={{ fontWeight: 600 }}>
                    {station.name}
                  </span>
                  <span className="block text-sm" style={{ color: "var(--c97-ink-2)" }}>
                    {station.city || "Bay Area"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center" style={{ gap: "var(--c97-sp-0)" }}>
                  {station.lines.map((colorName) => (
                    <span
                      key={`${station.id}-${colorName}`}
                      className="c97-transit-swatch"
                      style={swatchStyle(
                        hexByColor.get(colorName.trim().toLowerCase()) ?? "var(--c97-ink-2)"
                      )}
                      title={`${colorName} line`}
                      role="img"
                      aria-label={`${colorName} line`}
                    />
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : needle ? (
        <p className="c97-meta" role="status">
          No station matches that search.
        </p>
      ) : null}
    </div>
  );
}

function PlatformBoard({
  station,
  board,
  isLoading,
  error,
  onRetry,
  departuresStatus,
  finder,
}: {
  station: TransitStation | null;
  board: TransitStationBoard | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  departuresStatus: TransitSectionStatus;
  finder: ReactNode;
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
      {finder}
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
                    <li
                      key={`${departure.destinationAbbr}-${departure.platform}-${index}`}
                      className="c97-transit-departure-row"
                    >
                      <span
                        className="c97-transit-departure-bar"
                        style={{ background: departure.hexColor }}
                        aria-hidden="true"
                      />
                      <span className="c97-transit-departure-dest">
                        {departure.destination}
                        {departure.delaySeconds >= 60 ? (
                          <span className="c97-transit-departure-late">
                            {Math.round(departure.delaySeconds / 60)} min late
                          </span>
                        ) : null}
                      </span>
                      <span className="c97-mono c97-transit-departure-min">
                        {formatMinutes(departure.minutes)}
                      </span>
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
 * The page's signature. Station search and a platform board for the selected
 * station, set large like the display over the platform, beside a station map
 * with every station ringed in the colours of the lines that serve it. The
 * snapshot carries no ordered station sequence per line, so the map draws dots
 * and no line paths. Dots respond to a pointer; the station search and list on
 * the board are the keyboard and screen-reader path to the same selection.
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
}: TransitSignatureProps) {
  const points = useMemo(
    () => projectStations(stations, lines, W, H, PAD),
    [stations, lines]
  );
  const byAbbr = useMemo(() => new Map(stations.map((s) => [s.abbr, s])), [stations]);

  return (
    <div className="c97-transit-signature">
      <PlatformBoard
        departuresStatus={departuresStatus}
        station={selectedStation}
        board={stationBoard}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        finder={
          <StationFinder
            stations={stations}
            lines={lines}
            selectedStationId={selectedStation?.id ?? null}
            onSelect={onSelect}
          />
        }
      />

      {/*
       * Espresso, like the board: BART's own line colours are official data,
       * not a token, and most of them (red, blue, green) fall under 3:1 on
       * teal. Checked against every surface in the set, only the dark ones
       * clear 3:1 across the whole real palette (red is the tightest, 3.9:1
       * on espresso vs 1.5:1 on teal and 3.4:1 even on paper).
       */}
      <div className="c97-transit-map" data-c97-surface="espresso">
        {points.length === 0 ? (
          <p className="c97-meta">No stations in the current snapshot.</p>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="transit-map-title">
            <title id="transit-map-title">
              {`The BART network, ${points.length} stations, ${
                selectedStation ? `with ${selectedStation.name} selected` : "none selected"
              }`}
            </title>
            {points.map((point) => {
              const station = byAbbr.get(point.abbr);
              const isSelected = station?.id === selectedStation?.id;
              const r = isSelected ? SELECTED_R : DOT_R;
              return (
                // Pointer only. The station search on the board is the keyboard path, and
                // role="img" makes these marks presentational anyway.
                <g
                  key={point.abbr}
                  style={{ cursor: "pointer" }}
                  onClick={() => station && onSelect(station.id)}
                >
                  <circle cx={point.x} cy={point.y} r={r} fill="var(--c97-surface)" />
                  {point.rings.map((hex, index) => (
                    <circle
                      key={hex + index}
                      cx={point.x}
                      cy={point.y}
                      r={r + (index + 1) * RING_GAP}
                      fill="none"
                      stroke={hex}
                      strokeWidth={2}
                    />
                  ))}
                  {isSelected ? (
                    <text
                      x={point.x}
                      y={point.y - r - point.rings.length * RING_GAP - 8}
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
      </div>
    </div>
  );
}
