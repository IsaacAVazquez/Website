import { ChevronRight, Layers3, LoaderCircle, Orbit, Radar } from "lucide-react";
import type { MissionControlStatus, MissionLaunchCard } from "@/types/spacex";
import { MissionPatch } from "./MissionPatch";
import { formatMissionScheduleLabel } from "./formatters";

const STATUS_OPTIONS: Array<{ key: MissionControlStatus; label: string }> = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

interface MissionLaunchBoardProps {
  launches: MissionLaunchCard[];
  status: MissionControlStatus;
  selectedLaunchId: string | null;
  isLoading: boolean;
  error: string | null;
  onStatusChange: (status: MissionControlStatus) => void;
  onSelectLaunch: (id: string) => void;
  onRetry: () => void;
}

export function MissionLaunchBoard({
  launches,
  status,
  selectedLaunchId,
  isLoading,
  error,
  onStatusChange,
  onSelectLaunch,
  onRetry,
}: MissionLaunchBoardProps) {
  return (
    <section
      data-testid="mission-board"
      aria-label="Mission board"
      className="rounded-[30px] border border-[var(--home-rule)] bg-[var(--home-paper-raised)]/92 p-4 shadow-[var(--shadow-md)] sm:p-5"
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--home-ink-soft)]">
            Launch board
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--home-ink)]">
            Browse the SpaceX launch queue.
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
            Filter by upcoming or past missions, then open a launch to inspect vehicles,
            payloads, and outbound references in context.
          </p>
        </div>

        <div
          className="inline-flex flex-wrap gap-2 rounded-[22px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-2"
          role="tablist"
          aria-label="Mission board status filters"
        >
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={status === option.key}
              onClick={() => onStatusChange(option.key)}
              className={`tap-target rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                status === option.key
                  ? "bg-[var(--home-haze)] text-white"
                  : "text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && launches.length === 0 && !isLoading ? (
        <div role="alert" className="rounded-[24px] border border-[color-mix(in_srgb,var(--home-acid)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-acid)_9%,var(--home-paper))] p-4">
          <p className="text-sm font-semibold text-[var(--home-ink)]">
            Mission board unavailable
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="tap-target mt-4 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-4 py-3 text-sm font-semibold text-[var(--home-ink)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)]"
          >
            Retry board
          </button>
        </div>
      ) : null}

      {isLoading && launches.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-[124px] animate-pulse rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)]"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && launches.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[var(--home-rule)] bg-[var(--home-paper)] px-5 py-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--home-haze)_10%,var(--home-paper-alt))]">
            <Radar className="h-6 w-6 text-[var(--home-haze)]" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[var(--home-ink)]">
            {status === "upcoming"
              ? "No upcoming launches are currently available."
              : "No past launches are currently available."}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
            {status === "upcoming"
              ? "The live provider does not currently list a future SpaceX mission. The hero will fall back to the latest completed launch when possible."
              : "The published archive came back empty. Retry the request to check for recovery."}
          </p>
        </div>
      ) : null}

      {launches.length > 0 ? (
        <div className="space-y-3">
          {launches.map((launch) => {
            const isSelected = selectedLaunchId === launch.id;

            return (
              <button
                key={launch.id}
                type="button"
                onClick={() => onSelectLaunch(launch.id)}
                className={`w-full rounded-[24px] border p-4 text-left transition sm:p-5 ${
                  isSelected
                    ? "border-[var(--home-haze)] bg-[color-mix(in_srgb,var(--home-haze)_7%,var(--home-paper))] shadow-[var(--shadow-sm)]"
                    : "border-[var(--home-rule)] bg-[var(--home-paper)] hover:border-[color-mix(in_srgb,var(--home-haze)_26%,var(--home-rule))] hover:bg-[var(--home-paper-alt)]"
                }`}
              >
                <div className="grid gap-4 md:grid-cols-[92px_minmax(0,1fr)]">
                  <MissionPatch
                    name={launch.name}
                    image={launch.patchImage}
                    className="h-[92px] min-h-[92px]"
                    dataTestId={`mission-board-visual-${launch.id}`}
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--home-ink-soft)]">
                            Flight #{launch.flightNumber}
                          </span>
                          <span className="rounded-full border border-[var(--home-rule)] px-2 py-1 text-[11px] font-medium text-[var(--home-ink-muted)]">
                            {launch.upcoming ? "Upcoming" : launch.success === true ? "Successful" : launch.success === false ? "Failed" : "Status pending"}
                          </span>
                        </div>
                        <h3 className="mt-3 text-xl font-bold tracking-[-0.03em] text-[var(--home-ink)]">
                          {launch.name}
                        </h3>
                      </div>

                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--home-haze)]">
                        Open detail
                        {isLoading && isSelected ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--home-ink)]">
                          {launch.rocketName ?? "Rocket pending"} from {launch.launchpadName ?? "Launch site pending"}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--home-ink-muted)]">
                          {formatMissionScheduleLabel(launch)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--home-paper-alt)] px-3 py-2 text-xs font-medium text-[var(--home-ink-muted)]">
                          <Layers3 className="mr-1 inline h-3.5 w-3.5" />
                          {launch.payloadCount} payload{launch.payloadCount === 1 ? "" : "s"}
                        </span>
                        <span className="rounded-full bg-[var(--home-paper-alt)] px-3 py-2 text-xs font-medium text-[var(--home-ink-muted)]">
                          <Orbit className="mr-1 inline h-3.5 w-3.5" />
                          {launch.coreCount} core{launch.coreCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
