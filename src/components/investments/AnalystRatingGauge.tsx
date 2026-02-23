"use client";

import React from "react";
import { motion } from "framer-motion";
import { AnalystRating } from "@/types/investment";

interface AnalystRatingGaugeProps {
  analyst: AnalystRating;
  size?: "sm" | "md" | "lg";
}

const LABELS: Record<string, { label: string; shortLabel: string; color: string }> = {
  strong_buy: { label: "Strong Buy",   shortLabel: "STR BUY",   color: "#059669" },
  buy:        { label: "Buy",          shortLabel: "BUY",       color: "#10b981" },
  hold:       { label: "Hold",         shortLabel: "HOLD",      color: "#d97706" },
  sell:       { label: "Sell",         shortLabel: "SELL",      color: "#ef4444" },
  strong_sell:{ label: "Strong Sell",  shortLabel: "STR SELL",  color: "#dc2626" },
};

// Gauge spans a semicircle: -180° → 0° mapped to left → right
// recommendationMean: 1 (Strong Buy) → 5 (Strong Sell)
function meanToAngle(mean: number): number {
  // Clamp to [1, 5], then map to [-180, 0] degrees (left to right semicircle)
  const clamped = Math.max(1, Math.min(5, mean));
  // 1 → -180 (leftmost), 5 → 0 (rightmost)
  return -180 + ((clamped - 1) / 4) * 180;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function AnalystRatingGauge({ analyst, size = "md" }: AnalystRatingGaugeProps) {
  const info = LABELS[analyst.recommendationKey] ?? LABELS.hold;
  const angle = meanToAngle(analyst.recommendationMean);

  // Gauge dimensions
  const dimensions = { sm: 120, md: 160, lg: 200 };
  const svgSize = dimensions[size];
  const cx = svgSize / 2;
  const cy = svgSize * 0.62; // Pushes arc up slightly
  const outerR = svgSize * 0.42;
  const innerR = svgSize * 0.28;
  const needleR = outerR * 0.95;

  // Needle tip
  const needleTip = polarToCartesian(cx, cy, needleR, angle);

  // Zone segments (5 zones across -180° to 0°)
  const zones = [
    { start: -180, end: -144, color: "#059669" }, // Strong Buy
    { start: -144, end: -108, color: "#10b981" }, // Buy
    { start: -108, end:  -72, color: "#d97706" }, // Hold
    { start:  -72, end:  -36, color: "#ef4444" }, // Sell
    { start:  -36, end:    0, color: "#dc2626" }, // Strong Sell
  ];

  // Breakdown bar percentages
  const { strongBuy, buy, hold, sell, strongSell, total } = analyst.breakdown;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* SVG Gauge */}
      <div className="relative" style={{ width: svgSize, height: svgSize * 0.65 }}>
        <svg
          width={svgSize}
          height={svgSize * 0.65}
          viewBox={`0 0 ${svgSize} ${svgSize * 0.65}`}
          aria-label={`Analyst rating: ${info.label}`}
        >
          {/* Background track */}
          <path
            d={describeArc(cx, cy, (outerR + innerR) / 2, -180, 0)}
            fill="none"
            stroke="var(--border-primary)"
            strokeWidth={outerR - innerR + 2}
            strokeLinecap="butt"
          />

          {/* Colored zone arcs */}
          {zones.map((zone, i) => (
            <path
              key={i}
              d={describeArc(cx, cy, (outerR + innerR) / 2, zone.start, zone.end)}
              fill="none"
              stroke={zone.color}
              strokeWidth={outerR - innerR}
              strokeLinecap="butt"
              opacity={0.85}
            />
          ))}

          {/* Needle */}
          <motion.g
            initial={{ rotate: -180, originX: `${cx}px`, originY: `${cy}px` }}
            animate={{ rotate: angle + 180, originX: `${cx}px`, originY: `${cy}px` }}
            transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.3 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            {/* Shadow line */}
            <line
              x1={cx}
              y1={cy}
              x2={needleTip.x}
              y2={needleTip.y}
              stroke="var(--text-primary)"
              strokeWidth={size === "sm" ? 1.5 : 2.5}
              strokeLinecap="round"
              opacity={0.12}
              transform={`translate(1.5, 1.5)`}
            />
            {/* Needle line */}
            <line
              x1={cx}
              y1={cy}
              x2={needleTip.x}
              y2={needleTip.y}
              stroke="var(--text-primary)"
              strokeWidth={size === "sm" ? 1.5 : 2.5}
              strokeLinecap="round"
            />
          </motion.g>

          {/* Center pivot */}
          <circle cx={cx} cy={cy} r={size === "sm" ? 4 : 6} fill="var(--text-primary)" />
          <circle cx={cx} cy={cy} r={size === "sm" ? 2 : 3} fill="var(--surface-elevated)" />
        </svg>

        {/* Consensus label centred below needle */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-0 inset-x-0 flex flex-col items-center"
        >
          <span
            className="text-xs font-black tracking-widest uppercase"
            style={{ color: info.color }}
          >
            {info.shortLabel}
          </span>
          {analyst.numberOfAnalysts != null && analyst.numberOfAnalysts > 0 && (
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {analyst.numberOfAnalysts} analysts
            </span>
          )}
        </motion.div>
      </div>

      {/* Breakdown bars */}
      {total > 0 && (
        <div className="w-full flex flex-col gap-0.5 mt-1">
          {[
            { label: "Strong Buy", count: strongBuy, color: "#059669" },
            { label: "Buy",        count: buy,       color: "#10b981" },
            { label: "Hold",       count: hold,      color: "#d97706" },
            { label: "Sell",       count: sell,      color: "#ef4444" },
            { label: "Strong Sell",count: strongSell,color: "#dc2626" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="text-[9px] text-[var(--text-tertiary)] w-14 text-right shrink-0">
                {item.label}
              </span>
              <div className="flex-1 h-1.5 bg-[var(--border-primary)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct(item.count)}%` }}
                  transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="text-[9px] font-mono text-[var(--text-secondary)] w-5 shrink-0">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Price target */}
      {analyst.targetMeanPrice != null && (
        <div className="text-center mt-1">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
            Avg Target
          </span>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            ${analyst.targetMeanPrice.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
