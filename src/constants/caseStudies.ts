export interface CaseStudyData {
  slug: string;
  title: string;
  description: string;
  role: string;
  timeline: string;
  tools: string[];
  metrics: string;
  github?: string | null;
  link?: string | null;
  featured?: boolean;
  comingSoon?: boolean;

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

  // PM-specific fields
  userSegments: string[];
  northStarMetric: string;
  tradeoffs: {
    decision: string;
    optionChosen: string;
    optionRejected: string;
    reasoning: string;
  }[];
  retrospective: string;
  pmFramework?: string;
}

export const caseStudiesData: Record<string, CaseStudyData> = {
  "civic-engagement-platform": {
    slug: "civic-engagement-platform",
    title: "Scaling a Platform to 60M+ Users",
    description:
      "Led product strategy and quality for a high-scale SaaS platform during the 2022 midterm elections, achieving 99.9% uptime while scaling from 5M to 60M+ users.",
    role: "Product Contributor & Quality Lead",
    timeline: "8 months (2022)",
    tools: ["Cypress", "Jest", "React", "Node.js"],
    metrics: "99.9% uptime · 30% faster releases",
    github: "https://github.com/IsaacAVazquez",
    link: null,
    featured: false,

    overview: {
      summary:
        "Led product strategy for scaling a voter outreach SaaS platform from 5M to 60M+ users during the 2022 midterm elections, owning reliability, release velocity, and compliance.",
      impact:
        "Achieved 99.9% uptime during election day peak traffic while reducing release cycles by 30% and increasing pre-production bug detection from 70% to 95%.",
    },

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

    detailedMetrics: [
      {
        label: "Users Reached",
        value: "60M+",
        improvement: "200% increase",
      },
      {
        label: "Uptime Achieved",
        value: "99.9%",
        improvement: "From 97.2%",
      },
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

    userSegments: [
      "Campaign managers running voter outreach",
      "Political organizations scaling digital engagement",
      "Compliance teams ensuring regulatory adherence",
    ],
    northStarMetric: "Platform uptime during peak election traffic",
    tradeoffs: [
      {
        decision: "Testing framework selection",
        optionChosen: "Cypress",
        optionRejected: "Selenium",
        reasoning:
          "Faster feedback loops and better DX outweighed Selenium's broader browser support, given our user base was 90%+ Chrome/Safari.",
      },
      {
        decision: "Test execution strategy",
        optionChosen: "Parallel execution with Docker containers",
        optionRejected: "Sequential execution on shared infrastructure",
        reasoning:
          "2-hour sequential runs were blocking deploys; parallel cut it to 20 minutes with modest infrastructure cost increase.",
      },
    ],
    retrospective:
      "I'd invest earlier in observability. We had great test coverage but limited production monitoring — we got lucky that our test suite caught issues our monitoring would have missed.",
    pmFramework: "Risk-based prioritization",
  },

  "test-automation-suite": {
    slug: "test-automation-suite",
    title: "Unlocking Daily Deploys Through Process Automation",
    description:
      "Transformed QA from a release bottleneck into an enabler of daily deployments by designing a unified automation framework across 5 tech stacks.",
    role: "Product Contributor & Automation Lead",
    timeline: "6 months (2023)",
    tools: ["Selenium", "Python", "Docker", "CI/CD"],
    metrics: "50% defect reduction · 300% ROI",
    github: "https://github.com/IsaacAVazquez",
    link: null,
    featured: false,

    overview: {
      summary:
        "Architected and delivered a unified test automation framework that transformed QA from a release bottleneck into an enabler of daily deployments.",
      impact:
        "Reduced production defects by 50%, accelerated test execution by 83%, and generated 300% ROI through efficiency gains.",
    },

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
        "Conducted gap analysis identifying high-value test cases for automation (Pareto principle: 20% of tests covering 80% of critical paths)",
        "Built reusable component library reducing test development time by 60%",
        "Implemented Page Object Model design pattern for maintainability",
        "Integrated with CI/CD pipeline for continuous feedback on pull requests",
      ],
      decisions: [
        "Chose Python over Java for faster development and better team adoption",
        "Implemented Docker containers for consistent test environments across teams",
        "Prioritized flaky test elimination over coverage expansion (quality over quantity)",
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
          "Isaac's automation framework didn't just speed up our testing—it fundamentally changed how we think about quality. We can now ship with confidence every single day.",
        author: "Michael Rodriguez",
        role: "Senior Engineering Manager",
      },
      lessonsLearned: [
        "Test stability and reliability are more valuable than high coverage of flaky tests",
        "Investing time in training and documentation drives faster cross-team adoption",
        "Modular architecture with reusable components reduces long-term maintenance burden",
      ],
    },

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

    userSegments: [
      "Engineering teams blocked by slow QA cycles",
      "Product managers needing faster iteration",
      "DevOps teams managing CI/CD pipelines",
    ],
    northStarMetric: "Time from code merge to production deploy",
    tradeoffs: [
      {
        decision: "Language selection",
        optionChosen: "Python",
        optionRejected: "Java",
        reasoning:
          "Faster development velocity and lower learning curve for the team; most engineers had Python familiarity but limited Java experience.",
      },
      {
        decision: "Coverage vs. stability priority",
        optionChosen: "Flaky test elimination first",
        optionRejected: "Expand coverage to 95%",
        reasoning:
          "A flaky 85% suite that teams trust is more valuable than a 95% suite teams ignore. Trust drives adoption.",
      },
    ],
    retrospective:
      "I'd set up better metrics tracking from day one. We measured coverage and defects, but didn't track developer satisfaction with the framework — which turned out to be the biggest driver of adoption.",
    pmFramework: "Pareto principle (80/20)",
  },

  "data-analytics-dashboard": {
    slug: "data-analytics-dashboard",
    title: "Transforming Client Reporting into Self-Service Analytics",
    description:
      "Led a product initiative replacing manual Excel reporting with automated real-time dashboards, enabling the company to scale from 15 to 45 clients without adding headcount.",
    role: "Product Manager & Data Lead",
    timeline: "4 months (2020-2021)",
    tools: ["SQL", "Tableau", "Python", "APIs"],
    metrics: "40% faster decisions · 25% conversion lift",
    github: "https://github.com/IsaacAVazquez",
    link: null,
    featured: false,

    overview: {
      summary:
        "Product-led initiative to replace manual Excel reporting with automated, real-time analytics dashboards, enabling data-driven campaign optimization.",
      impact:
        "Accelerated decision-making by 40%, improved campaign conversion rates by 25%, and enabled company to scale from 15 to 45 clients without adding headcount.",
    },

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
        "Prioritized top 8 metrics covering 80% of client questions (Pareto principle)",
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
          "Isaac's dashboards gave us superpowers. What used to take days of Excel work now updates in real-time. I can finally spend my time optimizing campaigns instead of building spreadsheets.",
        author: "Jessica Martinez",
        role: "Senior Campaign Manager",
      },
      lessonsLearned: [
        "User research and iterative design are critical—first dashboard version missed 3 key metrics",
        "Simple, focused dashboards outperform feature-packed complexity every time",
        "Automated reporting frees teams to focus on strategy and high-value work",
      ],
    },

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

    userSegments: [
      "Campaign managers needing real-time performance data",
      "Clients wanting transparency into campaign ROI",
      "Executives tracking cross-campaign portfolio performance",
    ],
    northStarMetric: "Time from data availability to decision action",
    tradeoffs: [
      {
        decision: "Build vs. buy analytics platform",
        optionChosen: "Sisense (buy)",
        optionRejected: "Custom-built dashboard",
        reasoning:
          "Time-to-market was critical; Sisense delivered 80% of requirements in 2 weeks vs. estimated 3 months for custom build.",
      },
      {
        decision: "Data refresh frequency",
        optionChosen: "Hourly refreshes",
        optionRejected: "Real-time streaming",
        reasoning:
          "Real-time would triple API costs with minimal user benefit — campaign decisions happen on hourly/daily cadence, not minute-by-minute.",
      },
    ],
    retrospective:
      "I'd build the self-service filtering earlier. We designed dashboards for our mental model of what clients needed — but once they could filter themselves, usage and satisfaction jumped significantly.",
    pmFramework: "Jobs to Be Done",
  },

  "investment-analytics-platform": {
    slug: "investment-analytics-platform",
    title: "Investment Analytics Platform",
    description:
      "Full-stack investment platform with live Yahoo Finance data — portfolio tracking, gain/loss analytics, and side-by-side stock comparison with 30+ metrics and analyst consensus ratings.",
    role: "Full-Stack Developer & Designer",
    timeline: "2025",
    tools: ["Next.js", "TypeScript", "Yahoo Finance API", "Tailwind CSS"],
    metrics: "Live data · 30+ metrics per stock · Analyst consensus ratings",
    github: "https://github.com/IsaacAVazquez",
    link: "/investments",
    featured: true,

    // Required by interface — kept minimal (detail page not used)
    overview: { summary: "", impact: "" },
    problem: { context: "", painPoints: [], stakes: "" },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "performance-monitoring": {
    slug: "performance-monitoring",
    title: "Preventing Outages Through Proactive Performance Intelligence",
    description:
      "Shifted the team from reactive incident response to proactive performance monitoring, reducing page load times by 60% and achieving 99.95% uptime.",
    role: "Product Contributor & Performance Lead",
    timeline: "4 months (2022-2023)",
    tools: ["New Relic", "Grafana", "JMeter"],
    metrics: "60% faster load times · 99.95% uptime",

    overview: {
      summary:
        "Implemented comprehensive performance monitoring enabling proactive issue detection and optimization, shifting the team from reactive to proactive.",
      impact:
        "Improved user satisfaction and retention through faster, more reliable application performance.",
    },

    problem: {
      context:
        "Performance issues were degrading user experience and causing occasional outages.",
      painPoints: [
        "Reactive incident response — issues found by users, not engineering",
        "No visibility into performance bottlenecks",
        "Poor user experience due to slow load times",
      ],
      stakes:
        "Performance issues were driving user churn and damaging brand reputation.",
    },

    process: {
      approach:
        "Deployed monitoring tools with custom dashboards and proactive alerting.",
      methodology: [
        "Instrumented application with New Relic APM",
        "Built Grafana dashboards for real-time metrics",
        "Configured smart alerting thresholds",
      ],
      decisions: [
        "Chose New Relic for comprehensive APM capabilities",
        "Prioritized proactive monitoring over reactive debugging",
      ],
    },

    result: {
      outcomes: [
        "Reduced page load times by 60%",
        "Achieved 99.95% uptime",
        "85% of issues detected before user impact",
      ],
      lessonsLearned: [
        "Proactive monitoring prevents costly downtime",
        "Performance directly impacts business metrics",
      ],
    },

    userSegments: [
      "End users experiencing slow page loads",
      "Engineering teams responding to incidents reactively",
      "Business stakeholders tracking uptime SLAs",
    ],
    northStarMetric: "Percentage of issues detected before user impact",
    tradeoffs: [
      {
        decision: "Monitoring approach",
        optionChosen: "New Relic APM (full-stack observability)",
        optionRejected: "Open-source stack (Prometheus + Grafana only)",
        reasoning:
          "New Relic's auto-instrumentation and distributed tracing saved weeks of setup time; the cost was justified by faster time-to-insight.",
      },
    ],
    retrospective:
      "I'd define SLOs (Service Level Objectives) before building dashboards. We ended up with great visibility but no shared definition of 'good enough' performance, which made prioritization debates harder.",
    pmFramework: "SLO-based prioritization",
  },

  "fantasy-football-analytics": {
    slug: "fantasy-football-analytics",
    title: "Fantasy Football Analytics Platform",
    description:
      "Full-stack fantasy football platform with live tier rankings, D3 visualizations, and an automated data pipeline.",
    role: "Solo Builder",
    timeline: "2024–2025",
    tools: ["Next.js", "D3.js", "TypeScript", "SQLite"],
    metrics: "Live platform · 2026 season coming soon",
    github: "https://github.com/IsaacAVazquez",
    link: "/fantasy-football",
    featured: true,
    comingSoon: false,

    overview: { summary: "", impact: "" },
    problem: { context: "", painPoints: [], stakes: "" },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "march-madness-2026": {
    slug: "march-madness-2026",
    title: "March Madness 2026 Bracket Analysis",
    description:
      "Data-driven NCAA tournament bracket built on KenPom metrics, the Trapezoid of Excellence, S-curve seeding analysis, injury reports, and a custom time zone travel penalty model.",
    role: "Data Analyst & Builder",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "React"],
    metrics: "15 ranked teams · 20 picks · 4 regions",
    github: "https://github.com/IsaacAVazquez",
    link: "/march-madness-2026",
    featured: true,

    overview: { summary: "", impact: "" },
    problem: { context: "", painPoints: [], stakes: "" },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },
};

const HOMEPAGE_FEATURED_SLUGS = [
  "march-madness-2026",
  "investment-analytics-platform",
] as const;

/** Get featured case studies (for homepage) */
export function getFeaturedCaseStudies(): CaseStudyData[] {
  return Object.values(caseStudiesData).filter((cs) => cs.featured);
}

export function getHomepageFeaturedCaseStudies(): CaseStudyData[] {
  return HOMEPAGE_FEATURED_SLUGS.flatMap((slug) => {
    const study = caseStudiesData[slug];
    return study ? [study] : [];
  });
}

/** Get all case studies as an array */
export function getAllCaseStudies(): CaseStudyData[] {
  return Object.values(caseStudiesData);
}
