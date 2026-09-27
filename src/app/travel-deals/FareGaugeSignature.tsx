"use client";

import { useMemo } from "react";
import type { DestinationRegion } from "@/types/travelDeals";
import { formatUsd, type FareRating } from "@/lib/travelDeals";
import { bookingStrip, fareGauge, fitLabel } from "./fareGauge";

interface FareGaugeSignatureProps {
  quoted: number;
  region: DestinationRegion;
  departureDate: string;
  today: string;
}

const W = 640;
const X_LEFT = 34;
const X_RIGHT = 606;
const TRACK_W = X_RIGHT - X_LEFT;

// Gauge rows, top to bottom: kicker, the needle's amount/rating (or the empty
// prompt), the track with its typical tick, then the domain and typical labels.
const GAUGE_KICKER_Y = 16;
const GAUGE_RATING_Y = 40;
const GAUGE_TRACK_Y = 70;
const GAUGE_TRACK_H = 12;
const GAUGE_TICK_TOP = GAUGE_TRACK_Y - 12;
const GAUGE_TICK_BOTTOM = GAUGE_TRACK_Y + GAUGE_TRACK_H + 12;
const GAUGE_DOMAIN_ROW_Y = GAUGE_TRACK_Y + GAUGE_TRACK_H + 34;
const NEEDLE_BASE_Y = GAUGE_TRACK_Y - 20;
const NEEDLE_APEX_Y = GAUGE_TRACK_Y - 4;
const NEEDLE_STEM_BOTTOM = GAUGE_TRACK_Y + GAUGE_TRACK_H + 6;

// Strip rows: kicker, departure/sweet-spot labels above the track, the track
// itself, then today's label (or the empty prompt) below it.
const STRIP_TOP = 150;
const STRIP_KICKER_Y = STRIP_TOP + 2;
const STRIP_TRACK_Y = STRIP_TOP + 40;
const STRIP_TRACK_H = 14;
const STRIP_ABOVE_ROW_Y = STRIP_TRACK_Y - 14;
const STRIP_MARKER_TOP = STRIP_TRACK_Y - 20;
const STRIP_MARKER_BOTTOM = STRIP_TRACK_Y + STRIP_TRACK_H + 20;
const STRIP_BELOW_ROW_Y = STRIP_TRACK_Y + STRIP_TRACK_H + 34;

const H = 260;

/*
 * Mono glyphs advance about 0.62em. The label type is 15 units wide on a wide
 * screen and 32 at phone width (travel-deals.css), so each label is fitted
 * for both and the stylesheet shows the one that matches.
 */
const CHAR_WIDE = 15 * 0.62;
const CHAR_NARROW = 32 * 0.62;

function FittedLabel({ x, y, text, className }: { x: number; y: number; text: string; className: string }) {
  return (
    <>
      <text x={fitLabel(x, text.length * CHAR_WIDE, 0, W)} y={y} textAnchor="middle" className={`${className} c97-fare-wide`}>
        {text}
      </text>
      <text x={fitLabel(x, text.length * CHAR_NARROW, 0, W)} y={y} textAnchor="middle" className={`${className} c97-fare-narrow`}>
        {text}
      </text>
    </>
  );
}

const RATING_LABEL: Record<FareRating, string> = {
  steal: "Steal",
  good: "Good",
  fair: "Fair",
  high: "High",
};

/**
 * The page's signature. A fare gauge, the region's typical band with a
 * needle at the quoted fare, and a booking strip marking the sweet-spot
 * window against today. Both read straight off the trip form below, which
 * stays the keyboard path since this SVG carries no interactive marks.
 */
export function FareGaugeSignature({ quoted, region, departureDate, today }: FareGaugeSignatureProps) {
  const gauge = useMemo(() => fareGauge(quoted, region), [quoted, region]);
  const strip = useMemo(() => bookingStrip(departureDate, today, region), [departureDate, today, region]);

  const needleX = X_LEFT + gauge.needle * TRACK_W;
  const typicalX = X_LEFT + gauge.band.typical * TRACK_W;
  const bandX = X_LEFT + gauge.band.low * TRACK_W;
  const bandW = (gauge.band.high - gauge.band.low) * TRACK_W;

  const sweetX = X_LEFT + strip.sweetSpot.start * TRACK_W;
  const sweetW = (strip.sweetSpot.end - strip.sweetSpot.start) * TRACK_W;
  const todayX = strip.todayFraction !== null ? X_LEFT + strip.todayFraction * TRACK_W : null;
  const sweetMaxLabel = `${region.sweetSpotMaxDays}d out`;
  const sweetMinLabel = `${region.sweetSpotMinDays}d out`;
  // A far-off departure stretches the strip and narrows the window, so its two edge labels merge into one.
  const sweetLabelsFit = sweetW >= (sweetMaxLabel.length + sweetMinLabel.length) * CHAR_WIDE + 24;

  const fareDesc =
    quoted > 0
      ? `Your fare of ${formatUsd(quoted)} a seat is a ${RATING_LABEL[gauge.rating].toLowerCase()} deal against the typical ${formatUsd(region.typicalFare)}.`
      : "No fare entered yet.";
  const bookingDesc =
    strip.daysOut === null
      ? "No departure date set."
      : strip.position === "inside"
      ? `At ${strip.daysOut} days out, today is inside the sweet spot.`
      : strip.position === "before"
      ? `At ${strip.daysOut} days out, today is before the sweet spot opens.`
      : "Today is past the sweet spot window.";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="fare-signature-title fare-signature-desc" className="c97-fare-signature">
      <title id="fare-signature-title">{`Fare gauge and booking window for ${region.label}`}</title>
      <desc id="fare-signature-desc">{`${fareDesc} ${bookingDesc}`}</desc>

      {/* Fare gauge */}
      <text x={X_LEFT} y={GAUGE_KICKER_Y} className="c97-fare-kicker">
        Fare gauge · {region.label}
      </text>

      {quoted > 0 ? (
        <FittedLabel
          x={needleX}
          y={GAUGE_RATING_Y}
          className="c97-fare-label"
          text={`${gauge.clamped === "low" ? "‹ " : ""}${formatUsd(quoted)} a seat · ${RATING_LABEL[gauge.rating]}${gauge.clamped === "high" ? " ›" : ""}`}
        />
      ) : (
        <text x={W / 2} y={GAUGE_RATING_Y} textAnchor="middle" className="c97-fare-axis c97-fare-prompt">
          Add a quoted fare below to place it on the gauge
        </text>
      )}

      <rect x={X_LEFT} y={GAUGE_TRACK_Y} width={TRACK_W} height={GAUGE_TRACK_H} fill="var(--c97-rule)" />
      <rect x={bandX} y={GAUGE_TRACK_Y} width={bandW} height={GAUGE_TRACK_H} fill="var(--c97-ink)" opacity={0.16} />
      <line x1={typicalX} x2={typicalX} y1={GAUGE_TICK_TOP} y2={GAUGE_TICK_BOTTOM} stroke="var(--c97-ink)" strokeWidth={2} />

      {quoted > 0 ? (
        <>
          <path
            d={`M${needleX} ${NEEDLE_APEX_Y} L${needleX - 7} ${NEEDLE_BASE_Y} L${needleX + 7} ${NEEDLE_BASE_Y} Z`}
            fill="var(--c97-ink)"
          />
          <line x1={needleX} x2={needleX} y1={NEEDLE_APEX_Y} y2={NEEDLE_STEM_BOTTOM} stroke="var(--c97-ink)" strokeWidth={1.5} />
        </>
      ) : null}

      <text x={X_LEFT} y={GAUGE_DOMAIN_ROW_Y} textAnchor="start" className="c97-fare-axis">
        {formatUsd(gauge.domain.low)}
      </text>
      <text x={typicalX} y={GAUGE_DOMAIN_ROW_Y} textAnchor="middle" className="c97-fare-axis">
        Typical {formatUsd(region.typicalFare)}
      </text>
      <text x={X_RIGHT} y={GAUGE_DOMAIN_ROW_Y} textAnchor="end" className="c97-fare-axis">
        {formatUsd(gauge.domain.high)}
      </text>

      {/* Booking strip */}
      <text x={X_LEFT} y={STRIP_KICKER_Y} className="c97-fare-kicker">
        Booking window
      </text>
      {sweetLabelsFit ? (
        <>
          <text x={sweetX} y={STRIP_ABOVE_ROW_Y} textAnchor="start" className="c97-fare-axis c97-fare-axis-minor">
            {sweetMaxLabel}
          </text>
          <text x={sweetX + sweetW} y={STRIP_ABOVE_ROW_Y} textAnchor="end" className="c97-fare-axis c97-fare-axis-minor">
            {sweetMinLabel}
          </text>
        </>
      ) : (
        <text
          x={fitLabel(sweetX + sweetW / 2, `${region.sweetSpotMaxDays} to ${sweetMinLabel}`.length * CHAR_WIDE, 0, W)}
          y={STRIP_ABOVE_ROW_Y}
          textAnchor="middle"
          className="c97-fare-axis c97-fare-axis-minor"
        >
          {`${region.sweetSpotMaxDays} to ${sweetMinLabel}`}
        </text>
      )}
      <text x={X_RIGHT} y={STRIP_KICKER_Y} textAnchor="end" className="c97-fare-axis">
        Departure
      </text>

      <rect x={X_LEFT} y={STRIP_TRACK_Y} width={TRACK_W} height={STRIP_TRACK_H} fill="var(--c97-rule)" opacity={0.5} />
      <rect x={sweetX} y={STRIP_TRACK_Y} width={sweetW} height={STRIP_TRACK_H} fill="var(--c97-overprint)" opacity={0.4} />
      <line x1={X_RIGHT} x2={X_RIGHT} y1={STRIP_MARKER_TOP} y2={STRIP_MARKER_BOTTOM} stroke="var(--c97-ink)" strokeWidth={2} />

      {todayX !== null ? (
        <>
          <line
            x1={todayX}
            x2={todayX}
            y1={STRIP_MARKER_TOP}
            y2={STRIP_MARKER_BOTTOM}
            stroke="var(--c97-ink)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <FittedLabel
            x={todayX}
            y={STRIP_BELOW_ROW_Y}
            className="c97-fare-label"
            text={`Today, ${strip.daysOut !== null && strip.daysOut < 0 ? "past" : `${strip.daysOut}d out`}`}
          />
        </>
      ) : (
        <text x={W / 2} y={STRIP_BELOW_ROW_Y} textAnchor="middle" className="c97-fare-axis c97-fare-prompt">
          Add a departure date below to place today on the strip
        </text>
      )}
    </svg>
  );
}
