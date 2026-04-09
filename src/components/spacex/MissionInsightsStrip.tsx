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
              className="h-[116px] animate-pulse rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, white)]/85"
            />
          ))
        : insights.map((insight) => (
            <article
              key={insight.id}
              className="rounded-[24px] border border-[color-mix(in_srgb,var(--home-haze)_10%,var(--home-rule))] bg-[linear-gradient(150deg,color-mix(in_srgb,var(--home-haze)_6%,color-mix(in srgb, var(--home-paper) 92%, white))_0%,color-mix(in srgb, var(--home-paper) 92%, white)_100%)] p-4 shadow-[var(--shadow-sm)]"
            >
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                {insight.label}
              </p>
              <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[var(--home-ink)]">
                {insight.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
                {insight.description}
              </p>
            </article>
          ))}
    </section>
  );
}
