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
      className="rounded-[30px] border border-[var(--border-primary)] bg-[var(--surface-elevated)]/92 p-4 shadow-[var(--shadow-md)] sm:p-5"
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
            Launch board
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--text-primary)]">
            Browse the SpaceX launch queue.
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Filter by upcoming or past missions, then open a launch to inspect vehicles,
            payloads, and outbound references in context.
          </p>
        </div>

        <div
          className="inline-flex flex-wrap gap-2 rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-2"
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
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && launches.length === 0 && !isLoading ? (
        <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--color-error)_18%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-error)_7%,var(--surface-primary))] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Mission board unavailable
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="tap-target mt-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
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
              className="h-[124px] animate-pulse rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)]"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && launches.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[var(--border-primary)] bg-[var(--surface-primary)] px-5 py-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--surface-secondary))]">
            <Radar className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
            {status === "upcoming"
              ? "No upcoming launches are currently available."
              : "No past launches are currently available."}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
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
                    ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--surface-primary))] shadow-[var(--shadow-sm)]"
                    : "border-[var(--border-primary)] bg-[var(--surface-primary)] hover:border-[color-mix(in_srgb,var(--color-primary)_26%,var(--border-primary))] hover:bg-[var(--surface-secondary)]"
                }`}
              >
                <div className="grid gap-4 md:grid-cols-[92px_minmax(0,1fr)]">
                  <MissionPatch
                    name={launch.name}
                    image={launch.patchImage}
                    className="h-[92px] min-h-[92px]"
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                            Flight #{launch.flightNumber}
                          </span>
                          <span className="rounded-full border border-[var(--border-primary)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                            {launch.upcoming ? "Upcoming" : launch.success === true ? "Successful" : launch.success === false ? "Failed" : "Status pending"}
                          </span>
                        </div>
                        <h3 className="mt-3 text-xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                          {launch.name}
                        </h3>
                      </div>

                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
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
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {launch.rocketName ?? "Rocket pending"} from {launch.launchpadName ?? "Launch site pending"}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                          {formatMissionScheduleLabel(launch)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
                          <Layers3 className="mr-1 inline h-3.5 w-3.5" />
                          {launch.payloadCount} payload{launch.payloadCount === 1 ? "" : "s"}
                        </span>
                        <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
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
