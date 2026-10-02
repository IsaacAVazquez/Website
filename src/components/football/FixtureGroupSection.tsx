import { SurfaceCard } from "./SurfaceCard";
import { FixtureCard, type GenericFixture } from "./FixtureCard";

// The same zone FixtureCard prints kickoffs in, so a game sits under its own day.
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

function formatFixtureDate(utcDate: string): string {
  const date = new Date(utcDate);
  return Number.isNaN(date.getTime()) ? "Date TBD" : DATE_FORMATTER.format(date);
}

function groupFixturesByDay(fixtures: GenericFixture[]) {
  const groups = Map.groupBy(fixtures, (fixture) => formatFixtureDate(fixture.utcDate));
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export function FixtureGroupSection({
  title,
  description,
  fixtures,
  contextTeamId,
  onOpenTeam,
  getFallbackLabel,
}: {
  title: string;
  description: string;
  fixtures: GenericFixture[];
  contextTeamId?: string | null;
  onOpenTeam?: (teamId: string) => void;
  /** Per-fixture eyebrow label when the fixture has no matchday. */
  getFallbackLabel?: (fixture: GenericFixture) => string | undefined;
}) {
  const groups = groupFixturesByDay(fixtures);

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-2 border-b border-[var(--c97-rule)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--c97-label)]">
          {title}
        </p>
        <h3 className="text-xl font-semibold text-[var(--c97-ink)]">{description}</h3>
      </div>

      <div className="mt-5 space-y-6">
        {groups.length === 0 ? (
          <p className="text-sm text-[var(--c97-ink-2)]">No matches available right now.</p>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--c97-label)]">
                {group.label}
              </p>
              <div className="space-y-3">
                {group.items.map((fixture) => (
                  <FixtureCard
                    key={fixture.id}
                    fixture={fixture}
                    contextTeamId={contextTeamId}
                    onOpenTeam={onOpenTeam}
                    fallbackLabel={getFallbackLabel?.(fixture)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </SurfaceCard>
  );
}
