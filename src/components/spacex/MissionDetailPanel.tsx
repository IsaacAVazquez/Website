import { useId } from "react";
import { AlertTriangle, ExternalLink, MapPin, Orbit, Rocket, Users } from "lucide-react";
import type { MissionLaunchDetail, MissionControlPanel } from "@/types/spacex";
import { MissionVehiclePhoto } from "./MissionVehiclePhoto";
import { formatCurrencyCompact, formatInteger } from "./formatters";

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
      <p className="text-sm leading-6 text-[var(--c97-ink-2)]">
        No external references are listed for this mission.
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-1)" }}>
      {visibleLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="tap-target inline-flex items-center justify-between border border-[var(--c97-rule)] bg-[var(--c97-surface)] text-sm font-semibold text-[var(--c97-ink)] transition hover:border-[var(--c97-accent)] hover:text-[var(--c97-accent)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)" }}
        >
          {link.label}
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
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
  const idBase = useId();
  const tabId = (key: MissionControlPanel) => `${idBase}-tab-${key}`;
  const panelId = `${idBase}-panel`;
  const tabs = (
    <div
      className="inline-flex flex-wrap border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
      role="tablist"
      aria-label="Mission detail panels"
    >
      {PANEL_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          role="tab"
          id={tabId(option.key)}
          aria-selected={activePanel === option.key}
          aria-controls={panelId}
          onClick={() => onPanelChange(option.key)}
          style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)" }}
          className={`tap-target text-sm font-semibold transition ${
            activePanel === option.key
              ? "bg-[var(--c97-accent)] text-[var(--c97-surface)]"
              : "text-[var(--c97-ink-2)] hover:bg-[var(--c97-field)] hover:text-[var(--c97-ink)]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-2)" }}>
      <div style={{ paddingBottom: "var(--c97-sp-2)" }}>{tabs}</div>

      <div role="tabpanel" id={panelId} aria-labelledby={tabId(activePanel)}>
      {isLoading ? (
        <div className="flex flex-col" style={{ paddingBlock: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
          <span className="c97-skeleton" style={{ height: 20, width: "66%" }} />
          <span className="c97-skeleton" style={{ height: 20 }} />
          <span className="c97-skeleton" style={{ height: 220 }} />
        </div>
      ) : null}

      {!isLoading && error ? (
        <div
          role="alert"
          className="border border-[color-mix(in_srgb,var(--c97-warning)_30%,var(--c97-rule))] bg-[color-mix(in_srgb,var(--c97-warning)_9%,var(--c97-surface))]" style={{ padding: "var(--c97-sp-2)", marginTop: "var(--c97-sp-2)" }}
        >
          <div className="flex items-start" style={{ gap: "var(--c97-sp-1)" }}>
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 text-[color-mix(in_srgb,var(--c97-warning)_55%,var(--c97-ink))]" />
            <div>
              <p className="text-sm font-semibold text-[var(--c97-ink)]">
                Mission detail unavailable
              </p>
              <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && !launch ? (
        <div className="border border-dashed border-[var(--c97-rule)] bg-[var(--c97-surface)] text-center" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-4)", marginTop: "var(--c97-sp-2)" }}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center bg-[var(--c97-field)]">
            <Rocket aria-hidden="true" className="h-6 w-6 text-[var(--c97-accent)]" />
          </div>
          <p className="text-lg font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-2)" }}>
            Select a mission to inspect its full record.
          </p>
          <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
            The detail rail will expand launch context, vehicle information, payload records,
            and outbound references once a mission is selected.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && launch && activePanel === "overview" ? (
        <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-2)" }}>
          <div className="grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-1)" }}>
            <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}>
              <p className="font-mono text-3xs font-semibold uppercase tracking-[0.2em] text-[var(--c97-label)]">
                Launch status
              </p>
              <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                {launch.upcoming
                  ? "Upcoming"
                  : launch.success === true
                    ? "Successful"
                    : launch.success === false
                      ? "Failed"
                      : "Status pending"}
              </p>
            </div>
            <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}>
              <p className="font-mono text-3xs font-semibold uppercase tracking-[0.2em] text-[var(--c97-label)]">
                Launch site
              </p>
              <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                {launch.launchpadName ?? "Unspecified"}
              </p>
              <p className="text-xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                {launch.launchpadLocation ?? "Location unavailable"}
              </p>
            </div>
          </div>

          <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}>
            <h3 className="c97-serif c97-h3">
              Mission brief
            </h3>
            <p className="text-sm leading-7 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
              {launch.details ?? "No mission narrative is listed for this launch."}
            </p>
          </div>

          {launch.failures.length > 0 ? (
            <div className="border border-[color-mix(in_srgb,var(--c97-warning)_28%,var(--c97-rule))] bg-[color-mix(in_srgb,var(--c97-warning)_9%,var(--c97-surface))]" style={{ padding: "var(--c97-sp-2)" }}>
              <h3 className="c97-serif c97-h3">
                Failure log
              </h3>
              <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
                {launch.failures.map((failure, index) => (
                  <div
                    key={`${failure.reason}-${index}`}
                    className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}
                  >
                    <p className="text-sm font-semibold text-[var(--c97-ink)]">
                      {failure.reason ?? "Failure cause unavailable"}
                    </p>
                    <p className="text-xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
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
        <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-2)" }}>
          <MissionVehiclePhoto
            name={launch.rocket?.name ?? launch.name}
            image={launch.vehicleImage ?? launch.rocket?.image ?? null}
            className="h-[220px] min-h-[220px]"
            label="Vehicle photo"
            dataTestId="mission-vehicle-photo"
            // The drawer stops at 30rem, where the frame measured 439px, and
            // on a 375px screen it measured 334px.
            sizes="(min-width: 480px) 440px, 90vw"
          />

          <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}>
            <div className="flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
              <Rocket aria-hidden="true" className="h-5 w-5 text-[var(--c97-accent)]" />
              <h3 className="c97-serif c97-h3">
                Rocket
              </h3>
            </div>
            {launch.rocket ? (
              <div className="grid sm:grid-cols-2" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
                <div>
                  <p className="text-sm font-semibold text-[var(--c97-ink)]">
                    {launch.rocket.name ?? "Unnamed rocket"}
                  </p>
                  <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                    {launch.rocket.description ?? "No rocket description is listed."}
                  </p>
                </div>
                <div className="grid" style={{ gap: "var(--c97-sp-1)" }}>
                  <div className="bg-[var(--c97-field)]" style={{ padding: "var(--c97-sp-1)" }}>
                    <p className="text-xs text-[var(--c97-label)]">Cost per launch</p>
                    <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                      {formatCurrencyCompact(launch.rocket.costPerLaunch)}
                    </p>
                  </div>
                  <div className="bg-[var(--c97-field)]" style={{ padding: "var(--c97-sp-1)" }}>
                    <p className="text-xs text-[var(--c97-label)]">Success rate</p>
                    <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                      {launch.rocket.successRatePct !== null ? `${launch.rocket.successRatePct}%` : "Unavailable"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-2)" }}>
                No populated rocket record is available for this mission.
              </p>
            )}
          </div>

          <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}>
            <div className="flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
              <MapPin aria-hidden="true" className="h-5 w-5 text-[var(--c97-accent)]" />
              <h3 className="c97-serif c97-h3">
                Launchpad
              </h3>
            </div>
            {launch.launchpad ? (
              <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
                <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginBottom: 0 }}>
                  {launch.launchpad.fullName ?? launch.launchpad.name ?? "Unnamed launchpad"}
                </p>
                <p className="text-sm text-[var(--c97-ink-2)]" style={{ marginBottom: 0 }}>
                  {launch.launchpad.locality ?? "Unknown locality"}
                  {launch.launchpad.region ? `, ${launch.launchpad.region}` : ""}
                </p>
                <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginBottom: 0 }}>
                  {launch.launchpad.details ?? "No launchpad detail is listed for this mission."}
                </p>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-2)" }}>
                No populated launchpad record is available for this mission.
              </p>
            )}
          </div>

          <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}>
            <div className="flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
              <Users aria-hidden="true" className="h-5 w-5 text-[var(--c97-accent)]" />
              <h3 className="c97-serif c97-h3">
                Crew and cores
              </h3>
            </div>
            <div className="grid lg:grid-cols-2" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-2)" }}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--c97-label)]">
                  Crew manifest
                </p>
                {launch.crew.length > 0 ? (
                  <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
                    {launch.crew.map((member) => (
                      <div
                        key={member.id}
                        className="border border-[var(--c97-rule)] bg-[var(--c97-field)]" style={{ padding: "var(--c97-sp-1)" }}
                      >
                        <p className="text-sm font-semibold text-[var(--c97-ink)]">
                          {member.name}
                        </p>
                        <p className="text-xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                          {member.role ?? "Role unavailable"}
                          {member.agency ? ` • ${member.agency}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                    No crew is listed for this mission.
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--c97-label)]">
                  Core manifest
                </p>
                {launch.cores.length > 0 ? (
                  <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
                    {launch.cores.map((core, index) => (
                      <div
                        key={`${core.id ?? "core"}-${index}`}
                        className="border border-[var(--c97-rule)] bg-[var(--c97-field)]" style={{ padding: "var(--c97-sp-1)" }}
                      >
                        <p className="text-sm font-semibold text-[var(--c97-ink)]">
                          {core.serial ?? "Unnamed core"} • Flight {core.flight ?? "?"}
                        </p>
                        <p className="text-xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                          {core.landingType ?? "Landing type unavailable"}
                          {core.landpadName ? ` • ${core.landpadName}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                    No cores are listed for this mission.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && launch && activePanel === "payloads" ? (
        <div style={{ marginTop: "var(--c97-sp-2)" }}>
          {launch.payloads.length > 0 ? (
            <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
              {launch.payloads.map((payload) => (
                <article
                  key={payload.id}
                  className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}
                >
                  <div className="flex items-start justify-between" style={{ gap: "var(--c97-sp-1)" }}>
                    <div>
                      <p className="text-lg font-semibold text-[var(--c97-ink)]">
                        {payload.name}
                      </p>
                      <p className="text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                        {payload.type ?? "Type unavailable"} • {payload.orbit ?? "Orbit unavailable"}
                      </p>
                    </div>
                    <span className="bg-[var(--c97-field)] text-xs font-medium text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)" }}>
                      <Orbit aria-hidden="true" className="inline h-3.5 w-3.5" style={{ marginRight: "var(--c97-sp-0)" }} />
                      {formatInteger(payload.massKg)} kg
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
                    <div className="bg-[var(--c97-field)]" style={{ padding: "var(--c97-sp-1)" }}>
                      <p className="text-xs text-[var(--c97-label)]">Customers</p>
                      <p className="text-sm text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                        {payload.customers.length > 0 ? payload.customers.join(", ") : "None listed"}
                      </p>
                    </div>
                    <div className="bg-[var(--c97-field)]" style={{ padding: "var(--c97-sp-1)" }}>
                      <p className="text-xs text-[var(--c97-label)]">Manufacturers</p>
                      <p className="text-sm text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                        {payload.manufacturers.length > 0 ? payload.manufacturers.join(", ") : "None listed"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[var(--c97-rule)] bg-[var(--c97-surface)] text-center" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-4)" }}>
              <p className="text-lg font-semibold text-[var(--c97-ink)]">
                No payloads listed.
              </p>
              <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                This mission does not currently expose populated payload records in the upstream API.
              </p>
            </div>
          )}

          <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)", marginTop: "var(--c97-sp-2)" }}>
            <h3 className="c97-serif c97-h3">
              Capsules
            </h3>
            {launch.capsules.length > 0 ? (
              <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
                {launch.capsules.map((capsule) => (
                  <div
                    key={capsule.id}
                    className="border border-[var(--c97-rule)] bg-[var(--c97-field)]" style={{ padding: "var(--c97-sp-1)" }}
                  >
                    <p className="text-sm font-semibold text-[var(--c97-ink)]">
                      {capsule.serial ?? "Unnamed capsule"}
                    </p>
                    <p className="text-xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                      {capsule.type ?? "Type unavailable"} • Reuse count{" "}
                      {capsule.reuseCount ?? "unavailable"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                No capsules are listed for this mission.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {!isLoading && !error && launch && activePanel === "links" ? (
        <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-2)" }}>
          <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}>
            <h3 className="c97-serif c97-h3">
              Mission references
            </h3>
            <div style={{ marginTop: "var(--c97-sp-2)" }}>
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

          <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}>
            <h3 className="c97-serif c97-h3">
              Data completeness
            </h3>
            <div className="grid sm:grid-cols-2" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
              <div className="bg-[var(--c97-field)]" style={{ padding: "var(--c97-sp-1)" }}>
                <p className="text-xs text-[var(--c97-label)]">Crew records</p>
                <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                  {launch.crew.length > 0 ? `${launch.crew.length} populated` : "None listed"}
                </p>
              </div>
              <div className="bg-[var(--c97-field)]" style={{ padding: "var(--c97-sp-1)" }}>
                <p className="text-xs text-[var(--c97-label)]">Payload records</p>
                <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                  {launch.payloads.length > 0 ? `${launch.payloads.length} populated` : "None listed"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
