"use client";

import { useMemo } from "react";
import { EARTHQUAKE_RECENT_LIMIT, type QuakeEvent } from "@/types/earthquake";
import { epicentres, type Spike } from "./seismogram";

interface EarthquakeSignatureProps {
  /** The past day's notable quakes, the same set the Recent log lists. */
  quakes: QuakeEvent[];
  /** The quakes inside the 24-hour window as trace spikes, from `seismogramSpikes`, computed once by the page. */
  spikes: Spike[];
  /** The day's strongest quake from the hero stats, which count every quake rather than the capped log. */
  strongest: { magnitude: number | null; place: string | null };
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const W = 1000;
const TRACE_BASE = 128;
const TRACE_AMP = 112;
const TRACE_H = 204;
const PLOT_TOP = 6;
const PLOT_H = 440;
/** The plot crops to 75°N to 60°S, where nearly every recorded quake falls. */
const LAT_NORTH = 75;
const LAT_SPAN = 135;
const PLOT_VIEW_H = PLOT_TOP + PLOT_H + 6;

function plotY(fractionFromNorthPole: number): number {
  const degreesFromTop = fractionFromNorthPole * 180 - (90 - LAT_NORTH);
  const clamped = Math.min(LAT_SPAN, Math.max(0, degreesFromTop));
  return PLOT_TOP + (clamped / LAT_SPAN) * PLOT_H;
}

const DEPTH_OPACITY = { shallow: 0.9, intermediate: 0.6, deep: 0.35 } as const;

const quakeWord = (count: number) => (count === 1 ? "quake" : "quakes");

/**
 * The page's signature, a day of shaking drawn as one seismograph trace across
 * the full width of the page, with the day's strongest quake labelled on it.
 * Marks respond to a pointer; the log is the keyboard path to the same
 * selection.
 */
export function EarthquakeSignature({ quakes, spikes, strongest: dayStrongest, selectedId, onSelect }: EarthquakeSignatureProps) {

  if (spikes.length === 0) {
    return <p className="c97-meta">No quakes of magnitude 2.5 or more in the past 24 hours.</p>;
  }

  const byId = new Map(quakes.map((quake) => [quake.id, quake]));
  const strongest = spikes.reduce((top, spike) => (spike.magnitude > top.magnitude ? spike : top));
  const strongestQuake = byId.get(strongest.id);
  const selectedSpike = spikes.find((spike) => spike.id === selectedId) ?? null;
  const trace = [
    `M0 ${TRACE_BASE}`,
    ...[...spikes]
      .sort((a, b) => a.x - b.x)
      .map((spike) => {
        const x = spike.x * W;
        const h = spike.height * TRACE_AMP;
        return `L${(x - 3).toFixed(1)} ${TRACE_BASE} L${(x - 1).toFixed(1)} ${(TRACE_BASE - h).toFixed(1)} L${(x + 1).toFixed(1)} ${(TRACE_BASE + h * 0.4).toFixed(1)} L${(x + 3).toFixed(1)} ${TRACE_BASE}`;
      }),
    `L${W} ${TRACE_BASE}`,
  ].join(" ");
  // The log keeps only the newest quakes, so on a busy day the strongest may
  // have scrolled out of it. The label always names the day's strongest from
  // the hero stats, and it sits on its spike only when that spike is drawn.
  const capped = quakes.length >= EARTHQUAKE_RECENT_LIMIT;
  const oldestX = Math.min(...spikes.map((spike) => spike.x));
  const labelInLog =
    dayStrongest.magnitude === null || Math.abs(dayStrongest.magnitude - strongest.magnitude) < 0.05;
  const labelSpike = labelInLog ? strongest : null;
  const labelEnd = labelSpike ? labelSpike.x > 0.6 : false;
  const label =
    dayStrongest.magnitude !== null
      ? `M${dayStrongest.magnitude.toFixed(1)} ${dayStrongest.place ?? ""}`.trim().slice(0, 52)
      : strongestQuake
      ? `M${strongestQuake.magnitude.toFixed(1)} ${strongestQuake.place}`.slice(0, 52)
      : `M${strongest.magnitude.toFixed(1)}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${TRACE_H}`}
      role="img"
      aria-labelledby="quake-signature-title quake-signature-desc"
      className="eq-trace-svg"
    >
      <title id="quake-signature-title">The past 24 hours of earthquakes</title>
      <desc id="quake-signature-desc">
        {`${capped ? `The ${spikes.length} most recent` : spikes.length} ${quakeWord(spikes.length)} of magnitude 2.5 or more in the past 24 hours, drawn as a seismograph trace across the day. The strongest of the day was ${label}.`}
      </desc>

      {capped && oldestX > 0.04 ? (
        <g>
          <defs>
            <pattern id="quake-uncovered" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="var(--c97-rule)" strokeWidth="2" />
            </pattern>
          </defs>
          <rect x={0} y={TRACE_BASE - TRACE_AMP} width={oldestX * W - 6} height={TRACE_AMP + 12} fill="url(#quake-uncovered)" />
          <text x={8} y={TRACE_BASE - TRACE_AMP + 16} className="eq-axis">
            Older quakes are outside the log
          </text>
        </g>
      ) : null}
      <line x1={0} x2={W} y1={TRACE_BASE} y2={TRACE_BASE} stroke="var(--c97-rule)" strokeWidth={1} />
      {[0, 6, 12, 18, 24].map((hour) => (
        <text
          key={hour}
          x={(hour / 24) * W}
          y={TRACE_BASE + 66}
          textAnchor={hour === 0 ? "start" : hour === 24 ? "end" : "middle"}
          className="eq-axis"
          // The 6h/18h ticks sit close enough to their neighbours that the
          // larger phone-width type (needed to clear the 11px floor) makes
          // them collide, so they're dropped there; 0/12/24 still span the
          // full window.
          data-quake-tick={hour === 6 || hour === 18 ? "mid" : "edge"}
        >
          {hour === 24 ? "Now" : `${24 - hour}h ago`}
        </text>
      ))}
      <path d={trace} fill="none" stroke="var(--c97-ink)" strokeWidth={1.6} strokeLinejoin="round" />
      {spikes.map((spike) => (
        <rect
          key={spike.id}
          x={spike.x * W - 5}
          y={TRACE_BASE - TRACE_AMP}
          width={10}
          height={TRACE_AMP * 1.4}
          fill="transparent"
          onClick={() => onSelect(spike.id)}
          style={{ cursor: "pointer" }}
        />
      ))}
      {selectedSpike ? (
        <line
          x1={selectedSpike.x * W}
          x2={selectedSpike.x * W}
          y1={TRACE_BASE - TRACE_AMP - 6}
          y2={TRACE_BASE + 18}
          stroke="var(--c97-ink)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ) : null}
      <text
        x={labelSpike ? (labelEnd ? labelSpike.x * W - 8 : labelSpike.x * W + 8) : W - 4}
        y={labelSpike ? TRACE_BASE - labelSpike.height * TRACE_AMP + 4 : TRACE_BASE - TRACE_AMP + 16}
        textAnchor={labelSpike && !labelEnd ? "start" : "end"}
        className="eq-trace-label"
      >
        {labelSpike ? label : `Strongest today ${label}`}
      </text>

    </svg>
  );
}

interface EpicentrePlotProps {
  quakes: QuakeEvent[];
  /** The same spikes the trace draws, so the plot shows exactly the trace's quakes. */
  spikes: Spike[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * The same day's quakes plotted where they struck on a bare graticule. There
 * is no coastline in the repo, and none is needed, because the dots trace the
 * plate boundaries on their own.
 */
export function EpicentrePlot({ quakes, spikes, selectedId, onSelect }: EpicentrePlotProps) {
  const points = useMemo(() => {
    const inWindow = new Set(spikes.map((spike) => spike.id));
    return epicentres(quakes.filter((quake) => inWindow.has(quake.id)));
  }, [quakes, spikes]);
  if (points.length === 0) return null;
  const byId = new Map(quakes.map((quake) => [quake.id, quake]));
  const selectedPoint = points.find((point) => point.id === selectedId) ?? null;
  // A full log holds only the newest quakes, so it cannot speak for the whole day.
  const plotted =
    quakes.length >= EARTHQUAKE_RECENT_LIMIT
      ? `the ${points.length} most recent ${quakeWord(points.length)} of magnitude 2.5 or more`
      : `the past day's ${points.length} ${quakeWord(points.length)}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${PLOT_VIEW_H}`}
      role="img"
      aria-label={`Epicentres of ${plotted} on a latitude and longitude grid, shaded by depth`}
      className="eq-plot-svg"
    >
      {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => (
        <line
          key={`lon${lon}`}
          x1={((lon + 180) / 360) * W}
          x2={((lon + 180) / 360) * W}
          y1={PLOT_TOP}
          y2={PLOT_TOP + PLOT_H}
          stroke="var(--c97-rule)"
          strokeWidth={lon === 0 ? 1 : 0.6}
        />
      ))}
      {[60, 30, 0, -30].map((lat) => {
        const y = plotY((90 - lat) / 180);
        return (
          <g key={`lat${lat}`}>
            <line x1={0} x2={W} y1={y} y2={y} stroke="var(--c97-rule)" strokeWidth={lat === 0 ? 1 : 0.6} />
            <text x={4} y={y - 4} className="eq-axis">
              {lat === 0 ? "Equator" : `${Math.abs(lat)}°${lat > 0 ? "N" : "S"}`}
            </text>
          </g>
        );
      })}
      {points.map((point) => (
        <circle
          key={point.id}
          cx={point.x * W}
          cy={plotY(point.y)}
          r={point.r * 1.7}
          fill="var(--c97-ink)"
          fillOpacity={DEPTH_OPACITY[point.depthBand]}
          onClick={() => onSelect(point.id)}
          style={{ cursor: "pointer" }}
        >
          <title>{byId.get(point.id)?.place ?? point.id}</title>
        </circle>
      ))}
      {selectedPoint ? (
        <circle
          cx={selectedPoint.x * W}
          cy={plotY(selectedPoint.y)}
          r={selectedPoint.r * 1.7 + 7}
          fill="none"
          stroke="var(--c97-ink)"
          strokeWidth={1.5}
        />
      ) : null}
    </svg>
  );
}
