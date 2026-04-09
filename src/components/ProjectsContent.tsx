"use client";

import { Heading } from "@/components/ui/Heading";
import { motion, useReducedMotion } from "framer-motion";
import {
  IconBrandGithub,
  IconExternalLink,
  IconDatabase,
  IconTestPipe,
  IconChartBar,
  IconEye,
  IconChartLine,
  IconCreditCard,
} from "@tabler/icons-react";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import Link from "next/link";
import { useState, lazy, Suspense, ComponentType } from "react";
import type { ProjectDetailModalProps } from "@/components/ProjectDetailModal";

const ProjectDetailModal = lazy<ComponentType<ProjectDetailModalProps>>(() =>
  import("@/components/ProjectDetailModal").then((mod) => ({
    default: mod.ProjectDetailModal,
  }))
);

interface Project {
  id: number;
  title: string;
  description: string;
  tech: string[];
  type: "featured" | "normal" | "small";
  icon: React.ComponentType<{ className?: string }>;
  metrics?: string;
  github?: string | null;
  link?: string | null;
  detailedMetrics?: {
    label: string;
    value: string;
    improvement?: string;
  }[];
  screenshot?: string;
  challenges?: string[];
  impact?: string;
  timeline?: string;
  problem?: {
    context: string;
    painPoints: string[];
    stakes: string;
  };
  process?: {
    approach: string;
    methodology: string[];
    decisions: string[];
    collaboration?: string;
  };
  result?: {
    outcomes: string[];
    testimonial?: {
      quote: string;
      author: string;
      role: string;
    };
    lessonsLearned?: string[];
  };
}

const projects: Project[] = [
  {
    id: 6,
    title: "Interchange IQ",
    description:
      "Interactive payment processor fee analyzer. Compare Stripe, Square, PayPal, Adyen, and others based on your real volume, avg ticket, and card mix using actual 2024 interchange rate data.",
    tech: ["Next.js", "TypeScript", "Payments", "Interchange Economics"],
    type: "featured",
    icon: IconCreditCard,
    metrics: "7 processors · Real interchange data · Breakeven analysis",
    github: "https://github.com/IsaacAVazquez",
    link: "/fintech-tools/interchange-iq",
    detailedMetrics: [
      { label: "Processors Modeled", value: "7",          improvement: "Flat-rate + IC+" },
      { label: "Interchange Tiers",  value: "3 types",    improvement: "Credit, Debit, Amex" },
      { label: "Breakeven Calc",     value: "Dynamic",    improvement: "Per card mix" },
      { label: "Data Source",        value: "2024 Published", improvement: "Visa/MC/Amex tables" },
    ],
    impact:
      "Helps merchants and fintech founders understand the true cost structure of accepting payments before committing to a processor, grounded in real interchange economics, not marketing copy.",
    timeline: "Side project (2025)",
    challenges: [
      "Interchange has 300+ rate categories; simplifying to a useful model without losing directional accuracy",
      "Breakeven depends on card mix, avg ticket, and volume simultaneously, requiring a clean formula derivation",
      "Making the UI intuitive for non-technical founders while keeping the underlying math rigorous",
      "Keeping processor pricing current as rates shift quarterly",
    ],
    problem: {
      context:
        "Most merchants pick a payment processor based on brand recognition, not unit economics. The difference between flat-rate and interchange+ pricing can be tens of thousands of dollars per year at scale, but the underlying math is deliberately opaque.",
      painPoints: [
        "Flat-rate pricing (Stripe 2.9% + $0.30) bundles a significant markup over actual interchange into a 'simple' number",
        "Interchange+ sounds risky and complex even when it's clearly cheaper at higher volumes",
        "No simple tool lets you model your specific business profile (ticket size, card mix, volume) against multiple processors",
        "Breakeven thresholds are non-intuitive because they depend on avg ticket, card mix, AND volume at once",
      ],
      stakes:
        "A merchant processing $200k/month with a favorable card mix could be overpaying $2,000–$3,500/month by defaulting to flat-rate pricing.",
    },
    process: {
      approach:
        "Researched published Visa/Mastercard interchange schedules and Amex OptBlue pricing. Built a live Next.js calculator with slider-driven inputs, real-time fee comparisons, and a derived breakeven formula.",
      methodology: [
        "Researched published 2024 Visa, Mastercard, and Amex interchange rate schedules",
        "Modeled 3 card categories (Visa/MC credit, regulated debit, Amex) as the dominant cost drivers",
        "Derived breakeven ticket-size formula: at what avg transaction does IC+ fixed fee disadvantage flip?",
        "Iterated on UX to surface key insights without requiring users to understand interchange tables",
      ],
      decisions: [
        "Used blended interchange averages over 300+ categories. Accurate enough for directional decisions, far more usable.",
        "Sorted results ascending by cost so cheapest option is always visually obvious",
        "Added breakeven insight panel to answer the most common follow-up question",
        "Included educational cards explaining interchange to non-experts with an honest caveats section",
      ],
      collaboration:
        "Solo side project. Informed by conversations with fintech PMs and startup founders about how opaque processor pricing is in practice.",
    },
    result: {
      outcomes: [
        "Live tool modeling 7 processors with adjustable business profile inputs",
        "Calculates breakeven avg ticket size dynamically based on real card mix",
        "Surfaces the annual cost of processor choice in a legible, concrete format",
        "Demonstrates payments domain knowledge: interchange economics, card network structure, flat-rate vs. IC+ tradeoff",
      ],
      lessonsLearned: [
        "Interchange is deliberately complex. Useful tools compress 300+ categories into 3–4 decision levers.",
        "Breakeven analysis is the killer feature. It gives founders a concrete threshold, not just a comparison table.",
        "Per-transaction fixed fees are consistently underweighted in payment decisions. The tool makes this viscerally clear.",
      ],
    },
  },
  {
    id: 1,
    title: "Scaling a Platform to 60M+ Users",
    description:
      "Led product strategy and quality for a high-scale SaaS platform during the 2022 midterm elections, achieving 99.9% uptime while scaling from 5M to 60M+ users.",
    tech: ["Cypress", "Jest", "React", "Node.js"],
    type: "featured",
    icon: IconChartBar,
    metrics: "99.9% uptime, 30% faster releases",
    github: "https://github.com/IsaacAVazquez",
    link: null,
    detailedMetrics: [
      { label: "Users Reached", value: "60M+", improvement: "200% increase" },
      { label: "Uptime Achieved", value: "99.9%", improvement: "From 97.2%" },
      {
        label: "Release Velocity",
        value: "30% faster",
        improvement: "14 days to 10 days",
      },
      {
        label: "Bug Detection",
        value: "95% pre-prod",
        improvement: "From 70%",
      },
    ],
    screenshot: "/project-screenshots/civic-engagement-platform.png",
    challenges: [
      "Scale testing for 60M+ voter database queries",
      "Ensure reliability during election day traffic spikes",
      "Cross-browser compatibility across diverse user base",
      "Data privacy compliance (CCPA, state regulations)",
    ],
    impact:
      "Enabled secure, reliable voter outreach that processed millions of daily interactions during 2022 midterms without downtime",
    timeline: "8 months (2022)",
    problem: {
      context:
        "A rapidly growing SaaS platform needed to scale from 5M to 60M+ users while maintaining election-day reliability and compliance.",
      painPoints: [
        "Manual testing couldn't keep pace with rapid feature development",
        "Critical bugs were reaching production during high-stakes election periods",
        "14-day release cycles were too slow for competitive landscape",
        "No comprehensive test coverage for edge cases and state regulations",
      ],
      stakes:
        "System failures during elections could disenfranchise millions of voters and damage client trust irreparably.",
    },
    process: {
      approach:
        "Designed and implemented a comprehensive automated testing framework with parallel execution capabilities and compliance checks.",
      methodology: [
        "Built modular Cypress test suite with 500+ scenarios covering critical user paths",
        "Implemented Jest unit tests achieving 85% code coverage",
        "Created Docker-based testing environment for consistent cross-browser validation",
        "Integrated automated compliance checks for CCPA and state-specific regulations",
      ],
      decisions: [
        "Chose Cypress over Selenium for better developer experience and faster feedback loops",
        "Implemented parallel test execution reducing suite runtime from 2 hours to 20 minutes",
        "Prioritized critical path testing for election day scenarios",
        "Built custom reporting dashboard for stakeholder visibility",
      ],
      collaboration:
        "Worked closely with 3 product managers, 8 engineers, and legal team to align testing strategy with business priorities and compliance requirements.",
    },
    result: {
      outcomes: [
        "Achieved 99.9% uptime during 2022 midterm elections serving 60M+ voters",
        "Reduced release cycle from 14 to 10 days (30% improvement)",
        "Increased pre-production bug detection from 70% to 95%",
        "Zero critical incidents during election day peak traffic (10x normal load)",
      ],
      testimonial: {
        quote:
          "Isaac's testing framework gave us the confidence to scale rapidly while maintaining the reliability our clients depend on during critical election periods.",
        author: "Sarah Chen",
        role: "VP of Engineering",
      },
      lessonsLearned: [
        "Early investment in automation infrastructure pays massive dividends during scaling phases",
        "Test stability is as important as coverage - flaky tests erode team confidence",
        "Cross-functional collaboration on test strategy improves business outcome alignment",
      ],
    },
  },
  {
    id: 2,
    title: "Unlocking Daily Deploys Through Process Automation",
    description:
      "Transformed QA from a release bottleneck into an enabler of daily deployments by designing a unified automation framework across 5 tech stacks.",
    tech: ["Selenium", "Python", "Docker", "CI/CD"],
    type: "normal",
    icon: IconTestPipe,
    metrics: "50% defect reduction, 300% ROI",
    github: "https://github.com/IsaacAVazquez",
    link: null,
    detailedMetrics: [
      {
        label: "Defect Reduction",
        value: "50%",
        improvement: "From 23 to 11 bugs/release",
      },
      {
        label: "Test Coverage",
        value: "85%",
        improvement: "From 60%",
      },
      {
        label: "Execution Time",
        value: "6 hours",
        improvement: "From 2 days manual",
      },
      {
        label: "ROI",
        value: "300%",
        improvement: "Saved 160 QA hours/month",
      },
    ],
    screenshot: "/project-screenshots/test-automation-suite.png",
    challenges: [
      "Integrate across 5 different tech stacks",
      "Maintain test stability with frequent UI changes",
      "Parallel execution without resource conflicts",
      "Cross-team adoption and training",
    ],
    impact:
      "Transformed QA from bottleneck to enabler, allowing daily releases with confidence",
    timeline: "6 months (2023)",
    problem: {
      context:
        "Manual testing across five different tech stacks was creating a bottleneck, delaying releases by 2-3 days and allowing defects to slip into production.",
      painPoints: [
        "Manual testing required 2 days per release, blocking deployment pipeline",
        "60% test coverage left critical paths untested",
        "23 bugs per release reached production, damaging customer trust",
        "QA team spending 80% of time on repetitive manual testing",
      ],
      stakes:
        "Slow release cycles were costing the business competitive advantage and increasing technical debt, while quality issues were driving customer churn.",
    },
    process: {
      approach:
        "Architected a modular, Docker-based automation framework with Python and Selenium, designed for cross-platform compatibility and parallel execution.",
      methodology: [
        "Conducted gap analysis identifying high-value test cases for automation",
        "Built reusable component library reducing test development time by 60%",
        "Implemented Page Object Model design pattern for maintainability",
        "Integrated with CI/CD pipeline for continuous feedback on pull requests",
      ],
      decisions: [
        "Chose Python over Java for faster development and better team adoption",
        "Implemented Docker containers for consistent test environments across teams",
        "Prioritized flaky test elimination over coverage expansion",
        "Built custom reporting dashboard with trend analysis and failure categorization",
      ],
      collaboration:
        "Led workshops training 12 engineers across 3 teams on automation best practices. Partnered with DevOps to optimize CI/CD integration and resource allocation.",
    },
    result: {
      outcomes: [
        "Reduced production defects by 50% (from 23 to 11 bugs per release)",
        "Increased test coverage from 60% to 85% of critical user paths",
        "Decreased test execution time from 2 days to 6 hours (83% reduction)",
        "Achieved 300% ROI by saving 160 QA hours per month",
        "Enabled shift to daily releases from weekly cadence",
      ],
      testimonial: {
        quote:
          "Isaac's automation framework didn't just speed up our testing -- it fundamentally changed how we think about quality.",
        author: "Michael Rodriguez",
        role: "Senior Engineering Manager",
      },
      lessonsLearned: [
        "Test stability and reliability are more valuable than high coverage of flaky tests",
        "Investing time in training and documentation drives faster cross-team adoption",
        "Modular architecture with reusable components reduces long-term maintenance burden",
      ],
    },
  },
  {
    id: 3,
    title: "Transforming Client Reporting into Self-Service Analytics",
    description:
      "Led a product initiative replacing manual Excel reporting with automated real-time dashboards, enabling the company to scale from 15 to 45 clients without adding headcount.",
    tech: ["SQL", "Tableau", "Python", "APIs"],
    type: "normal",
    icon: IconDatabase,
    metrics: "40% faster decisions, 25% conversion lift",
    github: "https://github.com/IsaacAVazquez",
    link: null,
    detailedMetrics: [
      {
        label: "Decision Speed",
        value: "40% faster",
        improvement: "From 3 days to 1.8 days",
      },
      {
        label: "Conversion Rate",
        value: "25% increase",
        improvement: "Through better targeting",
      },
      {
        label: "Time Saved",
        value: "60 hours/month",
        improvement: "Automated reporting",
      },
      {
        label: "Client Satisfaction",
        value: "92% positive",
        improvement: "Up from 74%",
      },
    ],
    screenshot: "/project-screenshots/data-analytics-dashboard.png",
    challenges: [
      "Integrate data from 5 different campaign platforms",
      "Real-time sync with API rate limits",
      "Make complex metrics digestible for non-technical clients",
      "Maintain data privacy and security compliance",
    ],
    impact:
      "Empowered campaign managers to make data-driven decisions in hours instead of days, directly improving campaign ROI and client retention",
    timeline: "4 months (2020-2021)",
    problem: {
      context:
        "Campaign managers were spending 3 days per week creating manual Excel reports, leaving no time for strategic optimization or client consultation.",
      painPoints: [
        "Manual data aggregation from 5 platforms taking 60+ hours monthly",
        "Reports were 2-3 days stale by the time clients received them",
        "Complex Excel spreadsheets overwhelmed non-technical stakeholders",
        "No historical trend analysis or predictive insights",
        "Client churn of 18% due to perceived lack of transparency",
      ],
      stakes:
        "Inefficient reporting was limiting the company's ability to scale client base and preventing campaign managers from focusing on high-value strategic work.",
    },
    process: {
      approach:
        "Built automated ETL pipeline aggregating data from multiple platforms into Sisense/Tableau dashboards with real-time updates and user-friendly visualizations.",
      methodology: [
        "Conducted stakeholder interviews with 8 campaign managers to identify key metrics and pain points",
        "Designed SQL data warehouse schema optimized for campaign analytics queries",
        "Created Python scripts for automated data extraction via APIs (respecting rate limits)",
        "Developed interactive Tableau dashboards with drill-down capabilities and custom filters",
      ],
      decisions: [
        "Chose Sisense over custom-built solution for faster time-to-market and built-in features",
        "Implemented hourly data refreshes balancing timeliness with API costs",
        "Prioritized top 8 metrics covering 80% of client questions",
        "Built mobile-responsive views for on-the-go client access",
      ],
      collaboration:
        "Partnered with campaign managers, data engineering team, and clients directly to iterate on dashboard design. Conducted 5 rounds of user testing with real campaign data.",
    },
    result: {
      outcomes: [
        "Reduced reporting time from 60 hours to 5 hours per month (92% reduction)",
        "Accelerated decision-making by 40% (from 3 days to 1.8 days average)",
        "Improved campaign conversion rates by 25% through better-informed targeting",
        "Increased client satisfaction scores from 74% to 92%",
        "Enabled company to scale from 15 to 45 active clients without adding headcount",
      ],
      testimonial: {
        quote:
          "Isaac's dashboards gave us superpowers. What used to take days of Excel work now updates in real-time.",
        author: "Jessica Martinez",
        role: "Senior Campaign Manager",
      },
      lessonsLearned: [
        "User research and iterative design are critical -- first dashboard version missed 3 key metrics",
        "Simple, focused dashboards outperform feature-packed complexity every time",
        "Automated reporting frees teams to focus on strategy and high-value work",
      ],
    },
  },
  {
    id: 4,
    title: "Preventing Outages Through Proactive Performance Intelligence",
    description:
      "Shifted the team from reactive incident response to proactive performance monitoring, reducing page load times by 60% and achieving 99.95% uptime.",
    tech: ["New Relic", "Grafana", "JMeter"],
    type: "small",
    icon: IconChartBar,
    metrics: "60% faster load times, zero outages",
    github: null,
    link: null,
    detailedMetrics: [
      {
        label: "Page Load Time",
        value: "60% faster",
        improvement: "From 4.2s to 1.7s",
      },
      {
        label: "Uptime",
        value: "99.95%",
        improvement: "From 98.1%",
      },
      {
        label: "Response Time",
        value: "250ms avg",
        improvement: "From 680ms",
      },
      {
        label: "Issue Detection",
        value: "85% proactive",
        improvement: "Before user impact",
      },
    ],
    screenshot: "/project-screenshots/performance-monitoring.png",
    challenges: [
      "Monitor complex distributed system architecture",
      "Set meaningful alert thresholds avoiding fatigue",
      "Correlate performance metrics with business impact",
      "Handle high data volume without affecting production",
    ],
    impact:
      "Proactively identified performance bottlenecks before user impact, improving user satisfaction and retention",
    timeline: "4 months (2022-2023)",
  },
  {
    id: 5,
    title: "Investment Analytics Platform",
    description:
      "Built a full-stack investment platform with live Yahoo Finance data. Portfolio tracking with gain/loss analytics, plus a side-by-side stock comparison tool with 30+ metrics and Wall Street analyst consensus ratings.",
    tech: ["Next.js", "TypeScript", "Yahoo Finance API", "React", "Tailwind CSS"],
    type: "normal",
    icon: IconChartLine,
    metrics: "Live data, 30+ metrics per stock, analyst consensus ratings",
    github: "https://github.com/IsaacAVazquez",
    link: null,
    detailedMetrics: [
      {
        label: "Data Source",
        value: "Yahoo Finance",
        improvement: "Live market data",
      },
      {
        label: "Data Points",
        value: "30+ metrics",
        improvement: "Per stock",
      },
      {
        label: "Comparison",
        value: "Up to 4 stocks",
        improvement: "Side-by-side view",
      },
      {
        label: "Analyst Data",
        value: "Buy/Sell/Hold",
        improvement: "With price targets",
      },
    ],
    challenges: [
      "Yahoo Finance API requires cookie + crumb authentication for programmatic access",
      "Handling API rate limits and 429 responses with exponential backoff",
      "Displaying 30+ financial metrics in a clear, comparable format",
      "Client-side state persistence without a backend database",
    ],
    impact:
      "Enables real-time portfolio tracking with gain/loss analytics and Wall Street-level stock comparison: analyst consensus, price targets, PE ratios, margins, and growth metrics, all for free.",
    timeline: "2025",
    problem: {
      context:
        "Needed a lightweight investment platform that provides real-time stock data, portfolio tracking, and multi-stock comparison without paid API subscriptions or user accounts.",
      painPoints: [
        "Yahoo Finance API changed to require authentication, breaking unauthenticated requests",
        "No timeout handling meant API hangs caused infinite loading states",
        "Stock comparison tools either cost money or provide limited metrics",
        "Rate limiting from Yahoo could silently break the entire app",
      ],
      stakes:
        "Without proper API handling, users would see perpetual loading spinners or stale zero-value data with no feedback. Without authenticated access, all valuation metrics return null.",
    },
    process: {
      approach:
        "Built an authenticated Yahoo Finance client with automatic cookie/crumb management, then layered portfolio tracking and multi-stock comparison UIs on top.",
      methodology: [
        "Reverse-engineered Yahoo Finance cookie + crumb authentication flow",
        "Implemented in-memory auth caching with 30-minute TTL and exponential backoff on rate limits",
        "Added AbortController-based timeouts at both server (10s) and client (15s) layers",
        "Designed responsive comparison layout supporting 1-4 stocks with visual metric bars",
      ],
      decisions: [
        "Chose localStorage over a database for zero-friction user experience",
        "Used Promise.allSettled to show chart data even when summary auth fails",
        "Built safe accessor utilities (safeRaw, safeStr) to handle Yahoo's inconsistent response format",
        "Chose visual metric bars over raw numbers for faster comparison scanning",
      ],
      collaboration:
        "Solo project. Designed, built, and iterated on the platform end-to-end, from API reverse-engineering to UI/UX design.",
    },
    result: {
      outcomes: [
        "Live stock prices, gain/loss, and daily changes load in under 2 seconds",
        "Full analyst consensus with breakdown (Strong Buy/Buy/Hold/Sell/Strong Sell) and price targets",
        "30+ financial metrics per stock including valuation, profitability, and growth",
        "Timeout and rate limit handling ensures users always get feedback",
      ],
      lessonsLearned: [
        "External API dependencies require defensive coding. Timeouts, retries, and fallbacks are essential.",
        "Promise.allSettled is essential for multi-source data fetching. Always show what you can.",
        "Visual comparison (bars, color coding) is far more effective than tables of raw numbers",
      ],
    },
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export function ProjectsContent() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openProjectDetail = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeProjectDetail = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <>
      <div className="mb-12">
        <Heading className="text-5xl mb-4 tracking-tight">
          Case Studies
        </Heading>
        <p className="text-lg text-[var(--home-ink-muted)] max-w-3xl leading-relaxed">
          A curated selection of projects demonstrating product management
          expertise through strategic thinking, cross-functional leadership,
          and measurable business outcomes.
        </p>
        <p className="text-sm text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] mt-4 max-w-3xl">
          Click any project to view metrics, challenges, and outcomes.
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto md:auto-rows-[200px]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {projects.map((project) => {
          const Icon = project.icon;
          const gridClass =
            project.type === "featured"
              ? "md:col-span-2 md:row-span-2"
              : project.type === "normal"
                ? "md:row-span-2"
                : "md:row-span-1";

          return (
            <WarmCard
              key={project.id}
              hover={true}
              padding="none"
              className={`${gridClass} overflow-hidden relative`}
            >
              <div className="relative h-full p-6 flex flex-col">
                <div className="mb-4">
                  <Icon className="h-8 w-8 text-[var(--home-haze)]" />
                </div>

                <h3 className="font-bold text-xl mb-2 text-[var(--home-ink)]">
                  {project.title}
                </h3>
                <p className="text-sm text-[var(--home-ink-muted)] mb-4 flex-grow">
                  {project.description}
                </p>

                {project.metrics && (
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-[var(--home-haze)]">
                      {project.metrics}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--home-haze)]/10 text-[var(--home-haze)] border border-[var(--home-haze)]/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="absolute top-6 right-6 flex gap-2">
                  {(project.detailedMetrics ||
                    project.challenges ||
                    project.impact) && (
                    <button
                      onClick={() => openProjectDetail(project)}
                      className="p-2 rounded-lg bg-[color-mix(in srgb, var(--home-paper) 92%, white)] hover:bg-[var(--home-haze)]/10 border border-[var(--home-rule)] hover:border-[var(--home-haze)]/50 transition-all"
                      aria-label="View project details"
                    >
                      <IconEye className="h-4 w-4 text-[var(--home-haze)]" />
                    </button>
                  )}
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-[color-mix(in srgb, var(--home-paper) 92%, white)] hover:bg-[var(--home-haze)]/10 border border-[var(--home-rule)] hover:border-[var(--home-haze)]/50 transition-all"
                      aria-label="View source code"
                    >
                      <IconBrandGithub className="h-4 w-4 text-[var(--home-haze)]" />
                    </a>
                  )}
                  {project.link &&
                    (project.link.startsWith("/") ? (
                      <Link
                        href={project.link}
                        className="p-2 rounded-lg bg-[color-mix(in srgb, var(--home-paper) 92%, white)] hover:bg-[var(--home-haze)]/10 border border-[var(--home-rule)] hover:border-[var(--home-haze)]/50 transition-all"
                        aria-label="View live project"
                      >
                        <IconExternalLink className="h-4 w-4 text-[var(--home-haze)]" />
                      </Link>
                    ) : (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-[color-mix(in srgb, var(--home-paper) 92%, white)] hover:bg-[var(--home-haze)]/10 border border-[var(--home-rule)] hover:border-[var(--home-haze)]/50 transition-all"
                        aria-label="View live project"
                      >
                        <IconExternalLink className="h-4 w-4 text-[var(--home-haze)]" />
                      </a>
                    ))}
                </div>
              </div>
            </WarmCard>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: shouldReduceMotion ? 0 : 0.5 }}
        className="mt-16 text-center"
      >
        <p className="text-lg text-[var(--home-ink-muted)] mb-6">
          Interested in working together? Let's build something great.
        </p>
        <ModernButton href="/contact" variant="accent" size="lg">
          Get In Touch
        </ModernButton>
      </motion.div>

      <Suspense fallback={null}>
        <ProjectDetailModal
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={closeProjectDetail}
        />
      </Suspense>
    </>
  );
}
