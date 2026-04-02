import { AlertTriangle, ExternalLink, MapPin, Orbit, Rocket, Users } from "lucide-react";
import type { MissionLaunchDetail, MissionControlPanel } from "@/types/spacex";
import { formatCurrencyCompact, formatInteger, formatMissionMoment } from "./formatters";

const PANEL_OPTIONS: Array<{ key: MissionControlPanel; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "vehicle", label: "Vehicle" },
  { key: "payloads", label: "Payloads" },
  { key: "links", label: "Links" },
];

interface MissionDetailPanelProps {
  launch: MissionLaunchDetail | null;
  activePanel: MissionControlPanel;
  isLoading: boolean;
  error: string | null;
  onPanelChange: (panel: MissionControlPanel) => void;
}

function ExternalGrid({
  links,
}: {
  links: Array<{ href: string | null; label: string }>;
}) {
  const visibleLinks = links.filter(
    (link): link is { href: string; label: string } => Boolean(link.href)
  );

  if (visibleLinks.length === 0) {
    return (
      <p className="text-sm leading-6 text-[var(--text-secondary)]">
        No external references are listed for this mission.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {visibleLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="tap-target inline-flex items-center justify-between rounded-[20px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          {link.label}
          <ExternalLink className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

export function MissionDetailPanel({
  launch,
  activePanel,
  isLoading,
  error,
  onPanelChange,
}: MissionDetailPanelProps) {
  return (
    <aside
      data-testid="mission-detail-panel"
      aria-label="Mission detail panel"
      className="rounded-[30px] border border-[var(--border-primary)] bg-[var(--surface-elevated)]/92 p-4 shadow-[var(--shadow-md)] sm:p-5"
    >
      <div className="flex flex-col gap-4 border-b border-[var(--border-primary)] pb-5">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
            Mission detail
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--text-primary)]">
            {launch ? launch.name : "Select a mission"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {launch
              ? `${launch.rocketName ?? "Rocket TBD"} • ${formatMissionMoment(launch)}`
              : "Open a mission from the board to inspect vehicles, payloads, crew, and reference links in context."}
          </p>
        </div>

        <div
          className="inline-flex flex-wrap gap-2 rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-2"
          role="tablist"
          aria-label="Mission detail panels"
        >
          {PANEL_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={activePanel === option.key}
              onClick={() => onPanelChange(option.key)}
              className={`tap-target rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                activePanel === option.key
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-5">
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
          <div className="h-5 w-full animate-pulse rounded-full bg-[var(--surface-secondary)]" />
          <div className="h-[220px] animate-pulse rounded-[24px] bg-[var(--surface-secondary)]" />
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="mt-5 rounded-[24px] border border-[color-mix(in_srgb,var(--color-error)_18%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-error)_7%,var(--surface-primary))] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--color-error)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Mission detail unavailable
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && !launch ? (
        <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border-primary)] bg-[var(--surface-primary)] px-5 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--surface-secondary))]">
            <Rocket className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
            Select a mission to inspect its full record.
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            The detail rail will expand launch context, vehicle information, payload records,
            and outbound references once a mission is selected.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && launch && activePanel === "overview" ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Launch status
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                {launch.upcoming
                  ? "Upcoming"
                  : launch.success === true
                    ? "Successful"
                    : launch.success === false
                      ? "Failed"
                      : "Status pending"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Launch site
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                {launch.launchpadName ?? "Unspecified"}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {launch.launchpadLocation ?? "Location unavailable"}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Mission brief
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              {launch.details ?? "No mission narrative is listed for this launch."}
            </p>
          </div>

          {launch.failures.length > 0 ? (
            <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--color-warning)_18%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-warning)_7%,var(--surface-primary))] p-5">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Failure log
              </h3>
              <div className="mt-4 space-y-3">
                {launch.failures.map((failure, index) => (
                  <div
                    key={`${failure.reason}-${index}`}
                    className="rounded-[18px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {failure.reason ?? "Failure cause unavailable"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      T+{failure.time ?? "?"}s • Altitude {failure.altitude ?? "unknown"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !error && launch && activePanel === "vehicle" ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-[var(--color-primary)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Rocket
              </h3>
            </div>
            {launch.rocket ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {launch.rocket.name ?? "Unnamed rocket"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                    {launch.rocket.description ?? "No rocket description is listed."}
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-[18px] bg-[var(--surface-secondary)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)]">Cost per launch</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {formatCurrencyCompact(launch.rocket.costPerLaunch)}
                    </p>
                  </div>
                  <div className="rounded-[18px] bg-[var(--surface-secondary)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)]">Success rate</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {launch.rocket.successRatePct ?? "Unavailable"}%
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                No populated rocket record is available for this mission.
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[var(--color-primary)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Launchpad
              </h3>
            </div>
            {launch.launchpad ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {launch.launchpad.fullName ?? launch.launchpad.name ?? "Unnamed launchpad"}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {launch.launchpad.locality ?? "Unknown locality"}
                  {launch.launchpad.region ? `, ${launch.launchpad.region}` : ""}
                </p>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {launch.launchpad.details ?? "No launchpad detail is listed for this mission."}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                No populated launchpad record is available for this mission.
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--color-primary)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Crew and cores
              </h3>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                  Crew manifest
                </p>
                {launch.crew.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {launch.crew.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-[18px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-3"
                      >
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {member.name}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {member.role ?? "Role unavailable"}
                          {member.agency ? ` • ${member.agency}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    No crew is listed for this mission.
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                  Core manifest
                </p>
                {launch.cores.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {launch.cores.map((core, index) => (
                      <div
                        key={`${core.id ?? "core"}-${index}`}
                        className="rounded-[18px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-3"
                      >
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {core.serial ?? "Unnamed core"} • Flight {core.flight ?? "?"}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {core.landingType ?? "Landing type unavailable"}
                          {core.landpadName ? ` • ${core.landpadName}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    No cores are listed for this mission.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && launch && activePanel === "payloads" ? (
        <div className="mt-5">
          {launch.payloads.length > 0 ? (
            <div className="space-y-3">
              {launch.payloads.map((payload) => (
                <article
                  key={payload.id}
                  className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--text-primary)]">
                        {payload.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {payload.type ?? "Type unavailable"} • {payload.orbit ?? "Orbit unavailable"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
                      <Orbit className="mr-1 inline h-3.5 w-3.5" />
                      {formatInteger(payload.massKg)} kg
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] bg-[var(--surface-secondary)] p-3">
                      <p className="text-xs text-[var(--text-tertiary)]">Customers</p>
                      <p className="mt-1 text-sm text-[var(--text-primary)]">
                        {payload.customers.length > 0 ? payload.customers.join(", ") : "None listed"}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-[var(--surface-secondary)] p-3">
                      <p className="text-xs text-[var(--text-tertiary)]">Manufacturers</p>
                      <p className="mt-1 text-sm text-[var(--text-primary)]">
                        {payload.manufacturers.length > 0 ? payload.manufacturers.join(", ") : "None listed"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--border-primary)] bg-[var(--surface-primary)] px-5 py-10 text-center">
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                No payloads listed.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                This mission does not currently expose populated payload records in the upstream API.
              </p>
            </div>
          )}

          <div className="mt-4 rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Capsules
            </h3>
            {launch.capsules.length > 0 ? (
              <div className="mt-4 space-y-3">
                {launch.capsules.map((capsule) => (
                  <div
                    key={capsule.id}
                    className="rounded-[18px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-3"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {capsule.serial ?? "Unnamed capsule"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {capsule.type ?? "Type unavailable"} • Reuse count {capsule.reuseCount ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                No capsules are listed for this mission.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {!isLoading && !error && launch && activePanel === "links" ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Mission references
            </h3>
            <div className="mt-4">
              <ExternalGrid
                links={[
                  { href: launch.links.webcast, label: "Watch webcast" },
                  { href: launch.links.article, label: "Read article" },
                  { href: launch.links.wikipedia, label: "Open Wikipedia" },
                  { href: launch.links.presskit, label: "Open press kit" },
                  { href: launch.links.redditLaunch, label: "Launch thread" },
                  { href: launch.links.redditMedia, label: "Media thread" },
                ]}
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Data completeness
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-[var(--surface-secondary)] p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Crew records</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {launch.crew.length > 0 ? `${launch.crew.length} populated` : "None listed"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[var(--surface-secondary)] p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Payload records</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {launch.payloads.length > 0 ? `${launch.payloads.length} populated` : "None listed"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
