import { AlertTriangle, ExternalLink, MapPin, Orbit, Rocket, Users } from "lucide-react";
import type { MissionLaunchDetail, MissionControlPanel } from "@/types/spacex";
import { MissionVehiclePhoto } from "./MissionVehiclePhoto";
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
      <p className="text-sm leading-6 text-[var(--home-ink-muted)]">
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
          className="tap-target inline-flex items-center justify-between rounded-[20px] border border-[var(--home-rule)] bg-[var(--home-paper)] px-4 py-3 text-sm font-semibold text-[var(--home-ink)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)]"
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
      className="rounded-[30px] border border-[var(--home-rule)] bg-[var(--home-paper-raised)]/92 p-4 shadow-[var(--shadow-md)] sm:p-5"
    >
      <div className="flex flex-col gap-4 border-b border-[var(--home-rule)] pb-5">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--home-ink-soft)]">
            Mission detail
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--home-ink)]">
            {launch ? launch.name : "Select a mission"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
            {launch
              ? `${launch.rocketName ?? "Rocket TBD"} • ${formatMissionMoment(launch)}`
              : "Open a mission from the board to inspect vehicles, payloads, crew, and reference links in context."}
          </p>
        </div>

        <div
          className="inline-flex flex-wrap gap-2 rounded-[22px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-2"
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
                  ? "bg-[var(--home-haze)] text-white"
                  : "text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-5">
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-[var(--home-paper-alt)]" />
          <div className="h-5 w-full animate-pulse rounded-full bg-[var(--home-paper-alt)]" />
          <div className="h-[220px] animate-pulse rounded-[24px] bg-[var(--home-paper-alt)]" />
        </div>
      ) : null}

      {!isLoading && error ? (
        <div
          role="alert"
          className="mt-5 rounded-[24px] border border-[color-mix(in_srgb,var(--home-acid)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-acid)_9%,var(--home-paper))] p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 text-[color-mix(in_srgb,var(--home-acid)_55%,var(--home-ink))]" />
            <div>
              <p className="text-sm font-semibold text-[var(--home-ink)]">
                Mission detail unavailable
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--home-ink-muted)]">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && !launch ? (
        <div className="mt-5 rounded-[24px] border border-dashed border-[var(--home-rule)] bg-[var(--home-paper)] px-5 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--home-haze)_10%,var(--home-paper-alt))]">
            <Rocket className="h-6 w-6 text-[var(--home-haze)]" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[var(--home-ink)]">
            Select a mission to inspect its full record.
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
            The detail rail will expand launch context, vehicle information, payload records,
            and outbound references once a mission is selected.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && launch && activePanel === "overview" ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--home-ink-soft)]">
                Launch status
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--home-ink)]">
                {launch.upcoming
                  ? "Upcoming"
                  : launch.success === true
                    ? "Successful"
                    : launch.success === false
                      ? "Failed"
                      : "Status pending"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--home-ink-soft)]">
                Launch site
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--home-ink)]">
                {launch.launchpadName ?? "Unspecified"}
              </p>
              <p className="mt-1 text-xs text-[var(--home-ink-muted)]">
                {launch.launchpadLocation ?? "Location unavailable"}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-5">
            <h3 className="text-lg font-semibold text-[var(--home-ink)]">
              Mission brief
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--home-ink-muted)]">
              {launch.details ?? "No mission narrative is listed for this launch."}
            </p>
          </div>

          {launch.failures.length > 0 ? (
            <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--home-acid)_28%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-acid)_9%,var(--home-paper))] p-5">
              <h3 className="text-lg font-semibold text-[var(--home-ink)]">
                Failure log
              </h3>
              <div className="mt-4 space-y-3">
                {launch.failures.map((failure, index) => (
                  <div
                    key={`${failure.reason}-${index}`}
                    className="rounded-[18px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-4"
                  >
                    <p className="text-sm font-semibold text-[var(--home-ink)]">
                      {failure.reason ?? "Failure cause unavailable"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--home-ink-muted)]">
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
          <MissionVehiclePhoto
            name={launch.rocket?.name ?? launch.name}
            image={launch.vehicleImage ?? launch.rocket?.image ?? null}
            className="h-[220px] min-h-[220px]"
            label="Vehicle photo"
            dataTestId="mission-vehicle-photo"
          />

          <div className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-5">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-[var(--home-haze)]" />
              <h3 className="text-lg font-semibold text-[var(--home-ink)]">
                Rocket
              </h3>
            </div>
            {launch.rocket ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--home-ink)]">
                    {launch.rocket.name ?? "Unnamed rocket"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--home-ink-muted)]">
                    {launch.rocket.description ?? "No rocket description is listed."}
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-[18px] bg-[var(--home-paper-alt)] p-3">
                    <p className="text-xs text-[var(--home-ink-soft)]">Cost per launch</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--home-ink)]">
                      {formatCurrencyCompact(launch.rocket.costPerLaunch)}
                    </p>
                  </div>
                  <div className="rounded-[18px] bg-[var(--home-paper-alt)] p-3">
                    <p className="text-xs text-[var(--home-ink-soft)]">Success rate</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--home-ink)]">
                      {launch.rocket.successRatePct ?? "Unavailable"}%
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--home-ink-muted)]">
                No populated rocket record is available for this mission.
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[var(--home-haze)]" />
              <h3 className="text-lg font-semibold text-[var(--home-ink)]">
                Launchpad
              </h3>
            </div>
            {launch.launchpad ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-[var(--home-ink)]">
                  {launch.launchpad.fullName ?? launch.launchpad.name ?? "Unnamed launchpad"}
                </p>
                <p className="text-sm text-[var(--home-ink-muted)]">
                  {launch.launchpad.locality ?? "Unknown locality"}
                  {launch.launchpad.region ? `, ${launch.launchpad.region}` : ""}
                </p>
                <p className="text-sm leading-6 text-[var(--home-ink-muted)]">
                  {launch.launchpad.details ?? "No launchpad detail is listed for this mission."}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--home-ink-muted)]">
                No populated launchpad record is available for this mission.
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--home-haze)]" />
              <h3 className="text-lg font-semibold text-[var(--home-ink)]">
                Crew and cores
              </h3>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                  Crew manifest
                </p>
                {launch.crew.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {launch.crew.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-[18px] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-3"
                      >
                        <p className="text-sm font-semibold text-[var(--home-ink)]">
                          {member.name}
                        </p>
                        <p className="mt-1 text-xs text-[var(--home-ink-muted)]">
                          {member.role ?? "Role unavailable"}
                          {member.agency ? ` • ${member.agency}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[var(--home-ink-muted)]">
                    No crew is listed for this mission.
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                  Core manifest
                </p>
                {launch.cores.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {launch.cores.map((core, index) => (
                      <div
                        key={`${core.id ?? "core"}-${index}`}
                        className="rounded-[18px] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-3"
                      >
                        <p className="text-sm font-semibold text-[var(--home-ink)]">
                          {core.serial ?? "Unnamed core"} • Flight {core.flight ?? "?"}
                        </p>
                        <p className="mt-1 text-xs text-[var(--home-ink-muted)]">
                          {core.landingType ?? "Landing type unavailable"}
                          {core.landpadName ? ` • ${core.landpadName}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[var(--home-ink-muted)]">
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
                  className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--home-ink)]">
                        {payload.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
                        {payload.type ?? "Type unavailable"} • {payload.orbit ?? "Orbit unavailable"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--home-paper-alt)] px-3 py-2 text-xs font-medium text-[var(--home-ink-muted)]">
                      <Orbit className="mr-1 inline h-3.5 w-3.5" />
                      {formatInteger(payload.massKg)} kg
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] bg-[var(--home-paper-alt)] p-3">
                      <p className="text-xs text-[var(--home-ink-soft)]">Customers</p>
                      <p className="mt-1 text-sm text-[var(--home-ink)]">
                        {payload.customers.length > 0 ? payload.customers.join(", ") : "None listed"}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-[var(--home-paper-alt)] p-3">
                      <p className="text-xs text-[var(--home-ink-soft)]">Manufacturers</p>
                      <p className="mt-1 text-sm text-[var(--home-ink)]">
                        {payload.manufacturers.length > 0 ? payload.manufacturers.join(", ") : "None listed"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--home-rule)] bg-[var(--home-paper)] px-5 py-10 text-center">
              <p className="text-lg font-semibold text-[var(--home-ink)]">
                No payloads listed.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
                This mission does not currently expose populated payload records in the upstream API.
              </p>
            </div>
          )}

          <div className="mt-4 rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-5">
            <h3 className="text-lg font-semibold text-[var(--home-ink)]">
              Capsules
            </h3>
            {launch.capsules.length > 0 ? (
              <div className="mt-4 space-y-3">
                {launch.capsules.map((capsule) => (
                  <div
                    key={capsule.id}
                    className="rounded-[18px] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-3"
                  >
                    <p className="text-sm font-semibold text-[var(--home-ink)]">
                      {capsule.serial ?? "Unnamed capsule"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--home-ink-muted)]">
                      {capsule.type ?? "Type unavailable"} • Reuse count {capsule.reuseCount ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[var(--home-ink-muted)]">
                No capsules are listed for this mission.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {!isLoading && !error && launch && activePanel === "links" ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-5">
            <h3 className="text-lg font-semibold text-[var(--home-ink)]">
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

          <div className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-5">
            <h3 className="text-lg font-semibold text-[var(--home-ink)]">
              Data completeness
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-[var(--home-paper-alt)] p-3">
                <p className="text-xs text-[var(--home-ink-soft)]">Crew records</p>
                <p className="mt-1 text-sm font-semibold text-[var(--home-ink)]">
                  {launch.crew.length > 0 ? `${launch.crew.length} populated` : "None listed"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[var(--home-paper-alt)] p-3">
                <p className="text-xs text-[var(--home-ink-soft)]">Payload records</p>
                <p className="mt-1 text-sm font-semibold text-[var(--home-ink)]">
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
