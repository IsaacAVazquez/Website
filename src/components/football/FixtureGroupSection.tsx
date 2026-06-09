import { SurfaceCard } from "./SurfaceCard";
import { FixtureCard, type GenericFixture } from "./FixtureCard";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

function formatFixtureDate(utcDate: string): string {
  const date = new Date(utcDate);
  return Number.isNaN(date.getTime()) ? "Date TBD" : DATE_FORMATTER.format(date);
}

function groupFixturesByDay(fixtures: GenericFixture[]) {
  const groups = new Map<string, GenericFixture[]>();
  for (const fixture of fixtures) {
    const label = formatFixtureDate(fixture.utcDate);
    const existing = groups.get(label);
    if (existing) {
      existing.push(fixture);
    } else {
      groups.set(label, [fixture]);
    }
  }
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
      <div className="flex flex-col gap-2 border-b border-[var(--home-rule)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-soft)]">
          {title}
        </p>
        <h3 className="text-xl font-semibold text-[var(--home-ink)]">{description}</h3>
      </div>

      <div className="mt-5 space-y-6">
        {groups.length === 0 ? (
          <p className="text-sm text-[var(--home-ink-muted)]">No matches available right now.</p>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
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
