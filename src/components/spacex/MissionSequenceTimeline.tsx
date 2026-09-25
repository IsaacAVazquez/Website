import { MISSION_SEQUENCE_TEMPLATES } from "@/data/spacexSequenceTemplates";
import { deriveVehicleFamily } from "@/lib/spacexVehicleFamily";

interface MissionSequenceTimelineProps {
  rocketName: string | null;
  /** True for a mission that hasn't flown yet — used only to pick the "next" node. */
  upcoming: boolean;
}

/**
 * The T-0 sequence: a vertical timeline of flight-profile phases. No
 * per-mission telemetry source exists in this repo's upstream data, so this
 * renders a templated, clearly-labeled typical sequence for the mission's
 * vehicle family rather than fabricating mission-specific timing.
 */
export function MissionSequenceTimeline({ rocketName, upcoming }: MissionSequenceTimelineProps) {
  const family = deriveVehicleFamily(rocketName);
  const steps = MISSION_SEQUENCE_TEMPLATES[family];

  return (
    <div>
      <p className="mb-3.5 text-xs leading-6 text-[var(--c97-ink-2)]">
        Typical {family} flight profile — Launch Library doesn&apos;t publish a phase-by-phase
        timeline, so this is an estimated reference sequence, not this mission&apos;s actual
        telemetry.
      </p>
      <ul className="relative m-0 list-none p-0">
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 left-[5px] top-1.5 w-px bg-[var(--c97-rule)]"
        />
        {steps.map((step, index) => {
          const state = upcoming ? (index === 0 ? "next" : "pending") : "reference";
          return (
            <li
              key={step.label}
              className="relative grid grid-cols-[68px_1fr] items-baseline gap-3.5 py-0 pb-3.5 pl-5 last:pb-0"
            >
              <span
                aria-hidden="true"
                className="absolute left-0.5 top-1.5 h-1.5 w-1.5 border border-[var(--c97-surface)]"
                style={{
                  background:
                    state === "next"
                      ? "var(--c97-accent)"
                      : state === "reference"
                        ? "var(--c97-ink-2)"
                        : "var(--c97-rule)",
                  boxShadow:
                    state === "next"
                      ? "0 0 0 4px color-mix(in srgb, var(--c97-accent) 18%, transparent)"
                      : undefined,
                }}
              />
              <span
                className="font-mono text-xs tabular-nums"
                style={{ color: state === "next" ? "var(--c97-accent)" : "var(--c97-ink-2)" }}
              >
                {step.label}
              </span>
              <span
                className={`text-sm font-semibold ${
                  state === "pending" ? "text-[var(--c97-ink-2)]" : "text-[var(--c97-ink)]"
                }`}
              >
                {step.event}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
