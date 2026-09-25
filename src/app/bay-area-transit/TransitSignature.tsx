"use client";

import { useMemo } from "react";
import type {
  TransitLine,
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

function PlatformBoard({
  station,
  board,
  isLoading,
  error,
  onRetry,
}: {
  station: TransitStation | null;
  board: TransitStationBoard | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="c97-transit-board" data-c97-surface="espresso">
      {/*
       * Not `.c97-panel`: its `--c97-field` is a light card tint meant to sit
       * on a light surface. On espresso (a dark surface with light ink) that
       * field paints light text on a near-white box. The dark espresso
       * background is the board itself, so this stays unstyled but padded.
       */}
      <div className="c97-transit-board-inner">
        <p className="c97-kicker mb-1">Next trains</p>
        {!station ? (
          <p className="mb-0 text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
            No station is available in the current snapshot.
          </p>
        ) : (
          <>
            <h2 className="c97-poster-sm mb-2">{station.name}</h2>

            {isLoading ? (
              <p className="mb-0 text-sm" role="status" style={{ color: "var(--c97-ink-2)" }}>
                Loading departures…
              </p>
            ) : null}

            {error ? (
              <div role="alert">
                <p className="mb-2 text-sm leading-6" style={{ color: "var(--c97-negative)" }}>
                  {error}
                </p>
                <button type="button" className="c97-btn-ghost" onClick={onRetry}>
                  Try again
                </button>
              </div>
            ) : null}

            {!isLoading && !error && board ? (
              board.departures.length > 0 ? (
                <ul className="c97-transit-departures">
                  {board.departures.slice(0, 8).map((departure, index) => (
                    <li
                      key={`${departure.destinationAbbr}-${departure.platform}-${index}`}
                      className="c97-transit-departure-row"
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
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-0 text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
                  No upcoming departures in this snapshot for {station.name}.
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
 * The page's signature. A platform board for the selected station, set large
 * like the display over the platform, beside a station map with every
 * station ringed in the colours of the lines that serve it. The snapshot
 * carries no ordered station sequence per line, so the map draws dots and no
 * line paths. Dots respond to a pointer; the Departures list below is the
 * keyboard and screen-reader path to the same selection.
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
}: TransitSignatureProps) {
  const points = useMemo(
    () => projectStations(stations, lines, W, H, PAD),
    [stations, lines]
  );
  const byAbbr = useMemo(() => new Map(stations.map((s) => [s.abbr, s])), [stations]);

  return (
    <div className="c97-transit-signature">
      <PlatformBoard
        station={selectedStation}
        board={stationBoard}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
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
                <g
                  key={point.abbr}
                  role="button"
                  tabIndex={0}
                  aria-label={`${station?.name ?? point.abbr} station`}
                  aria-pressed={isSelected}
                  style={{ cursor: "pointer" }}
                  onClick={() => station && onSelect(station.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    if (!station) return;
                    onSelect(station.id);
                  }}
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
