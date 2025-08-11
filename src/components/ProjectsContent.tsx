"use client";

import { Heading } from "@/components/ui/Heading";
import { motion } from "framer-motion";
import { IconBrandGithub, IconExternalLink, IconCode, IconDatabase, IconTestPipe, IconChartBar, IconTrendingUp, IconEye } from "@tabler/icons-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { MorphButton } from "@/components/ui/MorphButton";
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
}

const projects: Project[] = [
  {
    id: 1,
    title: "Civic Engagement Platform",
    description: "Built a scalable QA framework for voter outreach tools reaching 60M+ voters",
    tech: ["Cypress", "Jest", "React", "Node.js"],
    type: "featured",
    color: "from-vivid-blue to-vivid-teal",
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
    timeline: "8 months (2022)"
  },
  {
    id: 2,
    title: "Test Automation Suite",
    description: "Designed unified automation framework enabling same-day validation",
    tech: ["Selenium", "Python", "Docker", "CI/CD"],
    type: "normal",
    color: "from-vivid-purple to-vivid-pink",
    icon: IconTestPipe,
    metrics: "50% reduction in defects",
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
    timeline: "6 months (2023)"
  },
  {
    id: 3,
    title: "Data Analytics Dashboard",
    description: "Created interactive dashboards for campaign performance monitoring",
    tech: ["SQL", "Tableau", "Python", "APIs"],
    type: "normal",
    color: "from-vivid-teal to-vivid-blue",
    icon: IconDatabase,
    metrics: "40% faster decisions",
    github: "https://github.com/IsaacAVazquez",
    link: null,
  },
  {
    id: 4,
    title: "API Testing Framework",
    description: "Developed comprehensive API testing suite with Postman and JMeter",
    tech: ["Postman", "JMeter", "JavaScript", "CI/CD"],
    type: "small",
    color: "from-vivid-yellow to-vivid-pink",
    icon: IconCode,
    github: "https://github.com/IsaacAVazquez",
    link: null,
  },
  {
    id: 5,
    title: "Performance Monitoring",
    description: "Implemented end-to-end performance monitoring system",
    tech: ["New Relic", "Grafana", "JMeter"],
    type: "small",
    color: "from-vivid-pink to-vivid-purple",
    icon: IconChartBar,
    github: null,
    link: null,
  },
  {
    id: 6,
    title: "Fantasy Football Tiers",
    description: "Interactive tier visualization using clustering algorithms to analyze player rankings",
    tech: ["D3.js", "TypeScript", "K-Means", "Framer Motion"],
    type: "normal",
    color: "from-vivid-blue to-vivid-green",
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
        <Heading className="font-heading font-black text-5xl mb-4 tracking-tight gradient-text">
          Projects & Work
        </Heading>
        <p className="text-lg text-secondary max-w-2xl">
          A curated selection of projects showcasing my expertise in quality assurance, 
          automation, and building reliable software systems.
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
            <GlassCard
              key={project.id}
              elevation={project.type === "featured" ? 4 : 3}
              interactive={true}
              cursorGlow={true}
              noiseTexture={true}
              floating={project.type === "featured"}
              className={`${gridClass} overflow-hidden`}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-10 group-hover:opacity-20 transition-opacity breathing-gradient`} />
              
              {/* Content */}
              <div className="relative h-full p-6 flex flex-col">
                {/* Icon */}
                <div className="mb-4">
                  <Icon className="h-8 w-8 text-vivid-blue dark:text-vivid-teal" />
                </div>

                {/* Title & Description */}
                <h3 className="font-heading font-bold text-xl mb-2 text-primary">
                  {project.title}
                </h3>
                <p className="text-sm text-secondary mb-4 flex-grow">
                  {project.description}
                </p>

                {/* Metrics */}
                {project.metrics && (
                  <div className="mb-4">
                    <span className="text-xs font-accent font-semibold text-vivid-blue dark:text-vivid-teal">
                      {project.metrics}
                    </span>
                  </div>
                )}

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-secondary"
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
                      className="p-2 rounded-lg bg-terminal-bg/50 backdrop-blur-sm hover:bg-matrix-green/10 border border-matrix-green/20 hover:border-matrix-green/50 transition-all group"
                      aria-label="View project details"
                    >
                      <IconEye className="h-4 w-4 text-matrix-green group-hover:text-electric-blue transition-colors" />
                    </button>
                  )}
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-terminal-bg/50 backdrop-blur-sm hover:bg-electric-blue/10 border border-electric-blue/20 hover:border-electric-blue/50 transition-all group"
                      aria-label="View source code"
                    >
                      <IconBrandGithub className="h-4 w-4 text-electric-blue group-hover:text-matrix-green transition-colors" />
                    </a>
                  )}
                  {project.link && (
                    project.link.startsWith('/') ? (
                      <Link
                        href={project.link}
                        className="p-2 rounded-lg bg-terminal-bg/50 backdrop-blur-sm hover:bg-electric-blue/10 border border-electric-blue/20 hover:border-electric-blue/50 transition-all group"
                        aria-label="View live project"
                      >
                        <IconExternalLink className="h-4 w-4 text-electric-blue group-hover:text-matrix-green transition-colors" />
                      </Link>
                    ) : (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-terminal-bg/50 backdrop-blur-sm hover:bg-electric-blue/10 border border-electric-blue/20 hover:border-electric-blue/50 transition-all group"
                        aria-label="View live project"
                      >
                        <IconExternalLink className="h-4 w-4 text-electric-blue group-hover:text-matrix-green transition-colors" />
                      </a>
                    )
                  )}
                </div>
              </div>
            </GlassCard>
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
        <p className="text-lg text-secondary mb-6">
          Interested in working together? Let's build something great.
        </p>
        <Link href="/contact">
          <MorphButton
            variant="primary"
            size="lg"
            icon={<IconExternalLink className="h-4 w-4" />}
            iconPosition="right"
          >
            Get In Touch
          </MorphButton>
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