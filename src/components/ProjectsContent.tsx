"use client";

import { Heading } from "@/components/ui/Heading";
import { motion } from "framer-motion";
import { IconBrandGithub, IconExternalLink, IconCode, IconDatabase, IconTestPipe, IconChartBar, IconTrendingUp, IconEye } from "@tabler/icons-react";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import Link from "next/link";
import { useState, lazy, Suspense } from "react";

// Lazy load heavy components
const ProjectDetailModal = lazy(() => import("@/components/ProjectDetailModal").then(mod => ({ default: mod.ProjectDetailModal })));
const LazyQADashboard = lazy(() => import("@/components/LazyQADashboard").then(mod => ({ default: mod.LazyQADashboard })));

interface Project {
  id: number;
  title: string;
  description: string;
  tech: string[];
  type: "featured" | "normal" | "small";
  color: string;
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
  // 2025 Case Study Framework: Problem-Process-Result
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
    id: 1,
    title: "Civic Engagement Platform",
    description: "Built a scalable QA framework for voter outreach tools reaching 60M+ voters",
    tech: ["Cypress", "Jest", "React", "Node.js"],
    type: "featured",
    color: "from-[#FF6B35] to-[#F7B32B]",
    icon: IconChartBar,
    metrics: "30% faster releases, 100% uptime",
    github: "https://github.com/IsaacAVazquez",
    link: "https://civitech.io",
    detailedMetrics: [
      { label: "Users Reached", value: "60M+", improvement: "200% increase" },
      { label: "Uptime Achieved", value: "99.9%", improvement: "From 97.2%" },
      { label: "Release Velocity", value: "30% faster", improvement: "14 days to 10 days" },
      { label: "Bug Detection", value: "95% pre-prod", improvement: "From 70%" }
    ],
    screenshot: "/project-screenshots/civic-engagement-platform.png",
    challenges: [
      "Scale testing for 60M+ voter database queries",
      "Ensure reliability during election day traffic spikes",
      "Cross-browser compatibility across diverse user base",
      "Data privacy compliance (CCPA, state regulations)"
    ],
    impact: "Enabled secure, reliable voter outreach that processed millions of daily interactions during 2022 midterms without downtime",
    timeline: "8 months (2022)",
    // Problem-Process-Result Framework
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
    }
  },
  {
    id: 2,
    title: "Test Automation Suite",
    description: "Led design and implementation of unified automation framework enabling same-day validation across 5 different tech stacks",
    tech: ["Selenium", "Python", "Docker", "CI/CD"],
    type: "normal",
    color: "from-[#FF8E53] to-[#FFC857]",
    icon: IconTestPipe,
    metrics: "50% reduction in defects, 300% ROI",
    github: "https://github.com/IsaacAVazquez",
    link: null,
    detailedMetrics: [
      { label: "Defect Reduction", value: "50%", improvement: "From 23 to 11 bugs/release" },
      { label: "Test Coverage", value: "85%", improvement: "From 60%" },
      { label: "Execution Time", value: "6 hours", improvement: "From 2 days manual" },
      { label: "ROI", value: "300%", improvement: "Saved 160 QA hours/month" }
    ],
    screenshot: "/project-screenshots/test-automation-suite.png",
    challenges: [
      "Integrate across 5 different tech stacks",
      "Maintain test stability with frequent UI changes",
      "Parallel execution without resource conflicts",
      "Cross-team adoption and training"
    ],
    impact: "Transformed QA from bottleneck to enabler, allowing daily releases with confidence",
    timeline: "6 months (2023)",
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
    }
  },
  {
    id: 3,
    title: "Data Analytics Dashboard",
    description: "Designed and launched interactive performance dashboards transforming client reporting from manual Excel exports to automated, real-time insights",
    tech: ["SQL", "Tableau", "Python", "APIs"],
    type: "normal",
    color: "from-[#F7B32B] to-[#FF6B35]",
    icon: IconDatabase,
    metrics: "40% faster decisions, 25% conversion lift",
    github: "https://github.com/IsaacAVazquez",
    link: null,
    detailedMetrics: [
      { label: "Decision Speed", value: "40% faster", improvement: "From 3 days to 1.8 days" },
      { label: "Conversion Rate", value: "25% increase", improvement: "Through better targeting" },
      { label: "Time Saved", value: "60 hours/month", improvement: "Automated reporting" },
      { label: "Client Satisfaction", value: "92% positive", improvement: "Up from 74%" }
    ],
    screenshot: "/project-screenshots/data-analytics-dashboard.png",
    challenges: [
      "Integrate data from 5 different campaign platforms",
      "Real-time sync with API rate limits",
      "Make complex metrics digestible for non-technical clients",
      "Maintain data privacy and security compliance"
    ],
    impact: "Empowered campaign managers to make data-driven decisions in hours instead of days, directly improving campaign ROI and client retention",
    timeline: "4 months (2020-2021)",
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
    }
  },
  {
    id: 4,
    title: "API Testing Framework",
    description: "Architected comprehensive API testing suite catching 95% of integration issues pre-production",
    tech: ["Postman", "JMeter", "JavaScript", "CI/CD"],
    type: "small",
    color: "from-[#FFC857] to-[#FF8E53]",
    icon: IconCode,
    metrics: "95% defect detection, 45% faster releases",
    github: "https://github.com/IsaacAVazquez",
    link: null,
    detailedMetrics: [
      { label: "Defect Detection", value: "95% pre-prod", improvement: "From 65%" },
      { label: "API Coverage", value: "120 endpoints", improvement: "Full platform coverage" },
      { label: "Release Speed", value: "45% faster", improvement: "Parallel testing" },
      { label: "Production Issues", value: "90% reduction", improvement: "From 18 to 2/month" }
    ],
    screenshot: "/project-screenshots/api-testing-framework.png",
    challenges: [
      "Test 120 interconnected API endpoints with complex dependencies",
      "Handle authentication flows and token management",
      "Validate data integrity across microservices",
      "Performance testing under production-like load"
    ],
    impact: "Eliminated API integration bugs from reaching production, enabling confident microservices deployments",
    timeline: "3 months (2023)"
  },
  {
    id: 5,
    title: "Performance Monitoring",
    description: "Launched real-time performance monitoring system reducing page load times by 60% and preventing outages",
    tech: ["New Relic", "Grafana", "JMeter"],
    type: "small",
    color: "from-[#FF6B35] to-[#FF8E53]",
    icon: IconChartBar,
    metrics: "60% faster load times, zero outages",
    github: null,
    link: null,
    detailedMetrics: [
      { label: "Page Load Time", value: "60% faster", improvement: "From 4.2s to 1.7s" },
      { label: "Uptime", value: "99.95%", improvement: "From 98.1%" },
      { label: "Response Time", value: "250ms avg", improvement: "From 680ms" },
      { label: "Issue Detection", value: "85% proactive", improvement: "Before user impact" }
    ],
    screenshot: "/project-screenshots/performance-monitoring.png",
    challenges: [
      "Monitor complex distributed system architecture",
      "Set meaningful alert thresholds avoiding fatigue",
      "Correlate performance metrics with business impact",
      "Handle high data volume without affecting production"
    ],
    impact: "Proactively identified performance bottlenecks before user impact, improving user satisfaction and retention",
    timeline: "4 months (2022-2023)"
  },
  {
    id: 6,
    title: "Fantasy Football Tiers",
    description: "Interactive tier visualization using clustering algorithms to analyze player rankings",
    tech: ["D3.js", "TypeScript", "K-Means", "Framer Motion"],
    type: "normal",
    color: "from-[#F7B32B] to-[#FFC857]",
    icon: IconTrendingUp,
    metrics: "6-tier clustering, real-time updates",
    github: "https://github.com/IsaacAVazquez",
    link: "/fantasy-football",
    detailedMetrics: [
      { label: "Data Points", value: "300+ players", improvement: "All positions" },
      { label: "Clustering Accuracy", value: "92%", improvement: "Expert consensus match" },
      { label: "Update Frequency", value: "Daily", improvement: "Automated pipeline" },
      { label: "User Engagement", value: "85% return rate", improvement: "Interactive features" }
    ],
    screenshot: "/project-screenshots/fantasy-football-tiers.png",
    challenges: [
      "Real-time data synchronization from FantasyPros",
      "Responsive D3.js visualizations across devices",
      "Clustering algorithm optimization for player tiers",
      "User-friendly interface for complex data"
    ],
    impact: "Demonstrates advanced data visualization and algorithm implementation skills with real-time data processing",
    timeline: "4 months (2024)"
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};


export function ProjectsContent() {
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
        <Heading className="font-heading font-black text-5xl mb-4 tracking-tight gradient-text-warm">
          Case Studies
        </Heading>
        <p className="text-lg text-[#4A3426] dark:text-[#D4A88E] max-w-3xl leading-relaxed">
          A curated selection of impactful projects demonstrating product management expertise through
          strategic thinking, cross-functional leadership, and measurable business outcomes. Each case study
          follows the Problem-Process-Result framework showcasing how I identify challenges, drive solutions,
          and deliver results.
        </p>
        <p className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mt-4 max-w-3xl">
          💡 Click any project to view the full case study with detailed metrics, methodology, and lessons learned.
        </p>
      </div>

      {/* Bento Box Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[200px]"
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
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-10 hover:opacity-20 transition-opacity`} />

              {/* Content */}
              <div className="relative h-full p-6 flex flex-col">
                {/* Icon */}
                <div className="mb-4">
                  <Icon className="h-8 w-8 text-[#FF6B35]" />
                </div>

                {/* Title & Description */}
                <h3 className="font-heading font-bold text-xl mb-2 text-[#2D1B12]">
                  {project.title}
                </h3>
                <p className="text-sm text-[#6B4F3D] mb-4 flex-grow">
                  {project.description}
                </p>

                {/* Metrics */}
                {project.metrics && (
                  <div className="mb-4">
                    <span className="text-xs font-accent font-semibold text-[#FF6B35]">
                      {project.metrics}
                    </span>
                  </div>
                )}

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 text-xs font-medium rounded-full bg-[#FFF8F0] text-[#6B4F3D]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-6 right-6 flex gap-2">
                  {/* View Details Button - only show for projects with detailed info */}
                  {(project.detailedMetrics || project.challenges || project.impact) && (
                    <button
                      onClick={() => openProjectDetail(project)}
                      className="p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-[#FF6B35]/10 border border-[#FFE4D6] hover:border-[#FF6B35]/50 transition-all group"
                      aria-label="View project details"
                    >
                      <IconEye className="h-4 w-4 text-[#FF6B35] group-hover:text-[#F7B32B] transition-colors" />
                    </button>
                  )}
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-[#FF6B35]/10 border border-[#FFE4D6] hover:border-[#FF6B35]/50 transition-all group"
                      aria-label="View source code"
                    >
                      <IconBrandGithub className="h-4 w-4 text-[#FF6B35] group-hover:text-[#F7B32B] transition-colors" />
                    </a>
                  )}
                  {project.link && (
                    project.link.startsWith('/') ? (
                      <Link
                        href={project.link}
                        className="p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-[#FF6B35]/10 border border-[#FFE4D6] hover:border-[#FF6B35]/50 transition-all group"
                        aria-label="View live project"
                      >
                        <IconExternalLink className="h-4 w-4 text-[#FF6B35] group-hover:text-[#F7B32B] transition-colors" />
                      </Link>
                    ) : (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-[#FF6B35]/10 border border-[#FFE4D6] hover:border-[#FF6B35]/50 transition-all group"
                        aria-label="View live project"
                      >
                        <IconExternalLink className="h-4 w-4 text-[#FF6B35] group-hover:text-[#F7B32B] transition-colors" />
                      </a>
                    )
                  )}
                </div>
              </div>
            </WarmCard>
          );
        })}
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-center"
      >
        <p className="text-lg text-[#6B4F3D] mb-6">
          Interested in working together? Let's build something great.
        </p>
        <Link href="/contact">
          <ModernButton variant="primary" size="lg">
            Get In Touch →
          </ModernButton>
        </Link>
      </motion.div>

      {/* QA Dashboard Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="mt-20"
      >
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-slate-400">Loading dashboard...</div>
          </div>
        }>
          <LazyQADashboard />
        </Suspense>
      </motion.div>

      {/* Project Detail Modal */}
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