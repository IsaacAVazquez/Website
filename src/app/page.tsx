"use client";

import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import HomeContent from "@/components/HomeContent";

import { ModernHero } from "@/components/ModernHero";
import { PageSummary } from "@/components/ui/PageSummary";
import { ExpertSignalGroup } from "@/components/ui/ExpertSignal";
import { motion } from "framer-motion";
import { personalMetrics } from "@/constants/personal";
import Image from "next/image";
import { IconCode } from "@tabler/icons-react";

// Clean Timeline Item Component - Pentagram Style
const TimelineItem = ({ item, index }: { item: typeof personalMetrics.careerTimeline[0]; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="pentagram-card pentagram-card-hover group"
    >
      {/* Header Section */}
      <div className="flex items-start justify-between gap-6 mb-4">
        <div className="flex-1">
          <h3 className="text-2xl md:text-3xl font-bold text-[#2D1B12] dark:text-[#FFFCF7] mb-2 leading-tight">
            {item.role}
          </h3>
          <p className="text-lg md:text-xl text-[#FF6B35] dark:text-[#FF8E53] font-semibold">
            {item.company}
          </p>
        </div>
        {item.logo && (
          <div className="w-16 h-16 rounded-sm overflow-hidden border border-black/[0.08] dark:border-white/[0.1] flex-shrink-0">
            <Image
              src={item.logo}
              alt={`${item.company} logo`}
              width={64}
              height={64}
              className="object-contain w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Year */}
      <p className="editorial-caption mb-3 text-[#6B4F3D] dark:text-[#9C7A5F] font-mono">
        {item.year}
      </p>

      {/* Description */}
      <p className="editorial-body text-[#4A3426] dark:text-[#D4A88E] mb-4">
        {item.description}
      </p>

      {/* Tech Stack */}
      {item.techStack && item.techStack.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <IconCode className="w-4 h-4 text-[#FF6B35] dark:text-[#FF8E53]" aria-hidden="true" />
            <span className="text-sm font-semibold text-[#FF6B35] dark:text-[#FF8E53] uppercase tracking-wider">
              Technologies
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 text-sm bg-[#FFFCF7] dark:bg-[#2D1B12] border border-black/[0.08] dark:border-white/[0.1] text-[#4A3426] dark:text-[#D4A88E] font-mono rounded-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function Home() {
  return (
    <main
      className="min-h-screen w-full bg-white dark:bg-[#1C1410]"
      id="main-content"
      aria-label="Isaac Vazquez - Technical Product Manager Portfolio"
    >
      {/* Editorial Hero Section */}
      <header>
        <ModernHero />
      </header>

      {/* Visual Divider */}
      <div className="pentagram-divider" aria-hidden="true" />

      {/* AI-Optimized Page Summary */}
      <section className="pentagram-section bg-white dark:bg-black" aria-labelledby="page-summary">
        <div className="container-wide">
          <PageSummary
            variant="featured"
            tldr="Technical Product Manager and UC Berkeley Haas MBA Candidate with 6+ years experience in civic tech and SaaS. Proven track record in product strategy, quality engineering, and cross-functional leadership."
            summary={
              <>
                <p>
                  <strong>Isaac Vazquez</strong> is a product-focused technologist pursuing an MBA at UC Berkeley Haas School of Business. With 6+ years of experience at Civitech, Florida State University, and Open Progress, Isaac brings a unique blend of technical expertise and strategic product thinking.
                </p>
                <p>
                  As a <strong>Quality Assurance Engineer</strong> at Civitech, Isaac led initiatives that reached 60M+ users, improved NPS scores by 56%, and reduced critical defects by 90%. Now at Haas, Isaac is developing deep product management expertise to lead mission-driven products in civic tech and SaaS.
                </p>
              </>
            }
            context="Based in the Bay Area • Open to Product Manager and APM roles • Interested in civic tech, SaaS, and mission-driven startups"
          />

          {/* Expert Credentials */}
          <div className="mt-8">
            <ExpertSignalGroup
              title="Credentials & Expertise"
              variant="compact"
              columns={2}
              signals={[
                {
                  type: "education",
                  label: "UC Berkeley Haas MBA Candidate",
                  value: "Expected 2027 • Consortium Fellow • MLT Professional Development Fellow",
                  verified: true,
                },
                {
                  type: "experience",
                  label: "6+ Years in Civic Tech & SaaS",
                  value: "Quality Engineering • Product Strategy • Data Analytics",
                },
                {
                  type: "achievement",
                  label: "60M+ Users Reached",
                  value: "Led voter engagement platform initiatives at Civitech",
                },
                {
                  type: "expertise",
                  label: "Product Management Skills",
                  value: "User Research • Roadmapping • Cross-functional Leadership • Experimentation",
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Visual Divider */}
      <div className="pentagram-divider" aria-hidden="true" />

      {/* Overview Section - Clean Editorial Layout */}
      <section className="pentagram-section bg-white dark:bg-[#1C1410]" aria-labelledby="overview-heading">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            {/* Section Header */}
            <h2 id="overview-heading" className="editorial-heading text-[#2D1B12] dark:text-[#FFFCF7] mb-6">
              Overview
            </h2>

            {/* Content Grid */}
            <div className="space-y-5">
              <p className="editorial-body text-[#4A3426] dark:text-[#D4A88E]">
                Product-focused technologist transitioning into product management, bringing 6+ years of experience in quality assurance, data analytics, and technology. At Civitech, I've led testing initiatives for voter engagement platforms, bridging technical execution with strategic product outcomes.
              </p>

              {/* Core Competencies */}
              <aside
                className="pentagram-card"
                aria-labelledby="core-competencies-heading"
              >
                <h3
                  id="core-competencies-heading"
                  className="editorial-subheading text-[#2D1B12] dark:text-[#FFFCF7] mb-4"
                >
                  Core Competencies
                </h3>
                <div
                  className="pentagram-grid pentagram-grid-2"
                  role="list"
                  aria-label="List of core competencies"
                >
                  <div>
                    <h4 className="text-lg font-bold text-[#FF6B35] dark:text-[#FF8E53] mb-2">
                      Product & Strategy
                    </h4>
                    <p className="text-base text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
                      User experience optimization, feature prioritization, cross-functional collaboration, stakeholder management
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#FF6B35] dark:text-[#FF8E53] mb-2">
                      Technical
                    </h4>
                    <p className="text-base text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
                      Test automation (Cypress), SQL, data analysis, API testing, Agile/Scrum methodologies
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#FF6B35] dark:text-[#FF8E53] mb-2">
                      Analytics
                    </h4>
                    <p className="text-base text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
                      Data-driven decision making, metrics definition, A/B testing, performance optimization
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#FF6B35] dark:text-[#FF8E53] mb-2">
                      Leadership
                    </h4>
                    <p className="text-base text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
                      Team mentorship, project management, diverse community advocacy
                    </p>
                  </div>
                </div>
              </aside>

              <p className="editorial-body text-[#4A3426] dark:text-[#D4A88E]">
                At the State of Florida, I analyzed large datasets to inform policy decisions, developing dashboards and reports that improved operational efficiency. As Client Services Manager at Open Progress, I managed digital campaigns for progressive causes, translating client needs into actionable strategies.
              </p>

              <p className="editorial-body text-[#4A3426] dark:text-[#D4A88E]">
                Currently pursuing an MBA at UC Berkeley Haas to deepen my product management expertise and explore venture capital opportunities in civic tech, SaaS, and mission-driven startups. Passionate about leveraging technology to create social impact and democratize access to essential services.
              </p>

              <p className="text-xl md:text-2xl text-[#2D1B12] dark:text-[#FFFCF7] font-semibold mt-6">
                Let's connect if you're interested in technology, product strategy, or social impact.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Visual Divider */}
      <div className="pentagram-divider" aria-hidden="true" />

      {/* Career Journey Section - Structured Grid */}
      <section className="pentagram-section bg-white dark:bg-[#1C1410]" aria-labelledby="career-journey-heading">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            {/* Section Header */}
            <div className="mb-8">
              <h2 id="career-journey-heading" className="editorial-heading text-[#2D1B12] dark:text-[#FFFCF7] mb-4">
                Career Journey
              </h2>
              <p className="editorial-body text-[#4A3426] dark:text-[#D4A88E] max-w-4xl">
                From Political Science graduate to QA engineer, and now an MBA candidate at UC Berkeley, my career has been a journey of continuous learning and impact. Here's a snapshot of my professional timeline.
              </p>
            </div>

            {/* Timeline Grid */}
            <div className="pentagram-grid">
              {personalMetrics.careerTimeline.map((item, index) => (
                <TimelineItem
                  key={`${item.year}-${item.role}`}
                  item={item}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ProfilePage Structured Data for Homepage */}
      <StructuredData type="ProfilePage" />

      {/* Bottom Spacing */}
      <div className="h-8" aria-hidden="true" />
    </main>
  );
}