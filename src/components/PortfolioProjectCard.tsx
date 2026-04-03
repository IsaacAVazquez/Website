import Link from "next/link";
import { ArrowRight } from "@/components/ui/ServerIcons";
import { WarmCard } from "@/components/ui/WarmCard";
import { Badge } from "@/components/ui/Badge";
import {
  CaseStudyData,
  getProjectCardProblem,
  getProjectCardSummary,
} from "@/constants/caseStudies";
import { cn } from "@/lib/utils";

interface PortfolioProjectCardProps {
  study: CaseStudyData;
  className?: string;
  showFeaturedBadge?: boolean;
}

export function PortfolioProjectCard({
  study,
  className,
  showFeaturedBadge = false,
}: PortfolioProjectCardProps) {
  const href = study.link ?? `/portfolio/${study.slug}`;
  const summary = getProjectCardSummary(study);
  const problem = getProjectCardProblem(study);
  const highlightedMetrics = study.detailedMetrics?.slice(0, 2) ?? [];

  return (
    <Link href={href} className="group block h-full">
      <WarmCard
        padding="none"
        hover
        className={cn("h-full overflow-hidden", className)}
      >
        <div className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="section-kicker">Project</span>
              {showFeaturedBadge && study.featured ? (
                <Badge variant="default">Featured</Badge>
              ) : null}
            </div>
            <span className="text-right text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              {study.timeline}
            </span>
          </div>

          <div className="mt-5 flex flex-1 flex-col gap-5">
            <div className="space-y-3">
              <h3 className="min-h-[3.5rem] text-xl font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--color-primary)] line-clamp-2">
                {study.title}
              </h3>
              <p className="min-h-[4.75rem] text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                {summary}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="surface-muted px-4 py-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Role
                </p>
                <p className="mb-0 min-h-[2.75rem] text-sm leading-relaxed text-[var(--text-primary)] line-clamp-2">
                  {study.role}
                </p>
              </div>
              <div className="surface-muted px-4 py-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Outcome
                </p>
                <p className="mb-0 min-h-[2.75rem] text-sm leading-relaxed text-[var(--text-primary)] line-clamp-2">
                  {study.metrics}
                </p>
              </div>
            </div>

            <div className="flex min-h-[2rem] flex-wrap gap-2">
              {highlightedMetrics.length > 0
                ? highlightedMetrics.map((metric) => (
                    <Badge key={metric.label} variant="outline">
                      {metric.value} {metric.label}
                    </Badge>
                  ))
                : study.tools.slice(0, 2).map((tool) => (
                    <Badge key={tool} variant="outline">
                      {tool}
                    </Badge>
                  ))}
            </div>

            <div className="border-t border-[var(--border-primary)] pt-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Problem space
              </p>
              <p className="mb-0 min-h-[3.5rem] text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-2">
                {problem}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--border-primary)] pt-4">
            <p className="mb-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              {study.tools.slice(0, 2).join(" · ")}
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
              View project
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </WarmCard>
    </Link>
  );
}
