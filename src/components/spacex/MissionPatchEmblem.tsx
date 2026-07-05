import type { ReactNode } from "react";
import { derivePatchSpec } from "./missionEmblem";

interface MissionPatchEmblemProps {
  /** Stable per-mission seed (launch id works well) — same seed, same emblem. */
  seed: string;
  /** CSS color value for the outcome accent, e.g. "var(--home-signal)". */
  accent: string;
  className?: string;
  title?: string;
}

const STAR_FIELD: Array<[number, number]> = [
  [24, 27],
  [77, 31],
  [29, 73],
  [74, 71],
];

/**
 * An original, deterministic geometric mission-patch emblem — orbit rings, a
 * vehicle/capsule/constellation glyph, and a small star field, drawn from
 * primitives only. No raster art, no third-party patch photography. The
 * glyph/ring/tilt spec is derived from `seed` via `derivePatchSpec`, so the
 * same mission always renders the same patch.
 */
export function MissionPatchEmblem({ seed, accent, className = "", title }: MissionPatchEmblemProps) {
  const { glyph, rings, tilt } = derivePatchSpec(seed);

  const orbits = Array.from({ length: rings }, (_, index) => (
    <ellipse
      key={`orbit-${index}`}
      cx="50"
      cy="50"
      rx={34 - index * 8}
      ry={13 - index * 3}
      fill="none"
      stroke={accent}
      strokeWidth="1.4"
      opacity={index === 0 ? 0.95 : 0.6}
      transform={`rotate(${tilt + index * 52} 50 50)`}
    />
  ));

  let center: ReactNode;
  if (glyph === "tri") {
    center = (
      <g>
        <path d="M50 33 L43 55 L57 55 Z" fill="var(--home-ink)" />
        <path d="M46.5 55 L50 63 L53.5 55 Z" fill={accent} />
      </g>
    );
  } else if (glyph === "capsule") {
    center = (
      <g>
        <path d="M43 55 L44.6 45 A6.2 6.2 0 0 1 55.4 45 L57 55 Z" fill="var(--home-ink)" />
        <circle cx="50" cy="47.5" r="2.1" fill={accent} />
      </g>
    );
  } else if (glyph === "ring") {
    center = (
      <g>
        <circle cx="50" cy="50" r="8.5" fill="none" stroke="var(--home-ink)" strokeWidth="2" />
        <circle cx="50" cy="50" r="2.6" fill={accent} />
      </g>
    );
  } else if (glyph === "constellation") {
    const points: Array<[number, number]> = [
      [39, 47],
      [47, 43],
      [55, 46],
      [51, 54],
    ];
    center = (
      <g>
        <polyline
          points="39,47 47,43 55,46 51,54"
          fill="none"
          stroke="var(--home-ink)"
          strokeWidth="0.9"
          opacity="0.55"
        />
        {points.map((point, index) => (
          <circle
            key={`constellation-${index}`}
            cx={point[0]}
            cy={point[1]}
            r="2.1"
            fill={index % 2 ? "var(--home-ink)" : accent}
          />
        ))}
      </g>
    );
  } else {
    center = <circle cx="50" cy="50" r="6.5" fill={accent} />;
  }

  return (
    <svg
      viewBox="0 0 100 100"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--home-ink)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="37" fill="none" stroke="var(--home-rule)" strokeWidth="1" />
      {orbits}
      {center}
      {STAR_FIELD.map((point, index) => (
        <circle
          key={`star-${index}`}
          cx={point[0]}
          cy={point[1]}
          r="1.1"
          fill="var(--home-ink-muted)"
          opacity="0.7"
        />
      ))}
    </svg>
  );
}
