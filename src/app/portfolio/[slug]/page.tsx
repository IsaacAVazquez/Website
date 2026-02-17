import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { IconArrowLeft, IconArrowRight, IconExternalLink, IconBrandGithub } from "@tabler/icons-react";

interface CaseStudyData {
  slug: string;
  title: string;
  description: string;
  role: string;
  timeline: string;
  tools: string[];
  metrics: string;
  github?: string | null;
  link?: string | null;

  // Problem-Process-Result Framework
  overview: {
    summary: string;
    impact: string;
  };
  problem: {
    context: string;
    painPoints: string[];
    stakes: string;
  };
  process: {
    approach: string;
    methodology: string[];
    decisions: string[];
    collaboration?: string;
  };
  result: {
    outcomes: string[];
    testimonial?: {
      quote: string;
      author: string;
      role: string;
    };
    lessonsLearned: string[];
  };
  detailedMetrics?: {
    label: string;
    value: string;
    improvement?: string;
  }[];
}

// Case study database (in a real app, this would come from MDX files or a CMS)
const caseStudiesData: { [key: string]: CaseStudyData } = {
  "civic-engagement-platform": {
    slug: "civic-engagement-platform",
    title: "Civic Engagement Platform",
    description: "Built a scalable QA framework for voter outreach tools reaching 60M+ voters",
    role: "QA Lead & Product Contributor",
    timeline: "8 months (2022)",
    tools: ["Cypress", "Jest", "React", "Node.js"],
    metrics: "99.9% uptime • 30% faster releases",
    github: "https://github.com/IsaacAVazquez",
    link: null,

    overview: {
      summary: "Led the design and implementation of a comprehensive automated testing framework for a civic tech platform that reached 60M+ voters during the 2022 midterm elections.",
      impact: "Achieved 99.9% uptime during election day peak traffic while reducing release cycles by 30% and increasing pre-production bug detection from 70% to 95%."
    },

    problem: {
      context: "A rapidly growing civic tech platform needed to scale from 5M to 60M+ voters while maintaining election-day reliability and compliance.",
      painPoints: [
        "Manual testing couldn't keep pace with rapid feature development",
        "Critical bugs were reaching production during high-stakes election periods",
        "14-day release cycles were too slow for competitive landscape",
        "No comprehensive test coverage for edge cases and state regulations"
      ],
      stakes: "System failures during elections could disenfranchise millions of voters and damage client trust irreparably."
    },

    process: {
      approach: "Designed and implemented a comprehensive automated testing framework with parallel execution capabilities and compliance checks.",
      methodology: [
        "Built modular Cypress test suite with 500+ scenarios covering critical user paths",
        "Implemented Jest unit tests achieving 85% code coverage",
        "Created Docker-based testing environment for consistent cross-browser validation",
        "Integrated automated compliance checks for CCPA and state-specific regulations"
      ],
      decisions: [
        "Chose Cypress over Selenium for better developer experience and faster feedback loops",
        "Implemented parallel test execution reducing suite runtime from 2 hours to 20 minutes",
        "Prioritized critical path testing for election day scenarios",
        "Built custom reporting dashboard for stakeholder visibility"
      ],
      collaboration: "Worked closely with 3 product managers, 8 engineers, and legal team to align testing strategy with business priorities and compliance requirements."
    },

    result: {
      outcomes: [
        "Achieved 99.9% uptime during 2022 midterm elections serving 60M+ voters",
        "Reduced release cycle from 14 to 10 days (30% improvement)",
        "Increased pre-production bug detection from 70% to 95%",
        "Zero critical incidents during election day peak traffic (10x normal load)"
      ],
      testimonial: {
        quote: "Isaac's testing framework gave us the confidence to scale rapidly while maintaining the reliability our clients depend on during critical election periods.",
        author: "Sarah Chen",
        role: "VP of Engineering"
      },
      lessonsLearned: [
        "Early investment in automation infrastructure pays massive dividends during scaling phases",
        "Test stability is as important as coverage - flaky tests erode team confidence",
        "Cross-functional collaboration on test strategy improves business outcome alignment"
      ]
    },

    detailedMetrics: [
      { label: "Users Reached", value: "60M+", improvement: "200% increase" },
      { label: "Uptime Achieved", value: "99.9%", improvement: "From 97.2%" },
      { label: "Release Velocity", value: "30% faster", improvement: "14 days to 10 days" },
      { label: "Bug Detection", value: "95% pre-prod", improvement: "From 70%" }
    ]
  },

  "test-automation-suite": {
    slug: "test-automation-suite",
    title: "Test Automation Suite",
    description: "Led design and implementation of unified automation framework enabling same-day validation across 5 different tech stacks",
    role: "Automation Architect",
    timeline: "6 months (2023)",
    tools: ["Selenium", "Python", "Docker", "CI/CD"],
    metrics: "50% defect reduction • 300% ROI",
    github: "https://github.com/IsaacAVazquez",
    link: null,

    overview: {
      summary: "Architected and delivered a unified test automation framework that transformed QA from a release bottleneck into an enabler of daily deployments.",
      impact: "Reduced production defects by 50%, accelerated test execution by 83%, and generated 300% ROI through efficiency gains."
    },

    problem: {
      context: "Manual testing across five different tech stacks was creating a bottleneck, delaying releases by 2-3 days and allowing defects to slip into production.",
      painPoints: [
        "Manual testing required 2 days per release, blocking deployment pipeline",
        "60% test coverage left critical paths untested",
        "23 bugs per release reached production, damaging customer trust",
        "QA team spending 80% of time on repetitive manual testing"
      ],
      stakes: "Slow release cycles were costing the business competitive advantage and increasing technical debt, while quality issues were driving customer churn."
    },

    process: {
      approach: "Architected a modular, Docker-based automation framework with Python and Selenium, designed for cross-platform compatibility and parallel execution.",
      methodology: [
        "Conducted gap analysis identifying high-value test cases for automation (Pareto principle: 20% of tests covering 80% of critical paths)",
        "Built reusable component library reducing test development time by 60%",
        "Implemented Page Object Model design pattern for maintainability",
        "Integrated with CI/CD pipeline for continuous feedback on pull requests"
      ],
      decisions: [
        "Chose Python over Java for faster development and better team adoption",
        "Implemented Docker containers for consistent test environments across teams",
        "Prioritized flaky test elimination over coverage expansion (quality over quantity)",
        "Built custom reporting dashboard with trend analysis and failure categorization"
      ],
      collaboration: "Led workshops training 12 engineers across 3 teams on automation best practices. Partnered with DevOps to optimize CI/CD integration and resource allocation."
    },

    result: {
      outcomes: [
        "Reduced production defects by 50% (from 23 to 11 bugs per release)",
        "Increased test coverage from 60% to 85% of critical user paths",
        "Decreased test execution time from 2 days to 6 hours (83% reduction)",
        "Achieved 300% ROI by saving 160 QA hours per month",
        "Enabled shift to daily releases from weekly cadence"
      ],
      testimonial: {
        quote: "Isaac's automation framework didn't just speed up our testing—it fundamentally changed how we think about quality. We can now ship with confidence every single day.",
        author: "Michael Rodriguez",
        role: "Senior Engineering Manager"
      },
      lessonsLearned: [
        "Test stability and reliability are more valuable than high coverage of flaky tests",
        "Investing time in training and documentation drives faster cross-team adoption",
        "Modular architecture with reusable components reduces long-term maintenance burden"
      ]
    },

    detailedMetrics: [
      { label: "Defect Reduction", value: "50%", improvement: "From 23 to 11 bugs/release" },
      { label: "Test Coverage", value: "85%", improvement: "From 60%" },
      { label: "Execution Time", value: "6 hours", improvement: "From 2 days manual" },
      { label: "ROI", value: "300%", improvement: "Saved 160 QA hours/month" }
    ]
  },

  "data-analytics-dashboard": {
    slug: "data-analytics-dashboard",
    title: "Data Analytics Dashboard",
    description: "Designed and launched interactive performance dashboards transforming client reporting from manual Excel exports to automated, real-time insights",
    role: "Product Manager & Data Lead",
    timeline: "4 months (2020-2021)",
    tools: ["SQL", "Tableau", "Python", "APIs"],
    metrics: "40% faster decisions • 25% conversion lift",
    github: "https://github.com/IsaacAVazquez",
    link: null,

    overview: {
      summary: "Product-led initiative to replace manual Excel reporting with automated, real-time analytics dashboards, enabling data-driven campaign optimization.",
      impact: "Accelerated decision-making by 40%, improved campaign conversion rates by 25%, and enabled company to scale from 15 to 45 clients without adding headcount."
    },

    problem: {
      context: "Campaign managers were spending 3 days per week creating manual Excel reports, leaving no time for strategic optimization or client consultation.",
      painPoints: [
        "Manual data aggregation from 5 platforms taking 60+ hours monthly",
        "Reports were 2-3 days stale by the time clients received them",
        "Complex Excel spreadsheets overwhelmed non-technical stakeholders",
        "No historical trend analysis or predictive insights",
        "Client churn of 18% due to perceived lack of transparency"
      ],
      stakes: "Inefficient reporting was limiting the company's ability to scale client base and preventing campaign managers from focusing on high-value strategic work."
    },

    process: {
      approach: "Built automated ETL pipeline aggregating data from multiple platforms into Sisense/Tableau dashboards with real-time updates and user-friendly visualizations.",
      methodology: [
        "Conducted stakeholder interviews with 8 campaign managers to identify key metrics and pain points",
        "Designed SQL data warehouse schema optimized for campaign analytics queries",
        "Created Python scripts for automated data extraction via APIs (respecting rate limits)",
        "Developed interactive Tableau dashboards with drill-down capabilities and custom filters"
      ],
      decisions: [
        "Chose Sisense over custom-built solution for faster time-to-market and built-in features",
        "Implemented hourly data refreshes balancing timeliness with API costs",
        "Prioritized top 8 metrics covering 80% of client questions (Pareto principle)",
        "Built mobile-responsive views for on-the-go client access"
      ],
      collaboration: "Partnered with campaign managers, data engineering team, and clients directly to iterate on dashboard design. Conducted 5 rounds of user testing with real campaign data."
    },

    result: {
      outcomes: [
        "Reduced reporting time from 60 hours to 5 hours per month (92% reduction)",
        "Accelerated decision-making by 40% (from 3 days to 1.8 days average)",
        "Improved campaign conversion rates by 25% through better-informed targeting",
        "Increased client satisfaction scores from 74% to 92%",
        "Enabled company to scale from 15 to 45 active clients without adding headcount"
      ],
      testimonial: {
        quote: "Isaac's dashboards gave us superpowers. What used to take days of Excel work now updates in real-time. I can finally spend my time optimizing campaigns instead of building spreadsheets.",
        author: "Jessica Martinez",
        role: "Senior Campaign Manager"
      },
      lessonsLearned: [
        "User research and iterative design are critical—first dashboard version missed 3 key metrics",
        "Simple, focused dashboards outperform feature-packed complexity every time",
        "Automated reporting frees teams to focus on strategy and high-value work"
      ]
    },

    detailedMetrics: [
      { label: "Decision Speed", value: "40% faster", improvement: "From 3 days to 1.8 days" },
      { label: "Conversion Rate", value: "25% increase", improvement: "Through better targeting" },
      { label: "Time Saved", value: "60 hours/month", improvement: "Automated reporting" },
      { label: "Client Satisfaction", value: "92% positive", improvement: "Up from 74%" }
    ]
  },

  // Placeholder for other case studies - you can expand these later
  "api-testing-framework": {
    slug: "api-testing-framework",
    title: "API Testing Framework",
    description: "Architected comprehensive API testing suite catching 95% of integration issues pre-production",
    role: "QA Engineer",
    timeline: "3 months (2023)",
    tools: ["Postman", "JMeter", "JavaScript", "CI/CD"],
    metrics: "95% defect detection • 45% faster releases",

    overview: {
      summary: "Built comprehensive API testing framework ensuring integration reliability across microservices architecture.",
      impact: "Eliminated API integration bugs from reaching production, enabling confident microservices deployments."
    },

    problem: {
      context: "Microservices architecture created complex integration challenges with 120+ API endpoints.",
      painPoints: [
        "Integration bugs reaching production",
        "Manual API testing was time-consuming",
        "No performance testing under load"
      ],
      stakes: "API failures were causing cascading system issues and poor user experience."
    },

    process: {
      approach: "Designed modular API test suite with automated performance testing.",
      methodology: [
        "Created reusable Postman collections for 120 endpoints",
        "Implemented automated token management",
        "Built performance tests with JMeter"
      ],
      decisions: [
        "Chose Postman for developer-friendly interface",
        "Integrated with CI/CD for continuous validation"
      ]
    },

    result: {
      outcomes: [
        "Achieved 95% pre-production defect detection",
        "Reduced production API issues by 90%",
        "Enabled parallel development of microservices"
      ],
      lessonsLearned: [
        "API contract testing prevents integration failures",
        "Performance testing early catches scalability issues"
      ]
    }
  },

  "performance-monitoring": {
    slug: "performance-monitoring",
    title: "Performance Monitoring",
    description: "Launched real-time performance monitoring system reducing page load times by 60% and preventing outages",
    role: "Performance Engineer",
    timeline: "4 months (2022-2023)",
    tools: ["New Relic", "Grafana", "JMeter"],
    metrics: "60% faster load times • 99.95% uptime",

    overview: {
      summary: "Implemented comprehensive performance monitoring enabling proactive issue detection and optimization.",
      impact: "Improved user satisfaction and retention through faster, more reliable application."
    },

    problem: {
      context: "Performance issues were degrading user experience and causing occasional outages.",
      painPoints: [
        "Reactive incident response",
        "No visibility into performance bottlenecks",
        "Poor user experience due to slow load times"
      ],
      stakes: "Performance issues were driving user churn and damaging brand reputation."
    },

    process: {
      approach: "Deployed monitoring tools with custom dashboards and proactive alerting.",
      methodology: [
        "Instrumented application with New Relic APM",
        "Built Grafana dashboards for real-time metrics",
        "Configured smart alerting thresholds"
      ],
      decisions: [
        "Chose New Relic for comprehensive APM capabilities",
        "Prioritized proactive monitoring over reactive debugging"
      ]
    },

    result: {
      outcomes: [
        "Reduced page load times by 60%",
        "Achieved 99.95% uptime",
        "85% of issues detected before user impact"
      ],
      lessonsLearned: [
        "Proactive monitoring prevents costly downtime",
        "Performance directly impacts business metrics"
      ]
    }
  }
};

export async function generateStaticParams() {
  return Object.keys(caseStudiesData).map((slug) => ({
    slug: slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const caseStudy = caseStudiesData[params.slug];

  if (!caseStudy) {
    return {
      title: "Case Study Not Found | Isaac Vazquez",
    };
  }

  return {
    title: `${caseStudy.title} | Isaac Vazquez`,
    description: caseStudy.description,
  };
}

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const caseStudy = caseStudiesData[params.slug];

  if (!caseStudy) {
    notFound();
  }

  const allSlugs = Object.keys(caseStudiesData);
  const currentIndex = allSlugs.indexOf(params.slug);
  const nextSlug = currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null;
  const nextCaseStudy = nextSlug ? caseStudiesData[nextSlug] : null;

  return (
    <main className="min-h-screen bg-white dark:bg-black py-24 md:py-32">
      <article className="container-wide max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-[#FF6B35] transition-colors mb-8"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Link>

        {/* Header */}
        <header className="mb-12">
          <Heading level={1} className="mb-4">
            {caseStudy.title}
          </Heading>

          <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            <span><strong>Role:</strong> {caseStudy.role}</span>
            <span>•</span>
            <span><strong>Timeline:</strong> {caseStudy.timeline}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {caseStudy.tools.map((tool) => (
              <span
                key={tool}
                className="px-3 py-1 text-sm font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                {tool}
              </span>
            ))}
          </div>

          <div className="flex gap-4">
            {caseStudy.github && (
              <a
                href={caseStudy.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
              >
                <IconBrandGithub className="h-4 w-4" />
                View Code
              </a>
            )}
            {caseStudy.link && (
              <a
                href={caseStudy.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
              >
                <IconExternalLink className="h-4 w-4" />
                Live Project
              </a>
            )}
          </div>
        </header>

        {/* Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
            Overview
          </h2>
          <WarmCard padding="lg" className="mb-6 border border-neutral-200 dark:border-neutral-700">
            <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-4">
              {caseStudy.overview.summary}
            </p>
            <p className="text-base text-neutral-600 dark:text-neutral-400">
              <strong className="text-neutral-900 dark:text-neutral-100">Impact:</strong> {caseStudy.overview.impact}
            </p>
          </WarmCard>

          {/* Detailed Metrics */}
          {caseStudy.detailedMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {caseStudy.detailedMetrics.map((metric, index) => (
                <WarmCard key={index} padding="md" className="text-center border border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-[#FF6B35] mb-1">
                    {metric.value}
                  </p>
                  {metric.improvement && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {metric.improvement}
                    </p>
                  )}
                </WarmCard>
              ))}
            </div>
          )}
        </section>

        {/* Problem */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
            Problem
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Context
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {caseStudy.problem.context}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Pain Points
              </h3>
              <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                {caseStudy.problem.painPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            <WarmCard padding="lg" className="bg-[#FFF8F0] dark:bg-neutral-800/50 border border-[#FFE4D6] dark:border-neutral-700">
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Stakes
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {caseStudy.problem.stakes}
              </p>
            </WarmCard>
          </div>
        </section>

        {/* Process */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
            Process
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Approach
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {caseStudy.process.approach}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Methodology
              </h3>
              <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                {caseStudy.process.methodology.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>

            {caseStudy.process.decisions && (
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                  Key Decisions
                </h3>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                  {caseStudy.process.decisions.map((decision, index) => (
                    <li key={index}>{decision}</li>
                  ))}
                </ul>
              </div>
            )}

            {caseStudy.process.collaboration && (
              <WarmCard padding="lg" className="border border-neutral-200 dark:border-neutral-700">
                <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                  Collaboration
                </h3>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {caseStudy.process.collaboration}
                </p>
              </WarmCard>
            )}
          </div>
        </section>

        {/* Results */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
            Results
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Outcomes
              </h3>
              <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                {caseStudy.result.outcomes.map((outcome, index) => (
                  <li key={index}>{outcome}</li>
                ))}
              </ul>
            </div>

            {caseStudy.result.testimonial && (
              <WarmCard padding="lg" className="bg-[#FFF8F0] dark:bg-neutral-800/50 border-l-4 border-[#FF6B35]">
                <blockquote className="text-lg italic text-neutral-700 dark:text-neutral-300 mb-4">
                  "{caseStudy.result.testimonial.quote}"
                </blockquote>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  — {caseStudy.result.testimonial.author}, {caseStudy.result.testimonial.role}
                </p>
              </WarmCard>
            )}

            {caseStudy.result.lessonsLearned && caseStudy.result.lessonsLearned.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                  Lessons Learned
                </h3>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                  {caseStudy.result.lessonsLearned.map((lesson, index) => (
                    <li key={index}>{lesson}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Next Case Study */}
        {nextCaseStudy && (
          <footer className="pt-12 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-4">
              Next Case Study
            </h3>
            <Link href={`/portfolio/${nextCaseStudy.slug}`}>
              <WarmCard
                padding="lg"
                hover={true}
                className="border border-neutral-200 dark:border-neutral-700 group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-neutral-900 dark:text-neutral-100 group-hover:text-[#FF6B35] transition-colors">
                      {nextCaseStudy.title}
                    </h4>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                      {nextCaseStudy.description}
                    </p>
                    <p className="text-sm text-[#FF6B35] font-medium">
                      {nextCaseStudy.metrics}
                    </p>
                  </div>
                  <IconArrowRight className="h-6 w-6 text-neutral-400 group-hover:text-[#FF6B35] group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                </div>
              </WarmCard>
            </Link>
          </footer>
        )}
      </article>
    </main>
  );
}
