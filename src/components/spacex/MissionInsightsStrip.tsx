import type { MissionControlInsight } from "@/types/spacex";

interface MissionInsightsStripProps {
  insights: MissionControlInsight[];
  isLoading: boolean;
}

export function MissionInsightsStrip({
  insights,
  isLoading,
}: MissionInsightsStripProps) {
  return (
    <section
      aria-label="Mission control insights"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {isLoading && insights.length === 0
        ? Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-[94px] animate-pulse rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)]/85"
            />
          ))
        : insights.map((insight) => (
            <article
              key={insight.id}
              className="rounded-[var(--radius-3xl)] border border-[color-mix(in_srgb,var(--home-signal)_10%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_5%,var(--home-paper-raised))] p-3.5 shadow-[var(--shadow-sm)]"
            >
              <p className="font-mono text-2xs font-semibold uppercase tracking-[0.22em] text-[var(--home-ink-soft)]">
                {insight.label}
              </p>
              <p className="mt-2 text-[1.75rem] font-bold tracking-[-0.04em] text-[var(--home-ink)]">
                {insight.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--home-ink-muted)]">
                {insight.description}
              </p>
            </article>
          ))}
    </section>
  );
}
