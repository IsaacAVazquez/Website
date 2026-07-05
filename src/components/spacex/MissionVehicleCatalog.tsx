import type { MissionLaunchDetail, MissionRocket } from "@/types/spacex";
import { formatCurrencyCompact } from "./formatters";

interface MissionVehicleCatalogProps {
  launchDetails: Record<string, MissionLaunchDetail>;
}

function dedupeRockets(launchDetails: Record<string, MissionLaunchDetail>): MissionRocket[] {
  const seen = new Map<string, MissionRocket>();
  for (const detail of Object.values(launchDetails)) {
    const rocket = detail.rocket;
    if (!rocket?.name) {
      continue;
    }
    if (!seen.has(rocket.name)) {
      seen.set(rocket.name, rocket);
    }
  }
  return Array.from(seen.values());
}

function VehicleSilhouette({
  rocket,
  maxHeight,
  maxDiameter,
}: {
  rocket: MissionRocket;
  maxHeight: number;
  maxDiameter: number;
}) {
  const height = rocket.heightMeters ?? 0;
  const diameter = rocket.diameterMeters ?? 0;
  const renderHeight = Math.max(24, Math.round((height / maxHeight) * 196) + 8);
  const renderWidth = Math.max(12, Math.min(34, Math.round((diameter / maxDiameter) * 26) + 8));
  const nose = 12;
  const x = (46 - renderWidth) / 2;

  return (
    <svg
      width="46"
      height={renderHeight}
      viewBox={`0 0 46 ${renderHeight}`}
      role="img"
      aria-label={`${rocket.name} height silhouette, ${rocket.heightMeters ?? "unknown"} meters`}
    >
      <path d={`M23 0 L${x} ${nose} L${x + renderWidth} ${nose} Z`} fill="var(--home-ink)" />
      <rect
        x={x}
        y={nose}
        width={renderWidth}
        height={renderHeight - nose}
        fill="color-mix(in srgb, var(--home-ink) 16%, var(--home-paper))"
        stroke="var(--home-ink)"
        strokeWidth="1.2"
      />
    </svg>
  );
}

/**
 * Fleet-wide vehicle spec cards + a to-scale height diagram, built from
 * whichever distinct rocket records show up across the snapshot's hydrated
 * launch details. Only real, already-normalized fields are shown (height,
 * diameter, mass, cost/launch, success rate, first flight) — thrust and
 * payload-to-LEO/GTO figures aren't in Launch Library's launcher
 * configuration payload, so they're omitted rather than fabricated.
 */
export function MissionVehicleCatalog({ launchDetails }: MissionVehicleCatalogProps) {
  const rockets = dedupeRockets(launchDetails);

  if (rockets.length === 0) {
    return (
      <div className="rounded-[var(--radius-3xl)] border border-dashed border-[var(--home-rule)] bg-[var(--home-paper)] px-5 py-10 text-center">
        <p className="text-lg font-semibold text-[var(--home-ink)]">
          No vehicle records are hydrated yet.
        </p>
        <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-6 text-[var(--home-ink-muted)]">
          The snapshot only carries full rocket specs for the handful of missions it hydrates
          detail for on each refresh. Check back after the next refresh.
        </p>
      </div>
    );
  }

  const maxHeight = Math.max(1, ...rockets.map((rocket) => rocket.heightMeters ?? 0));
  const maxDiameter = Math.max(1, ...rockets.map((rocket) => rocket.diameterMeters ?? 0));

  const specRows = (rocket: MissionRocket): Array<[string, string]> => [
    ["Height", rocket.heightMeters ? `${rocket.heightMeters} m` : "Unavailable"],
    ["Diameter", rocket.diameterMeters ? `${rocket.diameterMeters} m` : "Unavailable"],
    ["Mass", rocket.massKg ? `${(rocket.massKg / 1000).toLocaleString("en-US")} t` : "Unavailable"],
    ["Cost/launch", formatCurrencyCompact(rocket.costPerLaunch)],
    ["Success rate", rocket.successRatePct !== null ? `${rocket.successRatePct}%` : "Unavailable"],
    ["First flight", rocket.firstFlight ?? "Unavailable"],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
      <div className="flex flex-col gap-4">
        {rockets.map((rocket) => (
          <article
            key={rocket.name}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--home-rule)] bg-[var(--home-paper)]"
          >
            <div className="flex items-center gap-3.5 border-b border-[var(--home-rule)] px-4 py-3.5 sm:px-5">
              <span className="inline-flex h-10 min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2.5 font-mono text-sm text-[var(--home-ink)]">
                {rocket.type ?? "—"}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold tracking-[-0.02em] text-[var(--home-ink)]">
                  {rocket.name}
                </h3>
                <p className="mt-0.5 font-mono text-3xs uppercase tracking-[0.08em] text-[var(--home-ink-muted)]">
                  {rocket.company ?? "Manufacturer unlisted"}
                </p>
              </div>
              {rocket.active !== null ? (
                <span
                  className="ml-auto inline-flex shrink-0 items-center gap-1.5 self-start font-mono text-3xs uppercase tracking-[0.08em]"
                  style={{ color: rocket.active ? "var(--home-positive)" : "var(--home-ink-muted)" }}
                >
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                  {rocket.active ? "Active" : "Retired"}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-px bg-[var(--home-rule)] sm:grid-cols-3">
              {specRows(rocket).map(([key, value]) => (
                <div key={key} className="min-w-0 bg-[var(--home-paper)] px-3.5 py-3">
                  <div className="font-mono text-3xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)]">
                    {key}
                  </div>
                  <div className="mt-1.5 font-mono text-base tabular-nums text-[var(--home-ink)]">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {rocket.description ? (
              <p className="border-t border-[color-mix(in_srgb,var(--home-rule)_55%,transparent)] px-4 py-3.5 text-sm leading-6 text-[var(--home-ink-muted)] sm:px-5">
                {rocket.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--home-rule)] bg-[var(--home-paper)] p-4 lg:sticky lg:top-28">
        <h3 className="font-mono text-3xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
          Scale · to height
        </h3>
        <p className="mb-4 mt-1 text-xs leading-5 text-[var(--home-ink-muted)]">
          Booster + upper stage, metres. Diameter scaled for silhouette width only.
        </p>
        <div className="flex h-[220px] items-end justify-around gap-3 border-b border-[var(--home-rule)] pb-0.5">
          {rockets.map((rocket) => (
            <div key={rocket.name} className="flex h-full flex-col items-center justify-end gap-2">
              <VehicleSilhouette rocket={rocket} maxHeight={maxHeight} maxDiameter={maxDiameter} />
              <span className="font-mono text-3xs text-[var(--home-ink)]">
                {rocket.type ?? rocket.name}
              </span>
              <span className="font-mono text-3xs text-[var(--home-ink-muted)]">
                {rocket.heightMeters ? `${rocket.heightMeters} m` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
