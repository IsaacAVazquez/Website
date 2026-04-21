import Link from "next/link";
import { ArrowRight } from "@/components/ui/ServerIcons";
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
      <div className={cn("home-card h-full flex flex-col", className)} style={{ padding: "1.5rem" }}>
        {/* Top row: kicker + timeline */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="home-kicker">Project</span>
            {showFeaturedBadge && study.featured ? (
              <span className="home-pill">Featured</span>
            ) : null}
          </div>
          <span
            style={{
              fontFamily: "var(--font-home-sans)",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--home-ink-muted)",
            }}
          >
            {study.timeline}
          </span>
        </div>

        {/* Main content */}
        <div className="mt-5 flex flex-1 flex-col gap-5">
          <div className="space-y-3">
            <h3
              className="min-h-[3.5rem] line-clamp-2"
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "1.2rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                color: "var(--home-ink)",
              }}
            >
              {study.title}
            </h3>
            <p
              className="min-h-[4.75rem] text-sm leading-relaxed line-clamp-3"
              style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
            >
              {summary}
            </p>
          </div>

          {/* Role + Outcome */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className="px-4 py-3 rounded-xl"
              style={{
                background: "color-mix(in srgb, var(--home-paper-alt) 80%, var(--home-elev-mix))",
                border: "1px solid var(--home-rule)",
              }}
            >
              <p className="home-kicker mb-1">Role</p>
              <p
                className="mb-0 min-h-[2.75rem] text-sm leading-relaxed line-clamp-2"
                style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
              >
                {study.role}
              </p>
            </div>
            <div
              className="px-4 py-3 rounded-xl"
              style={{
                background: "color-mix(in srgb, var(--home-paper-alt) 80%, var(--home-elev-mix))",
                border: "1px solid var(--home-rule)",
              }}
            >
              <p className="home-kicker mb-1">Outcome</p>
              <p
                className="mb-0 min-h-[2.75rem] text-sm leading-relaxed line-clamp-2"
                style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
              >
                {study.metrics}
              </p>
            </div>
          </div>

          {/* Metric / tool chips */}
          <div className="flex min-h-[2rem] flex-wrap gap-2">
            {highlightedMetrics.length > 0
              ? highlightedMetrics.map((metric) => (
                  <span key={metric.label} className="resume-chip">
                    {metric.value} {metric.label}
                  </span>
                ))
              : study.tools.slice(0, 2).map((tool) => (
                  <span key={tool} className="resume-chip">
                    {tool}
                  </span>
                ))}
          </div>

          {/* Problem space */}
          <div className="pt-4" style={{ borderTop: "1px solid var(--home-rule)" }}>
            <p className="home-kicker mb-3">Problem space</p>
            <p
              className="mb-0 min-h-[3.5rem] text-sm leading-relaxed line-clamp-2"
              style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
            >
              {problem}
            </p>
          </div>
        </div>

        {/* Footer row */}
        <div
          className="mt-5 flex items-center justify-between gap-3 pt-4"
          style={{ borderTop: "1px solid var(--home-rule)" }}
        >
          <p
            className="mb-0"
            style={{
              fontFamily: "var(--font-home-sans)",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--home-ink-muted)",
            }}
          >
            {study.tools.slice(0, 2).join(" · ")}
          </p>
          <div
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--home-haze)", fontFamily: "var(--font-home-sans)" }}
          >
            View project
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
